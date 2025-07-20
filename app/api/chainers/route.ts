import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chainers } from '@/lib/schema/chainers';
import { eq } from 'drizzle-orm';

// GET /api/chainers - Get all chainers (with optional filtering)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // For now, get all chainers with basic pagination
    // TODO: Implement proper filtering
    const allChainers = await db.select().from(chainers).limit(limit).offset(offset);
    
    return NextResponse.json({
      success: true,
      data: allChainers,
      pagination: {
        limit,
        offset,
        total: allChainers.length,
      },
    });
  } catch (error) {
    console.error('Error fetching chainers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chainers' },
      { status: 500 }
    );
  }
}

// POST /api/chainers - Create a new chainer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      campaignId,
      commissionDestination,
      charityChoiceId,
    } = body;

    // Validate required fields
    if (!userId || !campaignId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate commission destination
    const validDestinations = ['keep', 'donate_back', 'donate_other'];
    if (commissionDestination && !validDestinations.includes(commissionDestination)) {
      return NextResponse.json(
        { success: false, error: 'Invalid commission destination' },
        { status: 400 }
      );
    }

    // Generate unique referral code
    const referralCode = generateReferralCode();

    const newChainer = await db.insert(chainers).values({
      userId,
      campaignId,
      referralCode,
      commissionDestination: commissionDestination || 'keep',
      charityChoiceId,
      totalRaised: '0',
      totalReferrals: 0,
      clicks: 0,
      conversions: 0,
      commissionEarned: '0',
      commissionPaid: false,
    }).returning();

    return NextResponse.json({
      success: true,
      data: newChainer[0],
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating chainer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create chainer' },
      { status: 500 }
    );
  }
}

// Helper function to generate unique referral code
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
} 