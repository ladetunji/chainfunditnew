import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { donations } from '@/lib/schema/donations';
import { campaigns } from '@/lib/schema/campaigns';
import { notifications } from '@/lib/schema/notifications';
import { eq, sum, and } from 'drizzle-orm';
import { handlePaystackWebhook, verifyPaystackTransaction } from '@/lib/payments/paystack';

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

    console.log(`Updated campaign ${campaignId} currentAmount to ${totalAmount}`);
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

    console.log(`Created failed donation notification for campaign creator: ${campaign[0].creatorId}`);
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

    console.log(`Created successful donation notification for campaign creator: ${campaign[0].creatorId}`);
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

    console.log(`Created pending donation notification for campaign creator: ${campaign[0].creatorId}`);
  } catch (error) {
    console.error('Error creating pending donation notification:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔔 Paystack webhook received:', JSON.stringify(body, null, 2));
    
    const { success, event, error } = await handlePaystackWebhook(body);

    if (!success) {
      console.error('Paystack webhook error:', error);
      return NextResponse.json({ error }, { status: 400 });
    }

    console.log('📋 Processing event:', event.event);

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        console.log('✅ Processing successful charge');
        await handleChargeSuccess(event.data);
        break;
      
      case 'charge.failed':
        console.log('❌ Processing failed charge');
        await handleChargeFailed(event.data);
        break;
      
      case 'charge.pending':
        console.log('⏳ Processing pending charge');
        await handleChargePending(event.data);
        break;
      
      default:
        console.log(`⚠️ Unhandled event type: ${event.event}`);
    }

    console.log('✅ Webhook processed successfully');
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('💥 Error processing Paystack webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleChargeSuccess(chargeData: any) {
  try {
    console.log('💰 Processing successful charge:', JSON.stringify(chargeData, null, 2));
    
    const donationId = chargeData.metadata?.donationId;
    const reference = chargeData.reference;
    
    console.log('🔍 Donation ID:', donationId, 'Reference:', reference);
    
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

    console.log('📊 Found donation, campaign ID:', donation[0].campaignId);

    // Verify the transaction
    console.log('🔐 Verifying transaction with reference:', reference);
    const verification = await verifyPaystackTransaction(reference);
    console.log('🔐 Verification result:', verification);
    
    if (verification.success) {
      console.log('✅ Transaction verified, updating donation status');
      
      await db
        .update(donations)
        .set({
          paymentStatus: 'completed',
          processedAt: new Date(),
        })
        .where(eq(donations.id, donationId));

      console.log('✅ Donation status updated to completed');

      // Update campaign currentAmount
      console.log('📈 Updating campaign amount for campaign:', donation[0].campaignId);
      await updateCampaignAmount(donation[0].campaignId);

      // Create notification for successful donation
      console.log('🔔 Creating notification for successful donation');
      await createSuccessfulDonationNotification(donationId, donation[0].campaignId);

      console.log(`✅ Payment completed for donation: ${donationId}`);
    } else {
      console.error('❌ Transaction verification failed:', verification.error);
    }
  } catch (error) {
    console.error('💥 Error handling charge success:', error);
  }
}

async function handleChargeFailed(chargeData: any) {
  try {
    console.log('❌ Processing failed charge:', JSON.stringify(chargeData, null, 2));
    
    const donationId = chargeData.metadata?.donationId;
    
    console.log('🔍 Failed donation ID:', donationId);
    
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
      console.error('❌ Donation not found:', donationId);
      return;
    }

    console.log('📊 Found failed donation, campaign ID:', donation[0].campaignId);

    // Update donation status to failed
    console.log('📝 Updating donation status to failed');
    await db
      .update(donations)
      .set({
        paymentStatus: 'failed',
      })
      .where(eq(donations.id, donationId));

    console.log('✅ Donation status updated to failed');

    // Create notification for failed donation
    console.log('🔔 Creating notification for failed donation');
    await createFailedDonationNotification(donationId, donation[0].campaignId);

    console.log(`✅ Failed payment processed for donation: ${donationId}`);
  } catch (error) {
    console.error('💥 Error handling charge failure:', error);
  }
}

async function handleChargePending(chargeData: any) {
  try {
    console.log('⏳ Processing pending charge:', JSON.stringify(chargeData, null, 2));
    
    const donationId = chargeData.metadata?.donationId;
    
    console.log('🔍 Pending donation ID:', donationId);
    
    if (!donationId) {
      console.error('❌ No donation ID found in pending charge metadata');
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

    console.log('📊 Found pending donation, campaign ID:', donation[0].campaignId);

    // Update donation status to pending
    console.log('📝 Updating donation status to pending');
    await db
      .update(donations)
      .set({
        paymentStatus: 'pending',
      })
      .where(eq(donations.id, donationId));

    console.log('✅ Donation status updated to pending');

    // Create notification for pending donation
    console.log('🔔 Creating notification for pending donation');
    await createPendingDonationNotification(donationId, donation[0].campaignId);

    console.log(`✅ Pending payment processed for donation: ${donationId}`);
  } catch (error) {
    console.error('💥 Error handling pending charge:', error);
  }
}
