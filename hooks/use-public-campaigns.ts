import { useState, useEffect, useCallback } from 'react';

interface PublicCampaign {
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
  stats: {
    totalDonations: number;
    totalAmount: number;
    uniqueDonors: number;
    progressPercentage: number;
  };
}

interface PublicCampaignFilters {
  status?: string;
  reason?: string;
  limit?: number;
  offset?: number;
}

export function usePublicCampaigns() {
  const [campaigns, setCampaigns] = useState<PublicCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PublicCampaignFilters>({ 
    limit: 3, 
    offset: 0 
  });

  const fetchCampaigns = useCallback(async (newFilters?: PublicCampaignFilters) => {
    try {
      setLoading(true);
      setError(null);

      const currentFilters = newFilters || filters;
      
      const params = new URLSearchParams();
      if (currentFilters?.status) params.append('status', currentFilters.status);
      if (currentFilters?.reason) params.append('reason', currentFilters.reason);
      if (currentFilters?.limit) params.append('limit', currentFilters.limit.toString());
      if (currentFilters?.offset) params.append('offset', currentFilters.offset.toString());

      const url = `/api/campaigns?${params}`;
      
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'max-age=60', // 1 minute cache
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setCampaigns(data.data);
      } else {
        setError(data.error || 'Failed to load campaigns');
      }
    } catch (error) {
      console.error('Error fetching public campaigns:', error);
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateFilters = useCallback((newFilters: Partial<PublicCampaignFilters>) => {
    setFilters(prevFilters => {
      const updatedFilters = { ...prevFilters, ...newFilters, offset: 0 };
      fetchCampaigns(updatedFilters);
      return updatedFilters;
    });
  }, [fetchCampaigns]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return {
    campaigns,
    loading,
    error,
    filters,
    fetchCampaigns,
    updateFilters,
    refetch: () => fetchCampaigns(),
  };
}
