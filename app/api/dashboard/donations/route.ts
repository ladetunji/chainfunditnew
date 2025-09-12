import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, campaigns, donations } from '@/lib/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { parse } from 'cookie';
import { verifyUserJWT } from '@/lib/auth';

async function getUserFromRequest(request: NextRequest) {
  const cookie = request.headers.get('cookie') || '';
  const cookies = parse(cookie);
  const token = cookies['auth_token'];
  if (!token) return null;
  const userPayload = verifyUserJWT(token);
  if (!userPayload || !userPayload.email) return null;
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

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Get user's campaigns first
    const userCampaigns = await db
      .select({ id: campaigns.id })
      .from(campaigns)
      .where(eq(campaigns.creatorId, userId));

    if (userCampaigns.length === 0) {
      return NextResponse.json({ 
        success: true, 
        donations: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      });
    }

    const campaignIds = userCampaigns.map(c => c.id);

    // Build where clause for donations received by user's campaigns
    let conditions = [inArray(donations.campaignId, campaignIds)];
    if (status !== 'all') {
      conditions.push(eq(donations.paymentStatus, status));
    }
    const whereClause = conditions.length > 0 ? conditions.reduce((acc, condition) => acc && condition) : undefined;

    // Get donations received by user's campaigns
    const receivedDonations = await db
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
        campaignId: campaigns.id,
        campaignTitle: campaigns.title,
        campaignCurrency: campaigns.currency,
        campaignCoverImage: campaigns.coverImageUrl,
      })
      .from(donations)
      .leftJoin(campaigns, eq(donations.campaignId, campaigns.id))
      .leftJoin(users, eq(donations.donorId, users.id))
      .where(whereClause)
      .orderBy(desc(donations.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: donations.id })
      .from(donations)
      .where(whereClause);

    const donationsWithStats = receivedDonations.map(donation => ({
      ...donation,
      amount: Number(donation.amount),
      isSuccessful: donation.paymentStatus === 'completed'
    }));

    return NextResponse.json({ 
      success: true, 
      donations: donationsWithStats,
      pagination: {
        page,
        limit,
        total: totalCount.length,
        totalPages: Math.ceil(totalCount.length / limit)
      }
    });
  } catch (error) {
    console.error('User donations error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
} 