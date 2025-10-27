import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns, users, donations, chainers } from '@/lib/schema';
import { eq, and, count, sum, desc } from 'drizzle-orm';

/**
 * GET /api/admin/campaigns/[id]
 * Get detailed information about a specific campaign
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;

    // Get campaign details with creator info
    const campaign = await db
      .select({
        id: campaigns.id,
        title: campaigns.title,
        description: campaigns.description,
        creatorId: campaigns.creatorId,
        goalAmount: campaigns.goalAmount,
        currentAmount: campaigns.currentAmount,
        currency: campaigns.currency,
        status: campaigns.status,
        createdAt: campaigns.createdAt,
        updatedAt: campaigns.updatedAt,
        isActive: campaigns.isActive,
        coverImageUrl: campaigns.coverImageUrl,
        creatorName: users.fullName,
        creatorEmail: users.email,
      })
      .from(campaigns)
      .leftJoin(users, eq(campaigns.creatorId, users.id))
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (!campaign[0]) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Get campaign statistics
    const [donationStats] = await db
      .select({
        totalDonations: count(),
        totalAmount: sum(donations.amount),
      })
      .from(donations)
      .where(and(
        eq(donations.campaignId, campaignId),
        eq(donations.paymentStatus, 'completed')
      ));

    const [chainerStats] = await db
      .select({
        totalChainers: count(),
        totalReferrals: sum(chainers.totalReferrals),
        totalRaised: sum(chainers.totalRaised),
      })
      .from(chainers)
      .where(eq(chainers.campaignId, campaignId));

    // Reports not available in current schema
    const reportStats = { totalReports: 0 };

    // Get recent donations
    const recentDonations = await db
      .select({
        id: donations.id,
        amount: donations.amount,
        currency: donations.currency,
        paymentStatus: donations.paymentStatus,
        createdAt: donations.createdAt,
        donorId: donations.donorId,
        chainerId: donations.chainerId,
      })
      .from(donations)
      .where(eq(donations.campaignId, campaignId))
      .orderBy(desc(donations.createdAt))
      .limit(20);

    // Get campaign chainers
    const campaignChainers = await db
      .select({
        id: chainers.id,
        userId: chainers.userId,
        totalReferrals: chainers.totalReferrals,
        totalRaised: chainers.totalRaised,
        commissionEarned: chainers.commissionEarned,
        createdAt: chainers.createdAt,
      })
      .from(chainers)
      .where(eq(chainers.campaignId, campaignId))
      .orderBy(desc(chainers.totalReferrals))
      .limit(20);

    // Reports not available in current schema
    const campaignReportsList: any[] = [];

    const campaignDetails = {
      ...campaign[0],
      stats: {
        totalDonations: donationStats?.totalDonations || 0,
        totalDonationAmount: donationStats?.totalAmount || 0,
        totalChainers: chainerStats?.totalChainers || 0,
        totalReferrals: chainerStats?.totalReferrals || 0,
        totalChainerRaised: chainerStats?.totalRaised || 0,
        totalReports: reportStats?.totalReports || 0,
      },
      recentDonations,
      chainers: campaignChainers,
      reports: campaignReportsList,
    };

    return NextResponse.json(campaignDetails);

  } catch (error) {
    console.error('Error fetching campaign details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign details' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/campaigns/[id]
 * Update campaign information or perform actions
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const body = await request.json();
    const { action, ...updateData } = body;

    // Check if campaign exists
    const existingCampaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, campaignId),
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    let updatedCampaign;

    switch (action) {
      case 'pause':
        updatedCampaign = await db
          .update(campaigns)
          .set({ 
            status: 'paused',
            updatedAt: new Date(),
          })
          .where(eq(campaigns.id, campaignId))
          .returning();
        break;

      case 'resume':
        updatedCampaign = await db
          .update(campaigns)
          .set({ 
            status: 'active',
            updatedAt: new Date(),
          })
          .where(eq(campaigns.id, campaignId))
          .returning();
        break;

      case 'close':
        updatedCampaign = await db
          .update(campaigns)
          .set({ 
            status: 'closed',
            updatedAt: new Date(),
          })
          .where(eq(campaigns.id, campaignId))
          .returning();
        break;

      case 'verify':
        updatedCampaign = await db
          .update(campaigns)
          .set({ 
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(campaigns.id, campaignId))
          .returning();
        break;

      case 'unverify':
        updatedCampaign = await db
          .update(campaigns)
          .set({ 
            isActive: false,
            updatedAt: new Date(),
          })
          .where(eq(campaigns.id, campaignId))
          .returning();
        break;

      case 'update':
        updatedCampaign = await db
          .update(campaigns)
          .set({ 
            ...updateData,
            updatedAt: new Date(),
          })
          .where(eq(campaigns.id, campaignId))
          .returning();
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: `Campaign ${action} successful`,
      campaign: updatedCampaign[0],
    });

  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/campaigns/[id]
 * Delete a campaign (soft delete by setting status to closed)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;

    // Check if campaign exists
    const existingCampaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, campaignId),
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting status to closed
    const deletedCampaign = await db
      .update(campaigns)
      .set({ 
        status: 'closed',
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, campaignId))
      .returning();

    return NextResponse.json({
      message: 'Campaign deleted successfully',
      campaign: deletedCampaign[0],
    });

  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}
