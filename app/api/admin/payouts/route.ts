import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { commissionPayouts, chainers, users, campaigns } from '@/lib/schema';
import { eq, like, and, desc, count, sum, sql } from 'drizzle-orm';

/**
 * GET /api/admin/payouts
 * Get paginated list of payouts with filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const fraud = searchParams.get('fraud') || 'all';

    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [];
    
    if (search) {
      whereConditions.push(
        sql`(${users.fullName} ILIKE ${`%${search}%`} OR ${users.email} ILIKE ${`%${search}%`})`
      );
    }
    
    if (status !== 'all') {
      whereConditions.push(eq(commissionPayouts.status, status as any));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get payouts with chainer and campaign info
    const payoutsList = await db
      .select({
        id: commissionPayouts.id,
        chainerId: commissionPayouts.chainerId,
        campaignId: commissionPayouts.campaignId,
        amount: commissionPayouts.amount,
        status: commissionPayouts.status,
        createdAt: commissionPayouts.createdAt,
        processedAt: commissionPayouts.processedAt,
        transactionId: commissionPayouts.transactionId,
        notes: commissionPayouts.notes,
        chainerName: users.fullName,
        chainerEmail: users.email,
        campaignTitle: campaigns.title,
      })
      .from(commissionPayouts)
      .leftJoin(chainers, eq(commissionPayouts.chainerId, chainers.id))
      .leftJoin(users, eq(chainers.userId, users.id))
      .leftJoin(campaigns, eq(commissionPayouts.campaignId, campaigns.id))
      .where(whereClause)
      .orderBy(desc(commissionPayouts.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [totalCount] = await db
      .select({ count: count() })
      .from(commissionPayouts)
      .leftJoin(chainers, eq(commissionPayouts.chainerId, chainers.id))
      .leftJoin(users, eq(chainers.userId, users.id))
      .where(whereClause);

    // Calculate fraud scores and suspicious activity
    const payoutsWithFraudData = await Promise.all(
      payoutsList.map(async (payout) => {
        // Get chainer performance for fraud detection
        const [chainerStats] = await db
          .select({
            totalReferrals: chainers.totalReferrals,
            totalRaised: chainers.totalRaised,
            commissionEarned: chainers.commissionEarned,
            createdAt: chainers.createdAt,
          })
          .from(chainers)
          .where(eq(chainers.id, payout.chainerId));

        // Simple fraud score calculation
        let fraudScore = 0;
        let suspiciousActivity = false;

        if (chainerStats) {
          // High commission amount
          if (Number(payout.amount) > 1000) fraudScore += 20;
          if (Number(payout.amount) > 5000) fraudScore += 30;

          // High performance in short time
          if (chainerStats.totalReferrals > 50) fraudScore += 15;
          if (chainerStats.totalReferrals > 100) fraudScore += 25;

          // Account age vs performance
          const accountAge = Date.now() - new Date(chainerStats.createdAt).getTime();
          const daysOld = accountAge / (1000 * 60 * 60 * 24);
          if (daysOld < 7 && chainerStats.totalReferrals > 10) {
            fraudScore += 30;
            suspiciousActivity = true;
          }

          // Multiple payout requests
          const [payoutCount] = await db
            .select({ count: count() })
            .from(commissionPayouts)
            .where(and(
              eq(commissionPayouts.chainerId, payout.chainerId),
              sql`${commissionPayouts.createdAt} >= NOW() - INTERVAL '30 days'`
            ));

          if (payoutCount.count > 3) {
            fraudScore += 20;
            suspiciousActivity = true;
          }
        }

        return {
          ...payout,
          fraudScore: Math.min(100, fraudScore),
          suspiciousActivity,
        };
      })
    );

    // Filter by fraud risk if specified
    let filteredPayouts = payoutsWithFraudData;
    if (fraud !== 'all') {
      filteredPayouts = payoutsWithFraudData.filter(payout => {
        switch (fraud) {
          case 'high':
            return payout.fraudScore >= 70;
          case 'medium':
            return payout.fraudScore >= 40 && payout.fraudScore < 70;
          case 'low':
            return payout.fraudScore < 40;
          case 'suspicious':
            return payout.suspiciousActivity;
          default:
            return true;
        }
      });
    }

    const totalPages = Math.ceil(totalCount.count / limit);

    return NextResponse.json({
      payouts: filteredPayouts,
      totalPages,
      currentPage: page,
      totalCount: filteredPayouts.length,
    });

  } catch (error) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}
