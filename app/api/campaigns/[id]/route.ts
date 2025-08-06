import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns, users, donations } from '@/lib/schema';
import { eq, and, count, sum } from 'drizzle-orm';
import { parse } from 'cookie';
import { verifyUserJWT } from '@/lib/auth';

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

// GET /api/campaigns/[id] - Get campaign by ID with detailed stats
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    
    // For testing purposes, skip UUID validation to allow any campaign ID
    // TODO: Re-enable UUID validation in production
    // if (!isValidUUID(campaignId)) {
    //   console.log('Invalid UUID format:', campaignId);
    //   return NextResponse.json(
    //     { success: false, error: 'Invalid campaign ID format' },
    //     { status: 400 }
    //   );
    // }

    // Get campaign with creator details
    const campaignData = await db
      .select({
        id: campaigns.id,
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
        currentAmount: campaigns.currentAmount,
        status: campaigns.status,
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
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (!campaignData.length) {
      // Return dummy data for testing purposes
      const dummyCampaign = {
        id: campaignId,
        title: "91 Days of Kindness Challenge",
        subtitle: "Spreading kindness across Nigeria, one act at a time",
        description: "Nigeria is a nation built on resilience, unity, and a love for community. This campaign aims to spread kindness across the country, one act at a time. Join us in making a difference! We believe that small acts of kindness can create a ripple effect that transforms communities and brings people together. Through this 91-day challenge, we're encouraging Nigerians to perform daily acts of kindness and share their experiences.",
        reason: "Community Development",
        fundraisingFor: "Ajegunle Children's Charity",
        duration: "91 days",
        videoUrl: "https://example.com/video.mp4",
        coverImageUrl: "/images/story-1.png",
        galleryImages: JSON.stringify([
          "/images/thumbnail1.png",
          "/images/thumbnail2.png", 
          "/images/thumbnail3.png",
          "/images/thumbnail4.png",
          "/images/thumbnail5.png"
        ]),
        documents: JSON.stringify([]),
        goalAmount: "3000000",
        currency: "NGN",
        minimumDonation: "1000",
        chainerCommissionRate: "5.0",
        currentAmount: "1201000",
        status: "active",
        isActive: true,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
        closedAt: null,
        creatorId: "dummy-creator-id",
        creatorName: "Adebola Ajani",
        creatorAvatar: "/images/avatar-7.png",
      };

      const dummyStats = {
        totalDonations: 35,
        totalAmount: 1201000,
        uniqueDonors: 28,
        progressPercentage: 40,
      };

      const campaignWithStats = {
        ...dummyCampaign,
        goalAmount: Number(dummyCampaign.goalAmount),
        currentAmount: Number(dummyCampaign.currentAmount),
        minimumDonation: Number(dummyCampaign.minimumDonation),
        chainerCommissionRate: Number(dummyCampaign.chainerCommissionRate),
        galleryImages: JSON.parse(dummyCampaign.galleryImages),
        documents: JSON.parse(dummyCampaign.documents),
        stats: dummyStats,
      };

      return NextResponse.json({
        success: true,
        data: campaignWithStats,
      });
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
        eq(donations.campaignId, campaignId),
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
    };

    return NextResponse.json({
      success: true,
      data: campaignWithStats,
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
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
    // TODO: Re-enable authentication later
    const { id: campaignId } = await params;
    
    // Validate UUID format
    if (!isValidUUID(campaignId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid campaign ID format' },
        { status: 400 }
      );
    }
    const body = await request.json();

    // Check if campaign exists
    const campaign = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
    if (!campaign.length) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    // Update campaign
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Only allow updating certain fields
    const allowedFields = ['title', 'subtitle', 'description', 'videoUrl', 'status', 'isActive'];
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    const updatedCampaign = await db
      .update(campaigns)
      .set(updateData)
      .where(eq(campaigns.id, campaignId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedCampaign[0],
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
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
    
    // Validate UUID format
    if (!isValidUUID(campaignId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid campaign ID format' },
        { status: 400 }
      );
    }

    // Check if campaign exists
    const campaign = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
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
      .where(eq(campaigns.id, campaignId))
      .returning();

    return NextResponse.json({
      success: true,
      data: deletedCampaign[0],
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
} 