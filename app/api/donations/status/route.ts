import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { donations } from '@/lib/schema/donations';
import { campaigns } from '@/lib/schema/campaigns';
import { eq, sum, and } from 'drizzle-orm';
import { verifyPaystackTransaction } from '@/lib/payments/paystack';
import { confirmStripePayment } from '@/lib/payments/stripe';

// Helper function to update campaign currentAmount based on completed donations
async function updateCampaignAmount(campaignId: string) {
  try {
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

    await db
      .update(campaigns)
      .set({
        currentAmount: totalAmount.toString(),
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, campaignId));

  } catch (error) {
    console.error('Error updating campaign amount:', error);
  }
}

// User-friendly donation status check
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const donationId = searchParams.get('donationId');

    if (!donationId) {
      return NextResponse.json(
        { success: false, error: 'Missing donation ID' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const userEmail = await getUserFromRequest(request);
    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get donation details
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

    const donationData = donation[0];

    // For pending donations, check with provider and update if needed
    if (donationData.paymentStatus === 'pending' && donationData.paymentIntentId) {
      let providerStatus;
      let wasUpdated = false;
      
      try {
        if (donationData.paymentMethod === 'paystack') {
          const verification = await verifyPaystackTransaction(donationData.paymentIntentId);
          providerStatus = verification.success ? 'completed' : 'failed';
        } else if (donationData.paymentMethod === 'stripe') {
          const confirmation = await confirmStripePayment(donationData.paymentIntentId);
          providerStatus = confirmation.success ? 'completed' : 'failed';
        }

        // Update database if status changed
        if (providerStatus && providerStatus !== donationData.paymentStatus) {
          await db
            .update(donations)
            .set({
              paymentStatus: providerStatus,
              processedAt: providerStatus === 'completed' ? new Date() : null,
            })
            .where(eq(donations.id, donationId));

          if (providerStatus === 'completed') {
            await updateCampaignAmount(donationData.campaignId);
          }

          wasUpdated = true;
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        // Return current status if check fails
        providerStatus = donationData.paymentStatus;
      }

      return NextResponse.json({
        success: true,
        donationId,
        status: providerStatus || donationData.paymentStatus,
        wasUpdated,
        message: wasUpdated ? 
          `Payment status updated to ${providerStatus}` : 
          `Payment is ${donationData.paymentStatus}`,
        donation: {
          id: donationData.id,
          amount: donationData.amount,
          currency: donationData.currency,
          paymentStatus: providerStatus || donationData.paymentStatus,
          createdAt: donationData.createdAt,
          processedAt: providerStatus === 'completed' ? new Date().toISOString() : donationData.processedAt,
        },
      });
    }

    // Return current status for completed/failed donations
    return NextResponse.json({
      success: true,
      donationId,
      status: donationData.paymentStatus,
      wasUpdated: false,
      message: `Donation is ${donationData.paymentStatus}`,
      donation: {
        id: donationData.id,
        amount: donationData.amount,
        currency: donationData.currency,
        paymentStatus: donationData.paymentStatus,
        createdAt: donationData.createdAt,
        processedAt: donationData.processedAt,
      },
    });

  } catch (error) {
    console.error('Error checking donation status:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
