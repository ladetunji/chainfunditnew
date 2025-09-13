import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns, users } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    
    // Direct approach: Get campaign and user info in separate queries
    const campaignQuery = await db
      .select({ 
        id: campaigns.id,
        title: campaigns.title,
        creatorId: campaigns.creatorId,
        createdAt: campaigns.createdAt
      })
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (!campaignQuery.length) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    const campaign = campaignQuery[0];
    if (!campaign.creatorId) {
      return NextResponse.json(
        { success: false, error: 'Campaign has no creator' },
        { status: 400 }
      );
    }
    // Now directly query the users table
    const userQuery = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        avatar: users.avatar,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, campaign.creatorId))
      .limit(1);

    if (!userQuery.length) {
      return NextResponse.json(
        { success: false, error: 'Creator not found' },
        { status: 404 }
      );
    }

    const user = userQuery[0];
    
    // Also try to get some basic campaign stats
    const campaignStats = {
      id: campaign.id,
      title: campaign.title,
      creatorId: campaign.creatorId,
      createdAt: campaign.createdAt,
      creator: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        createdAt: user.createdAt,
      }
    };


    return NextResponse.json({
      success: true,
      data: campaignStats,
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch creator info' },
      { status: 500 }
    );
  }
}
