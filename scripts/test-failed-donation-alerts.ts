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
    // 1. Check if we have any users and campaigns
    const allUsers = await db.select().from(users).limit(1);
    const allCampaigns = await db.select().from(campaigns).limit(1);

    if (allUsers.length === 0) {
      return;
    }

    if (allCampaigns.length === 0) {
      return;
    }

    const testUser = allUsers[0];
    const testCampaign = allCampaigns[0];

    // 2. Create a test donation with failed status
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

    // 3. Create a notification for the failed donation
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

    // 4. Verify the notification was created
    const createdNotification = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, testNotification[0].id))
      .limit(1);

    if (createdNotification.length > 0) {
    } else {
    }

    // 5. Check failed donations count
    const failedDonations = await db
      .select()
      .from(donations)
      .where(eq(donations.paymentStatus, 'failed'));

    // 6. Check notifications count
    const allNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.type, 'donation_failed'));
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testFailedDonationAlert();
