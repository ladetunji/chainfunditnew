import { useState, useEffect } from 'react';

interface DashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalDonations: number; // Total in Naira
  totalDonors: number;
  totalChained: number;
  totalEarnings: number;
  primaryCurrency: string; // Always 'NGN' for Nigerian users
  currencyBreakdown: { [key: string]: number }; // Breakdown by original currency
  recentDonations: Array<{
    id: string;
    amount: number;
    currency: string;
    message: string;
    donorName: string;
    campaignTitle: string;
    createdAt: string;
  }>;
}

interface Campaign {
  id: string;
  title: string;
  subtitle: string;
  goalAmount: number;
  currentAmount: number;
  currency: string;
  status: string;
  isActive: boolean;
  coverImageUrl: string;
  progressPercentage: number;
  donationCount: number;
  createdAt: string;
}

interface Donation {
  id: string;
  amount: number;
  currency: string;
  paymentStatus: string;
  paymentProvider: string;
  transactionId?: string;
  message: string;
  isAnonymous: boolean;
  donorName?: string;
  donorEmail?: string;
  donorAvatar?: string;
  createdAt: string;
  processedAt: string;
  campaignId: string;
  campaignTitle: string;
  campaignCurrency: string;
  campaignCoverImage: string;
  isSuccessful: boolean;
  // Enhanced status fields
  retryAttempts?: number;
  failureReason?: string;
  lastStatusUpdate?: string;
  providerStatus?: string;
  providerError?: string;
}

interface ChainingActivity {
  id: string;
  campaignId: string;
  referralCode: string;
  totalEarnings: number;
  totalDonations: number;
  createdAt: string;
  campaignTitle: string;
  campaignCoverImage: string;
  campaignGoal: number;
  campaignCurrent: number;
  campaignCurrency: string;
  progressPercentage: number;
}

interface DashboardData {
  stats: DashboardStats | null;
  campaigns: Campaign[];
  donations: Donation[];
  chaining: ChainingActivity[];
  loading: boolean;
  error: string | null;
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData>({
    stats: null,
    campaigns: [],
    donations: [],
    chaining: [],
    loading: true,
    error: null,
  });

  const fetchDashboardData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // Fetch all dashboard data in parallel
      const [statsRes, campaignsRes, donationsRes, chainingRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/campaigns'),
        fetch('/api/dashboard/donations'),
        fetch('/api/dashboard/chaining'),
      ]);

      const [statsData, campaignsData, donationsData, chainingData] = await Promise.all([
        statsRes.json(),
        campaignsRes.json(),
        donationsRes.json(),
        chainingRes.json(),
      ]);

      setData({
        stats: statsData.success ? statsData.stats : null,
        campaigns: campaignsData.success ? campaignsData.campaigns : [],
        donations: donationsData.success ? donationsData.donations : [],
        chaining: chainingData.success ? chainingData.chaining : [],
        loading: false,
        error: null,
      });
    } catch (error) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load dashboard data',
      }));
    }
  };

  const refreshData = () => {
    fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    ...data,
    refreshData,
  };
}

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard/campaigns');
      const data = await response.json();

      if (data.success) {
        setCampaigns(data.campaigns);
      } else {
        setError(data.error || 'Failed to load campaigns');
      }
    } catch (error) {
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return {
    campaigns,
    loading,
    error,
    refreshCampaigns: fetchCampaigns,
  };
}

export function useDonations(status: string = 'all', page: number = 1) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchDonations = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        status,
        page: page.toString(),
        limit: '10',
      });

      const response = await fetch(`/api/dashboard/donations?${params}`);
      const data = await response.json();

      if (data.success) {
        setDonations(data.donations);
        setPagination(data.pagination);
      } else {
        setError(data.error || 'Failed to load donations');
      }
    } catch (error) {
      setError('Failed to load donations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [status, page]);

  return {
    donations,
    loading,
    error,
    pagination,
    refreshDonations: fetchDonations,
  };
} 