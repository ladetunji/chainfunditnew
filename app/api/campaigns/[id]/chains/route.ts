import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chainers, users } from '@/lib/schema';
import { eq, count, desc, sum } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const { searchParams } = new URL(request.url);
    const topChainers = searchParams.get('topChainers') === 'true';

    if (topChainers) {
      // Get top chainers with user data
      const topChainersData = await db
        .select({
          id: chainers.id,
          userId: chainers.userId,
          referralCode: chainers.referralCode,
          totalRaised: chainers.totalRaised,
          totalReferrals: chainers.totalReferrals,
          commissionEarned: chainers.commissionEarned,
          createdAt: chainers.createdAt,
          userName: users.fullName,
          userEmail: users.email,
          userAvatar: users.avatar,
        })
        .from(chainers)
        .leftJoin(users, eq(chainers.userId, users.id))
        .where(eq(chainers.campaignId, campaignId))
        .orderBy(desc(chainers.totalRaised), desc(chainers.totalReferrals))
        .limit(6);

      return NextResponse.json({
        success: true,
        data: {
          campaignId,
          topChainers: topChainersData.map(chainer => ({
            id: chainer.id,
            userId: chainer.userId,
            referralCode: chainer.referralCode,
            totalRaised: Number(chainer.totalRaised || 0),
            totalReferrals: chainer.totalReferrals || 0,
            commissionEarned: Number(chainer.commissionEarned || 0),
            createdAt: chainer.createdAt,
            userName: chainer.userName || 'Anonymous',
            userEmail: chainer.userEmail,
            userAvatar: chainer.userAvatar,
          }))
        }
      });
    } else {
      // Get total chain count for this campaign
      const chainCountResult = await db
        .select({ count: count() })
        .from(chainers)
        .where(eq(chainers.campaignId, campaignId));

      // Ensure we always get a valid count
      const chainCount = chainCountResult.length > 0 ? Number(chainCountResult[0].count) : 0;
      
      return NextResponse.json({
        success: true,
        data: {
          campaignId,
          chainCount
        }
      });
    }
  } catch (error) {
    console.error('Error fetching campaign chains:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaign chains' },
      { status: 500 }
    );
  }
}
