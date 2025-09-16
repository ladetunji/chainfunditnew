import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, campaigns, donations, chainers } from '@/lib/schema';
import { eq, and, sql, desc, count, sum, inArray } from 'drizzle-orm';
import { parse } from 'cookie';
import { verifyUserJWT } from '@/lib/auth';
import { convertToNaira, CURRENCY_RATES_TO_NGN } from '@/lib/utils/currency-conversion';

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

    // Get user's campaigns
    const userCampaigns = await db.select().from(campaigns).where(eq(campaigns.creatorId, userId));

    // Get total donations for user's campaigns with currency conversion
    const campaignIds = userCampaigns.map(c => c.id);
    let totalDonationsInNGN = 0;
    let totalDonors = 0;
    let primaryCurrency = 'NGN'; // Default to Naira for Nigerian users
    let currencyBreakdown: { [key: string]: number } = {};

    if (campaignIds.length > 0) {
      // Get donations with their currencies for conversion
      const donationsWithCurrency = await db
        .select({
          amount: donations.amount,
          currency: donations.currency,
          donorId: donations.donorId
        })
        .from(donations)
        .where(and(
          inArray(donations.campaignId, campaignIds),
          eq(donations.paymentStatus, 'completed')
        ));

      // Calculate total donors
      const uniqueDonors = new Set(donationsWithCurrency.map(d => d.donorId));
      totalDonors = uniqueDonors.size;

      // Convert all donations to Naira and calculate totals
      donationsWithCurrency.forEach(donation => {
        const amount = Number(donation.amount);
        const currency = donation.currency;
        
        // Track currency breakdown
        if (!currencyBreakdown[currency]) {
          currencyBreakdown[currency] = 0;
        }
        currencyBreakdown[currency] += amount;
        
        // Convert to Naira and add to total
        const amountInNGN = convertToNaira(amount, currency);
        totalDonationsInNGN += amountInNGN;
      });

      // Get the most common currency from donations
      const currencyResult = await db
        .select({
          currency: donations.currency,
          count: count(donations.currency)
        })
        .from(donations)
        .where(and(
          inArray(donations.campaignId, campaignIds),
          eq(donations.paymentStatus, 'completed')
        ))
        .groupBy(donations.currency)
        .orderBy(desc(count(donations.currency)));

      if (currencyResult.length > 0) {
        primaryCurrency = currencyResult[0].currency;
      }
    }

    // Get user's chaining activity
    const chainerStats = await db
      .select({
        totalChained: count(chainers.id),
        totalEarnings: sum(chainers.commissionEarned)
      })
      .from(chainers)
      .where(eq(chainers.userId, userId));

    // Get recent donations
    let recentDonations: Array<{
      id: string;
      amount: string;
      currency: string;
      message: string | null;
      isAnonymous: boolean;
      createdAt: Date;
      campaignTitle: string | null;
      donorName: string | null;
      donorAvatar: string | null;
    }> = [];
    
    if (campaignIds.length > 0) {
      recentDonations = await db
        .select({
          id: donations.id,
          amount: donations.amount,
          currency: donations.currency,
          message: donations.message,
          isAnonymous: donations.isAnonymous,
          createdAt: donations.createdAt,
          campaignTitle: campaigns.title,
          donorName: users.fullName,
          donorAvatar: users.avatar
        })
        .from(donations)
        .leftJoin(campaigns, eq(donations.campaignId, campaigns.id))
        .leftJoin(users, eq(donations.donorId, users.id))
        .where(and(
          inArray(donations.campaignId, campaignIds),
          eq(donations.paymentStatus, 'completed')
        ))
        .orderBy(desc(donations.createdAt))
        .limit(5);
    }

    // Get active campaigns
    const activeCampaigns = userCampaigns.filter(c => c.isActive && c.status === 'active');

    const stats = {
      totalCampaigns: userCampaigns.length,
      activeCampaigns: activeCampaigns.length,
      totalDonations: totalDonationsInNGN, // Total in Naira
      totalDonors: totalDonors,
      totalChained: Number(chainerStats[0]?.totalChained || 0),
      totalEarnings: Number(chainerStats[0]?.totalEarnings || 0),
      primaryCurrency: 'NGN', // Always show in Naira for Nigerian users
      currencyBreakdown: currencyBreakdown, // Breakdown by original currency
      recentDonations: recentDonations.map(d => ({
        ...d,
        amount: Number(d.amount),
        donorName: d.isAnonymous ? 'Anonymous' : d.donorName,
        donorAvatar: d.isAnonymous ? null : d.donorAvatar
      }))
    };

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
} 