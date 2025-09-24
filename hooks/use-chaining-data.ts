import { useState, useEffect } from 'react';

interface ChainingData {
  id: string;
  campaignId: string;
  referralCode: string;
  totalRaised: number;
  totalReferrals: number;
  commissionEarned: number;
  commissionPaid: boolean;
  createdAt: string;
  campaignTitle: string;
  campaignCoverImage: string | null;
  campaignGoal: number;
  campaignCurrent: number;
  campaignCurrency: string;
  campaignStatus: string;
  progressPercentage: number;
}

interface RecentDonation {
  id: string;
  amount: number;
  currency: string;
  message: string | null;
  isAnonymous: boolean;
  createdAt: string;
  campaignTitle: string;
  donorName: string;
}

interface ChainingStats {
  totalChained: number;
  totalEarnings: number;
  totalDonations: number;
  totalReferrals: number;
}

interface ChainingResponse {
  success: boolean;
  chaining: ChainingData[];
  recentDonations: RecentDonation[];
  stats: ChainingStats;
  error?: string;
}

export function useChainingData() {
  const [data, setData] = useState<ChainingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChainingData() {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('auth-token');
        if (!token) {
          setError('No authentication token found');
          return;
        }

        const response = await fetch('/api/dashboard/chaining', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const result: ChainingResponse = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch chaining data');
        }

        setData(result);
      } catch (err) {
        console.error('Error fetching chaining data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch chaining data');
      } finally {
        setLoading(false);
      }
    }

    fetchChainingData();
  }, []);

  const refetch = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch('/api/dashboard/chaining', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result: ChainingResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch chaining data');
      }

      setData(result);
    } catch (err) {
      console.error('Error refetching chaining data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch chaining data');
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    refetch,
  };
}
