import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaignPayouts, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getAdminUser } from '@/lib/admin-auth';

/**
 * GET /api/admin/payouts/campaigns/[id]
 * Get a specific campaign payout request
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const payout = await db.query.campaignPayouts.findFirst({
      where: eq(campaignPayouts.id, id),
      with: {
        user: true,
        campaign: true,
      },
    });

    if (!payout) {
      return NextResponse.json(
        { error: 'Payout not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ payout });
  } catch (error) {
    console.error('Error fetching campaign payout:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payout' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/payouts/campaigns/[id]
 * Update campaign payout status or perform actions
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getAdminUser(request);
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action, notes, rejectionReason } = body;

    // Check if payout exists
    const existingPayout = await db.query.campaignPayouts.findFirst({
      where: eq(campaignPayouts.id, id),
    });

    if (!existingPayout) {
      return NextResponse.json(
        { error: 'Payout not found' },
        { status: 404 }
      );
    }

    let updatedPayout;

    switch (action) {
      case 'approve':
        updatedPayout = await db
          .update(campaignPayouts)
          .set({ 
            status: 'approved',
            approvedBy: adminUser.id,
            approvedAt: new Date(),
            notes: notes || null,
            updatedAt: new Date(),
          })
          .where(eq(campaignPayouts.id, id))
          .returning();
        break;

      case 'reject':
        if (!rejectionReason) {
          return NextResponse.json(
            { error: 'Rejection reason is required' },
            { status: 400 }
          );
        }
        updatedPayout = await db
          .update(campaignPayouts)
          .set({ 
            status: 'rejected',
            rejectionReason,
            notes: notes || null,
            updatedAt: new Date(),
          })
          .where(eq(campaignPayouts.id, id))
          .returning();
        break;

      case 'process':
        updatedPayout = await db
          .update(campaignPayouts)
          .set({ 
            status: 'processing',
            notes: notes || null,
            updatedAt: new Date(),
          })
          .where(eq(campaignPayouts.id, id))
          .returning();
        break;

      case 'complete':
        updatedPayout = await db
          .update(campaignPayouts)
          .set({ 
            status: 'completed',
            processedAt: new Date(),
            notes: notes || null,
            updatedAt: new Date(),
          })
          .where(eq(campaignPayouts.id, id))
          .returning();
        break;

      case 'fail':
        updatedPayout = await db
          .update(campaignPayouts)
          .set({ 
            status: 'failed',
            failureReason: rejectionReason || 'Payout processing failed',
            notes: notes || null,
            updatedAt: new Date(),
          })
          .where(eq(campaignPayouts.id, id))
          .returning();
        break;

      case 'add_notes':
        if (!notes) {
          return NextResponse.json(
            { error: 'Notes are required' },
            { status: 400 }
          );
        }
        updatedPayout = await db
          .update(campaignPayouts)
          .set({ 
            notes,
            updatedAt: new Date(),
          })
          .where(eq(campaignPayouts.id, id))
          .returning();
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: `Payout ${action}ed successfully`,
      payout: updatedPayout[0],
    });

  } catch (error) {
    console.error('Error updating campaign payout:', error);
    return NextResponse.json(
      { error: 'Failed to update payout' },
      { status: 500 }
    );
  }
}

