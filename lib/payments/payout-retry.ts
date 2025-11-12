import { db } from '@/lib/db';
import { campaignPayouts, commissionPayouts } from '@/lib/schema';
import { eq, and, lt, gte } from 'drizzle-orm';
import { processCampaignCreatorPayout, processAmbassadorPayout } from './payout-processor';

export interface RetryOptions {
  maxRetries?: number;
  retryDelayMinutes?: number;
  onlyFailed?: boolean;
}

/**
 * Retry failed payouts automatically
 */
export async function retryFailedPayouts(options: RetryOptions = {}) {
  const {
    maxRetries = 3,
    retryDelayMinutes = 60, // 1 hour
    onlyFailed = true,
  } = options;

  try {
    // Get failed campaign payouts that haven't exceeded max retries
    const failedCampaignPayouts = await db
      .select()
      .from(campaignPayouts)
      .where(
        and(
          eq(campaignPayouts.status, 'failed'),
          // Only retry payouts that failed at least retryDelayMinutes ago
          lt(
            campaignPayouts.updatedAt,
            new Date(Date.now() - retryDelayMinutes * 60 * 1000)
          )
        )
      );

    // Get failed commission payouts
    const failedCommissionPayouts = await db
      .select()
      .from(commissionPayouts)
      .where(
        and(
          eq(commissionPayouts.status, 'failed'),
          lt(
            commissionPayouts.createdAt,
            new Date(Date.now() - retryDelayMinutes * 60 * 1000)
          )
        )
      );

    const results = {
      campaign: { attempted: 0, succeeded: 0, failed: 0 },
      commission: { attempted: 0, succeeded: 0, failed: 0 },
    };

    // Retry campaign payouts
    for (const payout of failedCampaignPayouts) {
      try {
        results.campaign.attempted++;
        
        // Check retry count (stored in notes or we can add a retryCount field)
        const retryCount = parseInt(payout.notes?.match(/retries:(\d+)/)?.[1] || '0');
        
        if (retryCount >= maxRetries) {
          continue;
        }

        // Update status to processing before retry
        await db
          .update(campaignPayouts)
          .set({
            status: 'processing',
            notes: `${payout.notes || ''}\nRetry attempt ${retryCount + 1} at ${new Date().toISOString()}`,
            updatedAt: new Date(),
          })
          .where(eq(campaignPayouts.id, payout.id));

        // Process the payout
        const result = await processCampaignCreatorPayout(payout.id);

        if (result.success) {
          results.campaign.succeeded++;
        } else {
          results.campaign.failed++;
          // Update retry count in notes
          await db
            .update(campaignPayouts)
            .set({
              notes: `${payout.notes || ''}\nretries:${retryCount + 1}`,
              status: 'failed',
              failureReason: result.error,
              updatedAt: new Date(),
            })
            .where(eq(campaignPayouts.id, payout.id));
        }
      } catch (error) {
        results.campaign.failed++;
        console.error(`Error retrying campaign payout ${payout.id}:`, error);
      }
    }

    // Retry commission payouts
    for (const payout of failedCommissionPayouts) {
      try {
        results.commission.attempted++;
        
        const retryCount = parseInt(payout.notes?.match(/retries:(\d+)/)?.[1] || '0');
        
        if (retryCount >= maxRetries) {
          continue;
        }

        // Update status to processing
        await db
          .update(commissionPayouts)
          .set({
            status: 'processing',
            notes: `${payout.notes || ''}\nRetry attempt ${retryCount + 1} at ${new Date().toISOString()}`,
          })
          .where(eq(commissionPayouts.id, payout.id));

        // Process the payout
        const result = await processAmbassadorPayout(payout.id);

        if (result.success) {
          results.commission.succeeded++;
        } else {
          results.commission.failed++;
          await db
            .update(commissionPayouts)
            .set({
              notes: `${payout.notes || ''}\nretries:${retryCount + 1}`,
              status: 'failed',
            })
            .where(eq(commissionPayouts.id, payout.id));
        }
      } catch (error) {
        results.commission.failed++;
        console.error(`Error retrying commission payout ${payout.id}:`, error);
      }
    }

    return {
      success: true,
      results,
      summary: {
        totalAttempted: results.campaign.attempted + results.commission.attempted,
        totalSucceeded: results.campaign.succeeded + results.commission.succeeded,
        totalFailed: results.campaign.failed + results.commission.failed,
      },
    };
  } catch (error) {
    console.error('Error in retryFailedPayouts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Retry a specific failed payout
 */
export async function retryPayout(payoutId: string, type: 'campaign' | 'commission') {
  try {
    if (type === 'campaign') {
      const payout = await db.query.campaignPayouts.findFirst({
        where: eq(campaignPayouts.id, payoutId),
      });

      if (!payout) {
        return { success: false, error: 'Payout not found' };
      }

      if (payout.status !== 'failed') {
        return { success: false, error: 'Payout is not in failed status' };
      }

      return await processCampaignCreatorPayout(payoutId);
    } else {
      const payout = await db.query.commissionPayouts.findFirst({
        where: eq(commissionPayouts.id, payoutId),
      });

      if (!payout) {
        return { success: false, error: 'Payout not found' };
      }

      if (payout.status !== 'failed') {
        return { success: false, error: 'Payout is not in failed status' };
      }

      return await processAmbassadorPayout(payoutId);
    }
  } catch (error) {
    console.error(`Error retrying ${type} payout ${payoutId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

