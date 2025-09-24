import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, campaigns, donations } from '@/lib/schema';
import { eq, and, sql, desc, count, sum } from 'drizzle-orm';
import { parse } from 'cookie';
import { verifyUserJWT } from '@/lib/auth';

async function getUserFromRequest(request: NextRequest) {
  const cookie = request.headers.get('cookie') || '';
  const cookies = parse(cookie);
  const token = cookies['auth_token'];
  if (!token) return null;
  const userPayload = verifyUserJWT(token);
  if (!userPayload || !userPayload.email) return null;
  return userPayload.email;
}

export async function GET(request: NextRequest) {
  try {
    const email = await getUserFromRequest(request);
    if (!email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // Get user
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user.length) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const userId = user[0].id;

    // Get user's campaigns with donation stats
    const userCampaigns = await db
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
        goalAmount: campaigns.goalAmount,
        currency: campaigns.currency,
        minimumDonation: campaigns.minimumDonation,
        chainerCommissionRate: campaigns.chainerCommissionRate,
        isChained: campaigns.isChained,
        currentAmount: campaigns.currentAmount,
        status: campaigns.status,
        visibility: campaigns.visibility,
        isActive: campaigns.isActive,
        coverImageUrl: campaigns.coverImageUrl,
        galleryImages: campaigns.galleryImages,
        documents: campaigns.documents,
        createdAt: campaigns.createdAt,
        updatedAt: campaigns.updatedAt,
        closedAt: campaigns.closedAt,
        creatorId: campaigns.creatorId,
        creatorName: users.fullName,
        creatorAvatar: users.avatar,
        donationCount: count(donations.id),
        totalRaised: sum(donations.amount)
      })
      .from(campaigns)
      .leftJoin(users, eq(campaigns.creatorId, users.id))
      .leftJoin(donations, and(
        eq(campaigns.id, donations.campaignId),
        eq(donations.paymentStatus, 'completed')
      ))
      .where(eq(campaigns.creatorId, userId))
      .groupBy(
        campaigns.id,
        campaigns.title,
        campaigns.subtitle,
        campaigns.description,
        campaigns.reason,
        campaigns.fundraisingFor,
        campaigns.duration,
        campaigns.videoUrl,
        campaigns.goalAmount,
        campaigns.currency,
        campaigns.minimumDonation,
        campaigns.chainerCommissionRate,
        campaigns.currentAmount,
        campaigns.status,
        campaigns.isActive,
        campaigns.coverImageUrl,
        campaigns.galleryImages,
        campaigns.documents,
        campaigns.createdAt,
        campaigns.updatedAt,
        campaigns.closedAt,
        campaigns.creatorId,
        users.fullName,
        users.avatar
      )
      .orderBy(desc(campaigns.createdAt));

    const campaignsWithStats = userCampaigns.map(campaign => ({
      ...campaign,
      goalAmount: Number(campaign.goalAmount),
      currentAmount: Number(campaign.totalRaised || 0), // Use totalRaised instead of currentAmount
      donationCount: Number(campaign.donationCount),
      totalRaised: Number(campaign.totalRaised || 0),
      progressPercentage: Math.min(100, Math.round((Number(campaign.totalRaised || 0) / Number(campaign.goalAmount)) * 100)),
      stats: {
        totalDonations: Number(campaign.donationCount),
        totalAmount: Number(campaign.totalRaised || 0),
        uniqueDonors: Number(campaign.donationCount), // This might need to be calculated differently
        progressPercentage: Math.min(100, Math.round((Number(campaign.totalRaised || 0) / Number(campaign.goalAmount)) * 100))
      }
    }));

    return NextResponse.json({ success: true, campaigns: campaignsWithStats });
  } catch (error) {
    console.error('User campaigns error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
} 