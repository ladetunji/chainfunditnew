#!/usr/bin/env tsx

import { db } from '../lib/db';
import { donations, campaigns, users } from '../lib/schema';
import { eq } from 'drizzle-orm';

async function createTestPendingFailedDonations() {
  try {
    // Use specific campaign: Save the Planet
    const campaignId = 'a9ac811e-e98a-43ba-9f3e-409111db5258';
    
    const testCampaigns = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (testCampaigns.length === 0) {
      return;
    }

    // Get a test user
    const testUsers = await db
      .select()
      .from(users)
      .limit(3);

    if (testUsers.length === 0) {
      return;
    }

    const campaign = testCampaigns[0];
    const user = testUsers[0];
    // Create test pending donations
    const pendingDonations = [
      {
        campaignId: campaign.id,
        donorId: user.id,
        amount: '50.00',
        currency: campaign.currency,
        paymentMethod: 'stripe',
        paymentStatus: 'pending',
        message: 'Test pending donation - waiting for payment',
        isAnonymous: false,
      },
      {
        campaignId: campaign.id,
        donorId: user.id,
        amount: '25.00',
        currency: campaign.currency,
        paymentMethod: 'paystack',
        paymentStatus: 'pending',
        message: 'Another pending donation',
        isAnonymous: true,
      },
      {
        campaignId: campaign.id,
        donorId: user.id,
        amount: '100.00',
        currency: campaign.currency,
        paymentMethod: 'stripe',
        paymentStatus: 'pending',
        message: 'Large pending donation',
        isAnonymous: false,
      },
    ];

    // Create test failed donations
    const failedDonations = [
      {
        campaignId: campaign.id,
        donorId: user.id,
        amount: '30.00',
        currency: campaign.currency,
        paymentMethod: 'stripe',
        paymentStatus: 'failed',
        message: 'Test failed donation - payment declined',
        isAnonymous: false,
      },
      {
        campaignId: campaign.id,
        donorId: user.id,
        amount: '75.00',
        currency: campaign.currency,
        paymentMethod: 'paystack',
        paymentStatus: 'failed',
        message: 'Another failed donation',
        isAnonymous: true,
      },
    ];

    // Insert pending donations
    for (const donation of pendingDonations) {
      const result = await db.insert(donations).values(donation).returning();
    }

    // Insert failed donations
    for (const donation of failedDonations) {
      const result = await db.insert(donations).values(donation).returning();
    }

  } catch (error) {
  } finally {
    process.exit(0);
  }
}

// Run the script
createTestPendingFailedDonations();
