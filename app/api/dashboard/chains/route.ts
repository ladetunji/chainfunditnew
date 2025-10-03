import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema/users';
import { chainers } from '@/lib/schema/chainers';
import { campaigns } from '@/lib/schema/campaigns';
import { donations } from '@/lib/schema/donations';
import { eq, and, desc, inArray } from 'drizzle-orm';

async function getUserFromRequest(request: NextRequest) {
  // Try authorization header first (Bearer token)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const userPayload = JSON.parse(atob(token.split('.')[1]));
      return userPayload.email;
    } catch {
      // Fall through to cookie method
    }
  }

  // Fallback to cookie authentication
  const cookie = request.headers.get('cookie') || '';
  const cookies = cookie.split(';').reduce((acc, curr) => {
    const [key, value] = curr.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  const token = cookies['auth_token'];
  if (!token) return null;

  try {
    const userPayload = JSON.parse(atob(token.split('.')[1]));
    return userPayload.email;
  } catch {
    return null;
  }
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

    // Get user's campaigns (campaigns created by the user)
    const userCampaigns = await db.select().from(campaigns).where(eq(campaigns.creatorId, userId));
    
    if (userCampaigns.length === 0) {
      const response = NextResponse.json({
        success: true,
        campaigns: [],
        donations: [],
        stats: {
          totalChainedDonations: 0,
          totalChainedAmount: 0,
          totalChainers: 0,
          totalCommissionsPaid: 0
        }
      });

      // Add cache control headers to prevent stale data
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');

      return response;
    }

    const campaignIds = userCampaigns.map(c => c.id);

    // Get chainer donations for user's campaigns
    const chainerDonations = await db
      .select({
        id: donations.id,
        campaignId: donations.campaignId,
        donorId: donations.donorId,
        chainerId: donations.chainerId,
        amount: donations.amount,
        currency: donations.currency,
        message: donations.message,
        isAnonymous: donations.isAnonymous,
        createdAt: donations.createdAt,
        campaignTitle: campaigns.title,
        campaignSlug: campaigns.slug,
        campaignCoverImage: campaigns.coverImageUrl,
        campaignGoal: campaigns.goalAmount,
        campaignCurrent: campaigns.currentAmount,
        campaignCurrency: campaigns.currency,
        campaignStatus: campaigns.status,
        chainerReferralCode: chainers.referralCode,
        chainerUserId: chainers.userId,
        chainerCommissionEarned: chainers.commissionEarned,
        donorName: users.fullName,
      })
      .from(donations)
      .leftJoin(campaigns, eq(donations.campaignId, campaigns.id))
      .leftJoin(chainers, eq(donations.chainerId, chainers.id))
      .leftJoin(users, eq(donations.donorId, users.id))
      .where(and(
        inArray(donations.campaignId, campaignIds),
        eq(donations.paymentStatus, 'completed'),
        // Only donations that came through chainers
        // donations.chainerId is not null
      ))
      .orderBy(desc(donations.createdAt));

    // Filter out donations without chainerId (direct donations)
    const filteredChainerDonations = chainerDonations.filter(donation => donation.chainerId);

    // Calculate campaign statistics
    const campaignStats = userCampaigns.map(campaign => {
      const campaignDonations = filteredChainerDonations.filter(d => d.campaignId === campaign.id);
      const chainedAmount = campaignDonations.reduce((sum, d) => sum + Number(d.amount), 0);
      const uniqueChainers = new Set(campaignDonations.map(d => d.chainerId)).size;
      const totalCommissionsPaid = campaignDonations.reduce((sum, d) => sum + Number(d.chainerCommissionEarned || 0), 0);
      const progressPercentage = Math.min(100, Math.round((Number(campaign.currentAmount) / Number(campaign.goalAmount)) * 100));

      return {
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        campaignSlug: campaign.slug,
        campaignCoverImage: campaign.coverImageUrl,
        campaignGoal: Number(campaign.goalAmount),
        campaignCurrent: Number(campaign.currentAmount),
        campaignCurrency: campaign.currency,
        campaignStatus: campaign.status,
        chainedDonations: campaignDonations.length,
        chainedAmount,
        totalChainers: uniqueChainers,
        totalCommissionsPaid,
        progressPercentage
      };
    });

    // Calculate overall statistics
    const totalChainedDonations = filteredChainerDonations.length;
    const totalChainedAmount = filteredChainerDonations.reduce((sum, d) => sum + Number(d.amount), 0);
    const totalChainers = new Set(filteredChainerDonations.map(d => d.chainerId)).size;
    const totalCommissionsPaid = filteredChainerDonations.reduce((sum, d) => sum + Number(d.chainerCommissionEarned || 0), 0);

    // Format donations for response
    const formattedDonations = filteredChainerDonations.map(donation => ({
      id: donation.id,
      campaignId: donation.campaignId,
      donorId: donation.donorId,
      chainerId: donation.chainerId,
      amount: Number(donation.amount),
      currency: donation.currency,
      message: donation.message,
      isAnonymous: donation.isAnonymous,
      createdAt: donation.createdAt,
      campaignTitle: donation.campaignTitle,
      campaignSlug: donation.campaignSlug,
      campaignCoverImage: donation.campaignCoverImage,
      campaignGoal: Number(donation.campaignGoal),
      campaignCurrent: Number(donation.campaignCurrent),
      campaignCurrency: donation.campaignCurrency,
      campaignStatus: donation.campaignStatus,
      chainerReferralCode: donation.chainerReferralCode,
      chainerUserId: donation.chainerUserId,
      chainerCommissionEarned: Number(donation.chainerCommissionEarned || 0),
      donorName: donation.isAnonymous ? 'Anonymous' : donation.donorName
    }));

    const response = NextResponse.json({
      success: true,
      campaigns: campaignStats,
      donations: formattedDonations,
      stats: {
        totalChainedDonations,
        totalChainedAmount,
        totalChainers,
        totalCommissionsPaid
      }
    });

    // Add cache control headers to prevent stale data
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;

  } catch (error) {
    console.error('Chains API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}