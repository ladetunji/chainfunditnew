import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, donations, campaigns, chainers } from '@/lib/schema';
import { eq, and, count, sum, desc } from 'drizzle-orm';

/**
 * GET /api/admin/users/[id]
 * Get detailed information about a specific user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Get user details
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user statistics
    const [donationStats] = await db
      .select({
        totalDonations: count(),
        totalAmount: sum(donations.amount),
      })
      .from(donations)
      .where(and(
        eq(donations.donorId, userId),
        eq(donations.paymentStatus, 'completed')
      ));

    const [campaignStats] = await db
      .select({
        totalCampaigns: count(),
        totalRaised: sum(campaigns.currentAmount),
      })
      .from(campaigns)
      .where(eq(campaigns.creatorId, userId));

    const [chainerStats] = await db
      .select({
        totalChainers: count(),
        totalReferrals: sum(chainers.totalReferrals),
        totalCommission: sum(chainers.commissionEarned),
      })
      .from(chainers)
      .where(eq(chainers.userId, userId));

    // Get recent donations
    const recentDonations = await db
      .select({
        id: donations.id,
        amount: donations.amount,
        currency: donations.currency,
        paymentStatus: donations.paymentStatus,
        createdAt: donations.createdAt,
        campaignId: donations.campaignId,
      })
      .from(donations)
      .where(eq(donations.donorId, userId))
      .orderBy(desc(donations.createdAt))
      .limit(10);

    // Get user campaigns
    const userCampaigns = await db
      .select({
        id: campaigns.id,
        title: campaigns.title,
        goalAmount: campaigns.goalAmount,
        currentAmount: campaigns.currentAmount,
        status: campaigns.status,
        createdAt: campaigns.createdAt,
      })
      .from(campaigns)
      .where(eq(campaigns.creatorId, userId))
      .orderBy(desc(campaigns.createdAt))
      .limit(10);

    // Get user chainers
    const userChainers = await db
      .select({
        id: chainers.id,
        campaignId: chainers.campaignId,
        totalReferrals: chainers.totalReferrals,
        totalRaised: chainers.totalRaised,
        commissionEarned: chainers.commissionEarned,
        createdAt: chainers.createdAt,
      })
      .from(chainers)
      .where(eq(chainers.userId, userId))
      .orderBy(desc(chainers.createdAt))
      .limit(10);

    const userDetails = {
      ...user,
      stats: {
        totalDonations: donationStats?.totalDonations || 0,
        totalDonationAmount: donationStats?.totalAmount || 0,
        totalCampaigns: campaignStats?.totalCampaigns || 0,
        totalCampaignRaised: campaignStats?.totalRaised || 0,
        totalChainers: chainerStats?.totalChainers || 0,
        totalReferrals: chainerStats?.totalReferrals || 0,
        totalCommission: chainerStats?.totalCommission || 0,
      },
      recentDonations,
      campaigns: userCampaigns,
      chainers: userChainers,
    };

    return NextResponse.json(userDetails);

  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Update user information or perform actions
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();
    const { action, ...updateData } = body;

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let updatedUser;

    switch (action) {
      case 'activate':
        updatedUser = await db
          .update(users)
          .set({ 
            accountLocked: false,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId))
          .returning();
        break;

      case 'suspend':
        updatedUser = await db
          .update(users)
          .set({ 
            accountLocked: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId))
          .returning();
        break;

      case 'ban':
        updatedUser = await db
          .update(users)
          .set({ 
            accountLocked: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId))
          .returning();
        break;

      case 'verify':
        updatedUser = await db
          .update(users)
          .set({ 
            isVerified: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId))
          .returning();
        break;

      case 'update_role':
        return NextResponse.json(
          { error: 'Role management not supported in current schema' },
          { status: 400 }
        );

      case 'view':
        // For view action, just return the user data
        return NextResponse.json({
          message: 'User data retrieved',
          user: existingUser,
        });

      case 'edit':
        // For edit action, return the user data for editing
        return NextResponse.json({
          message: 'User data for editing',
          user: existingUser,
        });

      case 'update':
        updatedUser = await db
          .update(users)
          .set({ 
            ...updateData,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId))
          .returning();
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: `User ${action} successful`,
      user: updatedUser[0],
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete a user (soft delete by setting status to banned)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Soft delete by locking account
    const deletedUser = await db
      .update(users)
      .set({ 
        accountLocked: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return NextResponse.json({
      message: 'User deleted successfully',
      user: deletedUser[0],
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
