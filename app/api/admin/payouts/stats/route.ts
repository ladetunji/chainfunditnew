import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { commissionPayouts, chainers, users, campaigns } from '@/lib/schema';
import { eq, gte, count, sum, sql, desc } from 'drizzle-orm';

/**
 * GET /api/admin/payouts/stats
 * Get payout statistics for admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Get basic payout counts
    const [totalPayouts] = await db.select({ count: count() }).from(commissionPayouts);
    
    const [pendingPayouts] = await db
      .select({ count: count() })
      .from(commissionPayouts)
      .where(eq(commissionPayouts.status, 'pending'));

    const [approvedPayouts] = await db
      .select({ count: count() })
      .from(commissionPayouts)
      .where(eq(commissionPayouts.status, 'approved'));

    const [paidPayouts] = await db
      .select({ count: count() })
      .from(commissionPayouts)
      .where(eq(commissionPayouts.status, 'paid'));

    const [rejectedPayouts] = await db
      .select({ count: count() })
      .from(commissionPayouts)
      .where(eq(commissionPayouts.status, 'rejected'));

    // Get total amounts
    const [totalAmount] = await db
      .select({
        total: sum(commissionPayouts.amount),
      })
      .from(commissionPayouts);

    const [pendingAmount] = await db
      .select({
        total: sum(commissionPayouts.amount),
      })
      .from(commissionPayouts)
      .where(eq(commissionPayouts.status, 'pending'));

    const [approvedAmount] = await db
      .select({
        total: sum(commissionPayouts.amount),
      })
      .from(commissionPayouts)
      .where(eq(commissionPayouts.status, 'approved'));

    const [paidAmount] = await db
      .select({
        total: sum(commissionPayouts.amount),
      })
      .from(commissionPayouts)
      .where(eq(commissionPayouts.status, 'paid'));

    // Get fraud alerts (high amount payouts)
    const [fraudAlerts] = await db
      .select({ count: count() })
      .from(commissionPayouts)
      .where(
        sql`${commissionPayouts.amount} > 1000 AND ${commissionPayouts.status} = 'pending'`
      );

    // Get average processing time
    const [avgProcessingTime] = await db
      .select({
        average: sql<number>`AVG(EXTRACT(EPOCH FROM (${commissionPayouts.processedAt} - ${commissionPayouts.createdAt}))/3600)`,
      })
      .from(commissionPayouts)
      .where(eq(commissionPayouts.status, 'paid'));

    // Get recent payouts
    const recentPayouts = await db
      .select({
        id: commissionPayouts.id,
        chainerId: commissionPayouts.chainerId,
        amount: commissionPayouts.amount,
        status: commissionPayouts.status,
        createdAt: commissionPayouts.createdAt,
        chainerName: users.fullName,
        campaignTitle: campaigns.title,
      })
      .from(commissionPayouts)
      .leftJoin(chainers, eq(commissionPayouts.chainerId, chainers.id))
      .leftJoin(users, eq(chainers.userId, users.id))
      .leftJoin(campaigns, eq(commissionPayouts.campaignId, campaigns.id))
      .orderBy(desc(commissionPayouts.createdAt))
      .limit(10);

    // Get payout growth over time (last 12 months)
    const payoutGrowth = await db
      .select({
        month: sql<string>`DATE_TRUNC('month', ${commissionPayouts.createdAt})`,
        count: count(),
        total: sum(commissionPayouts.amount),
      })
      .from(commissionPayouts)
      .where(gte(commissionPayouts.createdAt, sql`NOW() - INTERVAL '12 months'`))
      .groupBy(sql`DATE_TRUNC('month', ${commissionPayouts.createdAt})`)
      .orderBy(sql`DATE_TRUNC('month', ${commissionPayouts.createdAt})`);

    // Get status distribution
    const statusDistribution = await db
      .select({
        status: commissionPayouts.status,
        count: count(),
      })
      .from(commissionPayouts)
      .groupBy(commissionPayouts.status);

    // Get amount distribution
    const amountDistribution = await db
      .select({
        range: sql<string>`CASE 
          WHEN ${commissionPayouts.amount} < 100 THEN '0-100'
          WHEN ${commissionPayouts.amount} < 500 THEN '100-500'
          WHEN ${commissionPayouts.amount} < 1000 THEN '500-1000'
          WHEN ${commissionPayouts.amount} < 5000 THEN '1000-5000'
          ELSE '5000+'
        END`,
        count: count(),
      })
      .from(commissionPayouts)
      .groupBy(sql`CASE 
        WHEN ${commissionPayouts.amount} < 100 THEN '0-100'
        WHEN ${commissionPayouts.amount} < 500 THEN '100-500'
        WHEN ${commissionPayouts.amount} < 1000 THEN '500-1000'
        WHEN ${commissionPayouts.amount} < 5000 THEN '1000-5000'
        ELSE '5000+'
      END`);

    const stats = {
      totalPayouts: totalPayouts.count,
      pendingPayouts: pendingPayouts.count,
      approvedPayouts: approvedPayouts.count,
      paidPayouts: paidPayouts.count,
      rejectedPayouts: rejectedPayouts.count,
      totalAmount: Number(totalAmount?.total) || 0,
      pendingAmount: Number(pendingAmount?.total) || 0,
      approvedAmount: Number(approvedAmount?.total) || 0,
      paidAmount: Number(paidAmount?.total) || 0,
      fraudAlerts: fraudAlerts.count,
      averageProcessingTime: Number(avgProcessingTime?.average) || 0,
      recentPayouts,
      payoutGrowth,
      statusDistribution,
      amountDistribution,
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching payout stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payout statistics' },
      { status: 500 }
    );
  }
}
