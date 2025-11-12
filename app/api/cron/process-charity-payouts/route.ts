import { NextRequest, NextResponse } from 'next/server';
import { processBatchPayouts } from '@/lib/payments/charity-payouts';
import { toast } from 'sonner';

/**
 * GET /api/cron/process-charity-payouts
 * 
 * Automated cron job to process charity payouts
 * This should be called periodically (e.g., weekly) to process pending donations
 * 
 * Setup in Vercel:
 * 1. Go to Project Settings > Cron Jobs
 * 2. Add a new cron job with schedule: "0 0 * * 1" (Every Monday at midnight)
 * 3. URL: /api/cron/process-charity-payouts
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication/authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Minimum payout amount (default: $100)
    const minAmount = parseFloat(process.env.MIN_CHARITY_PAYOUT_AMOUNT || '100');

    // Process batch payouts
    const results = await processBatchPayouts(minAmount);

    // Compile results
    const summary = {
      totalProcessed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalAmount: results.reduce((sum, r) => sum + r.amount, 0),
      totalDonations: results.reduce((sum, r) => sum + r.donationCount, 0),
      details: results.map(r => ({
        charityName: r.charityName,
        success: r.success,
        amount: r.amount,
        donationCount: r.donationCount,
        error: r.error,
        payoutId: r.payoutId,
      })),
    };

    return NextResponse.json({
      message: 'Charity payouts processed successfully',
      summary,
    });
  } catch (error) {
    toast.error('Error processing charity payouts: ' + error);
    return NextResponse.json(
      { 
        error: 'Failed to process charity payouts: ' + error,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

