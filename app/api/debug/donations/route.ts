import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { donations } from '@/lib/schema/donations';
import { campaigns } from '@/lib/schema/campaigns';
import { users } from '@/lib/schema/users';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const paymentMethod = searchParams.get('paymentMethod');
    const status = searchParams.get('status');

    // Build query conditions
    let conditions = [];
    if (paymentMethod) {
      conditions.push(eq(donations.paymentMethod, paymentMethod));
    }
    if (status) {
      conditions.push(eq(donations.paymentStatus, status));
    }

    // Get recent donations with campaign and user info
    const recentDonations = await db
      .select({
        id: donations.id,
        amount: donations.amount,
        currency: donations.currency,
        paymentStatus: donations.paymentStatus,
        paymentMethod: donations.paymentMethod,
        paymentIntentId: donations.paymentIntentId,
        message: donations.message,
        isAnonymous: donations.isAnonymous,
        createdAt: donations.createdAt,
        processedAt: donations.processedAt,
        campaignId: donations.campaignId,
        donorId: donations.donorId,
        campaignTitle: campaigns.title,
        donorName: users.fullName,
        donorEmail: users.email,
      })
      .from(donations)
      .leftJoin(campaigns, eq(donations.campaignId, campaigns.id))
      .leftJoin(users, eq(donations.donorId, users.id))
      .orderBy(desc(donations.createdAt))
      .limit(limit);

    // Get summary stats
    const stats = await db
      .select({
        total: donations.id,
        completed: donations.paymentStatus,
        pending: donations.paymentStatus,
        failed: donations.paymentStatus,
      })
      .from(donations);

    const totalDonations = stats.length;
    const completedDonations = stats.filter(s => s.completed === 'completed').length;
    const pendingDonations = stats.filter(s => s.pending === 'pending').length;
    const failedDonations = stats.filter(s => s.failed === 'failed').length;

    // Get Paystack-specific stats
    const paystackStats = await db
      .select({
        total: donations.id,
        completed: donations.paymentStatus,
        pending: donations.paymentStatus,
        failed: donations.paymentStatus,
      })
      .from(donations)
      .where(eq(donations.paymentMethod, 'paystack'));

    const paystackTotal = paystackStats.length;
    const paystackCompleted = paystackStats.filter(s => s.completed === 'completed').length;
    const paystackPending = paystackStats.filter(s => s.pending === 'pending').length;
    const paystackFailed = paystackStats.filter(s => s.failed === 'failed').length;

    return NextResponse.json({
      success: true,
      data: {
        donations: recentDonations,
        summary: {
          total: totalDonations,
          completed: completedDonations,
          pending: pendingDonations,
          failed: failedDonations,
        },
        paystack: {
          total: paystackTotal,
          completed: paystackCompleted,
          pending: paystackPending,
          failed: paystackFailed,
        },
        filters: {
          paymentMethod,
          status,
          limit,
        }
      }
    });
  } catch (error) {
    console.error('Error fetching debug donations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch donations' },
      { status: 500 }
    );
  }
}
