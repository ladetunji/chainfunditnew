import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns, users, donations } from '@/lib/schema';
import { eq, and, count, sum, desc } from 'drizzle-orm';
import { parse } from 'cookie';
import { verifyUserJWT } from '@/lib/auth';
import { generateSlug, generateUniqueSlug } from '@/lib/utils/slug';
import { runSyncScreeningForCampaign, initializeScreeningForCampaign } from '@/lib/compliance/screening-service';

async function getUserFromRequest(request: NextRequest) {
  const cookie = request.headers.get('cookie') || '';
  const cookies = parse(cookie);
  const token = cookies['auth_token'];
  if (!token) return null;
  const userPayload = verifyUserJWT(token);
  if (!userPayload) return null;
  return userPayload.email;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const reason = searchParams.get('reason');
    const complianceStatus = searchParams.get('complianceStatus');
    const includePending = searchParams.get('includePending') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const creatorId = searchParams.get('creatorId');


    // Build query with filters
    const conditions: any[] = [];
    if (status) {
      conditions.push(eq(campaigns.status, status));
    }
    if (reason) {
      conditions.push(eq(campaigns.reason, reason));
    }
    if (creatorId) {
      conditions.push(eq(campaigns.creatorId, creatorId));
    }
    if (complianceStatus) {
      conditions.push(eq(campaigns.complianceStatus, complianceStatus));
    } else if (!includePending) {
      conditions.push(eq(campaigns.complianceStatus, 'approved'));
    }
    
    // Get campaigns with creator details and donation stats
    const campaignsWithDetails = await db
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
        complianceStatus: campaigns.complianceStatus,
        complianceSummary: campaigns.complianceSummary,
        complianceFlags: campaigns.complianceFlags,
        riskScore: campaigns.riskScore,
        reviewRequired: campaigns.reviewRequired,
        lastScreenedAt: campaigns.lastScreenedAt,
        createdAt: campaigns.createdAt,
        updatedAt: campaigns.updatedAt,
        closedAt: campaigns.closedAt,
        creatorId: campaigns.creatorId,
        creatorName: users.fullName,
        creatorAvatar: users.avatar,
      })
      .from(campaigns)
      .leftJoin(users, eq(campaigns.creatorId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(campaigns.isActive), desc(campaigns.createdAt))
      .limit(limit)
      .offset(offset);


    // Get donation stats for each campaign
    const campaignsWithStats = await Promise.all(
      campaignsWithDetails.map(async (campaign) => {
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

        const complianceFlags = Array.isArray(campaign.complianceFlags)
          ? (campaign.complianceFlags as string[])
          : [];

        return {
          ...campaign,
          goalAmount: Number(campaign.goalAmount),
          currentAmount: Number(campaign.currentAmount),
          minimumDonation: Number(campaign.minimumDonation),
          chainerCommissionRate: Number(campaign.chainerCommissionRate),
          galleryImages: campaign.galleryImages ? JSON.parse(campaign.galleryImages) : [],
          documents: campaign.documents ? JSON.parse(campaign.documents) : [],
          complianceFlags,
          stats,
        };
      })
    );
    
    
    const response = NextResponse.json({
      success: true,
      data: campaignsWithStats,
      pagination: {
        limit,
        offset,
        total: campaignsWithStats.length,
      },
    });

    // Add performance headers
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    response.headers.set('CDN-Cache-Control', 'public, max-age=60');
    response.headers.set('Vary', 'Accept-Encoding');
    
    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// POST /api/campaigns - Create a new campaign
export async function POST(request: NextRequest) {
  try {
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

    // Parse form data
    const formData = await request.formData();
    
    // Extract campaign data
    const title = formData.get('title') as string;
    const subtitle = formData.get('subtitle') as string;
    const description = formData.get('description') as string;
    const reason = formData.get('reason') as string;
    const fundraisingFor = formData.get('fundraisingFor') as string;
    const duration = formData.get('duration') as string;
    const goalAmount = formData.get('goalAmount') as string;
    const currency = formData.get('currency') as string;
    const minimumDonation = formData.get('minimumDonation') as string;
    const chainerCommissionRate = formData.get('chainerCommissionRate') as string;
    const isChained = formData.get('isChained') as string;
    const visibility = formData.get('visibility') as string;
    const videoUrl = formData.get('videoUrl') as string;
    const coverImageUrl = formData.get('coverImageUrl') as string;
    const galleryImages = formData.get('galleryImages') as string;
    const documents = formData.get('documents') as string;

    // Validate required fields
    if (!title || !description || !goalAmount || !currency || !minimumDonation || !chainerCommissionRate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate visibility field
    if (visibility && !['public', 'private'].includes(visibility)) {
      return NextResponse.json(
        { success: false, error: 'Invalid visibility value. Must be public or private' },
        { status: 400 }
      );
    }

    // Validate isChained field
    const isChainedBool = isChained === 'true';

    // Validate numeric fields
    const goalAmountNum = parseFloat(goalAmount);
    const minimumDonationNum = parseFloat(minimumDonation);
    const commissionRateNum = parseFloat(chainerCommissionRate);

    if (isNaN(goalAmountNum) || goalAmountNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid goal amount' },
        { status: 400 }
      );
    }

    if (isNaN(minimumDonationNum) || minimumDonationNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid minimum donation amount' },
        { status: 400 }
      );
    }

    // Only validate commission rate if campaign is chained
    if (isChainedBool) {
      if (isNaN(commissionRateNum) || commissionRateNum < 1 || commissionRateNum > 10) {
        return NextResponse.json(
          { success: false, error: 'Commission rate must be between 1.0 and 10.0 when chaining is enabled' },
          { status: 400 }
        );
      }
    }

    // Generate unique slug for the campaign
    const baseSlug = generateSlug(title);
    
    // Check for existing slugs to ensure uniqueness
    const existingSlugs = await db
      .select({ slug: campaigns.slug })
      .from(campaigns)
      .where(eq(campaigns.slug, baseSlug));
    
    const uniqueSlug = existingSlugs.length > 0 
      ? generateUniqueSlug(baseSlug, existingSlugs.map(c => c.slug))
      : baseSlug;

    const syncResult = await runSyncScreeningForCampaign({
      title,
      description,
      reason,
      fundraisingFor,
      goalAmount: goalAmountNum,
      currency,
      creatorEmail: user[0].email,
    });

    const initialComplianceStatus =
      syncResult.decision === 'block'
        ? 'blocked'
        : syncResult.decision === 'review'
        ? 'in_review'
        : 'pending_screening';

    const complianceSummary = syncResult.summary;
    const complianceFlags = syncResult.flags;
    const complianceRiskScore = syncResult.riskScore.toFixed(2);

    // Create campaign
    const newCampaign = await db.insert(campaigns).values({
      creatorId: userId,
      title,
      slug: uniqueSlug,
      subtitle: subtitle || null,
      description,
      reason: reason || null,
      fundraisingFor: fundraisingFor || null,
      duration: duration || null,
      videoUrl: videoUrl || null,
      coverImageUrl: coverImageUrl || null,
      galleryImages: galleryImages || null,
      documents: documents || null,
      goalAmount: goalAmountNum.toString(),
      currency,
      minimumDonation: minimumDonationNum.toString(),
      chainerCommissionRate: isChainedBool ? commissionRateNum.toString() : '0',
      isChained: isChainedBool,
      currentAmount: '0',
      status: 'active',
      visibility: visibility || 'public',
      isActive: true,
      complianceStatus: initialComplianceStatus,
      complianceSummary,
      complianceFlags,
      riskScore: complianceRiskScore,
      reviewRequired: initialComplianceStatus === 'in_review',
      lastScreenedAt: initialComplianceStatus === 'pending_screening' ? null : new Date(),
      blockedAt: initialComplianceStatus === 'blocked' ? new Date() : null,
    }).returning();

    if (initialComplianceStatus !== 'blocked') {
      await initializeScreeningForCampaign(newCampaign[0].id, syncResult);
    }

    return NextResponse.json({
      success: true,
      data: newCampaign[0],
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}

