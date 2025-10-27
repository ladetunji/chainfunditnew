import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chainers } from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';

/**
 * PATCH /api/admin/chainers/bulk
 * Perform bulk actions on multiple chainers
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { chainerIds, action, ...actionData } = body;

    if (!chainerIds || !Array.isArray(chainerIds) || chainerIds.length === 0) {
      return NextResponse.json(
        { error: 'Chainer IDs are required' },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    let updatedChainers;
    const updateData = {
      updatedAt: new Date(),
    };

    switch (action) {
      case 'activate':
        updatedChainers = await db
          .update(chainers)
          .set({ 
            ...updateData,
            status: 'active',
          })
          .where(inArray(chainers.id, chainerIds))
          .returning();
        break;

      case 'suspend':
        updatedChainers = await db
          .update(chainers)
          .set({ 
            ...updateData,
            status: 'suspended',
          })
          .where(inArray(chainers.id, chainerIds))
          .returning();
        break;

      case 'ban':
        updatedChainers = await db
          .update(chainers)
          .set({ 
            ...updateData,
            status: 'banned',
          })
          .where(inArray(chainers.id, chainerIds))
          .returning();
        break;

      case 'update_commission_rate':
        if (!actionData.commissionRate) {
          return NextResponse.json(
            { error: 'Commission rate is required for commission rate update' },
            { status: 400 }
          );
        }
        updatedChainers = await db
          .update(chainers)
          .set({ 
            ...updateData,
            commissionRate: actionData.commissionRate,
          })
          .where(inArray(chainers.id, chainerIds))
          .returning();
        break;

      case 'reset_stats':
        updatedChainers = await db
          .update(chainers)
          .set({ 
            ...updateData,
            totalReferrals: 0,
            totalRaised: '0',
            commissionEarned: '0',
          })
          .where(inArray(chainers.id, chainerIds))
          .returning();
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: `Bulk ${action} completed successfully`,
      updatedCount: updatedChainers.length,
      updatedChainers: updatedChainers.map(chainer => ({
        id: chainer.id,
        userId: chainer.userId,
        status: chainer.status,
        commissionRate: chainer.commissionRate,
      })),
    });

  } catch (error) {
    console.error('Error performing bulk action:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}
