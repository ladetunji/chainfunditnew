import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { donations } from '@/lib/schema/donations';
import { campaigns } from '@/lib/schema/campaigns';
import { notifications } from '@/lib/schema/notifications';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const donationId = searchParams.get('donationId');
    
    if (!donationId) {
      return NextResponse.json({
        success: false,
        error: 'Donation ID is required'
      }, { status: 400 });
    }

    console.log('🔍 Debug: Looking for donation:', donationId);

    // Get donation details
    const donation = await db
      .select()
      .from(donations)
      .where(eq(donations.id, donationId))
      .limit(1);

    if (!donation.length) {
      return NextResponse.json({
        success: false,
        error: 'Donation not found'
      }, { status: 404 });
    }

    // Get campaign details
    const campaign = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, donation[0].campaignId))
      .limit(1);

    // Get notifications for this campaign creator
    const campaignNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, campaign[0]?.creatorId || ''))
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        donation: donation[0],
        campaign: campaign[0] || null,
        notifications: campaignNotifications,
        debug: {
          donationId,
          campaignId: donation[0].campaignId,
          paymentStatus: donation[0].paymentStatus,
          paymentIntentId: donation[0].paymentIntentId,
          createdAt: donation[0].createdAt,
          processedAt: donation[0].processedAt
        }
      }
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { donationId, action } = body;
    
    if (!donationId || !action) {
      return NextResponse.json({
        success: false,
        error: 'Donation ID and action are required'
      }, { status: 400 });
    }

    console.log('🔧 Debug: Manual action:', action, 'for donation:', donationId);

    let result;
    
    switch (action) {
      case 'mark_completed':
        result = await db
          .update(donations)
          .set({
            paymentStatus: 'completed',
            processedAt: new Date(),
          })
          .where(eq(donations.id, donationId));
        break;
        
      case 'mark_failed':
        result = await db
          .update(donations)
          .set({
            paymentStatus: 'failed',
          })
          .where(eq(donations.id, donationId));
        break;
        
      case 'mark_pending':
        result = await db
          .update(donations)
          .set({
            paymentStatus: 'pending',
          })
          .where(eq(donations.id, donationId));
        break;
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: mark_completed, mark_failed, or mark_pending'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Donation ${donationId} marked as ${action}`,
      result
    });

  } catch (error) {
    console.error('Debug POST endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
