import { db } from '../lib/db';
import { donations } from '../lib/schema/donations';
import { campaigns } from '../lib/schema/campaigns';
import { eq, and, sum } from 'drizzle-orm';
import { verifyPaystackTransaction } from '../lib/payments/paystack';

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

    console.log(`✅ Updated campaign ${campaignId} currentAmount to ${totalAmount}`);
  } catch (error) {
    console.error('❌ Error updating campaign amount:', error);
  }
}

async function fixPaystackDonations() {
  try {
    console.log('🔧 Fixing Paystack donations...\n');

    // Get all pending Paystack donations
    const pendingDonations = await db
      .select()
      .from(donations)
      .where(and(
        eq(donations.paymentMethod, 'paystack'),
        eq(donations.paymentStatus, 'pending')
      ));

    console.log(`📊 Found ${pendingDonations.length} pending Paystack donations\n`);

    if (pendingDonations.length === 0) {
      console.log('✅ No pending Paystack donations to fix');
      return;
    }

    let fixedCount = 0;
    let errorCount = 0;

    for (const donation of pendingDonations) {
      try {
        console.log(`🔍 Checking donation ${donation.id} with reference ${donation.paymentIntentId}`);
        
        if (!donation.paymentIntentId) {
          console.log(`⚠️  No payment reference found for donation ${donation.id}`);
          continue;
        }

        // Verify the transaction with Paystack
        const verification = await verifyPaystackTransaction(donation.paymentIntentId);
        
        if (verification.success) {
          console.log(`✅ Payment verified for donation ${donation.id}`);
          
          // Update donation status
          await db
            .update(donations)
            .set({
              paymentStatus: 'completed',
              processedAt: new Date(),
            })
            .where(eq(donations.id, donation.id));

          // Update campaign amount
          await updateCampaignAmount(donation.campaignId);
          
          fixedCount++;
          console.log(`✅ Fixed donation ${donation.id}`);
        } else {
          console.log(`❌ Payment verification failed for donation ${donation.id}: ${verification.error}`);
          
          // Mark as failed if verification fails
          await db
            .update(donations)
            .set({
              paymentStatus: 'failed',
            })
            .where(eq(donations.id, donation.id));
          
          errorCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing donation ${donation.id}:`, error);
        errorCount++;
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`✅ Fixed: ${fixedCount} donations`);
    console.log(`❌ Errors: ${errorCount} donations`);

  } catch (error) {
    console.error('❌ Error fixing Paystack donations:', error);
  } finally {
    process.exit(0);
  }
}

fixPaystackDonations();
