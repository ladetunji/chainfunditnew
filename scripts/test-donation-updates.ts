import { db } from '@/lib/db';
import { donations } from '@/lib/schema/donations';
import { campaigns } from '@/lib/schema/campaigns';
import { eq, desc, and, count } from 'drizzle-orm';

async function testDonationUpdates() {
  try {
    console.log('🧪 Testing donation updates...\n');

    // Check recent donations
    console.log('📊 Recent Donations (last 10):');
    const recentDonations = await db
      .select()
      .from(donations)
      .orderBy(desc(donations.createdAt))
      .limit(10);

    if (recentDonations.length === 0) {
      console.log('❌ No donations found in database');
      return;
    }

    recentDonations.forEach((donation, index) => {
      console.log(`${index + 1}. ID: ${donation.id}`);
      console.log(`   Amount: ${donation.currency} ${donation.amount}`);
      console.log(`   Status: ${donation.paymentStatus}`);
      console.log(`   Provider: ${donation.paymentProvider}`);
      console.log(`   Payment ID: ${donation.paymentIntentId || 'N/A'}`);
      console.log(`   Created: ${donation.createdAt}`);
      console.log(`   Updated: ${donation.updatedAt}`);
      console.log(`   Campaign: ${donation.campaignId}`);
      console.log('');
    });

    // Check donation status distribution
    console.log('📈 Donation Status Distribution:');
    const statusCounts = await db
      .select({
        paymentStatus: donations.paymentStatus,
        count: count(donations.id),
      })
      .from(donations)
      .groupBy(donations.paymentStatus);

    statusCounts.forEach(status => {
      console.log(`   ${status.paymentStatus}: ${status.count} donations`);
    });

    // Check campaigns with their current amounts
    console.log('\n💰 Campaign Current Amounts:');
    const campaignsWithAmounts = await db
      .select({
        id: campaigns.id,
        title: campaigns.title,
        currentAmount: campaigns.currentAmount,
        targetAmount: campaigns.targetAmount,
      })
      .from(campaigns)
      .orderBy(desc(campaigns.updatedAt))
      .limit(5);

    campaignsWithAmounts.forEach((campaign, index) => {
      console.log(`${index + 1}. ${campaign.title}`);
      console.log(`   Current: ${campaign.currentAmount}`);
      console.log(`   Target: ${campaign.targetAmount}`);
      console.log(`   Progress: ${((parseFloat(campaign.currentAmount || '0') / parseFloat(campaign.targetAmount || '1')) * 100).toFixed(1)}%`);
      console.log('');
    });

    // Check for pending donations
    console.log('⏳ Pending Donations:');
    const pendingDonations = await db
      .select()
      .from(donations)
      .where(eq(donations.paymentStatus, 'pending'))
      .limit(5);

    if (pendingDonations.length > 0) {
      pendingDonations.forEach((donation, index) => {
        console.log(`${index + 1}. ID: ${donation.id}`);
        console.log(`   Amount: ${donation.currency} ${donation.amount}`);
        console.log(`   Provider: ${donation.paymentProvider}`);
        console.log(`   Created: ${donation.createdAt}`);
        console.log('');
      });
    } else {
      console.log('   No pending donations found');
    }

    console.log('✅ Donation update test completed');

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    process.exit(0);
  }
}

testDonationUpdates();
