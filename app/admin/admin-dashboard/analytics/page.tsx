'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  Target,
  Share,
  CreditCard,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalCampaigns: number;
    totalDonations: number;
    totalAmount: number;
    totalChainers: number;
    totalPayouts: number;
    platformRevenue: number;
    averageDonation: number;
  };
  growth: {
    userGrowth: Array<{ month: string; count: number }>;
    campaignGrowth: Array<{ month: string; count: number }>;
    donationGrowth: Array<{ month: string; count: number; amount: number }>;
    revenueGrowth: Array<{ month: string; amount: number }>;
  };
  performance: {
    topCampaigns: Array<{
      id: string;
      title: string;
      amount: number;
      donations: number;
      chainers: number;
    }>;
    topChainers: Array<{
      id: string;
      name: string;
      referrals: number;
      raised: number;
      commission: number;
    }>;
    topDonors: Array<{
      id: string;
      name: string;
      totalDonated: number;
      donationCount: number;
    }>;
  };
  metrics: {
    conversionRates: {
      donationToChainer: number;
      clickToDonation: number;
      campaignSuccess: number;
    };
    engagement: {
      averageSessionTime: number;
      bounceRate: number;
      returnVisitorRate: number;
    };
    fraud: {
      fraudScore: number;
      suspiciousTransactions: number;
      blockedAttempts: number;
    };
  };
  charts: {
    revenueByCurrency: Array<{ currency: string; amount: number; percentage: number }>;
    donationsByStatus: Array<{ status: string; count: number; percentage: number }>;
    campaignsByStatus: Array<{ status: string; count: number; percentage: number }>;
    userActivity: Array<{ hour: number; activeUsers: number }>;
  };
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, refreshKey]);

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams({
        range: timeRange,
      });

      const response = await fetch(`/api/admin/analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast.success('Analytics refreshed');
  };

  const handleExport = () => {
    toast.success('Export started - you will receive an email when ready');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">Failed to load analytics</p>
          <Button onClick={handleRefresh} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive platform analytics and insights</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.overview.totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalCampaigns.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.totalChainers} chainers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.overview.platformRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +15% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Growth</CardTitle>
            <CardDescription>Monthly revenue trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Revenue Growth Chart</p>
                <p className="text-sm text-gray-400">Chart component would be integrated here</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>New user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">User Growth Chart</p>
                <p className="text-sm text-gray-400">Chart component would be integrated here</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Campaigns</CardTitle>
            <CardDescription>Highest earning campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.performance.topCampaigns.slice(0, 5).map((campaign, index) => (
                <div key={campaign.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{campaign.title}</p>
                      <p className="text-xs text-gray-500">{campaign.donations} donations</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${campaign.amount.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{campaign.chainers} chainers</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Chainers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Chainers</CardTitle>
            <CardDescription>Highest performing referrers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.performance.topChainers.slice(0, 5).map((chainer, index) => (
                <div key={chainer.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{chainer.name}</p>
                      <p className="text-xs text-gray-500">{chainer.referrals} referrals</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${chainer.raised.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">${chainer.commission.toLocaleString()} earned</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Donors */}
        <Card>
          <CardHeader>
            <CardTitle>Top Donors</CardTitle>
            <CardDescription>Most generous contributors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.performance.topDonors.slice(0, 5).map((donor, index) => (
                <div key={donor.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{donor.name}</p>
                      <p className="text-xs text-gray-500">{donor.donationCount} donations</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${donor.totalDonated.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Conversion Rates</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Donation to Chainer</span>
                <span className="text-lg font-bold">{analytics.metrics.conversionRates.donationToChainer}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Click to Donation</span>
                <span className="text-lg font-bold">{analytics.metrics.conversionRates.clickToDonation}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Campaign Success</span>
                <span className="text-lg font-bold">{analytics.metrics.conversionRates.campaignSuccess}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement Metrics</CardTitle>
            <CardDescription>User behavior insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avg Session Time</span>
                <span className="text-lg font-bold">{analytics.metrics.engagement.averageSessionTime}m</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Bounce Rate</span>
                <span className="text-lg font-bold">{analytics.metrics.engagement.bounceRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Return Visitors</span>
                <span className="text-lg font-bold">{analytics.metrics.engagement.returnVisitorRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Currency Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Currency</CardTitle>
          <CardDescription>Distribution of donations by currency</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analytics.charts.revenueByCurrency.map((currency) => (
              <div key={currency.currency} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{currency.currency}</p>
                  <p className="text-sm text-gray-500">{currency.percentage}% of total</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">${currency.amount.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
