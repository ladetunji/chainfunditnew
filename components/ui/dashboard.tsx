"use client"

import * as React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart"
import { 
  Area, 
  AreaChart, 
  Bar, 
  BarChart, 
  Line, 
  LineChart, 
  Pie, 
  PieChart, 
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts"
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  BarChart3, 
  Activity,
  ArrowUp,
  ArrowDown,
  Eye,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react"

// Chart configurations
const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  donations: {
    label: "Donations",
    color: "hsl(var(--chart-2))",
  },
  users: {
    label: "Users",
    color: "hsl(var(--chart-3))",
  },
  campaigns: {
    label: "Campaigns",
    color: "hsl(var(--chart-4))",
  },
}

// Types
interface DashboardStats {
  totalUsers: number;
  totalCampaigns: number;
  totalDonations: number;
  totalRevenue: number;
  pendingPayouts: number;
  activeChainers: number;
  recentActivity: ActivityItem[];
  topCampaigns: CampaignMetric[];
  topChainers: ChainerMetric[];
  revenueTrend: RevenueData[];
}

interface ActivityItem {
  id: string;
  type: 'donation' | 'campaign' | 'chainer' | 'payout';
  description: string;
  timestamp: string;
  amount?: number;
  status: 'success' | 'pending' | 'failed';
}

interface CampaignMetric {
  id: string;
  title: string;
  raised: number;
  goal: number;
  percentage: number;
  status: 'active' | 'completed' | 'paused';
}

interface ChainerMetric {
  id: string;
  name: string;
  referrals: number;
  raised: number;
  commission: number;
  conversionRate: number;
}

interface RevenueData {
  date: string;
  amount: number;
  donations: number;
  visitors: number;
}

interface DashboardProps {
  stats: DashboardStats | null;
  loading: boolean;
  currency?: string;
  onExportReport?: () => void;
  onExportPDF?: () => void;
  onSettings?: () => void;
  onReviewCampaign?: (id: string) => void;
  onReviewUser?: (id: string) => void;
}

// Metric Card Component
const MetricCard = ({ 
  title, 
  value, 
  change, 
  subtitle,
  icon: Icon, 
  loading = false 
}: {
  title: string;
  value: string | number;
  change?: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}) => {
  if (loading) {
    return (
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24 bg-gray-200" />
          <Skeleton className="h-4 w-4 bg-gray-200" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2 bg-gray-200" />
          <Skeleton className="h-3 w-20 bg-gray-200" />
        </CardContent>
      </Card>
    );
  }

  const isPositive = change?.includes('+');
  const isNegative = change?.includes('-');

  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-900">{title}</CardTitle>
        <Icon className="h-4 w-4 text-gray-200" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
        {change && (
          <div className="flex items-center space-x-2">
            <div className={`flex items-center text-xs ${
              isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-gray-400'
            }`}>
              {isPositive ? (
                <ArrowUp className="h-3 w-3 mr-1" />
              ) : isNegative ? (
                <ArrowDown className="h-3 w-3 mr-1" />
              ) : null}
              {change}
            </div>
          </div>
        )}
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
};

// Revenue Chart Component
const RevenueChart = ({ data, loading }: { data: RevenueData[]; loading: boolean }) => {
  const [timeRange, setTimeRange] = useState('3m');

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-32 bg-gray-200" />
              <Skeleton className="h-4 w-48 mt-2 bg-gray-200" />
            </div>
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-24 bg-gray-200" />
              <Skeleton className="h-8 w-20 bg-gray-200" />
              <Skeleton className="h-8 w-20 bg-gray-200" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full bg-gray-200" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">Total Visitors</CardTitle>
            <CardDescription className="mt-1">
              Total for the last 3 months
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button
              variant={timeRange === '3m' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('3m')}
              className="text-xs"
            >
              Last 3 months
            </Button>
            <Button
              variant={timeRange === '30d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('30d')}
              className="text-xs"
            >
              Last 30 days
            </Button>
            <Button
              variant={timeRange === '7d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('7d')}
              className="text-xs"
            >
              Last 7 days
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="visitors"
              stroke="#3B82F6"
              fill="url(#revenueGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

// Campaign Performance Chart
const CampaignPerformanceChart = ({ data, loading }: { data: CampaignMetric[]; loading: boolean }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 bg-gray-200" />
          <Skeleton className="h-4 w-32 bg-gray-200" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full bg-gray-200" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Performance</CardTitle>
        <CardDescription>Top performing campaigns</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart data={data.slice(0, 5)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="title" 
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="raised" fill="green" />
            <Bar dataKey="goal" fill="red" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

// Activity Feed Component
const ActivityFeed = ({ activities, loading }: { activities: ActivityItem[]; loading: boolean }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32 bg-gray-200" />
          <Skeleton className="h-4 w-24 bg-gray-200" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-8 w-8 rounded-full bg-gray-200" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-48 bg-gray-200" />
                <Skeleton className="h-3 w-24 bg-gray-200" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest platform activities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.slice(0, 8).map((activity) => (
            <div key={activity.id} className="flex items-center space-x-3">
              {getStatusIcon(activity.status)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{activity.description}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
              {activity.amount && (
                <Badge variant="outline" className="text-xs">
                  ${activity.amount.toLocaleString()}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Main Dashboard Component
export const ModernDashboard = ({
  stats,
  loading,
  currency = 'USD',
  onExportReport,
  onExportPDF,
  onSettings,
  onReviewCampaign,
  onReviewUser
}: DashboardProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6 bg-gray-50 min-h-screen p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <MetricCard key={i} title="" value="" icon={Activity} loading />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart data={[]} loading />
          <ActivityFeed activities={[]} loading />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Unable to load dashboard</h2>
          <p className="text-gray-400 mb-4">There was an error loading the dashboard data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          change="+12.5%"
          subtitle="Trending up this month"
          icon={DollarSign}
        />
        <MetricCard
          title="New Customers"
          value={stats.totalUsers.toLocaleString()}
          change="-20%"
          subtitle="Down 20% this period"
          icon={Users}
        />
        <MetricCard
          title="Active Accounts"
          value={stats.totalCampaigns.toLocaleString()}
          change="+12.5%"
          subtitle="Strong user retention"
          icon={BarChart3}
        />
        <MetricCard
          title="Growth Rate"
          value="4.5%"
          change="+4.5%"
          subtitle="Steady performance increase"
          icon={TrendingUp}
        />
      </div>

      {/* Main Revenue Chart - Full Width */}
      <RevenueChart data={stats.revenueTrend} loading={false} />

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CampaignPerformanceChart data={stats.topCampaigns} loading={false} />
        <ActivityFeed activities={stats.recentActivity} loading={false} />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Actions</CardTitle>
            <CardDescription>Items requiring your attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">Pending Payouts</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.pendingPayouts} payouts awaiting approval
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Review
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Eye className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Campaign Reviews</p>
                    <p className="text-sm text-muted-foreground">
                      3 campaigns pending review
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Review
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Platform health and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Payment Processing</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Operational</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Operational</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Email Service</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Operational</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Response Time</span>
                <span className="text-sm text-muted-foreground">45ms avg</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ModernDashboard;
