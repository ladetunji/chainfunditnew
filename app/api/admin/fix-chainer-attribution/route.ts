import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { donations } from '@/lib/schema/donations';
import { chainers } from '@/lib/schema/chainers';
import { eq, and, isNull } from 'drizzle-orm';

// POST /api/admin/fix-chainer-attribution - Fix existing donations to include chainer attribution
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referralCode, campaignId } = body;

    if (!referralCode || !campaignId) {
      return NextResponse.json(
        { success: false, error: 'Missing referralCode or campaignId' },
        { status: 400 }
      );
    }

    // Find the chainer by referral code and campaign
    const chainer = await db
      .select()
      .from(chainers)
      .where(and(
        eq(chainers.referralCode, referralCode),
        eq(chainers.campaignId, campaignId)
      ))
      .limit(1);

    if (!chainer.length) {
      return NextResponse.json(
        { success: false, error: 'Chainer not found' },
        { status: 404 }
      );
    }

    const chainerId = chainer[0].id;

    // Find donations for this campaign that don't have a chainerId
    const donationsToUpdate = await db
      .select()
      .from(donations)
      .where(and(
        eq(donations.campaignId, campaignId),
        isNull(donations.chainerId)
      ));

    if (donationsToUpdate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No donations found to update',
        updatedCount: 0
      });
    }

    // Update donations to include chainerId
    const updateResult = await db
      .update(donations)
      .set({
        chainerId: chainerId
      })
      .where(and(
        eq(donations.campaignId, campaignId),
        isNull(donations.chainerId)
      ))
      .returning();

    // Update chainer statistics
    const totalRaised = donationsToUpdate
      .filter(d => d.paymentStatus === 'completed')
      .reduce((sum, d) => sum + parseFloat(d.amount), 0);

    const conversions = donationsToUpdate
      .filter(d => d.paymentStatus === 'completed').length;

    await db
      .update(chainers)
      .set({
        totalRaised: totalRaised.toString(),
        conversions: conversions,
        updatedAt: new Date()
      })
      .where(eq(chainers.id, chainerId));

    return NextResponse.json({
      success: true,
      message: `Updated ${updateResult.length} donations with chainer attribution`,
      updatedCount: updateResult.length,
      chainerId: chainerId,
      totalRaised: totalRaised,
      conversions: conversions
    });

  } catch (error) {
    console.error('Error fixing chainer attribution:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fix chainer attribution' },
      { status: 500 }
    );
  }
}
