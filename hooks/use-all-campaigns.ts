import { useState, useEffect, useCallback, useRef } from "react";

interface Campaign {
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
}

interface UseAllCampaignsFilters {
  status?: string;
  reason?: string;
  limit?: number;
  offset?: number;
}

export function useAllCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<UseAllCampaignsFilters>({
    limit: 20,
    offset: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Fetch campaigns from the API
  const fetchCampaigns = useCallback(
    async (reset: boolean = false) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        setError(null);

        // Build query parameters
        const params = new URLSearchParams();
        if (filters.status) params.append("status", filters.status);
        if (filters.reason) params.append("reason", filters.reason);
        params.append("limit", filters.limit?.toString() || "20");
        params.append(
          "offset",
          reset ? "0" : filters.offset?.toString() || "0"
        );

        const response = await fetch(`/api/campaigns?${params.toString()}`, {
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch campaigns: ${response.status}`);
        }

        const data = await response.json();

        if (!isMountedRef.current) return;

        // Fix: API returns data.data, not data.campaigns
        const campaignsData = data.data || [];

        if (reset) {
          setCampaigns(campaignsData);
          setFilters((prev) => ({ ...prev, offset: 0 }));
        } else {
          setCampaigns((prev) => [...prev, ...campaignsData]);
        }

        // Check if there are more campaigns
        setHasMore(campaignsData.length === (filters.limit || 20));
      } catch (err: any) {
        if (err.name === "AbortError") return;

        if (!isMountedRef.current) return;

        console.error("Error fetching campaigns:", err);
        setError(err.message || "Failed to fetch campaigns");
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [filters]
  );

  // Load more campaigns
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;

    setFilters((prev) => ({
      ...prev,
      offset: (prev.offset || 0) + (prev.limit || 20),
    }));
  }, [loading, hasMore]);

  // Update filters and reset campaigns
  const updateFilters = useCallback(
    (newFilters: Partial<UseAllCampaignsFilters>) => {
      setFilters((prev) => {
        const updatedFilters = { ...prev, ...newFilters, offset: 0 };
        // Only update if there is a change
        if (JSON.stringify(updatedFilters) !== JSON.stringify(prev)) {
          return updatedFilters;
        }
        return prev;
      });
    },
    []
  );

  // Initial fetch
  useEffect(() => {
    fetchCampaigns(true);
  }, []); // Only run once on mount

  // Fetch more when offset changes - but don't depend on fetchCampaigns
  useEffect(() => {
    const currentOffset = filters.offset;
    if (currentOffset && currentOffset > 0) {
      // Use a local function to avoid dependency issues
      const fetchMore = async () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        try {
          setLoading(true);
          setError(null);

          // Build query parameters
          const params = new URLSearchParams();
          if (filters.status) params.append("status", filters.status);
          if (filters.reason) params.append("reason", filters.reason);
          params.append("limit", filters.limit?.toString() || "20");
          params.append("offset", currentOffset.toString());

          const url = `/api/campaigns?${params.toString()}`;

          const response = await fetch(url, {
            signal: abortControllerRef.current.signal,
          });
          if (!response.ok) {
            throw new Error(`Failed to fetch campaigns: ${response.status}`);
          }
          const data = await response.json();
          if (!isMountedRef.current) return;
          const campaignsData = data.data || [];
          setCampaigns((prev) => [...prev, ...campaignsData]);
          setHasMore(campaignsData.length === (filters.limit || 20));
        } catch (err: any) {
          if (err.name === "AbortError") return;

          if (!isMountedRef.current) return;

          console.error("Error fetching more campaigns:", err);
          setError(err.message || "Failed to fetch more campaigns");
        } finally {
          if (isMountedRef.current) {
            setLoading(false);
          }
        }
      };

      fetchMore();
    }
  }, [filters.offset, filters.status, filters.reason, filters.limit]); // Only depend on filter values, not the function

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    campaigns,
    loading,
    error,
    hasMore,
    fetchCampaigns: () => fetchCampaigns(true),
    loadMore,
    updateFilters,
    filters,
  };
}
