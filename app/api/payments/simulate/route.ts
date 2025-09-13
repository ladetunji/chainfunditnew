import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { donations } from '@/lib/schema/donations';
import { campaigns } from '@/lib/schema/campaigns';
import { eq, sum, and } from 'drizzle-orm';

// Helper function to update campaign currentAmount based on completed donations
async function updateCampaignAmount(campaignId: string) {
  try {
    // Calculate total amount from completed donations
    const donationStats = await db
      .select({
        totalAmount: sum(donations.amount),
      })
      .from(donations)
      .where(and(
        eq(donations.campaignId, campaignId),
        eq(donations.paymentStatus, 'completed')
      ));

    const totalAmount = Number(donationStats[0]?.totalAmount || 0);

    // Update campaign currentAmount
    await db
      .update(campaigns)
      .set({
        currentAmount: totalAmount.toString(),
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, campaignId));
  } catch (error) {
    console.error('Error updating campaign amount:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { donationId, success = true, status } = body;

    if (!donationId) {
      return NextResponse.json(
        { success: false, error: 'Missing donation ID' },
        { status: 400 }
      );
    }

    // Get authenticated user using the same method as other APIs
    const userEmail = await getUserFromRequest(request);
    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get donation
    const donation = await db
      .select()
      .from(donations)
      .where(eq(donations.id, donationId))
      .limit(1);

    if (!donation.length) {
      return NextResponse.json(
        { success: false, error: 'Donation not found' },
        { status: 404 }
      );
    }

    // Update donation status based on simulation result
    let newStatus: string;
    let processedAt: Date | null = null;
    
    if (status) {
      // Use explicit status if provided
      newStatus = status;
      if (status === 'completed') {
        processedAt = new Date();
      }
    } else {
      // Use success boolean for backward compatibility
      newStatus = success ? 'completed' : 'failed';
      processedAt = success ? new Date() : null;
    }

    await db
      .update(donations)
      .set({ 
        paymentStatus: newStatus,
        processedAt,
      })
      .where(eq(donations.id, donationId));

    // If payment was successful, update campaign currentAmount
    if (newStatus === 'completed') {
      await updateCampaignAmount(donation[0].campaignId);
    }

    const statusMessages = {
      'completed': 'Payment simulated successfully',
      'failed': 'Payment simulation failed',
      'pending': 'Payment left as pending'
    };

    return NextResponse.json({
      success: true,
      donationId,
      status: newStatus,
      message: statusMessages[newStatus as keyof typeof statusMessages] || 'Payment status updated',
    });

  } catch (error) {
    console.error('Error simulating payment:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
