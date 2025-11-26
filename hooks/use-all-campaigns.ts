import { useState, useEffect, useCallback, useRef } from "react";

interface Campaign {
  id: string;
  slug: string;
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
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, 15000); // 15 second timeout

      try {
        setLoading(true);
        setError(null);

        // Build query parameters
        const params = new URLSearchParams();
        if (filters.status && filters.status !== "trending") params.append("status", filters.status);
        if (filters.reason) params.append("reason", filters.reason);
        params.append("limit", filters.limit?.toString() || "20");
        params.append(
          "offset",
          reset ? "0" : filters.offset?.toString() || "0"
        );

        console.log('Fetching campaigns with params:', params.toString());

        const response = await fetch(`/api/campaigns?${params.toString()}`, {
          signal: abortControllerRef.current.signal,
        });

        clearTimeout(timeoutId);

        console.log('Fetch response status:', response.status, response.ok);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error('API error response:', errorText);
          throw new Error(`Failed to fetch campaigns: ${response.status} - ${errorText}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error('Non-JSON response:', text);
          throw new Error("API returned non-JSON response");
        }

        const data = await response.json();
        
        // Log the raw response structure
        console.log('=== RAW API RESPONSE ===');
        console.log('Full response object:', data);
        console.log('data.data value:', data.data);
        console.log('data.data type:', typeof data.data);
        console.log('data.data isArray:', Array.isArray(data.data));
        console.log('data.data length:', Array.isArray(data.data) ? data.data.length : 'N/A');
        if (Array.isArray(data.data) && data.data.length > 0) {
          console.log('First campaign:', data.data[0]);
        }
        console.log('=== END API RESPONSE ===');

        if (!isMountedRef.current) {
          console.warn('Component unmounted before processing response');
          return;
        }

        // Fix: API returns data.data, not data.campaigns
        // Handle different possible response structures
        let campaignsData: any[] = [];
        
        if (Array.isArray(data.data)) {
          campaignsData = data.data;
        } else if (Array.isArray(data.campaigns)) {
          campaignsData = data.campaigns;
          console.warn('API returned data.campaigns instead of data.data');
        } else if (Array.isArray(data)) {
          campaignsData = data;
          console.warn('API returned array directly, not wrapped in object');
        } else if (data.data && typeof data.data === 'object') {
          console.error('API returned non-array data.data:', data.data);
        }
        
        console.log('Extracted campaigns data:', {
          campaignsDataLength: campaignsData.length,
          isArray: Array.isArray(campaignsData),
          sample: campaignsData[0] || 'no campaigns',
          firstCampaign: campaignsData[0]
        });
        
        if (campaignsData.length === 0) {
          console.warn('No campaigns extracted from API response. Full response:', data);
        }

        // Double-check component is still mounted before state update
        if (!isMountedRef.current) {
          console.warn('Component unmounted before state update');
          return;
        }

        if (reset) {
          console.log('Setting campaigns (reset):', campaignsData.length);
          setCampaigns(campaignsData);
          setFilters((prev) => ({ ...prev, offset: 0 }));
        } else {
          console.log('Appending campaigns:', campaignsData.length);
          setCampaigns((prev) => {
            const updated = [...prev, ...campaignsData];
            console.log('Updated campaigns count:', updated.length, 'prev:', prev.length, 'new:', campaignsData.length);
            return updated;
          });
        }

        // Check if there are more campaigns
        setHasMore(campaignsData.length === (filters.limit || 20));
        
        console.log('State update complete - campaignsData.length:', campaignsData.length, 'hasMore:', campaignsData.length === (filters.limit || 20));
      } catch (err: any) {
        clearTimeout(timeoutId);
        
        if (err.name === "AbortError") {
          console.warn("Campaign fetch aborted (timeout or cancellation)");
          if (isMountedRef.current) {
            setError("Request timed out. Please try again.");
            setLoading(false);
          }
          return;
        }

        if (!isMountedRef.current) return;

        console.error("Error fetching campaigns:", err);
        setError(err.message || "Failed to fetch campaigns");
      } finally {
        clearTimeout(timeoutId);
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

  // Refetch when filters change (but not offset)
  useEffect(() => {
    if ((filters.status && filters.status.trim()) || (filters.reason && filters.reason.trim())) {
      // Use a local function to avoid dependency issues
      const refetchCampaigns = async () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        const timeoutId = setTimeout(() => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
        }, 15000); // 15 second timeout

        try {
          setLoading(true);
          setError(null);

          // Build query parameters
          const params = new URLSearchParams();
          if (filters.status && filters.status.trim() && filters.status !== "trending") {
            params.append("status", filters.status);
          }
          if (filters.reason && filters.reason.trim()) params.append("reason", filters.reason);
          params.append("limit", filters.limit?.toString() || "20");
          params.append("offset", "0");

          const response = await fetch(`/api/campaigns?${params.toString()}`, {
            signal: abortControllerRef.current.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`Failed to fetch campaigns: ${response.status}`);
          }

          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            throw new Error("API returned non-JSON response");
          }

          const data = await response.json();

          if (!isMountedRef.current) return;

          // Debug: Log API response
          console.log('API Response (filter refetch):', {
            success: data.success,
            hasData: !!data.data,
            dataLength: Array.isArray(data.data) ? data.data.length : 'not an array',
          });

          // Fix: API returns data.data, not data.campaigns
          const campaignsData = Array.isArray(data.data) ? data.data : [];
          setCampaigns(campaignsData);
          setFilters((prev) => ({ ...prev, offset: 0 }));

          // Check if there are more campaigns
          setHasMore(campaignsData.length === (filters.limit || 20));
        } catch (err: any) {
          clearTimeout(timeoutId);
          
          if (err.name === "AbortError") {
            console.warn("Campaign refetch aborted");
            if (isMountedRef.current) {
              setError("Request timed out. Please try again.");
              setLoading(false);
            }
            return;
          }

          if (!isMountedRef.current) return;

          console.error("Error fetching campaigns:", err);
          setError(err.message || "Failed to fetch campaigns");
        } finally {
          clearTimeout(timeoutId);
          if (isMountedRef.current) {
            setLoading(false);
          }
        }
      };

      refetchCampaigns();
    }
  }, [filters.status, filters.reason, filters.limit]);

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
        const timeoutId = setTimeout(() => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
        }, 15000); // 15 second timeout

        try {
          setLoading(true);
          setError(null);

          // Build query parameters
          const params = new URLSearchParams();
          if (filters.status && filters.status !== "trending") params.append("status", filters.status);
          if (filters.reason) params.append("reason", filters.reason);
          params.append("limit", filters.limit?.toString() || "20");
          params.append("offset", currentOffset.toString());

          const url = `/api/campaigns?${params.toString()}`;

          const response = await fetch(url, {
            signal: abortControllerRef.current.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch campaigns: ${response.status}`);
          }
          
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            throw new Error("API returned non-JSON response");
          }
          
          const data = await response.json();
          if (!isMountedRef.current) return;
          
          // Debug: Log API response
          console.log('API Response (load more):', {
            success: data.success,
            hasData: !!data.data,
            dataLength: Array.isArray(data.data) ? data.data.length : 'not an array',
          });
          
          const campaignsData = Array.isArray(data.data) ? data.data : [];
          setCampaigns((prev) => [...prev, ...campaignsData]);
          setHasMore(campaignsData.length === (filters.limit || 20));
        } catch (err: any) {
          clearTimeout(timeoutId);
          
          if (err.name === "AbortError") {
            console.warn("Load more aborted");
            if (isMountedRef.current) {
              setError("Request timed out. Please try again.");
              setLoading(false);
            }
            return;
          }

          if (!isMountedRef.current) return;

          console.error("Error fetching more campaigns:", err);
          setError(err.message || "Failed to fetch more campaigns");
        } finally {
          clearTimeout(timeoutId);
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
