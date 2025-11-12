import { NextRequest, NextResponse } from 'next/server';
import { retryFailedPayouts } from '@/lib/payments/payout-retry';
import { processAutomatedCharityPayouts } from '@/lib/payments/automated-charity-payouts';
import { toast } from 'sonner';

export const runtime = 'nodejs';

/**
 * POST /api/cron/payouts
 * Cron job endpoint for automated payout processing
 * Should be called by a cron service (e.g., Vercel Cron, GitHub Actions, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    // Vercel Cron sends x-vercel-signature header, but we'll use CRON_SECRET for flexibility
    const authHeader = request.headers.get('authorization');
    const vercelSignature = request.headers.get('x-vercel-signature');
    const cronSecret = process.env.CRON_SECRET;

    // Allow if:
    // 1. CRON_SECRET is set and Authorization header matches, OR
    // 2. CRON_SECRET is not set (for local dev/testing), OR
    // 3. Vercel signature is present (Vercel Cron)
    if (cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}` && !vercelSignature) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const results = {
      retry: null as any,
      charityPayouts: null as any,
    };

    // 1. Retry failed payouts
    try {
      results.retry = await retryFailedPayouts({
        maxRetries: 3,
        retryDelayMinutes: 60,
      });
    } catch (error) {
      toast.error('Error retrying failed payouts: ' + error);
      results.retry = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error: ' + error,
      };
    }

    // 2. Process automated charity payouts
    try {
      results.charityPayouts = await processAutomatedCharityPayouts(100, false); // Don't auto-process, just create
    } catch (error) {
      toast.error('Error processing automated charity payouts: ' + error);
      results.charityPayouts = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error: ' + error,
      };
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    toast.error('Error in cron payout endpoint: ' + error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error: ' + error,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/payouts
 * Health check endpoint
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    service: 'payout-cron',
    timestamp: new Date().toISOString(),
  });
}

