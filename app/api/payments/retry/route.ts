import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { donations } from '@/lib/schema/donations';
import { eq } from 'drizzle-orm';
import { isRetryable, getNextRetryTime } from '@/lib/utils/donation-status';

export async function POST(request: NextRequest) {
  try {
    const { donationId } = await request.json();

    if (!donationId) {
      return NextResponse.json(
        { success: false, error: 'Donation ID is required' },
        { status: 400 }
      );
    }

    // Get the donation
    const donation = await db
      .select()
      .from(donations)
      .where(eq(donations.id, donationId))
      .limit(1);

    if (!donation.length) {
      return NextResponse.json(
        { success: false, error: 'Donation not found' },
        { status: 404 }
      );
    }

    const donationRecord = donation[0];

    // Check if donation is retryable
    if (!isRetryable(donationRecord)) {
      const nextRetryTime = getNextRetryTime(donationRecord);
      const retryAttempts = donationRecord.retryAttempts || 0;
      const lastUpdate = donationRecord.lastStatusUpdate || donationRecord.createdAt;
      const now = new Date();
      const lastUpdateTime = new Date(lastUpdate);
      const timeSinceLastUpdate = now.getTime() - lastUpdateTime.getTime();
      const cooldownTime = 24 * 60 * 60 * 1000; // 24 hours
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Donation cannot be retried',
          nextRetryTime: nextRetryTime?.toISOString(),
          reason: donationRecord.failureReason || 'Maximum retry attempts exceeded',
          details: {
            retryAttempts,
            maxAttempts: 3,
            timeSinceLastUpdate: Math.round(timeSinceLastUpdate / (1000 * 60 * 60)), // hours
            cooldownRequired: Math.round(cooldownTime / (1000 * 60 * 60)) // hours
          }
        },
        { status: 400 }
      );
    }

    // Reset donation to pending status for retry
    await db
      .update(donations)
      .set({
        paymentStatus: 'pending',
        lastStatusUpdate: new Date(),
        providerStatus: 'retry_initiated',
        providerError: null,
      })
      .where(eq(donations.id, donationId));

    // TODO: Implement actual payment retry logic here
    // This would involve:
    // 1. Creating a new payment intent with the same details
    // 2. Redirecting user to payment page
    // 3. Handling the new payment flow

    return NextResponse.json({
      success: true,
      message: 'Donation retry initiated',
      donationId,
      status: 'pending'
    });

  } catch (error) {
    console.error('Retry payment error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retry payment' },
      { status: 500 }
    );
  }
}
