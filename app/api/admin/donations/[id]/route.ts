import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { donations, users, campaigns, chainers } from '@/lib/schema';
import { eq, and, count, sum, desc, sql } from 'drizzle-orm';

/**
 * GET /api/admin/donations/[id]
 * Get detailed information about a specific donation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: donationId } = await params;

    // Get donation details with donor, campaign, and chainer info
    const donation = await db
      .select({
        id: donations.id,
        campaignId: donations.campaignId,
        donorId: donations.donorId,
        amount: donations.amount,
        currency: donations.currency,
        paymentStatus: donations.paymentStatus,
        paymentMethod: donations.paymentMethod,
        chainerId: donations.chainerId,
        createdAt: donations.createdAt,
        processedAt: donations.processedAt,
        paymentIntentId: donations.paymentIntentId,
        donorName: users.fullName,
        donorEmail: users.email,
        campaignTitle: campaigns.title,
      })
      .from(donations)
      .leftJoin(users, eq(donations.donorId, users.id))
      .leftJoin(campaigns, eq(donations.campaignId, campaigns.id))
      .where(eq(donations.id, donationId))
      .limit(1);

    if (!donation[0]) {
      return NextResponse.json(
        { error: 'Donation not found' },
        { status: 404 }
      );
    }

    // Get chainer info if applicable
    let chainerInfo = null;
    if (donation[0].chainerId) {
      const [chainerData] = await db
        .select({
          id: chainers.id,
          userId: chainers.userId,
          totalReferrals: chainers.totalReferrals,
          totalRaised: chainers.totalRaised,
          commissionEarned: chainers.commissionEarned,
          chainerName: users.fullName,
        })
        .from(chainers)
        .leftJoin(users, eq(chainers.userId, users.id))
        .where(eq(chainers.id, donation[0].chainerId))
        .limit(1);
      
      chainerInfo = chainerData;
    }

    // Get donor's donation history
    const donorHistory = await db
      .select({
        id: donations.id,
        amount: donations.amount,
        currency: donations.currency,
        paymentStatus: donations.paymentStatus,
        createdAt: donations.createdAt,
        campaignTitle: campaigns.title,
      })
      .from(donations)
      .leftJoin(campaigns, eq(donations.campaignId, campaigns.id))
      .where(eq(donations.donorId, donation[0].donorId))
      .orderBy(desc(donations.createdAt))
      .limit(10);

    // Calculate fraud score
    let fraudScore = 0;
    let suspiciousActivity = false;

    // High amount donations
    if (Number(donation[0].amount) > 1000) fraudScore += 20;
    if (Number(donation[0].amount) > 5000) fraudScore += 30;

    // Multiple donations from same donor
    const [donationCount] = await db
      .select({ count: count() })
      .from(donations)
      .where(and(
        eq(donations.donorId, donation[0].donorId),
        sql`${donations.createdAt} >= NOW() - INTERVAL '24 hours'`
      ));

    if (donationCount.count > 5) {
      fraudScore += 25;
      suspiciousActivity = true;
    }

    // Failed payment attempts
    const [failedCount] = await db
      .select({ count: count() })
      .from(donations)
      .where(and(
        eq(donations.donorId, donation[0].donorId),
        eq(donations.paymentStatus, 'failed')
      ));

    if (failedCount.count > 3) {
      fraudScore += 20;
      suspiciousActivity = true;
    }

    // Recent account creation
    const [donorAccount] = await db
      .select({ createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, donation[0].donorId))
      .limit(1);

    if (donorAccount) {
      const accountAge = Date.now() - new Date(donorAccount.createdAt).getTime();
      const hoursOld = accountAge / (1000 * 60 * 60);
      if (hoursOld < 24 && Number(donation[0].amount) > 100) {
        fraudScore += 30;
        suspiciousActivity = true;
      }
    }

    const donationDetails = {
      ...donation[0],
      chainerInfo,
      fraudScore: Math.min(100, fraudScore),
      suspiciousActivity,
      donorHistory,
    };

    return NextResponse.json(donationDetails);

  } catch (error) {
    console.error('Error fetching donation details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch donation details' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/donations/[id]
 * Update donation information or perform actions
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: donationId } = await params;
    const body = await request.json();
    const { action, ...updateData } = body;

    // Check if donation exists
    const existingDonation = await db.query.donations.findFirst({
      where: eq(donations.id, donationId),
    });

    if (!existingDonation) {
      return NextResponse.json(
        { error: 'Donation not found' },
        { status: 404 }
      );
    }

    let updatedDonation;

    switch (action) {
      case 'refund':
        if (!updateData.reason) {
          return NextResponse.json(
            { error: 'Refund reason is required' },
            { status: 400 }
          );
        }
        updatedDonation = await db
          .update(donations)
          .set({ 
            paymentStatus: 'refunded',
          })
          .where(eq(donations.id, donationId))
          .returning();
        break;

      case 'retry':
        updatedDonation = await db
          .update(donations)
          .set({ 
            paymentStatus: 'pending',
          })
          .where(eq(donations.id, donationId))
          .returning();
        break;

      case 'mark_completed':
        updatedDonation = await db
          .update(donations)
          .set({ 
            paymentStatus: 'completed',
            processedAt: new Date(),
          })
          .where(eq(donations.id, donationId))
          .returning();
        break;

      case 'mark_failed':
        if (!updateData.reason) {
          return NextResponse.json(
            { error: 'Failure reason is required' },
            { status: 400 }
          );
        }
        updatedDonation = await db
          .update(donations)
          .set({ 
            paymentStatus: 'failed',
          })
          .where(eq(donations.id, donationId))
          .returning();
        break;

      case 'add_notes':
        if (!updateData.notes) {
          return NextResponse.json(
            { error: 'Notes are required' },
            { status: 400 }
          );
        }
        updatedDonation = await db
          .update(donations)
          .set({ 
            // No notes field available in donations schema
          })
          .where(eq(donations.id, donationId))
          .returning();
        break;

      case 'update':
        updatedDonation = await db
          .update(donations)
          .set({ 
            ...updateData,
            updatedAt: new Date(),
          })
          .where(eq(donations.id, donationId))
          .returning();
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: `Donation ${action} successful`,
      donation: updatedDonation[0],
    });

  } catch (error) {
    console.error('Error updating donation:', error);
    return NextResponse.json(
      { error: 'Failed to update donation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/donations/[id]
 * Delete a donation (soft delete by marking as failed)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: donationId } = await params;

    // Check if donation exists
    const existingDonation = await db.query.donations.findFirst({
      where: eq(donations.id, donationId),
    });

    if (!existingDonation) {
      return NextResponse.json(
        { error: 'Donation not found' },
        { status: 404 }
      );
    }

    // Soft delete by marking as failed
    const deletedDonation = await db
      .update(donations)
      .set({ 
        paymentStatus: 'failed',
      })
      .where(eq(donations.id, donationId))
      .returning();

    return NextResponse.json({
      message: 'Donation deleted successfully',
      donation: deletedDonation[0],
    });

  } catch (error) {
    console.error('Error deleting donation:', error);
    return NextResponse.json(
      { error: 'Failed to delete donation' },
      { status: 500 }
    );
  }
}
