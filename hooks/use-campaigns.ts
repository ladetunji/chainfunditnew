import { useState, useEffect, useCallback, useRef } from 'react';

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

interface CampaignFormData {
  title: string;
  subtitle: string;
  description: string;
  reason: string;
  fundraisingFor: string;
  duration: string;
  videoUrl: string;
  goalAmount: number;
  currency: string;
  minimumDonation: number;
  chainerCommissionRate: number;
}

interface CampaignUpdate {
  id: string;
  campaignId: string;
  title: string;
  content: string;
  mediaUrl: string;
  createdAt: string;
  updatedAt: string;
  creatorName: string;
  creatorAvatar: string;
}

interface CampaignComment {
  id: string;
  campaignId: string;
  content: string;
  createdAt: string;
  userId: string;
  userName: string;
  userAvatar: string;
}

// Cache for campaigns data
const campaignsCache = new Map<string, { data: Campaign[]; timestamp: number; ttl: number }>();

// Debounce function for search/filtering
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    status?: string;
    reason?: string;
    creatorId?: string;
    limit?: number;
    offset?: number;
  }>({ limit: 12, offset: 0 });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const fetchCampaignsRef = useRef<((newFilters?: typeof filters) => Promise<void>) | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchCampaigns = useCallback(async (newFilters?: typeof filters) => {
    try {
      // Cancel previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      const currentFilters = newFilters || filters;
      const cacheKey = JSON.stringify(currentFilters);
      
      // Check cache first
      const cached = campaignsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        if (isMountedRef.current) {
          setCampaigns(cached.data);
          setLoading(false);
          setError(null);
        }
        return;
      }

      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
      }
      const params = new URLSearchParams();
      if (currentFilters?.status) params.append('status', currentFilters.status);
      if (currentFilters?.reason) params.append('reason', currentFilters.reason);
      if (currentFilters?.creatorId) params.append('creatorId', currentFilters.creatorId);
      if (currentFilters?.limit) params.append('limit', currentFilters.limit.toString());
      if (currentFilters?.offset) params.append('offset', currentFilters.offset.toString());

      const url = `/api/dashboard/campaigns?${params}`;

      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Cache-Control': 'max-age=60', // 1 minute cache
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data.success && isMountedRef.current) {
        setCampaigns(data.data);
        
        // Cache the result (5 minutes TTL)
        campaignsCache.set(cacheKey, {
          data: data.data,
          timestamp: Date.now(),
          ttl: 5 * 60 * 1000
        });
      } else if (isMountedRef.current) {  
        setError(data.error || 'Failed to load campaigns');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, don't update state
        return;
      }
      
      console.error('Error:', error);
      if (isMountedRef.current) {
        setError('Failed to load campaigns');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Update ref to latest fetchCampaigns
  fetchCampaignsRef.current = fetchCampaigns;

  // Debounced version for search/filtering
  const debouncedFetch = useCallback(
    debounce((newFilters: typeof filters) => {
      fetchCampaignsRef.current?.(newFilters);
    }, 300),
    []
  );

  const createCampaign = useCallback(async (campaignData: CampaignFormData): Promise<Campaign | null> => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      Object.entries(campaignData).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });

      const response = await fetch('/api/dashboard/campaigns', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create campaign');
      }

      // Clear cache to force refresh
      campaignsCache.clear();
      
      // Update local state
      setCampaigns(prev => [data.data, ...prev]);

      return data.data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      setError(error instanceof Error ? error.message : 'Failed to create campaign');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCampaign = useCallback(async (campaignId: string, updates: Partial<Campaign>): Promise<Campaign | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/dashboard/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update campaign');
      }

      // Clear cache to force refresh
      campaignsCache.clear();

      // Update local state
      setCampaigns(prev => prev.map(campaign => 
        campaign.id === campaignId ? { ...campaign, ...data.data } : campaign
      ));

      return data.data;
    } catch (error) {
      console.error('Error updating campaign:', error);
      setError(error instanceof Error ? error.message : 'Failed to update campaign');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCampaign = useCallback(async (campaignId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/dashboard/campaigns/${campaignId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete campaign');
      }

      // Clear cache to force refresh
      campaignsCache.clear();

      // Remove from local state
      setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId));

      return true;
    } catch (error) {
      console.error('Error deleting campaign:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete campaign');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update filters and refetch
  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prevFilters => {
      const updatedFilters = { ...prevFilters, ...newFilters, offset: 0 }; // Reset offset when filters change
      debouncedFetch(updatedFilters);
      return updatedFilters;
    });
  }, [debouncedFetch]);

  // Clear cache manually
  const clearCache = useCallback(() => {
    campaignsCache.clear();
  }, []);

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
    createCampaign,
    updateCampaign,
    deleteCampaign,
    clearCache,
    refetch: () => fetchCampaigns(),
  };
}

export function useCampaign(campaignId: string) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaign = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/dashboard/campaigns`);
      const data = await response.json();

      if (data.success) {
        setCampaign(data.data);
      } else {
        setError(data.error || 'Failed to load campaign');
      }
    } catch (error) {
      console.error('Error fetching campaign:', error);
      setError('Failed to load campaign');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    if (campaignId) {
      fetchCampaign();
    }
  }, [campaignId, fetchCampaign]);

  return {
    campaign,
    loading,
    error,
    fetchCampaign,
  };
}

export function useCampaignUpdates(campaignId: string) {
  const [updates, setUpdates] = useState<CampaignUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUpdates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/dashboard/campaigns/${campaignId}/updates`);
      const data = await response.json();

      if (data.success) {
        setUpdates(data.data);
      } else {
        setError(data.error || 'Failed to load updates');
      }
    } catch (error) {
      console.error('Error fetching updates:', error);
      setError('Failed to load updates');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  const createUpdate = useCallback(async (updateData: { title: string; content: string; mediaUrl?: string }): Promise<CampaignUpdate | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/dashboard/campaigns/${campaignId}/updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create update');
      }

      // Add to local state
      setUpdates(prev => [data.data, ...prev]);

      return data.data;
    } catch (error) {
      console.error('Error creating update:', error);
      setError(error instanceof Error ? error.message : 'Failed to create update');
      return null;
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    if (campaignId) {
      fetchUpdates();
    }
  }, [campaignId, fetchUpdates]);

  return {
    updates,
    loading,
    error,
    fetchUpdates,
    createUpdate,
  };
}

export function useCampaignComments(campaignId: string) {
  const [comments, setComments] = useState<CampaignComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchComments = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/dashboard/campaigns/${campaignId}/comments?page=${page}&limit=10`);
      const data = await response.json();

      if (data.success) {
        setComments(data.data);
        setPagination(data.pagination);
      } else {
        setError(data.error || 'Failed to load comments');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  const createComment = useCallback(async (content: string): Promise<CampaignComment | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/dashboard/campaigns/${campaignId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create comment');
      }

      // Add to local state
      setComments(prev => [data.data, ...prev]);

      return data.data;
    } catch (error) {
      console.error('Error creating comment:', error);
      setError(error instanceof Error ? error.message : 'Failed to create comment');
      return null;
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    if (campaignId) {
      fetchComments();
    }
  }, [campaignId, fetchComments]);

  return {
    comments,
    loading,
    error,
    pagination,
    fetchComments,
    createComment,
  };
} 