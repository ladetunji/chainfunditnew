import { db } from '@/lib/db';
import { donations } from '@/lib/schema/donations';
import { chainers } from '@/lib/schema/chainers';
import { campaigns } from '@/lib/schema/campaigns';
import { commissionPayouts } from '@/lib/schema/commission-payouts';
import { referrals } from '@/lib/schema/referrals';
import { eq, and } from 'drizzle-orm';

/**
 * Calculate and distribute commissions for a completed donation
 * This handles both direct referrals and multi-level referrals
 */
export async function calculateAndDistributeCommissions(donationId: string) {
  try {
    // Get donation details
    const donation = await db
      .select({
        id: donations.id,
        campaignId: donations.campaignId,
        donorId: donations.donorId,
        chainerId: donations.chainerId,
        amount: donations.amount,
        currency: donations.currency,
      })
      .from(donations)
      .where(eq(donations.id, donationId))
      .limit(1);

    if (!donation.length) {
      console.error('❌ Donation not found:', donationId);
      return;
    }

    const donationData = donation[0];

    // Get campaign commission rate
    const campaign = await db
      .select({
        id: campaigns.id,
        chainerCommissionRate: campaigns.chainerCommissionRate,
        creatorId: campaigns.creatorId,
      })
      .from(campaigns)
      .where(eq(campaigns.id, donationData.campaignId))
      .limit(1);

    if (!campaign.length) {
      console.error('❌ Campaign not found:', donationData.campaignId);
      return;
    }

    const campaignData = campaign[0];
    const commissionRate = Number(campaignData.chainerCommissionRate) / 100; // Convert percentage to decimal
    const donationAmount = Number(donationData.amount);
    const totalCommission = donationAmount * commissionRate;

    // If donation came through a referral (chainerId exists)
    if (donationData.chainerId) {
      await handleDirectReferralCommission(
        donationData.chainerId,
        donationData.campaignId,
        donationAmount,
        totalCommission,
        donationData.donorId,
        donationData.id,
        donationData.currency
      );
    }

    // Handle multi-level referrals (if the donor is also a chainer)
    // This gives the donor chainer a commission for donating to their own chained campaign
    await handleMultiLevelReferrals(
      donationData.donorId,
      donationData.campaignId,
      donationAmount,
      totalCommission,
      donationData.id,
      donationData.currency
    );

  } catch (error) {
    console.error('💥 Error calculating commissions:', error);
  }
}

/**
 * Handle direct referral commission (the chainer who referred the donor)
 */
async function handleDirectReferralCommission(
  chainerId: string,
  campaignId: string,
  donationAmount: number,
  totalCommission: number,
  donorId: string,
  donationId: string,
  currency: string
) {
  try {

    // Get chainer details
    const chainer = await db
      .select({
        id: chainers.id,
        userId: chainers.userId,
        commissionDestination: chainers.commissionDestination,
        totalRaised: chainers.totalRaised,
        totalReferrals: chainers.totalReferrals,
        commissionEarned: chainers.commissionEarned,
      })
      .from(chainers)
      .where(eq(chainers.id, chainerId))
      .limit(1);

    if (!chainer.length) {
      console.error('❌ Chainer not found:', chainerId);
      return;
    }

    const chainerData = chainer[0];

    // Update chainer stats
    const newTotalRaised = Number(chainerData.totalRaised) + donationAmount;
    const newTotalReferrals = chainerData.totalReferrals + 1;
    const newCommissionEarned = Number(chainerData.commissionEarned) + totalCommission;

    await db
      .update(chainers)
      .set({
        totalRaised: newTotalRaised.toString(),
        totalReferrals: newTotalReferrals,
        commissionEarned: newCommissionEarned.toString(),
        updatedAt: new Date(),
      })
      .where(eq(chainers.id, chainerId));

    // Create commission payout record
    await db.insert(commissionPayouts).values({
      chainerId: chainerId,
      campaignId: campaignId,
      amount: totalCommission.toString(),
      currency: currency || 'USD', 
      destination: chainerData.commissionDestination,
      status: 'pending',
      notes: `Commission from donation ${donationId} via direct referral`,
    });

    // Create referral record
    await db.insert(referrals).values({
      referrerId: chainerData.userId,
      referredId: donorId,
      campaignId: campaignId,
      referralCode: '', // We'll get this from chainer if needed
      isConverted: true,
    });

  } catch (error) {
    console.error('💥 Error processing direct referral commission:', error);
  }
}

/**
 * Handle multi-level referrals (if the donor is also a chainer)
 * This gives the donor chainer a commission for donating to their own chained campaign
 */
async function handleMultiLevelReferrals(
  donorId: string,
  campaignId: string,
  donationAmount: number,
  totalCommission: number,
  donationId: string,
  currency: string
) {
  try {

    // Check if the donor is also a chainer for this campaign
    const donorChainer = await db
      .select({
        id: chainers.id,
        userId: chainers.userId,
        commissionDestination: chainers.commissionDestination,
        totalRaised: chainers.totalRaised,
        totalReferrals: chainers.totalReferrals,
        commissionEarned: chainers.commissionEarned,
      })
      .from(chainers)
      .where(and(
        eq(chainers.userId, donorId),
        eq(chainers.campaignId, campaignId)
      ))
      .limit(1);

    if (!donorChainer.length) {
      return;
    }

    const donorChainerData = donorChainer[0];

    // Calculate self-referral commission (full commission since they're donating to their own chained campaign)
    const selfReferralCommission = totalCommission;

    // Update donor's chainer stats
    const newTotalRaised = Number(donorChainerData.totalRaised) + donationAmount;
    const newCommissionEarned = Number(donorChainerData.commissionEarned) + selfReferralCommission;

    await db
      .update(chainers)
      .set({
        totalRaised: newTotalRaised.toString(),
        commissionEarned: newCommissionEarned.toString(),
        updatedAt: new Date(),
      })
      .where(eq(chainers.id, donorChainerData.id));

    // Create commission payout record for self-referral commission
    await db.insert(commissionPayouts).values({
      chainerId: donorChainerData.id,
      campaignId: campaignId,
      amount: selfReferralCommission.toString(),
      currency: currency || 'USD', // Include currency from donation
      destination: donorChainerData.commissionDestination,
      status: 'pending',
      notes: `Self-referral commission from donation ${donationId} (donor chained this campaign)`,
    });

  } catch (error) {
    console.error('💥 Error processing self-referral commission:', error);
  }
}

/**
 * Get commission statistics for a user
 */
export async function getUserCommissionStats(userId: string) {
  try {
    // Get all chainers for this user
    const userChainers = await db
      .select({
        id: chainers.id,
        campaignId: chainers.campaignId,
        referralCode: chainers.referralCode,
        totalRaised: chainers.totalRaised,
        totalReferrals: chainers.totalReferrals,
        commissionEarned: chainers.commissionEarned,
        commissionPaid: chainers.commissionPaid,
        createdAt: chainers.createdAt,
        campaignTitle: campaigns.title,
        campaignCoverImage: campaigns.coverImageUrl,
        campaignGoal: campaigns.goalAmount,
        campaignCurrent: campaigns.currentAmount,
        campaignCurrency: campaigns.currency,
        campaignStatus: campaigns.status,
      })
      .from(chainers)
      .leftJoin(campaigns, eq(chainers.campaignId, campaigns.id))
      .where(eq(chainers.userId, userId))
      .orderBy(chainers.createdAt);

    // Calculate totals
    const totalStats = userChainers.reduce(
      (acc, chainer) => ({
        totalChained: acc.totalChained + 1,
        totalEarnings: acc.totalEarnings + Number(chainer.commissionEarned || 0),
        totalDonations: acc.totalDonations + Number(chainer.totalRaised || 0),
        totalReferrals: acc.totalReferrals + chainer.totalReferrals,
      }),
      {
        totalChained: 0,
        totalEarnings: 0,
        totalDonations: 0,
        totalReferrals: 0,
      }
    );

    return {
      chainers: userChainers.map(chainer => ({
        ...chainer,
        totalEarnings: Number(chainer.commissionEarned || 0),
        totalDonations: Number(chainer.totalRaised || 0),
        campaignGoal: Number(chainer.campaignGoal),
        campaignCurrent: Number(chainer.campaignCurrent),
        progressPercentage: Math.min(
          100,
          Math.round((Number(chainer.campaignCurrent) / Number(chainer.campaignGoal)) * 100)
        ),
      })),
      stats: totalStats,
    };
  } catch (error) {
    console.error('💥 Error getting user commission stats:', error);
    return {
      chainers: [],
      stats: {
        totalChained: 0,
        totalEarnings: 0,
        totalDonations: 0,
        totalReferrals: 0,
      },
    };
  }
}
