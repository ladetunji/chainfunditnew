import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { donations } from '@/lib/schema/donations';
import { campaigns } from '@/lib/schema/campaigns';
import { eq, sum, and } from 'drizzle-orm';
import { toast } from 'sonner';

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

  } catch (error) {
    toast.error('Error updating campaign amount: ' + error);
  }
}

// GET - List all pending donations
export async function GET(request: NextRequest) {
  try {
    const pendingDonations = await db
      .select({
        id: donations.id,
        campaignId: donations.campaignId,
        amount: donations.amount,
        currency: donations.currency,
        paymentMethod: donations.paymentMethod,
        paymentStatus: donations.paymentStatus,
        createdAt: donations.createdAt,
        processedAt: donations.processedAt,
      })
      .from(donations)
      .where(eq(donations.paymentStatus, 'pending'))
      .orderBy(donations.createdAt);

    return NextResponse.json({
      success: true,
      data: pendingDonations,
      count: pendingDonations.length,
    });
  } catch (error) {
    toast.error('Error fetching pending donations: ' + error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pending donations' },
      { status: 500 }
    );
  }
}

// POST - Update donation status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { donationId, status = 'completed' } = body;

    if (!donationId) {
      return NextResponse.json(
        { success: false, error: 'Missing donation ID' },
        { status: 400 }
      );
    }

    if (!['completed', 'failed', 'pending'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be completed, failed, or pending' },
        { status: 400 }
      );
    }

    // Get donation
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

    // Update donation status
    await db
      .update(donations)
      .set({
        paymentStatus: status,
        processedAt: status === 'completed' ? new Date() : null,
        lastStatusUpdate: new Date(),
      })
      .where(eq(donations.id, donationId));

    // If payment was successful, update campaign currentAmount
    if (status === 'completed') {
      await updateCampaignAmount(donationRecord.campaignId);
    }

    return NextResponse.json({
      success: true,
      donationId,
      status,
      message: `Donation ${donationId} updated to ${status}`,
    });

  } catch (error) {
    toast.error('Error updating donation: ' + error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update all pending donations to completed
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { status = 'completed', campaignId } = body;

    if (!['completed', 'failed'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be completed or failed' },
        { status: 400 }
      );
    }

    // Build where condition
    const whereCondition = campaignId 
      ? and(eq(donations.paymentStatus, 'pending'), eq(donations.campaignId, campaignId))
      : eq(donations.paymentStatus, 'pending');

    // Get all pending donations
    const pendingDonations = await db
      .select()
      .from(donations)
      .where(whereCondition);

    if (pendingDonations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending donations found',
        updatedCount: 0,
      });
    }

    // Update all pending donations
    await db
      .update(donations)
      .set({
        paymentStatus: status,
        processedAt: status === 'completed' ? new Date() : null,
        lastStatusUpdate: new Date(),
      })
      .where(whereCondition);

    // If payments were successful, update campaign amounts
    if (status === 'completed') {
      const campaignIds = [...new Set(pendingDonations.map(d => d.campaignId))];
      for (const cId of campaignIds) {
        await updateCampaignAmount(cId);
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount: pendingDonations.length,
      status,
      message: `Updated ${pendingDonations.length} donations to ${status}`,
    });

  } catch (error) {
    toast.error('Error updating donations: ' + error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
