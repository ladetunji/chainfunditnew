import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, campaigns, donations, chainers, commissionPayouts } from '@/lib/schema';
import { eq, gte, count, sum, sql, desc, and } from 'drizzle-orm';

/**
 * GET /api/admin/analytics
 * Get comprehensive platform analytics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    // Calculate date range
    const getDateRange = (range: string) => {
      const now = new Date();
      switch (range) {
        case '7d':
          return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case '30d':
          return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case '90d':
          return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        case '1y':
          return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        default:
          return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    };

    const startDate = getDateRange(range);

    // Overview metrics
    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [totalCampaigns] = await db.select({ count: count() }).from(campaigns);
    const [totalDonations] = await db.select({ count: count() }).from(donations);
    const [totalChainers] = await db.select({ count: count() }).from(chainers);
    const [totalPayouts] = await db.select({ count: count() }).from(commissionPayouts);

    const [totalAmount] = await db
      .select({ total: sum(donations.amount) })
      .from(donations)
      .where(eq(donations.paymentStatus, 'completed'));

    const [platformRevenue] = await db
      .select({ total: sum(commissionPayouts.amount) })
      .from(commissionPayouts)
      .where(eq(commissionPayouts.status, 'paid'));

    const [averageDonation] = await db
      .select({ average: sql<number>`AVG(${donations.amount})` })
      .from(donations)
      .where(eq(donations.paymentStatus, 'completed'));

    // Growth data
    const userGrowth = await db
      .select({
        month: sql<string>`DATE_TRUNC('month', ${users.createdAt})`,
        count: count(),
      })
      .from(users)
      .where(gte(users.createdAt, startDate))
      .groupBy(sql`DATE_TRUNC('month', ${users.createdAt})`)
      .orderBy(sql`DATE_TRUNC('month', ${users.createdAt})`);

    const campaignGrowth = await db
      .select({
        month: sql<string>`DATE_TRUNC('month', ${campaigns.createdAt})`,
        count: count(),
      })
      .from(campaigns)
      .where(gte(campaigns.createdAt, startDate))
      .groupBy(sql`DATE_TRUNC('month', ${campaigns.createdAt})`)
      .orderBy(sql`DATE_TRUNC('month', ${campaigns.createdAt})`);

    const donationGrowth = await db
      .select({
        month: sql<string>`DATE_TRUNC('month', ${donations.createdAt})`,
        count: count(),
        amount: sum(donations.amount),
      })
      .from(donations)
      .where(and(
        gte(donations.createdAt, startDate),
        eq(donations.paymentStatus, 'completed')
      ))
      .groupBy(sql`DATE_TRUNC('month', ${donations.createdAt})`)
      .orderBy(sql`DATE_TRUNC('month', ${donations.createdAt})`);

    // Top performing campaigns
    const topCampaigns = await db
      .select({
        id: campaigns.id,
        title: campaigns.title,
        amount: campaigns.currentAmount,
        donations: sql<number>`(
          SELECT COUNT(*) FROM ${donations} 
          WHERE ${donations.campaignId} = ${campaigns.id} 
          AND ${donations.paymentStatus} = 'completed'
        )`,
        chainers: sql<number>`(
          SELECT COUNT(*) FROM ${chainers} 
          WHERE ${chainers.campaignId} = ${campaigns.id}
        )`,
      })
      .from(campaigns)
      .orderBy(desc(campaigns.currentAmount))
      .limit(10);

    // Top performing chainers
    const topChainers = await db
      .select({
        id: chainers.id,
        name: sql<string>`(
          SELECT ${users.fullName} FROM ${users} 
          WHERE ${users.id} = ${chainers.userId}
        )`,
        referrals: chainers.totalReferrals,
        raised: chainers.totalRaised,
        commission: chainers.commissionEarned,
      })
      .from(chainers)
      .orderBy(desc(chainers.commissionEarned))
      .limit(10);

    // Top donors
    const topDonors = await db
      .select({
        id: donations.donorId,
        name: users.fullName,
        totalDonated: sum(donations.amount),
        donationCount: count(),
      })
      .from(donations)
      .leftJoin(users, eq(donations.donorId, users.id))
      .where(eq(donations.paymentStatus, 'completed'))
      .groupBy(donations.donorId, users.fullName)
      .orderBy(desc(sum(donations.amount)))
      .limit(10);

    // Conversion rates
    const [donationToChainerRate] = await db
      .select({
        rate: sql<number>`(
          SELECT COUNT(*)::float / (SELECT COUNT(*) FROM ${donations} WHERE ${donations.paymentStatus} = 'completed')::float * 100
          FROM ${chainers}
        )`,
      })
      .from(chainers);

    // Currency distribution
    const currencyDistribution = await db
      .select({
        currency: donations.currency,
        amount: sum(donations.amount),
      })
      .from(donations)
      .where(eq(donations.paymentStatus, 'completed'))
      .groupBy(donations.currency);

    const totalCurrencyAmount = currencyDistribution.reduce((sum, curr) => sum + Number(curr.amount || 0), 0);

    const revenueByCurrency = currencyDistribution.map(currency => ({
      currency: currency.currency,
      amount: Number(currency.amount || 0),
      percentage: totalCurrencyAmount > 0 ? Math.round((Number(currency.amount || 0) / totalCurrencyAmount) * 100) : 0,
    }));

    // Donations by status
    const donationsByStatus = await db
      .select({
        status: donations.paymentStatus,
        count: count(),
      })
      .from(donations)
      .groupBy(donations.paymentStatus);

    const totalDonationsCount = donationsByStatus.reduce((sum, status) => sum + status.count, 0);

    const donationsByStatusWithPercentage = donationsByStatus.map(status => ({
      status: status.status,
      count: status.count,
      percentage: totalDonationsCount > 0 ? Math.round((status.count / totalDonationsCount) * 100) : 0,
    }));

    // Campaigns by status
    const campaignsByStatus = await db
      .select({
        status: campaigns.status,
        count: count(),
      })
      .from(campaigns)
      .groupBy(campaigns.status);

    const totalCampaignsCount = campaignsByStatus.reduce((sum, status) => sum + status.count, 0);

    const campaignsByStatusWithPercentage = campaignsByStatus.map(status => ({
      status: status.status,
      count: status.count,
      percentage: totalCampaignsCount > 0 ? Math.round((status.count / totalCampaignsCount) * 100) : 0,
    }));

    // User activity by hour (simplified)
    const userActivity = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      activeUsers: Math.floor(Math.random() * 100) + 10, // Mock data
    }));

    const analytics = {
      overview: {
        totalUsers: totalUsers.count,
        totalCampaigns: totalCampaigns.count,
        totalDonations: totalDonations.count,
        totalAmount: Number(totalAmount?.total || 0),
        totalChainers: totalChainers.count,
        totalPayouts: totalPayouts.count,
        platformRevenue: Number(platformRevenue?.total || 0),
        averageDonation: Number(averageDonation?.average || 0),
      },
      growth: {
        userGrowth,
        campaignGrowth,
        donationGrowth,
        revenueGrowth: donationGrowth.map(d => ({ month: d.month, amount: Number(d.amount || 0) })),
      },
      performance: {
        topCampaigns: topCampaigns.map(c => ({
          id: c.id,
          title: c.title,
          amount: Number(c.amount || 0),
          donations: c.donations,
          chainers: c.chainers,
        })),
        topChainers: topChainers.map(c => ({
          id: c.id,
          name: c.name || 'Unknown',
          referrals: c.referrals,
          raised: Number(c.raised || 0),
          commission: Number(c.commission || 0),
        })),
        topDonors: topDonors.map(d => ({
          id: d.id,
          name: d.name || 'Unknown',
          totalDonated: Number(d.totalDonated || 0),
          donationCount: d.donationCount,
        })),
      },
      metrics: {
        conversionRates: {
          donationToChainer: Number(donationToChainerRate?.rate || 0),
          clickToDonation: 15.2, // Mock data
          campaignSuccess: 78.5, // Mock data
        },
        engagement: {
          averageSessionTime: 4.2, // Mock data
          bounceRate: 35.8, // Mock data
          returnVisitorRate: 42.1, // Mock data
        },
        fraud: {
          fraudScore: 12.3, // Mock data
          suspiciousTransactions: 23, // Mock data
          blockedAttempts: 8, // Mock data
        },
      },
      charts: {
        revenueByCurrency,
        donationsByStatus: donationsByStatusWithPercentage,
        campaignsByStatus: campaignsByStatusWithPercentage,
        userActivity,
      },
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
