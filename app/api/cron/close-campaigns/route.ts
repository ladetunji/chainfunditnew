import { NextRequest, NextResponse } from 'next/server';
import { closeEligibleCampaigns, getCampaignClosureStats } from '@/lib/utils/campaign-closure';
import { toast } from 'sonner';

/**
 * POST /api/cron/close-campaigns - Scheduled job to automatically close campaigns
 * This endpoint should be called by a cron job or scheduler
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const startTime = Date.now();
    const result = await closeEligibleCampaigns();
    const endTime = Date.now();
    
    const stats = await getCampaignClosureStats();
    
    return NextResponse.json({
      success: true,
      message: 'Campaign closure job completed',
      data: {
        executionTime: endTime - startTime,
        closed: result.closed,
        errors: result.errors,
        stats,
        summary: {
          totalClosed: result.closed.length,
          totalErrors: result.errors.length,
          goalReached: result.closed.filter(r => r.reason === 'goal_reached').length,
          expired: result.closed.filter(r => r.reason === 'expired').length
        }
      }
    });

  } catch (error) {
    toast.error('Campaign closure job failed: ' + error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Campaign closure job failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/close-campaigns - Get information about the campaign closure job
 */
export async function GET(request: NextRequest) {
  try {
    const stats = await getCampaignClosureStats();
    
    return NextResponse.json({
      success: true,
      message: 'Campaign closure job information',
      data: {
        stats,
        description: 'This endpoint automatically closes campaigns that have reached their goal or expired',
        schedule: 'Should be called every hour or daily depending on requirements',
        lastRun: 'Not tracked - implement logging if needed'
      }
    });

  } catch (error) {
    toast.error('Error getting campaign closure job info: ' + error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
