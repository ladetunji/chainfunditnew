import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chainers, users, campaigns, donations, referrals } from '@/lib/schema';
import { eq, and, count, sum, desc } from 'drizzle-orm';

/**
 * GET /api/admin/chainers/[id]
 * Get detailed information about a specific chainer
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chainerId } = await params;

    // Get chainer details with user and campaign info
    const chainer = await db
      .select({
        id: chainers.id,
        userId: chainers.userId,
        campaignId: chainers.campaignId,
        totalReferrals: chainers.totalReferrals,
        totalRaised: chainers.totalRaised,
        commissionEarned: chainers.commissionEarned,
        commissionRate: chainers.commissionRate,
        status: chainers.status,
        createdAt: chainers.createdAt,
        updatedAt: chainers.updatedAt,
        userName: users.fullName,
        userEmail: users.email,
        campaignTitle: campaigns.title,
        isVerified: users.isVerified,
      })
      .from(chainers)
      .leftJoin(users, eq(chainers.userId, users.id))
      .leftJoin(campaigns, eq(chainers.campaignId, campaigns.id))
      .where(eq(chainers.id, chainerId))
      .limit(1);

    if (!chainer[0]) {
      return NextResponse.json(
        { error: 'Chainer not found' },
        { status: 404 }
      );
    }

    // Get chainer statistics
    const [donationStats] = await db
      .select({
        totalDonations: count(),
        totalAmount: sum(donations.amount),
      })
      .from(donations)
      .where(and(
        eq(donations.chainerId, chainerId),
        eq(donations.paymentStatus, 'completed')
      ));

    const [referralStats] = await db
      .select({
        totalReferrals: count(),
      })
      .from(referrals)
      .where(eq(referrals.referrerId, chainerId));

    // Get recent donations
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
      .where(eq(donations.chainerId, chainerId))
      .orderBy(desc(donations.createdAt))
      .limit(20);

    // Get referral history
    const referralHistory = await db
      .select({
        id: referrals.id,
        referredUserId: referrals.referredId,
        createdAt: referrals.createdAt,
        isConverted: referrals.isConverted,
        referredUserName: users.fullName,
        referredUserEmail: users.email,
      })
      .from(referrals)
      .leftJoin(users, eq(referrals.referredId, users.id))
      .where(eq(referrals.referrerId, chainerId))
      .orderBy(desc(referrals.createdAt))
      .limit(20);

    // Calculate fraud score
    let fraudScore = 0;
    let suspiciousActivity = false;

    // High referral count in short time
    if (chainer[0].totalReferrals > 50) fraudScore += 20;
    if (chainer[0].totalReferrals > 100) fraudScore += 30;

    // High commission earned
    if (Number(chainer[0].commissionEarned) > 1000) fraudScore += 15;
    if (Number(chainer[0].commissionEarned) > 5000) fraudScore += 25;

    // Account age vs performance
    const accountAge = Date.now() - new Date(chainer[0].createdAt).getTime();
    const daysOld = accountAge / (1000 * 60 * 60 * 24);
    if (daysOld < 7 && chainer[0].totalReferrals > 10) {
      fraudScore += 30;
      suspiciousActivity = true;
    }

    const chainerDetails = {
      ...chainer[0],
      stats: {
        totalDonations: donationStats?.totalDonations || 0,
        totalDonationAmount: donationStats?.totalAmount || 0,
        totalReferrals: referralStats?.totalReferrals || 0,
      },
      fraudScore: Math.min(100, fraudScore),
      suspiciousActivity,
      recentDonations,
      referralHistory,
    };

    return NextResponse.json(chainerDetails);

  } catch (error) {
    console.error('Error fetching chainer details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chainer details' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/chainers/[id]
 * Update chainer information or perform actions
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chainerId } = await params;
    const body = await request.json();
    const { action, ...updateData } = body;

    // Check if chainer exists
    const existingChainer = await db.query.chainers.findFirst({
      where: eq(chainers.id, chainerId),
    });

    if (!existingChainer) {
      return NextResponse.json(
        { error: 'Chainer not found' },
        { status: 404 }
      );
    }

    let updatedChainer;

    switch (action) {
      case 'activate':
        updatedChainer = await db
          .update(chainers)
          .set({ 
            status: 'active',
            updatedAt: new Date(),
          })
          .where(eq(chainers.id, chainerId))
          .returning();
        break;

      case 'suspend':
        updatedChainer = await db
          .update(chainers)
          .set({ 
            status: 'suspended',
            updatedAt: new Date(),
          })
          .where(eq(chainers.id, chainerId))
          .returning();
        break;

      case 'ban':
        updatedChainer = await db
          .update(chainers)
          .set({ 
            status: 'banned',
            updatedAt: new Date(),
          })
          .where(eq(chainers.id, chainerId))
          .returning();
        break;

      case 'update_commission_rate':
        if (!updateData.commissionRate) {
          return NextResponse.json(
            { error: 'Commission rate is required' },
            { status: 400 }
          );
        }
        updatedChainer = await db
          .update(chainers)
          .set({ 
            commissionRate: updateData.commissionRate,
            updatedAt: new Date(),
          })
          .where(eq(chainers.id, chainerId))
          .returning();
        break;

      case 'reset_stats':
        updatedChainer = await db
          .update(chainers)
          .set({ 
            totalReferrals: 0,
            totalRaised: '0',
            commissionEarned: '0',
            updatedAt: new Date(),
          })
          .where(eq(chainers.id, chainerId))
          .returning();
        break;

      case 'update':
        updatedChainer = await db
          .update(chainers)
          .set({ 
            ...updateData,
            updatedAt: new Date(),
          })
          .where(eq(chainers.id, chainerId))
          .returning();
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: `Chainer ${action} successful`,
      chainer: updatedChainer[0],
    });

  } catch (error) {
    console.error('Error updating chainer:', error);
    return NextResponse.json(
      { error: 'Failed to update chainer' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/chainers/[id]
 * Delete a chainer (soft delete by setting status to banned)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chainerId } = await params;

    // Check if chainer exists
    const existingChainer = await db.query.chainers.findFirst({
      where: eq(chainers.id, chainerId),
    });

    if (!existingChainer) {
      return NextResponse.json(
        { error: 'Chainer not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting status to banned
    const deletedChainer = await db
      .update(chainers)
      .set({ 
        status: 'banned',
        updatedAt: new Date(),
      })
      .where(eq(chainers.id, chainerId))
      .returning();

    return NextResponse.json({
      message: 'Chainer deleted successfully',
      chainer: deletedChainer[0],
    });

  } catch (error) {
    console.error('Error deleting chainer:', error);
    return NextResponse.json(
      { error: 'Failed to delete chainer' },
      { status: 500 }
    );
  }
}
