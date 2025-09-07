import { useState, useEffect } from 'react';

interface Chainer {
  id: string;
  userId: string;
  referralCode: string;
  totalRaised: number;
  totalReferrals: number;
  commissionEarned: number;
  createdAt: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
}

interface TopChainersData {
  campaignId: string;
  topChainers: Chainer[];
}

export function useTopChainers(campaignId: string) {
  const [topChainers, setTopChainers] = useState<Chainer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) return;

    const fetchTopChainers = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/campaigns/${campaignId}/chains?topChainers=true`);
        const result = await response.json();

        if (result.success) {
          setTopChainers(result.data.topChainers);
        } else {
          setError(result.error || 'Failed to fetch top chainers');
        }
      } catch (err) {
        setError('Failed to fetch top chainers');
        console.error('Error fetching top chainers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopChainers();
  }, [campaignId]);

  return {
    topChainers,
    loading,
    error,
  };
}
