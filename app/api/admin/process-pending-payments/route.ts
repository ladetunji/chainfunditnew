import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { donations } from '@/lib/schema/donations';
import { campaigns } from '@/lib/schema/campaigns';
import { eq, sum, and, isNull, lt } from 'drizzle-orm';
import { verifyPaystackTransaction } from '@/lib/payments/paystack';
import { checkAndUpdateGoalReached } from '@/lib/utils/campaign-validation';

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

    // Check if campaign reached its goal and update status
    await checkAndUpdateGoalReached(campaignId);
  } catch (error) {
    console.error('Error updating campaign amount:', error);
  }
}

// GET /api/admin/process-pending-payments - Get all pending payments
export async function GET(request: NextRequest) {
  try {
    // Get all pending donations older than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const pendingDonations = await db
      .select({
        id: donations.id,
        campaignId: donations.campaignId,
        amount: donations.amount,
        currency: donations.currency,
        paymentMethod: donations.paymentMethod,
        paymentIntentId: donations.paymentIntentId,
        createdAt: donations.createdAt,
        lastStatusUpdate: donations.lastStatusUpdate,
      })
      .from(donations)
      .where(and(
        eq(donations.paymentStatus, 'pending'),
        lt(donations.createdAt, fiveMinutesAgo)
      ))
      .orderBy(donations.createdAt);

    return NextResponse.json({
      success: true,
      data: pendingDonations,
      count: pendingDonations.length
    });
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pending payments' },
      { status: 500 }
    );
  }
}

// POST /api/admin/process-pending-payments - Process pending payments
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { donationId, action = 'verify' } = body;

    if (!donationId) {
      return NextResponse.json(
        { success: false, error: 'Missing donation ID' },
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

    if (donationRecord.paymentStatus !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Donation is not pending' },
        { status: 400 }
      );
    }

    let newStatus = 'pending';
    let processedAt = null;
    let providerStatus = null;
    let providerError = null;

    if (action === 'verify' && donationRecord.paymentMethod === 'paystack' && donationRecord.paymentIntentId) {
      // Verify with Paystack
      try {
        const verification = await verifyPaystackTransaction(donationRecord.paymentIntentId);
        
        if (verification.success) {
          newStatus = 'completed';
          processedAt = new Date();
          providerStatus = 'success';
          providerError = null;
        } else {
          newStatus = 'failed';
          providerStatus = 'failed';
          providerError = verification.error || 'Verification failed';
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        newStatus = 'failed';
        providerStatus = 'error';
        providerError = error instanceof Error ? error.message : 'Verification error';
      }
    } else if (action === 'complete') {
      // Manually mark as completed
      newStatus = 'completed';
      processedAt = new Date();
      providerStatus = 'manual_completion';
      providerError = null;
    } else if (action === 'fail') {
      // Manually mark as failed
      newStatus = 'failed';
      providerStatus = 'manual_failure';
      providerError = 'Manually marked as failed';
    }

    // Update the donation
    const updateResult = await db
      .update(donations)
      .set({
        paymentStatus: newStatus,
        processedAt,
        lastStatusUpdate: new Date(),
        providerStatus,
        providerError,
      })
      .where(eq(donations.id, donationId))
      .returning();

    // If completed, update campaign amount
    if (newStatus === 'completed') {
      await updateCampaignAmount(donationRecord.campaignId);
    }

    return NextResponse.json({
      success: true,
      data: updateResult[0],
      message: `Donation ${donationId} updated to ${newStatus}`
    });

  } catch (error) {
    console.error('Error processing pending payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}
