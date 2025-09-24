import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema/users';
import { campaigns } from '@/lib/schema/campaigns';
import { donations } from '@/lib/schema/donations';
import { chainers } from '@/lib/schema/chainers';
import { eq, and, desc, sum, count, inArray } from 'drizzle-orm';

async function getUserFromRequest(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;

  const userPayload = JSON.parse(atob(token.split('.')[1]));
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

    // Get user's campaigns
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

    if (userCampaigns.length === 0) {
      return NextResponse.json({
        success: true,
        campaigns: [],
        stats: {
          totalChainedDonations: 0,
          totalChainedAmount: 0,
          totalChainers: 0,
          totalCommissionsPaid: 0,
        }
      });
    }

    const campaignIds = userCampaigns.map(c => c.id);

    // Get donations raised by chainers for user's campaigns
    const chainedDonations = await db
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
        // Only donations that came through chainers (chainerId is not null)
        // We need to use a different approach since we can't use IS NOT NULL directly
      ))
      .orderBy(desc(donations.createdAt));

    // Filter to only include donations that have a chainerId (came through referrals)
    const filteredChainedDonations = chainedDonations.filter(donation => donation.chainerId !== null);

    // Get chainer statistics for each campaign
    const campaignStats = await Promise.all(
      userCampaigns.map(async (campaign) => {
        // Get total donations through chainers for this campaign
        const chainedDonationStats = await db
          .select({
            totalAmount: sum(donations.amount),
            totalDonations: count(donations.id),
          })
          .from(donations)
          .where(and(
            eq(donations.campaignId, campaign.id),
            eq(donations.paymentStatus, 'completed'),
            // donations.chainerId is not null
          ));

        // Get total chainers for this campaign
        const chainerStats = await db
          .select({
            totalChainers: count(chainers.id),
            totalCommissions: sum(chainers.commissionEarned),
          })
          .from(chainers)
          .where(eq(chainers.campaignId, campaign.id));

        return {
          campaignId: campaign.id,
          campaignTitle: campaign.title,
          campaignSlug: campaign.slug,
          campaignCoverImage: campaign.coverImageUrl,
          campaignGoal: Number(campaign.goalAmount),
          campaignCurrent: Number(campaign.currentAmount),
          campaignCurrency: campaign.currency,
          campaignStatus: campaign.status,
          chainedDonations: Number(chainedDonationStats[0]?.totalDonations || 0),
          chainedAmount: Number(chainedDonationStats[0]?.totalAmount || 0),
          totalChainers: Number(chainerStats[0]?.totalChainers || 0),
          totalCommissionsPaid: Number(chainerStats[0]?.totalCommissions || 0),
          progressPercentage: Math.min(
            100,
            Math.round((Number(campaign.currentAmount) / Number(campaign.goalAmount)) * 100)
          ),
        };
      })
    );

    // Calculate overall stats
    const overallStats = campaignStats.reduce(
      (acc, campaign) => ({
        totalChainedDonations: acc.totalChainedDonations + campaign.chainedDonations,
        totalChainedAmount: acc.totalChainedAmount + campaign.chainedAmount,
        totalChainers: acc.totalChainers + campaign.totalChainers,
        totalCommissionsPaid: acc.totalCommissionsPaid + campaign.totalCommissionsPaid,
      }),
      {
        totalChainedDonations: 0,
        totalChainedAmount: 0,
        totalChainers: 0,
        totalCommissionsPaid: 0,
      }
    );

    // Format donation data
    const formattedDonations = filteredChainedDonations.map(donation => ({
      ...donation,
      amount: Number(donation.amount),
      campaignGoal: Number(donation.campaignGoal),
      campaignCurrent: Number(donation.campaignCurrent),
      chainerCommissionEarned: Number(donation.chainerCommissionEarned || 0),
      donorName: donation.isAnonymous ? 'Anonymous' : donation.donorName,
    }));

    return NextResponse.json({
      success: true,
      campaigns: campaignStats,
      donations: formattedDonations,
      stats: overallStats,
    });
  } catch (error) {
    console.error('Error fetching chainer donations:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
