import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { donations } from '@/lib/schema/donations';
import { campaigns } from '@/lib/schema/campaigns';
import { notifications } from '@/lib/schema/notifications';
import { eq, sum, and } from 'drizzle-orm';
import { 
  DONATION_STATUS_CONFIG, 
  getFailureReason, 
  isDonationPending, 
  isDonationFailed 
} from '@/lib/utils/donation-status';
import { checkAndUpdateGoalReached } from '@/lib/utils/campaign-validation';

// Helper function to update campaign currentAmount based on completed donations
async function updateCampaignAmount(campaignId: string) {
  try {
    // Calculate total amount from completed donations
    const donationStats = await db
      .select({
        totalAmount: sum(donations.amount),
      })
      .from(donations)
      .where(and(
        eq(donations.campaignId, campaignId),
        eq(donations.paymentStatus, 'completed')
      ));

    const totalAmount = Number(donationStats[0]?.totalAmount || 0);

    // Update campaign currentAmount
    await db
      .update(campaigns)
      .set({
        currentAmount: totalAmount.toString(),
      })
      .where(eq(campaigns.id, campaignId));

    // Check if campaign reached its goal and update status
    await checkAndUpdateGoalReached(campaignId);
  } catch (error) {
    console.error('Error updating campaign amount:', error);
  }
}

// Helper function to create notification for successful donation
async function createSuccessfulDonationNotification(donationId: string, campaignId: string) {
  try {
    // Get campaign creator ID
    const campaign = await db
      .select({ creatorId: campaigns.creatorId })
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (!campaign.length) {
      console.error('Campaign not found:', campaignId);
      return;
    }

    // Get donation details
    const donation = await db
      .select({ 
        amount: donations.amount, 
        currency: donations.currency,
        donorId: donations.donorId 
      })
      .from(donations)
      .where(eq(donations.id, donationId))
      .limit(1);

    if (!donation.length) {
      console.error('Donation not found:', donationId);
      return;
    }

    // Create notification for campaign creator
    await db.insert(notifications).values({
      userId: campaign[0].creatorId,
      type: 'donation_received',
      title: 'New Donation Received!',
      message: `You received a donation of ${donation[0].currency} ${donation[0].amount} for your campaign.`,
      metadata: JSON.stringify({
        donationId,
        campaignId,
        amount: donation[0].amount,
        currency: donation[0].currency,
        donorId: donation[0].donorId
      }),
      createdAt: new Date(),
    });

    console.log('Success notification created for donation:', donationId);
  } catch (error) {
    console.error('Error creating success notification:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { donationId, paymentIntentId, status } = body;

    if (!donationId || !paymentIntentId) {
      return NextResponse.json(
        { error: 'Missing required fields: donationId and paymentIntentId' },
        { status: 400 }
      );
    }

    console.log('Stripe callback received:', { donationId, paymentIntentId, status });

    // Find the donation
    const donation = await db
      .select()
      .from(donations)
      .where(eq(donations.id, donationId))
      .limit(1);

    if (!donation.length) {
      return NextResponse.json(
        { error: 'Donation not found' },
        { status: 404 }
      );
    }

    const donationRecord = donation[0];

    // Update donation status based on payment status with enhanced logic
    let newStatus: 'pending' | 'completed' | 'failed' = 'pending';
    let failureReason: string | undefined;
    let retryAttempts = donationRecord.retryAttempts || 0;
    
    if (status === 'succeeded') {
      newStatus = 'completed';
    } else if (DONATION_STATUS_CONFIG.STRIPE_PENDING_STATES.includes(status)) {
      newStatus = 'pending';
    } else if (DONATION_STATUS_CONFIG.STRIPE_FAILED_STATES.includes(status)) {
      newStatus = 'failed';
      failureReason = getFailureReason('stripe', status);
      
      // Increment retry attempts for failed payments
      retryAttempts += 1;
      
      // If max retries exceeded, mark as permanently failed
      if (retryAttempts >= DONATION_STATUS_CONFIG.MAX_RETRY_ATTEMPTS) {
        failureReason = DONATION_STATUS_CONFIG.FAILURE_REASONS.MAX_RETRIES;
      }
    } else {
      newStatus = 'failed';
      failureReason = DONATION_STATUS_CONFIG.FAILURE_REASONS.TECHNICAL_ERROR;
    }

    // Update the donation with enhanced fields
    await db
      .update(donations)
      .set({
        paymentStatus: newStatus,
        paymentIntentId: paymentIntentId,
        retryAttempts: retryAttempts,
        failureReason: failureReason,
        lastStatusUpdate: new Date(),
        providerStatus: status,
        providerError: status !== 'succeeded' ? `Stripe status: ${status}` : null,
      })
      .where(eq(donations.id, donationId));

    console.log(`Donation ${donationId} updated to status: ${newStatus}`);

    // If payment succeeded, update campaign amount and create notification
    if (newStatus === 'completed') {
      await updateCampaignAmount(donationRecord.campaignId);
      await createSuccessfulDonationNotification(donationId, donationRecord.campaignId);
      console.log(`Campaign ${donationRecord.campaignId} amount updated and notification created`);
    }

    return NextResponse.json({ 
      success: true, 
      donationId, 
      status: newStatus,
      message: `Donation ${donationId} updated to ${newStatus}` 
    });

  } catch (error) {
    console.error('Stripe callback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}