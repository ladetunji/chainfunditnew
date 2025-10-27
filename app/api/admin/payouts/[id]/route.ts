import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { commissionPayouts, chainers, users, campaigns, donations } from '@/lib/schema';
import { eq, and, count, sum, desc, sql } from 'drizzle-orm';

/**
 * GET /api/admin/payouts/[id]
 * Get detailed information about a specific payout
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: payoutId } = await params;

    // Get payout details with chainer and campaign info
    const payout = await db
      .select({
        id: commissionPayouts.id,
        chainerId: commissionPayouts.chainerId,
        campaignId: commissionPayouts.campaignId,
        amount: commissionPayouts.amount,
        status: commissionPayouts.status,
        createdAt: commissionPayouts.createdAt,
        processedAt: commissionPayouts.processedAt,
        transactionId: commissionPayouts.transactionId,
        notes: commissionPayouts.notes,
        chainerName: users.fullName,
        chainerEmail: users.email,
        campaignTitle: campaigns.title,
      })
      .from(commissionPayouts)
      .leftJoin(chainers, eq(commissionPayouts.chainerId, chainers.id))
      .leftJoin(users, eq(chainers.userId, users.id))
      .leftJoin(campaigns, eq(commissionPayouts.campaignId, campaigns.id))
      .where(eq(commissionPayouts.id, payoutId))
      .limit(1);

    if (!payout[0]) {
      return NextResponse.json(
        { error: 'Payout not found' },
        { status: 404 }
      );
    }

    // Get chainer performance stats
    const [chainerStats] = await db
      .select({
        totalReferrals: chainers.totalReferrals,
        totalRaised: chainers.totalRaised,
        commissionEarned: chainers.commissionEarned,
        commissionRate: chainers.commissionRate,
        createdAt: chainers.createdAt,
      })
      .from(chainers)
      .where(eq(chainers.id, payout[0].chainerId));

    // Get recent donations from this chainer
    const recentDonations = await db
      .select({
        id: donations.id,
        amount: donations.amount,
        currency: donations.currency,
        paymentStatus: donations.paymentStatus,
        createdAt: donations.createdAt,
        donorId: donations.donorId,
      })
      .from(donations)
      .where(eq(donations.chainerId, payout[0].chainerId))
      .orderBy(desc(donations.createdAt))
      .limit(10);

    // Calculate fraud score
    let fraudScore = 0;
    let suspiciousActivity = false;

    if (chainerStats) {
      // High payout amount
      if (Number(payout[0].amount) > 1000) fraudScore += 20;
      if (Number(payout[0].amount) > 5000) fraudScore += 30;

      // High performance in short time
      if (chainerStats.totalReferrals > 50) fraudScore += 15;
      if (chainerStats.totalReferrals > 100) fraudScore += 25;

      // Account age vs performance
      const accountAge = Date.now() - new Date(chainerStats.createdAt).getTime();
      const daysOld = accountAge / (1000 * 60 * 60 * 24);
      if (daysOld < 7 && chainerStats.totalReferrals > 10) {
        fraudScore += 30;
        suspiciousActivity = true;
      }

      // Multiple payout requests
      const [payoutCount] = await db
        .select({ count: count() })
        .from(commissionPayouts)
        .where(and(
          eq(commissionPayouts.chainerId, payout[0].chainerId),
          sql`${commissionPayouts.createdAt} >= NOW() - INTERVAL '30 days'`
        ));

      if (payoutCount.count > 3) {
        fraudScore += 20;
        suspiciousActivity = true;
      }
    }

    const payoutDetails = {
      ...payout[0],
      chainerStats,
      fraudScore: Math.min(100, fraudScore),
      suspiciousActivity,
      recentDonations,
    };

    return NextResponse.json(payoutDetails);

  } catch (error) {
    console.error('Error fetching payout details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payout details' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/payouts/[id]
 * Update payout information or perform actions
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: payoutId } = await params;
    const body = await request.json();
    const { action, ...updateData } = body;

    // Check if payout exists
    const existingPayout = await db.query.commissionPayouts.findFirst({
      where: eq(commissionPayouts.id, payoutId),
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
          .update(commissionPayouts)
          .set({ 
            status: 'approved',
          })
          .where(eq(commissionPayouts.id, payoutId))
          .returning();
        break;

      case 'reject':
        if (!updateData.rejectionReason) {
          return NextResponse.json(
            { error: 'Rejection reason is required' },
            { status: 400 }
          );
        }
        updatedPayout = await db
          .update(commissionPayouts)
          .set({ 
            status: 'rejected',
            notes: updateData.rejectionReason,
          })
          .where(eq(commissionPayouts.id, payoutId))
          .returning();
        break;

      case 'pay':
        updatedPayout = await db
          .update(commissionPayouts)
          .set({ 
            status: 'paid',
            processedAt: new Date(),
          })
          .where(eq(commissionPayouts.id, payoutId))
          .returning();
        break;

      case 'mark_failed':
        updatedPayout = await db
          .update(commissionPayouts)
          .set({ 
            status: 'failed',
          })
          .where(eq(commissionPayouts.id, payoutId))
          .returning();
        break;

      case 'add_notes':
        if (!updateData.notes) {
          return NextResponse.json(
            { error: 'Notes are required' },
            { status: 400 }
          );
        }
        updatedPayout = await db
          .update(commissionPayouts)
          .set({ 
            notes: updateData.notes,
          })
          .where(eq(commissionPayouts.id, payoutId))
          .returning();
        break;

      case 'update':
        updatedPayout = await db
          .update(commissionPayouts)
          .set({ 
            ...updateData,
            updatedAt: new Date(),
          })
          .where(eq(commissionPayouts.id, payoutId))
          .returning();
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: `Payout ${action} successful`,
      payout: updatedPayout[0],
    });

  } catch (error) {
    console.error('Error updating payout:', error);
    return NextResponse.json(
      { error: 'Failed to update payout' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/payouts/[id]
 * Delete a payout (soft delete by setting status to rejected)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: payoutId } = await params;

    // Check if payout exists
    const existingPayout = await db.query.commissionPayouts.findFirst({
      where: eq(commissionPayouts.id, payoutId),
    });

    if (!existingPayout) {
      return NextResponse.json(
        { error: 'Payout not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting status to rejected
    const deletedPayout = await db
      .update(commissionPayouts)
      .set({ 
        status: 'rejected',
        notes: 'Deleted by admin',
      })
      .where(eq(commissionPayouts.id, payoutId))
      .returning();

    return NextResponse.json({
      message: 'Payout deleted successfully',
      payout: deletedPayout[0],
    });

  } catch (error) {
    console.error('Error deleting payout:', error);
    return NextResponse.json(
      { error: 'Failed to delete payout' },
      { status: 500 }
    );
  }
}
