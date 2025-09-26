import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chainers } from '@/lib/schema/chainers';
import { campaigns } from '@/lib/schema/campaigns';
import { linkClicks } from '@/lib/schema/link-clicks';
import { eq } from 'drizzle-orm';

// GET /api/c/[referralCode] - Redirect to campaign and track click
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ referralCode: string }> }
) {
  try {
    const { referralCode } = await params;
    
    // Find the chainer by referral code
    const chainer = await db
      .select()
      .from(chainers)
      .where(eq(chainers.referralCode, referralCode))
      .limit(1);

    if (!chainer.length) {
      return NextResponse.json(
        { success: false, error: 'Invalid referral code' },
        { status: 404 }
      );
    }

    // Track the click
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referrer = request.headers.get('referer') || '';

    await db.insert(linkClicks).values({
      chainerId: chainer[0].id,
      ipAddress,
      userAgent,
      referrer,
    });

    // Update chainer click count
    await db
      .update(chainers)
      .set({ 
        clicks: chainer[0].clicks + 1,
        updatedAt: new Date()
      })
      .where(eq(chainers.id, chainer[0].id));

    // Get campaign details to use slug in URL
    const campaign = await db
      .select({ slug: campaigns.slug })
      .from(campaigns)
      .where(eq(campaigns.id, chainer[0].campaignId))
      .limit(1);

    if (!campaign[0]?.slug) {
      return NextResponse.json(
        { success: false, error: 'Campaign slug not found' },
        { status: 404 }
      );
    }

    const campaignUrl = `/campaign/${campaign[0].slug}?ref=${referralCode}`;
    const fullUrl = new URL(campaignUrl, request.url).toString();
    
    return NextResponse.json({
      success: true,
      redirectUrl: fullUrl,
      campaignSlug: campaign[0].slug,
      referralCode
    });
  } catch (error) {
    console.error('Error processing referral:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process referral' },
      { status: 500 }
    );
  }
} 