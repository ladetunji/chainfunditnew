import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { donations } from '@/lib/schema/donations';
import { users } from '@/lib/schema/users';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'completed';

    // Get donations for the campaign with donor information
    const campaignDonations = await db
      .select({
        id: donations.id,
        amount: donations.amount,
        currency: donations.currency,
        paymentStatus: donations.paymentStatus,
        message: donations.message,
        isAnonymous: donations.isAnonymous,
        createdAt: donations.createdAt,
        processedAt: donations.processedAt,
        donorName: users.firstName,
        donorLastName: users.lastName,
        donorAvatar: users.profilePictureUrl,
      })
      .from(donations)
      .leftJoin(users, eq(donations.donorId, users.id))
      .where(eq(donations.campaignId, campaignId))
      .orderBy(desc(donations.createdAt))
      .limit(limit);

    // Ensure we have valid data
    if (!campaignDonations || !Array.isArray(campaignDonations)) {
      console.error('Invalid campaign donations data:', campaignDonations);
      return NextResponse.json({
        success: true,
        donations: [],
        stats: {
          totalDonations: 0,
          totalAmount: 0,
          uniqueDonors: 0,
        },
      });
    }

    // Filter by status if specified with null safety
    const filteredDonations = status !== 'all' 
      ? campaignDonations.filter(d => d && d.paymentStatus === status)
      : campaignDonations;

    // Format donations for frontend with null safety
    const formattedDonations = filteredDonations.map(donation => ({
      id: donation.id || '',
      amount: donation.amount || '0',
      currency: donation.currency || 'NGN',
      paymentStatus: donation.paymentStatus || 'pending',
      message: donation.message || '',
      isAnonymous: donation.isAnonymous || false,
      createdAt: donation.createdAt || new Date().toISOString(),
      processedAt: donation.processedAt || null,
      donorName: donation.isAnonymous 
        ? 'Anonymous' 
        : (donation.donorName && donation.donorLastName)
          ? `${donation.donorName} ${donation.donorLastName}`
          : (donation.donorName || 'Anonymous'),
      donorAvatar: donation.isAnonymous ? null : (donation.donorAvatar || null),
    }));

    // Calculate donation stats with null safety
    const completedDonations = campaignDonations.filter(d => d && d.paymentStatus === 'completed');
    const totalAmount = completedDonations.reduce((sum, d) => {
      const amount = d.amount;
      if (!amount || isNaN(parseFloat(amount))) return sum;
      return sum + parseFloat(amount);
    }, 0);
    const uniqueDonors = new Set(
      completedDonations
        .map(d => d.donorName)
        .filter(name => name && name !== 'Anonymous')
    ).size;

    return NextResponse.json({
      success: true,
      donations: formattedDonations,
      stats: {
        totalDonations: completedDonations.length,
        totalAmount,
        uniqueDonors,
      },
    });
  } catch (error) {
    console.error('Error fetching campaign donations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch donations' },
      { status: 500 }
    );
  }
}
