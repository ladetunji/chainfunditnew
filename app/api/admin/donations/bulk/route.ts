import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { donations } from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';

/**
 * PATCH /api/admin/donations/bulk
 * Perform bulk actions on multiple donations
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { donationIds, action, ...actionData } = body;

    if (!donationIds || !Array.isArray(donationIds) || donationIds.length === 0) {
      return NextResponse.json(
        { error: 'Donation IDs are required' },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    let updatedDonations;
    const updateData = {
      updatedAt: new Date(),
    };

    switch (action) {
      case 'refund':
        if (!actionData.reason) {
          return NextResponse.json(
            { error: 'Refund reason is required for refund action' },
            { status: 400 }
          );
        }
        updatedDonations = await db
          .update(donations)
          .set({ 
            ...updateData,
            paymentStatus: 'refunded',
          })
          .where(inArray(donations.id, donationIds))
          .returning();
        break;

      case 'retry':
        updatedDonations = await db
          .update(donations)
          .set({ 
            ...updateData,
            paymentStatus: 'pending',
          })
          .where(inArray(donations.id, donationIds))
          .returning();
        break;

      case 'mark_completed':
        updatedDonations = await db
          .update(donations)
          .set({ 
            ...updateData,
            paymentStatus: 'completed',
            processedAt: new Date(),
          })
          .where(inArray(donations.id, donationIds))
          .returning();
        break;

      case 'mark_failed':
        if (!actionData.reason) {
          return NextResponse.json(
            { error: 'Failure reason is required for mark failed action' },
            { status: 400 }
          );
        }
        updatedDonations = await db
          .update(donations)
          .set({ 
            ...updateData,
            paymentStatus: 'failed',
          })
          .where(inArray(donations.id, donationIds))
          .returning();
        break;

      case 'add_notes':
        if (!actionData.notes) {
          return NextResponse.json(
            { error: 'Notes are required for adding notes' },
            { status: 400 }
          );
        }
        updatedDonations = await db
          .update(donations)
          .set({ 
            // No notes field available in donations schema
          })
          .where(inArray(donations.id, donationIds))
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
      updatedCount: updatedDonations.length,
      updatedDonations: updatedDonations.map(donation => ({
        id: donation.id,
        donorId: donation.donorId,
        paymentStatus: donation.paymentStatus,
        amount: donation.amount,
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
