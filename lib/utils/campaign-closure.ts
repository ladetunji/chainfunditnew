import { db } from '@/lib/db';
import { campaigns } from '@/lib/schema/campaigns';
import { notifications } from '@/lib/schema/notifications';
import { eq, and, lt, gte } from 'drizzle-orm';

export interface CampaignClosureResult {
  campaignId: string;
  reason: 'goal_reached' | 'expired' | 'manual';
  closedAt: Date;
  success: boolean;
  error?: string;
}

/**
 * Parse duration string to get end date
 */
export function parseDurationToEndDate(duration: string, createdAt: Date): Date | null {
  if (!duration || duration === 'Not applicable') {
    return null; // No expiration
  }

  const now = new Date();
  const endDate = new Date(createdAt);

  switch (duration) {
    case '1 week':
      endDate.setDate(endDate.getDate() + 7);
      break;
    case '2 weeks':
      endDate.setDate(endDate.getDate() + 14);
      break;
    case '1 month':
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case '1 year':
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
    default:
      return null;
  }

  return endDate;
}

/**
 * Check if a campaign should be closed due to goal reached
 */
export function shouldCloseForGoalReached(currentAmount: number, goalAmount: number): boolean {
  return currentAmount >= goalAmount;
}

/**
 * Check if a campaign should be closed due to expiration
 */
export function shouldCloseForExpiration(duration: string, createdAt: Date): boolean {
  const endDate = parseDurationToEndDate(duration, createdAt);
  if (!endDate) return false;
  
  return new Date() > endDate;
}

/**
 * Close a single campaign
 */
export async function closeCampaign(
  campaignId: string, 
  reason: 'goal_reached' | 'expired' | 'manual',
  userId?: string
): Promise<CampaignClosureResult> {
  try {
    const now = new Date();

    // Update campaign status
    const updateResult = await db
      .update(campaigns)
      .set({
        status: 'closed',
        isActive: false,
        closedAt: now,
        updatedAt: now,
      })
      .where(eq(campaigns.id, campaignId))
      .returning();

    if (!updateResult.length) {
      return {
        campaignId,
        reason,
        closedAt: now,
        success: false,
        error: 'Campaign not found or already closed'
      };
    }

    const campaign = updateResult[0];

    // Create notification for campaign creator
    if (userId) {
      await db.insert(notifications).values({
        userId,
        type: 'campaign_closed',
        title: reason === 'goal_reached' ? 'Campaign Goal Reached!' : 'Campaign Closed',
        message: reason === 'goal_reached' 
          ? `Congratulations! Your campaign "${campaign.title}" has reached its goal of ${campaign.currency} ${campaign.goalAmount}.`
          : `Your campaign "${campaign.title}" has been closed.`,
        metadata: JSON.stringify({
          campaignId,
          reason,
          closedAt: now.toISOString(),
          goalAmount: campaign.goalAmount,
          currentAmount: campaign.currentAmount,
          currency: campaign.currency
        })
      });
    }

    return {
      campaignId,
      reason,
      closedAt: now,
      success: true
    };

  } catch (error) {
    console.error(`❌ Error closing campaign ${campaignId}:`, error);
    return {
      campaignId,
      reason,
      closedAt: new Date(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get campaigns that should be closed
 */
export async function getCampaignsToClose(): Promise<{
  goalReached: Array<{ id: string; creatorId: string; title: string; currentAmount: string; goalAmount: string; currency: string }>;
  expired: Array<{ id: string; creatorId: string; title: string; duration: string; createdAt: Date; currency: string; goalAmount: string; currentAmount: string }>;
}> {
  try {
    // Get campaigns that have reached their goal
    const goalReachedCampaigns = await db
      .select({
        id: campaigns.id,
        creatorId: campaigns.creatorId,
        title: campaigns.title,
        currentAmount: campaigns.currentAmount,
        goalAmount: campaigns.goalAmount,
        currency: campaigns.currency,
      })
      .from(campaigns)
      .where(
        and(
          eq(campaigns.status, 'active'),
          eq(campaigns.isActive, true),
          gte(campaigns.currentAmount, campaigns.goalAmount)
        )
      );

    // Get campaigns that have expired
    const expiredCampaigns = await db
      .select({
        id: campaigns.id,
        creatorId: campaigns.creatorId,
        title: campaigns.title,
        duration: campaigns.duration,
        createdAt: campaigns.createdAt,
        currency: campaigns.currency,
        goalAmount: campaigns.goalAmount,
        currentAmount: campaigns.currentAmount,
      })
      .from(campaigns)
      .where(
        and(
          eq(campaigns.status, 'active'),
          eq(campaigns.isActive, true)
        )
      );

    // Filter expired campaigns
    const now = new Date();
    const actuallyExpired = expiredCampaigns.filter(campaign => {
      if (!campaign.duration || campaign.duration === 'Not applicable') {
        return false;
      }
      
      const endDate = parseDurationToEndDate(campaign.duration, campaign.createdAt);
      return endDate && now > endDate;
    }).map(campaign => ({
      ...campaign,
      duration: campaign.duration!
    }));

    return {
      goalReached: goalReachedCampaigns,
      expired: actuallyExpired
    };

  } catch (error) {
    console.error('❌ Error getting campaigns to close:', error);
    return {
      goalReached: [],
      expired: []
    };
  }
}

/**
 * Close all campaigns that should be closed
 */
export async function closeEligibleCampaigns(): Promise<{
  closed: CampaignClosureResult[];
  errors: CampaignClosureResult[];
}> {
  try {
    const { goalReached, expired } = await getCampaignsToClose();
    
    const results: CampaignClosureResult[] = [];
    const errors: CampaignClosureResult[] = [];

    // Close goal-reached campaigns
    for (const campaign of goalReached) {
      const result = await closeCampaign(campaign.id, 'goal_reached', campaign.creatorId);
      if (result.success) {
        results.push(result);
      } else {
        errors.push(result);
      }
    }

    // Close expired campaigns
    for (const campaign of expired) {
      const result = await closeCampaign(campaign.id, 'expired', campaign.creatorId);
      if (result.success) {
        results.push(result);
      } else {
        errors.push(result);
      }
    }

    return { closed: results, errors };

  } catch (error) {
    console.error('❌ Error closing eligible campaigns:', error);
    return { closed: [], errors: [] };
  }
}

/**
 * Get campaign closure statistics
 */
export async function getCampaignClosureStats(): Promise<{
  totalActive: number;
  goalReached: number;
  expired: number;
  totalClosed: number;
}> {
  try {
    const { goalReached, expired } = await getCampaignsToClose();
    
    const totalActive = await db
      .select({ count: campaigns.id })
      .from(campaigns)
      .where(
        and(
          eq(campaigns.status, 'active'),
          eq(campaigns.isActive, true)
        )
      );

    const totalClosed = await db
      .select({ count: campaigns.id })
      .from(campaigns)
      .where(eq(campaigns.status, 'closed'));

    return {
      totalActive: totalActive.length,
      goalReached: goalReached.length,
      expired: expired.length,
      totalClosed: totalClosed.length
    };

  } catch (error) {
    console.error('❌ Error getting campaign closure stats:', error);
    return {
      totalActive: 0,
      goalReached: 0,
      expired: 0,
      totalClosed: 0
    };
  }
}
