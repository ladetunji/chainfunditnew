import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get all campaigns with basic info
    const allCampaigns = await db
      .select({
        id: campaigns.id,
        title: campaigns.title,
        creatorId: campaigns.creatorId,
        createdAt: campaigns.createdAt,
      })
      .from(campaigns)
      .limit(10);

    // Get all users with basic info
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        createdAt: users.createdAt,
      })
      .from(users)
      .limit(10);

    // Test a JOIN query to see what happens
    const testJoin = await db
      .select({
        campaignId: campaigns.id,
        campaignTitle: campaigns.title,
        creatorId: campaigns.creatorId,
        creatorName: users.fullName,
        creatorEmail: users.email,
      })
      .from(campaigns)
      .leftJoin(users, eq(campaigns.creatorId, users.id))
      .limit(5);

    // Test direct user lookup for campaigns
    const directUserLookups = await Promise.all(
      allCampaigns.map(async (campaign) => {
        if (campaign.creatorId) {
          try {
            const user = await db
              .select({ fullName: users.fullName, email: users.email })
              .from(users)
              .where(eq(users.id, campaign.creatorId))
              .limit(1);
            
            return {
              campaignId: campaign.id,
              campaignTitle: campaign.title,
              creatorId: campaign.creatorId,
              userFound: user.length > 0,
              userName: user[0]?.fullName || null,
              userEmail: user[0]?.email || null,
            };
          } catch (err) {
            return {
              campaignId: campaign.id,
              campaignTitle: campaign.title,
              creatorId: campaign.creatorId,
              userFound: false,
              error: err.message,
            };
          }
        }
        return {
          campaignId: campaign.id,
          campaignTitle: campaign.title,
          creatorId: null,
          userFound: false,
          userName: null,
          userEmail: null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        campaigns: allCampaigns,
        users: allUsers,
        testJoin,
        directUserLookups,
        totalCampaigns: allCampaigns.length,
        totalUsers: allUsers.length,
      }
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch debug data' },
      { status: 500 }
    );
  }
}
