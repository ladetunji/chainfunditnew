import { useState, useEffect } from 'react';

interface ChainerDonation {
  id: string;
  campaignId: string;
  donorId: string;
  chainerId: string;
  amount: number;
  currency: string;
  message: string | null;
  isAnonymous: boolean;
  createdAt: string;
  campaignTitle: string;
  campaignSlug: string;
  campaignCoverImage: string | null;
  campaignGoal: number;
  campaignCurrent: number;
  campaignCurrency: string;
  campaignStatus: string;
  chainerReferralCode: string;
  chainerUserId: string;
  chainerCommissionEarned: number;
  donorName: string;
}

interface CampaignStats {
  campaignId: string;
  campaignTitle: string;
  campaignSlug: string;
  campaignCoverImage: string | null;
  campaignGoal: number;
  campaignCurrent: number;
  campaignCurrency: string;
  campaignStatus: string;
  chainedDonations: number;
  chainedAmount: number;
  totalChainers: number;
  totalCommissionsPaid: number;
  progressPercentage: number;
}

interface ChainerStats {
  totalChainedDonations: number;
  totalChainedAmount: number;
  totalChainers: number;
  totalCommissionsPaid: number;
}

interface ChainerDonationsResponse {
  success: boolean;
  campaigns: CampaignStats[];
  donations: ChainerDonation[];
  stats: ChainerStats;
  error?: string;
}

export function useChainerDonations() {
  const [data, setData] = useState<ChainerDonationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/dashboard/chains', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
      });

      const result: ChainerDonationsResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch chainer donations');
      }

      setData(result);
    } catch (err) {
      console.error('Error refetching chainer donations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch chainer donations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function fetchChainerDonations() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/dashboard/chains', {
          credentials: 'include', // Include cookies for authentication
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
        });

        const result: ChainerDonationsResponse = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch chainer donations');
        }

        setData(result);
      } catch (err) {
        console.error('Error fetching chainer donations:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch chainer donations');
      } finally {
        setLoading(false);
      }
    }

    fetchChainerDonations();
  }, []);

  // Auto-refresh chainer donations every 30 seconds when not loading
  useEffect(() => {
    if (loading) return;
    
    async function fetchChainerDonations() {
      try {
        setError(null);

        const response = await fetch('/api/dashboard/chains', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
        });

        const result: ChainerDonationsResponse = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch chainer donations');
        }

        setData(result);
      } catch (err) {
        console.error('Error fetching chainer donations:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch chainer donations');
      }
    }
    
    const interval = setInterval(() => {
      fetchChainerDonations();
    }, 30000); // 30 seconds instead of 45

    return () => clearInterval(interval);
  }, [loading]);

  // Refresh when page gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        refetch();
      }
    };

    document.addEventListener('visibilitychange', handleFocus);
    return () => document.removeEventListener('visibilitychange', handleFocus);
  }, [refetch]);


  return {
    data,
    loading,
    error,
    refetch,
  };
}
