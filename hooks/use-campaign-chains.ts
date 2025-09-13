import { useState, useEffect, useCallback, useRef } from 'react';

interface CampaignChains {
  [campaignId: string]: number;
}

export const useCampaignChains = (campaignIds: string[]) => {
  const [chainCounts, setChainCounts] = useState<CampaignChains>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<string>('');
  const isFetchingRef = useRef(false);
  const lastCampaignIdsRef = useRef<string>('');

  const fetchChainCounts = useCallback(async () => {
    if (campaignIds.length === 0) return;
    
    // Create a stable key for the campaignIds array
    const campaignIdsKey = campaignIds.sort().join(',');
    
    // Prevent duplicate fetches
    if (lastFetchRef.current === campaignIdsKey || isFetchingRef.current) {
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      const counts: CampaignChains = {};
      
      // Fetch chain counts for each campaign
      await Promise.all(
        campaignIds.map(async (campaignId) => {
          try {
            const response = await fetch(`/api/campaigns/${campaignId}/chains`);
            if (response.ok) {
              const result = await response.json();
              if (result.success) {
                counts[campaignId] = result.data.chainCount;
              }
            }
          } catch (err) {
            console.error(`Error fetching chains for campaign ${campaignId}:`, err);
          }
        })
      );

      setChainCounts(counts);
      lastFetchRef.current = campaignIdsKey;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch chain counts';
      setError(errorMessage);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [campaignIds]);

  useEffect(() => {
    // Create a stable key for comparison
    const currentCampaignIdsKey = campaignIds.sort().join(',');
    
    // Skip if campaignIds haven't meaningfully changed
    if (lastCampaignIdsRef.current === currentCampaignIdsKey) {
      return;
    }
    
    // Update the last seen campaignIds
    lastCampaignIdsRef.current = currentCampaignIdsKey;
    
    // Add debounce to prevent rapid successive calls
    const timeoutId = setTimeout(() => {
      fetchChainCounts();
    }, 100); // 100ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [fetchChainCounts, campaignIds]);

  return {
    chainCounts,
    loading,
    error,
  };
};
