import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema/users';
import { chainers } from '@/lib/schema/chainers';
import { campaigns } from '@/lib/schema/campaigns';
import { donations } from '@/lib/schema/donations';
import { eq, and, desc } from 'drizzle-orm';
import { getUserCommissionStats } from '@/lib/utils/commission-calculation';

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

    // Get user's chaining data using the commission calculation utility
    const chainingData = await getUserCommissionStats(userId);

    // Get recent donations through chaining
    const recentChainedDonations = await db
      .select({
        id: donations.id,
        amount: donations.amount,
        currency: donations.currency,
        message: donations.message,
        isAnonymous: donations.isAnonymous,
        createdAt: donations.createdAt,
        campaignTitle: campaigns.title,
        donorName: users.fullName,
      })
      .from(donations)
      .leftJoin(campaigns, eq(donations.campaignId, campaigns.id))
      .leftJoin(users, eq(donations.donorId, users.id))
      .where(and(
        eq(donations.chainerId, userId),
        eq(donations.paymentStatus, 'completed')
      ))
      .orderBy(desc(donations.createdAt))
      .limit(10);

    const recentDonationsWithStats = recentChainedDonations.map(donation => ({
      ...donation,
      amount: Number(donation.amount),
      donorName: donation.isAnonymous ? 'Anonymous' : donation.donorName
    }));

    return NextResponse.json({ 
      success: true, 
      chaining: chainingData.chainers,
      recentDonations: recentDonationsWithStats,
      stats: chainingData.stats
    });
  } catch (error) {
    console.error('User chaining error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}