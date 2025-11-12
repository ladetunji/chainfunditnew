#!/usr/bin/env tsx

import { db } from '@/lib/db';
import { charityDonations, charities } from '@/lib/schema/charities';
import { eq, sql } from 'drizzle-orm';

/**
 * Script to update test donations to completed status
 * Usage: npm run update-test-donations
 */

async function updateTestDonations() {
  try {

    // Get all pending donations
    const pendingDonations = await db.query.charityDonations.findMany({
      where: eq(charityDonations.paymentStatus, 'pending'),
      orderBy: (charityDonations, { desc }) => [desc(charityDonations.createdAt)],
    });

    if (pendingDonations.length === 0) {
      return;
    }


    pendingDonations.forEach((donation, index) => {
    });

    for (const donation of pendingDonations) {
      // Update donation to completed
      await db
        .update(charityDonations)
        .set({
          paymentStatus: 'completed',
          updatedAt: new Date(),
        })
        .where(eq(charityDonations.id, donation.id));

      // Update charity totals
      await db
        .update(charities)
        .set({
          totalReceived: sql`CAST(${charities.totalReceived} AS NUMERIC) + CAST(${donation.amount} AS NUMERIC)`,
          pendingAmount: sql`CAST(${charities.pendingAmount} AS NUMERIC) + CAST(${donation.amount} AS NUMERIC)`,
          updatedAt: new Date(),
        })
        .where(eq(charities.id, donation.charityId));

    }

  } catch (error) {
    console.error('❌ Error updating donations:', error);
    process.exit(1);
  }
}

updateTestDonations();

