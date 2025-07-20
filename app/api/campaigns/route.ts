import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns } from '@/lib/schema/campaigns';
import { eq } from 'drizzle-orm';

// GET /api/campaigns - Get all campaigns
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    let allCampaigns;
    
    if (status) {
      allCampaigns = await db.select().from(campaigns).where(eq(campaigns.status, status)).limit(limit).offset(offset);
    } else {
      allCampaigns = await db.select().from(campaigns).limit(limit).offset(offset);
    }
    
    return NextResponse.json({
      success: true,
      data: allCampaigns,
      pagination: {
        limit,
        offset,
        total: allCampaigns.length,
      },
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// POST /api/campaigns - Create a new campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      creatorId,
      title,
      description,
      goalAmount,
      currency,
      minimumDonation,
      chainerCommissionRate,
    } = body;

    // Validate required fields
    if (!creatorId || !title || !description || !goalAmount || !currency) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate commission rate
    if (chainerCommissionRate && (chainerCommissionRate < 1 || chainerCommissionRate > 10)) {
      return NextResponse.json(
        { success: false, error: 'Commission rate must be between 1% and 10%' },
        { status: 400 }
      );
    }

    const newCampaign = await db.insert(campaigns).values({
      creatorId,
      title,
      description,
      goalAmount: goalAmount.toString(),
      currency,
      minimumDonation: minimumDonation?.toString() || '0',
      chainerCommissionRate: chainerCommissionRate?.toString() || '5.0',
      currentAmount: '0',
      status: 'active',
    }).returning();

    return NextResponse.json({
      success: true,
      data: newCampaign[0],
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
} 