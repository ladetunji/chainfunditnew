import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaignPayouts, users, campaigns } from '@/lib/schema';
import { eq, and, desc, count, sql, or } from 'drizzle-orm';

/**
 * GET /api/admin/payouts/campaigns
 * Get paginated list of campaign payout requests with filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [];
    
    if (search) {
      whereConditions.push(
        or(
          sql`${users.fullName} ILIKE ${`%${search}%`}`,
          sql`${users.email} ILIKE ${`%${search}%`}`,
          sql`${campaigns.title} ILIKE ${`%${search}%`}`
        )
      );
    }
    
    if (status !== 'all') {
      whereConditions.push(eq(campaignPayouts.status, status as any));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get campaign payouts with user and campaign info
    const payoutsList = await db
      .select({
        id: campaignPayouts.id,
        userId: campaignPayouts.userId,
        campaignId: campaignPayouts.campaignId,
        requestedAmount: campaignPayouts.requestedAmount,
        grossAmount: campaignPayouts.grossAmount,
        fees: campaignPayouts.fees,
        netAmount: campaignPayouts.netAmount,
        currency: campaignPayouts.currency,
        status: campaignPayouts.status,
        payoutProvider: campaignPayouts.payoutProvider,
        reference: campaignPayouts.reference,
        bankName: campaignPayouts.bankName,
        accountNumber: campaignPayouts.accountNumber,
        accountName: campaignPayouts.accountName,
        bankCode: campaignPayouts.bankCode,
        notes: campaignPayouts.notes,
        rejectionReason: campaignPayouts.rejectionReason,
        approvedBy: campaignPayouts.approvedBy,
        approvedAt: campaignPayouts.approvedAt,
        transactionId: campaignPayouts.transactionId,
        failureReason: campaignPayouts.failureReason,
        createdAt: campaignPayouts.createdAt,
        processedAt: campaignPayouts.processedAt,
        userName: users.fullName,
        userEmail: users.email,
        campaignTitle: campaigns.title,
        campaignSlug: campaigns.slug,
      })
      .from(campaignPayouts)
      .leftJoin(users, eq(campaignPayouts.userId, users.id))
      .leftJoin(campaigns, eq(campaignPayouts.campaignId, campaigns.id))
      .where(whereClause)
      .orderBy(desc(campaignPayouts.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [totalCount] = await db
      .select({ count: count() })
      .from(campaignPayouts)
      .leftJoin(users, eq(campaignPayouts.userId, users.id))
      .leftJoin(campaigns, eq(campaignPayouts.campaignId, campaigns.id))
      .where(whereClause);

    const totalPages = Math.ceil(totalCount.count / limit);

    return NextResponse.json({
      payouts: payoutsList,
      totalPages,
      currentPage: page,
      totalCount: totalCount.count,
    });

  } catch (error) {
    console.error('Error fetching campaign payouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign payouts' },
      { status: 500 }
    );
  }
}

