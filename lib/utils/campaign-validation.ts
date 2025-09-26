import { db } from '@/lib/db';
import { campaigns } from '@/lib/schema/campaigns';
import { eq, and, lt, gte } from 'drizzle-orm';

export interface CampaignValidationResult {
  canAcceptDonations: boolean;
  canAcceptChains: boolean;
  reason?: string;
  campaign?: any;
}

/**
 * Validates if a campaign can accept new donations or chains
 * @param campaignId - The campaign ID to validate
 * @returns Validation result with permissions and reason
 */
export async function validateCampaignForDonations(campaignId: string): Promise<CampaignValidationResult> {
  try {
    const campaign = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (!campaign.length) {
      return {
        canAcceptDonations: false,
        canAcceptChains: false,
        reason: 'Campaign not found'
      };
    }

    const campaignData = campaign[0];
    const now = new Date();

    // Check if campaign is active
    if (!campaignData.isActive) {
      return {
        canAcceptDonations: false,
        canAcceptChains: false,
        reason: 'Campaign is not active'
      };
    }

    // Check campaign status
    if (campaignData.status === 'closed') {
      return {
        canAcceptDonations: false,
        canAcceptChains: false,
        reason: 'Campaign has been closed'
      };
    }

    if (campaignData.status === 'expired') {
      return {
        canAcceptDonations: false,
        canAcceptChains: false,
        reason: 'Campaign has expired'
      };
    }

    if (campaignData.status === 'paused') {
      return {
        canAcceptDonations: false,
        canAcceptChains: false,
        reason: 'Campaign is currently paused'
      };
    }

    // Check if campaign has expired (if expiresAt is set)
    if (campaignData.expiresAt && now > campaignData.expiresAt) {
      // Auto-update status to expired
      await db
        .update(campaigns)
        .set({ 
          status: 'expired',
          updatedAt: now
        })
        .where(eq(campaigns.id, campaignId));

      return {
        canAcceptDonations: false,
        canAcceptChains: false,
        reason: 'Campaign has expired'
      };
    }

    // Check if campaign should be auto-closed (4 weeks after goal reached)
    if (campaignData.autoCloseAt && now > campaignData.autoCloseAt) {
      // Auto-update status to closed
      await db
        .update(campaigns)
        .set({ 
          status: 'closed',
          closedAt: now,
          updatedAt: now
        })
        .where(eq(campaigns.id, campaignId));

      return {
        canAcceptDonations: false,
        canAcceptChains: false,
        reason: 'Campaign has been automatically closed after reaching goal'
      };
    }

    // If campaign reached goal but hasn't been auto-closed yet, don't allow donations or chains
    // Campaign remains open for viewing only
    if (campaignData.status === 'goal_reached') {
      const daysUntilClose = campaignData.autoCloseAt 
        ? Math.ceil((campaignData.autoCloseAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        canAcceptDonations: false,
        canAcceptChains: false,
        reason: daysUntilClose > 0 
          ? `Campaign reached goal and will close in ${daysUntilClose} days`
          : 'Campaign reached goal and will close soon',
        campaign: campaignData
      };
    }

    // Campaign is active and can accept donations and chains
    return {
      canAcceptDonations: true,
      canAcceptChains: campaignData.isChained,
      campaign: campaignData
    };

  } catch (error) {
    console.error('Error validating campaign:', error);
    return {
      canAcceptDonations: false,
      canAcceptChains: false,
      reason: 'Error validating campaign'
    };
  }
}

/**
 * Checks if a campaign has reached its goal and updates status accordingly
 * @param campaignId - The campaign ID to check
 * @returns True if goal was reached, false otherwise
 */
export async function checkAndUpdateGoalReached(campaignId: string): Promise<boolean> {
  try {
    const campaign = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (!campaign.length) {
      return false;
    }

    const campaignData = campaign[0];
    const currentAmount = parseFloat(campaignData.currentAmount);
    const goalAmount = parseFloat(campaignData.goalAmount);

    // Check if goal is reached
    if (currentAmount >= goalAmount && campaignData.status === 'active') {
      const now = new Date();
      const autoCloseAt = new Date(now.getTime() + (4 * 7 * 24 * 60 * 60 * 1000)); // 4 weeks from now

      // Update campaign status
      await db
        .update(campaigns)
        .set({
          status: 'goal_reached',
          goalReachedAt: now,
          autoCloseAt: autoCloseAt,
          updatedAt: now
        })
        .where(eq(campaigns.id, campaignId));

      console.log(`Campaign ${campaignId} reached goal. Will auto-close on ${autoCloseAt.toISOString()}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking goal reached:', error);
    return false;
  }
}

/**
 * Gets campaigns that need to be auto-closed (4 weeks after goal reached)
 * @returns Array of campaign IDs that should be closed
 */
export async function getCampaignsToAutoClose(): Promise<string[]> {
  try {
    const now = new Date();
    
    const campaignsToClose = await db
      .select({ id: campaigns.id })
      .from(campaigns)
      .where(
        and(
          eq(campaigns.status, 'goal_reached'),
          lt(campaigns.autoCloseAt, now)
        )
      );

    return campaignsToClose.map(c => c.id);
  } catch (error) {
    console.error('Error getting campaigns to auto-close:', error);
    return [];
  }
}

/**
 * Auto-closes campaigns that have reached their 4-week limit after goal reached
 * @returns Number of campaigns closed
 */
export async function autoCloseExpiredCampaigns(): Promise<number> {
  try {
    const campaignIds = await getCampaignsToAutoClose();
    
    if (campaignIds.length === 0) {
      return 0;
    }

    const now = new Date();
    let closedCount = 0;

    for (const campaignId of campaignIds) {
      try {
        await db
          .update(campaigns)
          .set({
            status: 'closed',
            closedAt: now,
            updatedAt: now
          })
          .where(eq(campaigns.id, campaignId));

        closedCount++;
        console.log(`Auto-closed campaign ${campaignId}`);
      } catch (error) {
        console.error(`Error auto-closing campaign ${campaignId}:`, error);
      }
    }

    return closedCount;
  } catch (error) {
    console.error('Error auto-closing campaigns:', error);
    return 0;
  }
}

/**
 * Gets campaigns that are expired (past expiresAt date)
 * @returns Array of campaign IDs that should be marked as expired
 */
export async function getExpiredCampaigns(): Promise<string[]> {
  try {
    const now = new Date();
    
    const expiredCampaigns = await db
      .select({ id: campaigns.id })
      .from(campaigns)
      .where(
        and(
          eq(campaigns.status, 'active'),
          lt(campaigns.expiresAt, now)
        )
      );

    return expiredCampaigns.map(c => c.id);
  } catch (error) {
    console.error('Error getting expired campaigns:', error);
    return [];
  }
}

/**
 * Marks expired campaigns as expired
 * @returns Number of campaigns marked as expired
 */
export async function markExpiredCampaigns(): Promise<number> {
  try {
    const campaignIds = await getExpiredCampaigns();
    
    if (campaignIds.length === 0) {
      return 0;
    }

    const now = new Date();
    let expiredCount = 0;

    for (const campaignId of campaignIds) {
      try {
        await db
          .update(campaigns)
          .set({
            status: 'expired',
            updatedAt: now
          })
          .where(eq(campaigns.id, campaignId));

        expiredCount++;
        console.log(`Marked campaign ${campaignId} as expired`);
      } catch (error) {
        console.error(`Error marking campaign ${campaignId} as expired:`, error);
      }
    }

    return expiredCount;
  } catch (error) {
    console.error('Error marking expired campaigns:', error);
    return 0;
  }
}
