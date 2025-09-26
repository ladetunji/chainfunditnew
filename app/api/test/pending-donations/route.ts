import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { donations } from '@/lib/schema/donations';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get all donations with their status
    const allDonations = await db
      .select({
        id: donations.id,
        campaignId: donations.campaignId,
        amount: donations.amount,
        currency: donations.currency,
        paymentMethod: donations.paymentMethod,
        paymentStatus: donations.paymentStatus,
        createdAt: donations.createdAt,
        processedAt: donations.processedAt,
      })
      .from(donations)
      .orderBy(donations.createdAt);

    // Group by status
    const donationsByStatus = allDonations.reduce((acc, donation) => {
      const status = donation.paymentStatus;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(donation);
      return acc;
    }, {} as Record<string, typeof allDonations>);

    return NextResponse.json({
      success: true,
      total: allDonations.length,
      byStatus: donationsByStatus,
      summary: {
        pending: donationsByStatus.pending?.length || 0,
        completed: donationsByStatus.completed?.length || 0,
        failed: donationsByStatus.failed?.length || 0,
      }
    });
  } catch (error) {
    console.error('Error fetching donations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch donations' },
      { status: 500 }
    );
  }
}
