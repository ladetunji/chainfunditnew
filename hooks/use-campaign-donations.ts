import { useState, useEffect, useCallback } from 'react';

export interface CampaignDonation {
  id: string;
  amount: string;
  currency: string;
  paymentStatus: string;
  message?: string;
  isAnonymous: boolean;
  createdAt: string;
  processedAt?: string;
  donorName?: string;
  donorAvatar?: string;
}

export function useCampaignDonations(campaignId: string | undefined) {
  const [donations, setDonations] = useState<CampaignDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDonations = useCallback(async () => {
    if (!campaignId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/campaigns/${campaignId}/donations`);
      const data = await response.json();

      if (data.success) {
        setDonations(data.donations || []);
      } else {
        setError(data.error || 'Failed to load donations');
      }
    } catch (err) {
      console.error('Error fetching campaign donations:', err);
      setError('Failed to load donations');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  return {
    donations,
    loading,
    error,
    refreshDonations: fetchDonations,
  };
}
