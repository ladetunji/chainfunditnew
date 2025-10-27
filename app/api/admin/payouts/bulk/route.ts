import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { commissionPayouts } from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';

/**
 * PATCH /api/admin/payouts/bulk
 * Perform bulk actions on multiple payouts
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { payoutIds, action, ...actionData } = body;

    if (!payoutIds || !Array.isArray(payoutIds) || payoutIds.length === 0) {
      return NextResponse.json(
        { error: 'Payout IDs are required' },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    let updatedPayouts;
    const updateData = {
      updatedAt: new Date(),
    };

    switch (action) {
      case 'approve':
        updatedPayouts = await db
          .update(commissionPayouts)
          .set({ 
            ...updateData,
            status: 'approved',
          })
          .where(inArray(commissionPayouts.id, payoutIds))
          .returning();
        break;

      case 'reject':
        if (!actionData.rejectionReason) {
          return NextResponse.json(
            { error: 'Rejection reason is required for rejection' },
            { status: 400 }
          );
        }
        updatedPayouts = await db
          .update(commissionPayouts)
          .set({ 
            ...updateData,
            status: 'rejected',
            notes: actionData.rejectionReason,
          })
          .where(inArray(commissionPayouts.id, payoutIds))
          .returning();
        break;

      case 'pay':
        updatedPayouts = await db
          .update(commissionPayouts)
          .set({ 
            ...updateData,
            status: 'paid',
            processedAt: new Date(),
          })
          .where(inArray(commissionPayouts.id, payoutIds))
          .returning();
        break;

      case 'mark_failed':
        updatedPayouts = await db
          .update(commissionPayouts)
          .set({ 
            ...updateData,
            status: 'failed',
          })
          .where(inArray(commissionPayouts.id, payoutIds))
          .returning();
        break;

      case 'add_notes':
        if (!actionData.notes) {
          return NextResponse.json(
            { error: 'Notes are required for adding notes' },
            { status: 400 }
          );
        }
        updatedPayouts = await db
          .update(commissionPayouts)
          .set({ 
            ...updateData,
            notes: actionData.notes,
          })
          .where(inArray(commissionPayouts.id, payoutIds))
          .returning();
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: `Bulk ${action} completed successfully`,
      updatedCount: updatedPayouts.length,
      updatedPayouts: updatedPayouts.map(payout => ({
        id: payout.id,
        chainerId: payout.chainerId,
        status: payout.status,
        amount: payout.amount,
      })),
    });

  } catch (error) {
    console.error('Error performing bulk action:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}
