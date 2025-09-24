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
import { shouldCloseForGoalReached, closeCampaign } from '@/lib/utils/campaign-closure';
import { calculateAndDistributeCommissions } from '@/lib/utils/commission-calculation';

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
    
    console.log('🔔 Paystack webhook received:', { 
      event: body.event, 
      signature: !!signature,
      data: body.data ? {
        reference: body.data.reference,
        metadata: body.data.metadata
      } : 'No data'
    });
    
    // Skip signature verification in development for easier testing
    const { success, event, error } = await handlePaystackWebhook(
      body, 
      process.env.NODE_ENV === 'development' ? undefined : signature || undefined
    );

    if (!success) {
      console.error('❌ Paystack webhook verification failed:', error);
      return NextResponse.json({ error }, { status: 400 });
    }

    console.log('✅ Paystack webhook verified, processing event:', event.event);

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        console.log('💰 Processing successful charge:', event.data.reference);
        await handleChargeSuccess(event.data);
        break;
      
      case 'charge.failed':
        console.log('❌ Processing failed charge:', event.data.reference);
        await handleChargeFailed(event.data);
        break;
      
      case 'charge.pending':
        console.log('⏳ Processing pending charge:', event.data.reference);
        await handleChargePending(event.data);
        break;
      
      default:
        console.log('ℹ️ Unhandled event type:', event.event);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('💥 Paystack webhook error:', error);
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
    
    console.log('🔍 Processing successful charge:', { donationId, reference });
    
    if (!donationId) {
      console.error('❌ No donation ID found in charge metadata');
      return;
    }

    // Get donation to get campaignId
    const donation = await db
      .select({ campaignId: donations.campaignId })
      .from(donations)
      .where(eq(donations.id, donationId))
      .limit(1);

    if (!donation.length) {
      console.error('❌ Donation not found:', donationId);
      return;
    }

    console.log('✅ Found donation:', donation[0].campaignId);

    // Verify the transaction
    const verification = await verifyPaystackTransaction(reference);
    
    if (verification.success) {
      console.log('✅ Transaction verified successfully');
      
      // Update donation status
      const updateResult = await db
        .update(donations)
        .set({
          paymentStatus: 'completed',
          processedAt: new Date(),
          lastStatusUpdate: new Date(),
          providerStatus: 'success',
          providerError: null,
          paymentIntentId: reference, // Store the Paystack reference
        })
        .where(eq(donations.id, donationId))
        .returning();

      console.log('✅ Donation updated:', updateResult[0]?.id);

      // Update campaign currentAmount
      await updateCampaignAmount(donation[0].campaignId);
      console.log('✅ Campaign amount updated');

      // Check if campaign should be closed due to goal reached
      const campaign = await db
        .select({
          id: campaigns.id,
          creatorId: campaigns.creatorId,
          title: campaigns.title,
          currentAmount: campaigns.currentAmount,
          goalAmount: campaigns.goalAmount,
          currency: campaigns.currency,
          status: campaigns.status
        })
        .from(campaigns)
        .where(eq(campaigns.id, donation[0].campaignId))
        .limit(1);

      if (campaign.length > 0 && campaign[0].status === 'active') {
        const currentAmount = parseFloat(campaign[0].currentAmount);
        const goalAmount = parseFloat(campaign[0].goalAmount);
        
        if (shouldCloseForGoalReached(currentAmount, goalAmount)) {
          console.log('🎯 Campaign goal reached, closing campaign...');
          await closeCampaign(campaign[0].id, 'goal_reached', campaign[0].creatorId);
        }
      }

      // Calculate and distribute commissions
      await calculateAndDistributeCommissions(donationId);
      console.log('✅ Commissions calculated and distributed');

      // Create notification for successful donation
      await createSuccessfulDonationNotification(donationId, donation[0].campaignId);
      console.log('✅ Success notification created');

    } else {
      console.error('❌ Transaction verification failed:', verification.error);
    }
  } catch (error) {
    console.error('💥 Error handling charge success:', error);
  }
}

async function handleChargeFailed(chargeData: any) {
  try {
    const donationId = chargeData.metadata?.donationId;
    const reference = chargeData.reference;
    
    console.log('❌ Processing failed charge:', { donationId, reference, gatewayResponse: chargeData.gateway_response });
    
    if (!donationId) {
      console.error('❌ No donation ID found in failed charge metadata');
      return;
    }

    // Get donation to get campaignId
    const donation = await db
      .select({ campaignId: donations.campaignId })
      .from(donations)
      .where(eq(donations.id, donationId))
      .limit(1);

    if (!donation.length) {
      console.error('❌ Donation not found for failed charge:', donationId);
      return;
    }

    console.log('✅ Found donation for failed charge:', donation[0].campaignId);

    // Get current donation to check retry attempts
    const currentDonation = await db
      .select({ retryAttempts: donations.retryAttempts })
      .from(donations)
      .where(eq(donations.id, donationId))
      .limit(1);

    const retryAttempts = (currentDonation[0]?.retryAttempts || 0) + 1;
    const failureReason = getFailureReason('paystack', 'failed', chargeData.gateway_response);
    
    console.log('🔄 Updating donation to failed status:', { retryAttempts, failureReason });
    
    // Update donation status to failed with enhanced tracking
    const updateResult = await db
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
        paymentIntentId: reference, // Store the reference for tracking
      })
      .where(eq(donations.id, donationId))
      .returning();

    console.log('✅ Donation updated to failed:', updateResult[0]?.id);

    // Create notification for failed donation
    await createFailedDonationNotification(donationId, donation[0].campaignId);
    console.log('✅ Failed donation notification created');

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
