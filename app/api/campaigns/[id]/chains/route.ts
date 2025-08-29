import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chainers } from '@/lib/schema';
import { eq, count } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;

    // Get total chain count for this campaign
    const chainCount = await db
      .select({ count: count() })
      .from(chainers)
      .where(eq(chainers.campaignId, campaignId));

    return NextResponse.json({
      success: true,
      data: {
        campaignId,
        chainCount: Number(chainCount[0]?.count || 0)
      }
    });
  } catch (error) {
    console.error('Error fetching campaign chains:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaign chains' },
      { status: 500 }
    );
  }
}
