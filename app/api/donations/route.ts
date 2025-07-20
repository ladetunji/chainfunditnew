import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { donations } from '@/lib/schema/donations';
import { campaigns } from '@/lib/schema/campaigns';
import { eq } from 'drizzle-orm';

// GET /api/donations - Get all donations (with optional filtering)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const donorId = searchParams.get('donorId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // For now, get all donations with basic pagination
    // TODO: Implement proper filtering with and() operator
    const allDonations = await db.select().from(donations).limit(limit).offset(offset);
    
    return NextResponse.json({
      success: true,
      data: allDonations,
      pagination: {
        limit,
        offset,
        total: allDonations.length,
      },
    });
  } catch (error) {
    console.error('Error fetching donations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch donations' },
      { status: 500 }
    );
  }
}

// POST /api/donations - Create a new donation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      campaignId,
      donorId,
      chainerId,
      amount,
      currency,
      paymentMethod,
      message,
      isAnonymous,
    } = body;

    // Validate required fields
    if (!campaignId || !donorId || !amount || !currency || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate amount is positive
    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Check if campaign exists and is active
    const campaign = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (!campaign.length) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (campaign[0].status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Campaign is not active' },
        { status: 400 }
      );
    }

    // Check minimum donation amount
    const minDonation = parseFloat(campaign[0].minimumDonation);
    if (amount < minDonation) {
      return NextResponse.json(
        { success: false, error: `Minimum donation amount is ${campaign[0].currency} ${minDonation}` },
        { status: 400 }
      );
    }

    const newDonation = await db.insert(donations).values({
      campaignId,
      donorId,
      chainerId,
      amount: amount.toString(),
      currency,
      paymentMethod,
      paymentStatus: 'pending',
      message,
      isAnonymous: isAnonymous || false,
    }).returning();

    return NextResponse.json({
      success: true,
      data: newDonation[0],
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating donation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create donation' },
      { status: 500 }
    );
  }
} 