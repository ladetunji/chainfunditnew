import { db } from '../lib/db';
import { donations } from '../lib/schema/donations';
import { campaigns } from '../lib/schema/campaigns';
import { users } from '../lib/schema/users';
import { eq, desc } from 'drizzle-orm';

async function testPaystackDonations() {
  try {
    console.log('🔍 Checking Paystack donations...\n');

    // Get all Paystack donations
    const paystackDonations = await db
      .select({
        id: donations.id,
        amount: donations.amount,
        currency: donations.currency,
        paymentStatus: donations.paymentStatus,
        paymentIntentId: donations.paymentIntentId,
        createdAt: donations.createdAt,
        processedAt: donations.processedAt,
        campaignId: donations.campaignId,
        donorId: donations.donorId,
        campaignTitle: campaigns.title,
        donorName: users.fullName,
        donorEmail: users.email,
      })
      .from(donations)
      .leftJoin(campaigns, eq(donations.campaignId, campaigns.id))
      .leftJoin(users, eq(donations.donorId, users.id))
      .where(eq(donations.paymentMethod, 'paystack'))
      .orderBy(desc(donations.createdAt));

    console.log(`📊 Found ${paystackDonations.length} Paystack donations:\n`);

    if (paystackDonations.length === 0) {
      console.log('❌ No Paystack donations found in database');
      return;
    }

    // Group by status
    const byStatus = paystackDonations.reduce((acc, donation) => {
      const status = donation.paymentStatus || 'unknown';
      if (!acc[status]) acc[status] = [];
      acc[status].push(donation);
      return acc;
    }, {} as Record<string, any[]>);

    // Display summary
    console.log('📈 Summary by Status:');
    Object.entries(byStatus).forEach(([status, donations]) => {
      console.log(`  ${status}: ${donations.length} donations`);
    });

    console.log('\n📋 Recent Paystack Donations:');
    paystackDonations.slice(0, 10).forEach((donation, index) => {
      console.log(`\n${index + 1}. Donation ID: ${donation.id}`);
      console.log(`   Amount: ${donation.currency} ${donation.amount}`);
      console.log(`   Status: ${donation.paymentStatus}`);
      console.log(`   Reference: ${donation.paymentIntentId || 'N/A'}`);
      console.log(`   Campaign: ${donation.campaignTitle || 'N/A'}`);
      console.log(`   Donor: ${donation.donorName || donation.donorEmail || 'N/A'}`);
      console.log(`   Created: ${donation.createdAt}`);
      console.log(`   Processed: ${donation.processedAt || 'Not processed'}`);
    });

    // Check for stuck donations
    const stuckDonations = paystackDonations.filter(d => 
      d.paymentStatus === 'pending' && 
      new Date(d.createdAt).getTime() < Date.now() - 24 * 60 * 60 * 1000 // Older than 24 hours
    );

    if (stuckDonations.length > 0) {
      console.log(`\n⚠️  Found ${stuckDonations.length} donations stuck in pending status for more than 24 hours:`);
      stuckDonations.forEach(donation => {
        console.log(`   - ${donation.id}: ${donation.currency} ${donation.amount} (${donation.createdAt})`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking Paystack donations:', error);
  } finally {
    process.exit(0);
  }
}

testPaystackDonations();
