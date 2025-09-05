// Campaign type from the useCampaigns hook
export type Campaign = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  reason: string;
  fundraisingFor: string;
  duration: string;
  videoUrl: string;
  coverImageUrl: string;
  galleryImages: string[];
  documents: string[];
  goalAmount: number;
  currency: string;
  minimumDonation: number;
  chainerCommissionRate: number;
  currentAmount: number;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  closedAt: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  stats?: {
    totalDonations: number;
    totalAmount: number;
    uniqueDonors: number;
    progressPercentage: number;
  };
};

// Transformed campaign type for display
export type TransformedCampaign = {
  id: string; // Changed from number to string to preserve UUID
  title: string;
  description: string;
  amountRaised: number;
  goal: number;
  donors: number;
  chains: number;
  image: string;
  currency: string;
};

// Transform function to convert Campaign to TransformedCampaign
export const transformCampaign = (campaign: Campaign): TransformedCampaign => ({
  id: campaign.id, // Keep as string instead of converting to number
  title: campaign.title,
  description: campaign.description,
  amountRaised: campaign.currentAmount || 0,
  goal: campaign.goalAmount || 0,
  donors: campaign.stats?.uniqueDonors || 0,
  chains: 0, // TODO: Implement chain counting
  image: campaign.coverImageUrl || "/images/image.png",
  currency: campaign.currency,
}); 