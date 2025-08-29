import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userEmail } = body;

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'User email is required' },
        { status: 400 }
      );
    }

    // First, find or create a user
    let user = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
    
    if (!user.length) {
      // Create a test user
      const newUser = await db.insert(users).values({
        email: userEmail,
        fullName: 'Test User',
        isVerified: true,
        hasCompletedProfile: true,
      }).returning();
      user = newUser;
    }

    const userId = user[0].id;

    // Create a test campaign
    const testCampaign = await db.insert(campaigns).values({
      title: 'Test Campaign for Creator Name',
      subtitle: 'Testing the creator name display',
      description: 'This is a test campaign to verify that creator names are displayed correctly.',
      reason: 'Testing',
      fundraisingFor: 'Testing Creator Display',
      duration: '1 month',
      goalAmount: '100000',
      currentAmount: '25000',
      currency: 'NGN',
      minimumDonation: '1000',
      chainerCommissionRate: '5.0',
      status: 'active',
      isActive: true,
      creatorId: userId,
    }).returning();

    return NextResponse.json({
      success: true,
      message: 'Test campaign created successfully',
      data: {
        campaign: testCampaign[0],
        user: {
          id: userId,
          email: userEmail,
          fullName: user[0].fullName
        }
      }
    });

  } catch (error) {
    console.error('Error creating test campaign:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create test campaign' },
      { status: 500 }
    );
  }
}
