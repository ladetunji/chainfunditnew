import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { donations, campaigns, users } from '@/lib/schema';
import { eq, and, inArray } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userEmail = await getUserFromRequest(request);
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: donationId } = await params;

    // Get the authenticated user
    const user = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
    if (!user.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user[0].id;

    // Get user's campaigns first
    const userCampaigns = await db
      .select({ id: campaigns.id })
      .from(campaigns)
      .where(eq(campaigns.creatorId, userId));

    if (userCampaigns.length === 0) {
      return NextResponse.json(
        { error: 'No campaigns found for user' },
        { status: 404 }
      );
    }

    const campaignIds = userCampaigns.map(c => c.id);

    // Get the donation and verify it belongs to the user's campaigns
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
      .where(
        and(
          eq(donations.id, donationId),
          inArray(donations.campaignId, campaignIds)
        )
      )
      .limit(1);

    if (!donation.length) {
      return NextResponse.json(
        { error: 'Donation not found or not authorized' },
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