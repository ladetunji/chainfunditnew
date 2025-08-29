import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    
    console.log('Creator API: Fetching creator info for campaign:', campaignId);
    
    // First, get the campaign to find the creatorId
    const campaign = await db
      .select({ creatorId: campaigns.creatorId })
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (!campaign.length) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    const creatorId = campaign[0].creatorId;
    
    if (!creatorId) {
      return NextResponse.json(
        { success: false, error: 'Campaign has no creator' },
        { status: 400 }
      );
    }

    console.log('Creator API: Found creatorId:', creatorId);

    // Now fetch the creator's information
    const creator = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        avatar: users.avatar,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, creatorId))
      .limit(1);

    console.log('Creator API: User lookup result:', { creatorId, userFound: creator.length > 0 });

    if (!creator.length) {
      return NextResponse.json(
        { success: false, error: 'Creator not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      creator: creator[0],
    });

  } catch (error) {
    console.error('Creator API: Error fetching creator:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch creator' },
      { status: 500 }
    );
  }
}
