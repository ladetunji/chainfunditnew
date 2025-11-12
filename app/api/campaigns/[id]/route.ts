import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns, users, donations } from '@/lib/schema';
import { eq, and, count, sum, or } from 'drizzle-orm';
import { parse } from 'cookie';
import { verifyUserJWT } from '@/lib/auth';
import { toast } from 'sonner';

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

async function getUserFromRequest(request: NextRequest) {
  const cookie = request.headers.get('cookie') || '';
  const cookies = parse(cookie);
  const token = cookies['auth_token'];
  if (!token) return null;
  const userPayload = verifyUserJWT(token);
  if (!userPayload || !userPayload.email) return null;
  return userPayload.email;
}

// GET /api/campaigns/[id] - Get campaign by ID or slug with detailed stats
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    
    // Determine if the ID is a UUID or slug
    const isUUID = isValidUUID(campaignId);
    const whereCondition = isUUID 
      ? eq(campaigns.id, campaignId)
      : eq(campaigns.slug, campaignId);

    // Get authenticated user (optional for viewing)
    const userEmail = await getUserFromRequest(request);
    let userId: string | null = null;
    
    if (userEmail) {
      const user = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
      if (user.length) {
        userId = user[0].id;
      }
    }

    // Get campaign with creator details - using a more robust approach
    let campaignData = await db
      .select({
        id: campaigns.id,
        slug: campaigns.slug,
        title: campaigns.title,
        subtitle: campaigns.subtitle,
        description: campaigns.description,
        reason: campaigns.reason,
        fundraisingFor: campaigns.fundraisingFor,
        duration: campaigns.duration,
        videoUrl: campaigns.videoUrl,
        coverImageUrl: campaigns.coverImageUrl,
        galleryImages: campaigns.galleryImages,
        documents: campaigns.documents,
        goalAmount: campaigns.goalAmount,
        currency: campaigns.currency,
        minimumDonation: campaigns.minimumDonation,
        chainerCommissionRate: campaigns.chainerCommissionRate,
        isChained: campaigns.isChained,
        currentAmount: campaigns.currentAmount,
        status: campaigns.status,
        visibility: campaigns.visibility,
        isActive: campaigns.isActive,
        createdAt: campaigns.createdAt,
        updatedAt: campaigns.updatedAt,
        closedAt: campaigns.closedAt,
        creatorId: campaigns.creatorId,
        creatorName: users.fullName,
        creatorAvatar: users.avatar,
      })
      .from(campaigns)
      .leftJoin(users, eq(campaigns.creatorId, users.id))
      .where(whereCondition)
      .limit(1);

    // If JOIN didn't work or creator info is missing, fetch user info separately
    if (campaignData.length > 0 && campaignData[0].creatorId && !campaignData[0].creatorName) {
      try {
        const userInfo = await db
           .select({
            fullName: users.fullName,
            avatar: users.avatar,
          })
          .from(users)
          .where(eq(users.id, campaignData[0].creatorId))
          .limit(1);

        if (userInfo.length > 0) {
          // Update the campaign data with user info
          campaignData[0] = {
            ...campaignData[0],
            creatorName: userInfo[0].fullName,
            creatorAvatar: userInfo[0].avatar,
          };
        } else {
        }
      } catch (userErr) {
      }
    }

    if (!campaignData.length) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    const campaign = campaignData[0];

    // Get donation statistics
    const donationStats = await db
      .select({
        totalDonations: count(donations.id),
        totalAmount: sum(donations.amount),
        uniqueDonors: count(donations.donorId),
      })
      .from(donations)
      .where(and(
        eq(donations.campaignId, campaign.id),
        eq(donations.paymentStatus, 'completed')
      ));

    const stats = {
      totalDonations: Number(donationStats[0]?.totalDonations || 0),
      totalAmount: Number(donationStats[0]?.totalAmount || 0),
      uniqueDonors: Number(donationStats[0]?.uniqueDonors || 0),
      progressPercentage: Math.min(100, Math.round((Number(campaign.currentAmount) / Number(campaign.goalAmount)) * 100)),
    };

    // Parse JSON fields
    const campaignWithStats = {
      ...campaign,
      goalAmount: Number(campaign.goalAmount),
      currentAmount: Number(campaign.currentAmount),
      minimumDonation: Number(campaign.minimumDonation),
      chainerCommissionRate: Number(campaign.chainerCommissionRate),
      galleryImages: campaign.galleryImages ? JSON.parse(campaign.galleryImages) : [],
      documents: campaign.documents ? JSON.parse(campaign.documents) : [],
      stats,
      canEdit: userId === campaign.creatorId, // Add flag for edit permission
    };

    return NextResponse.json({
      success: true,
      data: campaignWithStats,
    });
  } catch (error) {
    toast.error('Error fetching campaign: ' + error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}

// PUT /api/campaigns/[id] - Update campaign
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    
    // Determine if the ID is a UUID or slug
    const isUUID = isValidUUID(campaignId);
    const whereCondition = isUUID 
      ? eq(campaigns.id, campaignId)
      : eq(campaigns.slug, campaignId);

    // Get authenticated user
    const userEmail = await getUserFromRequest(request);
    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user details
    const user = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
    if (!user.length) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = user[0].id;
    const body = await request.json();

    // Check if campaign exists
    const campaign = await db.select().from(campaigns).where(whereCondition).limit(1);
    if (!campaign.length) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    // Verify user is the creator of the campaign
    if (campaign[0].creatorId !== userId) {
      return NextResponse.json(
        { success: false, error: 'You can only edit campaigns you created' },
        { status: 403 }
      );
    }

    // Update campaign
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Only allow updating certain fields
    const allowedFields = [
      'title', 
      'subtitle', 
      'description', 
      'duration',
      'videoUrl',
      'coverImageUrl',
      'goalAmount',
      'currency',
      'minimumDonation',
      'chainerCommissionRate',
      'status', 
      'isActive'
    ];
    
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    const updatedCampaign = await db
      .update(campaigns)
      .set(updateData)
      .where(eq(campaigns.id, campaign[0].id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedCampaign[0],
    });
  } catch (error) {
    toast.error('Error updating campaign: ' + error);
    return NextResponse.json(
      { success: false, error: 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

// DELETE /api/campaigns/[id] - Delete campaign (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Re-enable authentication later
    const { id: campaignId } = await params;
    
    // Determine if the ID is a UUID or slug
    const isUUID = isValidUUID(campaignId);
    const whereCondition = isUUID 
      ? eq(campaigns.id, campaignId)
      : eq(campaigns.slug, campaignId);

    // Check if campaign exists
    const campaign = await db.select().from(campaigns).where(whereCondition).limit(1);
    if (!campaign.length) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    // Soft delete by setting isActive to false
    const deletedCampaign = await db
      .update(campaigns)
      .set({
        isActive: false,
        status: 'closed',
        closedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, campaign[0].id))
      .returning();

    return NextResponse.json({
      success: true,
      data: deletedCampaign[0],
    });
  } catch (error) {
    toast.error('Error deleting campaign: ' + error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
} 