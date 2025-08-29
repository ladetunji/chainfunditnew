import { Campaign as SchemaCampaign } from '@/lib/schema/campaigns';

// Campaign type that can handle both schema and transformed versions
export type Campaign = SchemaCampaign | {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  reason: string | null;
  fundraisingFor: string | null;
  duration: string | null;
  videoUrl: string | null;
  coverImageUrl: string | null;
  galleryImages: string | string[];
  documents: string | string[];
  goalAmount: string | number;
  currency: string;
  minimumDonation: string | number;
  chainerCommissionRate: string | number;
  currentAmount: string | number;
  status: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  closedAt: string | Date | null;
  creatorId: string;
  creatorName?: string;
  creatorAvatar?: string | null;
};

export type CampaignStatus = 'active' | 'paused' | 'goal_reached' | 'closed' | 'expired';

export interface CampaignStatusInfo {
  status: CampaignStatus;
  isActive: boolean;
  daysRemaining?: number;
  daysOverdue?: number;
  reason: string;
}

/**
 * Determines campaign status based on duration, current time, and other factors
 */
export function getCampaignStatus(campaign: Campaign): CampaignStatusInfo {
  const now = new Date();
  const createdAt = new Date(campaign.createdAt);
  
  // If campaign is manually closed, respect that
  if (campaign.status === 'closed' || !campaign.isActive) {
    return {
      status: 'closed',
      isActive: false,
      reason: 'Campaign manually closed'
    };
  }

  // If goal is reached, mark as goal_reached
  const currentAmount = Number(campaign.currentAmount);
  const goalAmount = Number(campaign.goalAmount);
  
  if (currentAmount >= goalAmount) {
    return {
      status: 'goal_reached',
      isActive: true,
      reason: 'Funding goal reached'
    };
  }

  // Handle duration-based expiration
  if (campaign.duration && campaign.duration !== 'Not applicable') {
    const durationInDays = parseDurationToDays(campaign.duration);
    if (durationInDays > 0) {
      const endDate = new Date(createdAt.getTime() + (durationInDays * 24 * 60 * 60 * 1000));
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      
      if (daysRemaining <= 0) {
        // Campaign has expired
        return {
          status: 'expired',
          isActive: false,
          daysOverdue: Math.abs(daysRemaining),
          reason: `Campaign expired ${Math.abs(daysRemaining)} day(s) ago`
        };
      } else {
        // Campaign is still active
        return {
          status: 'active',
          isActive: true,
          daysRemaining,
          reason: `${daysRemaining} day(s) remaining`
        };
      }
    }
  }

  // Default: campaign is active
  return {
    status: 'active',
    isActive: true,
    reason: 'Campaign is active'
  };
}

/**
 * Parse duration string to number of days
 */
function parseDurationToDays(duration: string): number {
  const lowerDuration = duration.toLowerCase();
  
  if (lowerDuration.includes('week')) {
    const weeks = parseInt(duration.match(/\d+/)?.[0] || '1');
    return weeks * 7;
  }
  
  if (lowerDuration.includes('month')) {
    const months = parseInt(duration.match(/\d+/)?.[0] || '1');
    return months * 30; // Approximate
  }
  
  if (lowerDuration.includes('year')) {
    const years = parseInt(duration.match(/\d+/)?.[0] || '1');
    return years * 365; // Approximate
  }
  
  return 0; // Not applicable or unknown
}

/**
 * Check if a campaign should be considered "past"
 */
export function isPastCampaign(campaign: Campaign): boolean {
  const statusInfo = getCampaignStatus(campaign);
  return !statusInfo.isActive || 
         statusInfo.status === 'closed' || 
         statusInfo.status === 'expired' ||
         statusInfo.status === 'goal_reached';
}

/**
 * Check if a campaign should be considered "live"
 */
export function isLiveCampaign(campaign: Campaign): boolean {
  const statusInfo = getCampaignStatus(campaign);
  const currentAmount = Number(campaign.currentAmount);
  const goalAmount = Number(campaign.goalAmount);
  
  return statusInfo.isActive && 
         statusInfo.status === 'active' && 
         currentAmount < goalAmount;
}

/**
 * Get formatted time remaining for display
 */
export function getTimeRemaining(campaign: Campaign): string {
  const statusInfo = getCampaignStatus(campaign);
  
  if (statusInfo.daysRemaining !== undefined) {
    if (statusInfo.daysRemaining === 0) {
      return 'Ends today';
    } else if (statusInfo.daysRemaining === 1) {
      return 'Ends tomorrow';
    } else if (statusInfo.daysRemaining < 7) {
      return `${statusInfo.daysRemaining} days left`;
    } else if (statusInfo.daysRemaining < 30) {
      const weeks = Math.ceil(statusInfo.daysRemaining / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} left`;
    } else {
      const months = Math.ceil(statusInfo.daysRemaining / 30);
      return `${months} month${months > 1 ? 's' : ''} left`;
    }
  }
  
  if (statusInfo.daysOverdue !== undefined) {
    if (statusInfo.daysOverdue === 1) {
      return 'Expired yesterday';
    } else if (statusInfo.daysOverdue < 7) {
      return `Expired ${statusInfo.daysOverdue} days ago`;
    } else {
      return `Expired ${Math.ceil(statusInfo.daysOverdue / 7)} weeks ago`;
    }
  }
  
  return 'Ongoing';
}
