import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema/users';
import { chainers } from '@/lib/schema/chainers';
import { campaigns } from '@/lib/schema/campaigns';
import { donations } from '@/lib/schema/donations';
import { eq, and, desc, sum, count } from 'drizzle-orm';
import { getUserCommissionStats } from '@/lib/utils/commission-calculation';

async function getUserFromRequest(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;

  try {
    const userPayload = JSON.parse(atob(token.split('.')[1]));
    return userPayload.email;
  } catch (error) {
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
    const userCampaigns = await db
      .select({
        id: campaigns.id,
        title: campaigns.title,
        slug: campaigns.slug,
        coverImageUrl: campaigns.coverImageUrl,
        goalAmount: campaigns.goalAmount,
        currentAmount: campaigns.currentAmount,
        currency: campaigns.currency,
        status: campaigns.status,
      })
      .from(campaigns)
      .where(eq(campaigns.creatorId, userId));

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
        eq(donations.paymentStatus, 'completed'),
        // Only donations to user's campaigns that have a chainer
        eq(donations.chainerId, chainers.id)
      ))
      .orderBy(desc(donations.createdAt));

    // Filter to only include donations to user's campaigns
    const filteredChainerDonations = chainerDonations.filter(donation => 
      campaignIds.includes(donation.campaignId)
    );

    // Calculate campaign stats
    const campaignStats = userCampaigns.map(campaign => {
      const campaignDonations = filteredChainerDonations.filter(d => d.campaignId === campaign.id);
      const chainedAmount = campaignDonations.reduce((sum, d) => sum + Number(d.amount), 0);
      const totalCommissionsPaid = campaignDonations.reduce((sum, d) => sum + Number(d.chainerCommissionEarned || 0), 0);
      
      // Get unique chainers for this campaign
      const uniqueChainers = new Set(campaignDonations.map(d => d.chainerId));
      
      const progressPercentage = Number(campaign.goalAmount) > 0 
        ? (Number(campaign.currentAmount) / Number(campaign.goalAmount)) * 100 
        : 0;

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
        totalChainers: uniqueChainers.size,
        totalCommissionsPaid,
        progressPercentage: Math.round(progressPercentage),
      };
    });

    // Calculate overall stats
    const totalChainedDonations = filteredChainerDonations.length;
    const totalChainedAmount = filteredChainerDonations.reduce((sum, d) => sum + Number(d.amount), 0);
    const totalChainers = new Set(filteredChainerDonations.map(d => d.chainerId)).size;
    const totalCommissionsPaid = filteredChainerDonations.reduce((sum, d) => sum + Number(d.chainerCommissionEarned || 0), 0);

    // Transform donations to match expected interface
    const transformedDonations = filteredChainerDonations.map(donation => ({
      id: donation.id,
      campaignId: donation.campaignId,
      donorId: donation.donorId,
      chainerId: donation.chainerId,
      amount: Number(donation.amount),
      currency: donation.currency,
      message: donation.message,
      isAnonymous: donation.isAnonymous,
      createdAt: donation.createdAt.toISOString(),
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
      donorName: donation.isAnonymous ? 'Anonymous' : donation.donorName,
    }));

    return NextResponse.json({
      success: true,
      campaigns: campaignStats,
      donations: transformedDonations,
      stats: {
        totalChainedDonations,
        totalChainedAmount,
        totalChainers,
        totalCommissionsPaid,
      }
    });

  } catch (error) {
    console.error('Error fetching chainer donations:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}