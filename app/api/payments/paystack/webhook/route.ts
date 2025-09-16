import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { donations } from '@/lib/schema/donations';
import { campaigns } from '@/lib/schema/campaigns';
import { notifications } from '@/lib/schema/notifications';
import { eq, sum, and } from 'drizzle-orm';
import { handlePaystackWebhook, verifyPaystackTransaction } from '@/lib/payments/paystack';
import { 
  DONATION_STATUS_CONFIG, 
  getFailureReason, 
  isDonationPending, 
  isDonationFailed 
} from '@/lib/utils/donation-status';

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
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, campaignId));

  } catch (error) {
    console.error('Error updating campaign amount:', error);
  }
}

// Helper function to create notification for failed donation
async function createFailedDonationNotification(donationId: string, campaignId: string) {
  try {
    // Get campaign creator ID
    const campaign = await db
      .select({ creatorId: campaigns.creatorId })
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (!campaign.length) {
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
      return;
    }

    // Create notification for campaign creator
    await db.insert(notifications).values({
      userId: campaign[0].creatorId,
      type: 'donation_failed',
      title: 'Donation Failed',
      message: `A donation of ${donation[0].currency} ${donation[0].amount} failed to process. Please check your payment settings.`,
      metadata: JSON.stringify({
        donationId,
        campaignId,
        amount: donation[0].amount,
        currency: donation[0].currency,
        donorId: donation[0].donorId
      })
    });

  } catch (error) {
    console.error('Error creating failed donation notification:', error);
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
      message: `You received a donation of ${donation[0].currency} ${donation[0].amount}. Thank you for your campaign!`,
      metadata: JSON.stringify({
        donationId,
        campaignId,
        amount: donation[0].amount,
        currency: donation[0].currency,
        donorId: donation[0].donorId
      })
    });

  } catch (error) {
    console.error('Error creating successful donation notification:', error);
  }
}

// Helper function to create notification for pending donation
async function createPendingDonationNotification(donationId: string, campaignId: string) {
  try {
    // Get campaign creator ID
    const campaign = await db
      .select({ creatorId: campaigns.creatorId })
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (!campaign.length) {
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
      type: 'donation_pending',
      title: 'Donation Pending',
      message: `A donation of ${donation[0].currency} ${donation[0].amount} is pending verification. You'll be notified once it's confirmed.`,
      metadata: JSON.stringify({
        donationId,
        campaignId,
        amount: donation[0].amount,
        currency: donation[0].currency,
        donorId: donation[0].donorId
      })
    });

  } catch (error) {
    console.error('Error creating pending donation notification:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-paystack-signature');
    
    const { success, event, error } = await handlePaystackWebhook(body, signature || undefined);

    if (!success) {
      return NextResponse.json({ error }, { status: 400 });
    }

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(event.data);
        break;
      
      case 'charge.failed':
        await handleChargeFailed(event.data);
        break;
      
      case 'charge.pending':
        await handleChargePending(event.data);
        break;
      
      default:
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleChargeSuccess(chargeData: any) {
  try {
    const donationId = chargeData.metadata?.donationId;
    const reference = chargeData.reference;
    
    if (!donationId) {
      return;
    }

    // Get donation to get campaignId
    const donation = await db
      .select({ campaignId: donations.campaignId })
      .from(donations)
      .where(eq(donations.id, donationId))
      .limit(1);

    if (!donation.length) {
      return;
    }


    // Verify the transaction
    const verification = await verifyPaystackTransaction(reference);
    
    if (verification.success) {
      
      await db
        .update(donations)
        .set({
          paymentStatus: 'completed',
          processedAt: new Date(),
          lastStatusUpdate: new Date(),
          providerStatus: 'success',
          providerError: null,
        })
        .where(eq(donations.id, donationId));
      // Update campaign currentAmount
      await updateCampaignAmount(donation[0].campaignId);

      // Create notification for successful donation
      await createSuccessfulDonationNotification(donationId, donation[0].campaignId);

    } else {
      console.error('❌ Transaction verification failed:', verification.error);
    }
  } catch (error) {
  }
}

async function handleChargeFailed(chargeData: any) {
  try {
    const donationId = chargeData.metadata?.donationId;
    if (!donationId) {
      return;
    }

    // Get donation to get campaignId
    const donation = await db
      .select({ campaignId: donations.campaignId })
      .from(donations)
      .where(eq(donations.id, donationId))
      .limit(1);

    if (!donation.length) {
      return;
    }

    // Get current donation to check retry attempts
    const currentDonation = await db
      .select({ retryAttempts: donations.retryAttempts })
      .from(donations)
      .where(eq(donations.id, donationId))
      .limit(1);

    const retryAttempts = (currentDonation[0]?.retryAttempts || 0) + 1;
    const failureReason = getFailureReason('paystack', 'failed', chargeData.gateway_response);
    
    // Update donation status to failed with enhanced tracking
    await db
      .update(donations)
      .set({
        paymentStatus: 'failed',
        retryAttempts: retryAttempts,
        failureReason: retryAttempts >= DONATION_STATUS_CONFIG.MAX_RETRY_ATTEMPTS 
          ? DONATION_STATUS_CONFIG.FAILURE_REASONS.MAX_RETRIES 
          : failureReason,
        lastStatusUpdate: new Date(),
        providerStatus: 'failed',
        providerError: chargeData.gateway_response || 'Payment failed',
      })
      .where(eq(donations.id, donationId));

    // Create notification for failed donation
    await createFailedDonationNotification(donationId, donation[0].campaignId);

  } catch (error) {
    console.error('💥 Error handling charge failure:', error);
  }
}

async function handleChargePending(chargeData: any) {
  try {
    const donationId = chargeData.metadata?.donationId;
    
    if (!donationId) {
      return;
    }

    // Get donation to get campaignId
    const donation = await db
      .select({ campaignId: donations.campaignId })
      .from(donations)
      .where(eq(donations.id, donationId))
      .limit(1);

    if (!donation.length) {
      return;
    }
    // Update donation status to pending with enhanced tracking
    await db
      .update(donations)
      .set({
        paymentStatus: 'pending',
        lastStatusUpdate: new Date(),
        providerStatus: 'pending',
        providerError: null,
      })
      .where(eq(donations.id, donationId));

    // Create notification for pending donation
    await createPendingDonationNotification(donationId, donation[0].campaignId);

  } catch (error) {
    console.error('💥 Error handling pending charge:', error);
  }
}
