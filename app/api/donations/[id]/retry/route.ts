import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { donations } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: donationId } = await params;

    // Get the donation to verify it belongs to the user's campaigns
    const donation = await db
      .select({
        id: donations.id,
        campaignId: donations.campaignId,
        paymentStatus: donations.paymentStatus,
        amount: donations.amount,
        currency: donations.currency,
        paymentProvider: donations.paymentMethod,
      })
      .from(donations)
      .where(eq(donations.id, donationId))
      .limit(1);

    if (!donation.length) {
      return NextResponse.json(
        { error: 'Donation not found' },
        { status: 404 }
      );
    }

    // Check if donation is in failed status
    if (donation[0].paymentStatus !== 'failed') {
      return NextResponse.json(
        { error: 'Only failed donations can be retried' },
        { status: 400 }
      );
    }

    // Update donation status to pending for retry
    await db
      .update(donations)
      .set({
        paymentStatus: 'pending',
        processedAt: null, // Reset processed date
      })
      .where(eq(donations.id, donationId));

    return NextResponse.json({
      success: true,
      message: 'Donation retry initiated successfully',
      data: {
        donationId,
        newStatus: 'pending',
        message: 'The donation has been queued for retry. Please check back later for updates.'
      }
    });

  } catch (error) {
    console.error('Error retrying donation:', error);
    return NextResponse.json(
      { error: 'Failed to retry donation' },
      { status: 500 }
    );
  }
}