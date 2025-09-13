import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { donations } from '@/lib/schema/donations';
import { campaigns } from '@/lib/schema/campaigns';
import { notifications } from '@/lib/schema/notifications';
import { eq, sum, and } from 'drizzle-orm';
import { handleStripeWebhook } from '@/lib/payments/stripe';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    const { success, event, error } = await handleStripeWebhook(body, signature);

    if (!success) {
      return NextResponse.json({ error }, { status: 400 });
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Error processing Stripe webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(paymentIntent: any) {
  try {
    const donationId = paymentIntent.metadata.donationId;
    
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

    await db
      .update(donations)
      .set({
        paymentStatus: 'completed',
        processedAt: new Date(),
      })
      .where(eq(donations.id, donationId));

    // Update campaign currentAmount
    await updateCampaignAmount(donation[0].campaignId);

    // Create notification for successful donation
    await createSuccessfulDonationNotification(donationId, donation[0].campaignId);

  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(paymentIntent: any) {
  try {
    const donationId = paymentIntent.metadata.donationId;
    
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

    await db
      .update(donations)
      .set({
        paymentStatus: 'failed',
      })
      .where(eq(donations.id, donationId));

    // Create notification for failed donation
    await createFailedDonationNotification(donationId, donation[0].campaignId);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}
