import { NextRequest, NextResponse } from 'next/server';
import { autoCloseExpiredCampaigns, markExpiredCampaigns } from '@/lib/utils/campaign-validation';

/**
 * Cron job endpoint to handle campaign auto-closing and expiration
 * This should be called periodically (e.g., daily) to:
 * 1. Auto-close campaigns that reached goal 4 weeks ago
 * 2. Mark campaigns as expired if they passed their expiration date
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const startTime = Date.now();
    console.log('Starting campaign auto-close and expiration cron job...');

    // Auto-close campaigns that reached goal 4 weeks ago
    const autoClosedCount = await autoCloseExpiredCampaigns();
    console.log(`Auto-closed ${autoClosedCount} campaigns`);

    // Mark expired campaigns
    const expiredCount = await markExpiredCampaigns();
    console.log(`Marked ${expiredCount} campaigns as expired`);

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`Campaign cron job completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      data: {
        autoClosedCount,
        expiredCount,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in campaign cron job:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process campaign auto-close',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Allow GET requests for manual testing (remove in production)
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'GET method not allowed in production' },
      { status: 405 }
    );
  }

  return POST(request);
}
