import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { donations, campaigns, users } from '@/lib/schema';
import { eq, and, desc, or, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const userEmail = await getUserFromRequest(request);
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1);

    if (!user.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'completed', 'pending', 'failed', or null for all
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get user's campaigns first
    const userCampaigns = await db
      .select({ id: campaigns.id })
      .from(campaigns)
      .where(eq(campaigns.creatorId, user[0].id));

    if (userCampaigns.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          payments: [],
          summary: {
            total: 0,
            completed: 0,
            pending: 0,
            failed: 0,
            totalAmount: 0,
            completedAmount: 0,
            pendingAmount: 0,
            failedAmount: 0,
          },
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          }
        }
      });
    }

    const campaignIds = userCampaigns.map(c => c.id);

    // Build the query conditions
    let whereConditions = inArray(donations.campaignId, campaignIds);
    
    if (status) {
      whereConditions = and(whereConditions, eq(donations.paymentStatus, status))!;
    }

    // Fetch donations with campaign and donor information
    const userDonations = await db
      .select({
        id: donations.id,
        amount: donations.amount,
        currency: donations.currency,
        paymentStatus: donations.paymentStatus,
        paymentProvider: donations.paymentMethod,
        transactionId: donations.paymentIntentId,
        message: donations.message,
        isAnonymous: donations.isAnonymous,
        donorName: users.fullName,
        donorEmail: users.email,
        donorAvatar: users.avatar,
        createdAt: donations.createdAt,
        processedAt: donations.processedAt,
        campaignId: donations.campaignId,
        campaignTitle: campaigns.title,
        campaignCurrency: campaigns.currency,
      })
      .from(donations)
      .leftJoin(campaigns, eq(donations.campaignId, campaigns.id))
      .leftJoin(users, eq(donations.donorId, users.id))
      .where(whereConditions)
      .orderBy(desc(donations.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: donations.id })
      .from(donations)
      .where(whereConditions);

    // Group donations by status for summary
    const statusSummary = await db
      .select({
        paymentStatus: donations.paymentStatus,
        count: donations.id,
        totalAmount: donations.amount,
      })
      .from(donations)
      .where(inArray(donations.campaignId, campaignIds))
      .groupBy(donations.paymentStatus);

    // Calculate summary statistics
    const summary = {
      total: 0,
      completed: 0,
      pending: 0,
      failed: 0,
      totalAmount: 0,
      completedAmount: 0,
      pendingAmount: 0,
      failedAmount: 0,
    };

    statusSummary.forEach((item) => {
      const count = parseInt(item.count as any) || 0;
      const amount = parseFloat(item.totalAmount as any) || 0;
      
      summary.total += count;
      summary.totalAmount += amount;
      
      switch (item.paymentStatus) {
        case 'completed':
          summary.completed = count;
          summary.completedAmount = amount;
          break;
        case 'pending':
          summary.pending = count;
          summary.pendingAmount = amount;
          break;
        case 'failed':
          summary.failed = count;
          summary.failedAmount = amount;
          break;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        donations: userDonations,
        summary,
        pagination: {
          page,
          limit,
          total: totalCount.length,
          totalPages: Math.ceil(totalCount.length / limit),
          hasNext: page * limit < totalCount.length,
          hasPrev: page > 1,
        }
      }
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
