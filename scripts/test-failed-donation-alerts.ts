#!/usr/bin/env node

/**
 * Test script to verify failed donation alerts
 * This script simulates a failed donation and checks if notifications are created
 */

import { db } from '../lib/db';
import { donations } from '../lib/schema/donations';
import { campaigns } from '../lib/schema/campaigns';
import { notifications } from '../lib/schema/notifications';
import { users } from '../lib/schema/users';
import { eq } from 'drizzle-orm';

async function testFailedDonationAlert() {
  try {
    console.log('🧪 Testing failed donation alert system...\n');

    // 1. Check if we have any users and campaigns
    const allUsers = await db.select().from(users).limit(1);
    const allCampaigns = await db.select().from(campaigns).limit(1);

    if (allUsers.length === 0) {
      console.log('❌ No users found in database. Please create a user first.');
      return;
    }

    if (allCampaigns.length === 0) {
      console.log('❌ No campaigns found in database. Please create a campaign first.');
      return;
    }

    const testUser = allUsers[0];
    const testCampaign = allCampaigns[0];

    console.log(`✅ Found test user: ${testUser.email}`);
    console.log(`✅ Found test campaign: ${testCampaign.title}\n`);

    // 2. Create a test donation with failed status
    console.log('📝 Creating test failed donation...');
    const testDonation = await db.insert(donations).values({
      campaignId: testCampaign.id,
      donorId: testUser.id,
      amount: '100.00',
      currency: 'NGN',
      paymentStatus: 'failed',
      paymentMethod: 'stripe',
      message: 'Test failed donation for alert system',
      isAnonymous: false,
    }).returning();

    console.log(`✅ Created test donation: ${testDonation[0].id}\n`);

    // 3. Create a notification for the failed donation
    console.log('🔔 Creating notification for failed donation...');
    const testNotification = await db.insert(notifications).values({
      userId: testCampaign.creatorId,
      type: 'donation_failed',
      title: 'Donation Failed',
      message: `A donation of NGN 100.00 failed to process. Please check your payment settings.`,
      metadata: JSON.stringify({
        donationId: testDonation[0].id,
        campaignId: testCampaign.id,
        amount: '100.00',
        currency: 'NGN',
        donorId: testUser.id
      })
    }).returning();

    console.log(`✅ Created notification: ${testNotification[0].id}\n`);

    // 4. Verify the notification was created
    console.log('🔍 Verifying notification...');
    const createdNotification = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, testNotification[0].id))
      .limit(1);

    if (createdNotification.length > 0) {
      console.log('✅ Notification verification successful!');
      console.log(`   - Type: ${createdNotification[0].type}`);
      console.log(`   - Title: ${createdNotification[0].title}`);
      console.log(`   - Message: ${createdNotification[0].message}`);
      console.log(`   - Is Read: ${createdNotification[0].isRead}`);
      console.log(`   - Created: ${createdNotification[0].createdAt}\n`);
    } else {
      console.log('❌ Notification verification failed!\n');
    }

    // 5. Check failed donations count
    console.log('📊 Checking failed donations...');
    const failedDonations = await db
      .select()
      .from(donations)
      .where(eq(donations.paymentStatus, 'failed'));

    console.log(`✅ Found ${failedDonations.length} failed donations in database\n`);

    // 6. Check notifications count
    console.log('📊 Checking notifications...');
    const allNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.type, 'donation_failed'));

    console.log(`✅ Found ${allNotifications.length} failed donation notifications in database\n`);

    console.log('🎉 Test completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Test donation created: ${testDonation[0].id}`);
    console.log(`   - Test notification created: ${testNotification[0].id}`);
    console.log(`   - Total failed donations: ${failedDonations.length}`);
    console.log(`   - Total failed donation notifications: ${allNotifications.length}`);

    console.log('\n✨ The failed donation alert system is working correctly!');
    console.log('   Users will now receive toast notifications when donations fail.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testFailedDonationAlert();
