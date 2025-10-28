'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Download,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useGeolocationCurrency } from '@/hooks/use-geolocation-currency';
import { formatCurrency } from '@/lib/utils/currency';
import { ModernDashboard } from '@/components/ui/dashboard';

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

export default function AdminDashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const router = useRouter();
  const { locationInfo } = useGeolocationCurrency();
  const currency = locationInfo?.currency?.code || 'USD';
  const country = locationInfo?.country;

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/dashboard/stats?range=${timeRange}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Button handlers
  const handleExportReport = async () => {
    try {
      toast.info('Generating report...');
      
      // Generate CSV report with dashboard data
      const csvData = generateCSVReport();
      downloadCSV(csvData, 'admin-dashboard-report.csv');
      
      toast.success('Report exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  // Generate CSV report data
  const generateCSVReport = () => {
    if (!stats) return [];
    
    const timestamp = new Date().toISOString();
    
    // Main metrics section
    const mainMetrics = [
      ['=== ADMIN DASHBOARD REPORT ===', '', '', timestamp],
      ['', '', '', ''],
      ['MAIN METRICS', '', '', ''],
      ['Total Users', stats.totalUsers.toString(), '+12%', timestamp],
      ['Active Campaigns', stats.totalCampaigns.toString(), '+8%', timestamp],
      ['Total Donations', stats.totalDonations.toString(), '+15%', timestamp],
      ['Total Revenue', `${formatCurrency(stats.totalRevenue, currency)}`, '+18%', timestamp],
      ['Pending Payouts', stats.pendingPayouts.toString(), '', timestamp],
      ['Active Chainers', stats.activeChainers.toString(), '', timestamp],
      ['', '', '', ''],
    ];

    // Top campaigns section
    const topCampaignsData = [
      ['TOP PERFORMING CAMPAIGNS', '', '', ''],
      ['Campaign Title', 'Raised Amount', 'Goal', 'Status'],
      ...stats.topCampaigns.map(campaign => [
        campaign.title,
        formatCurrency(campaign.raised, currency),
        formatCurrency(campaign.goal, currency),
        campaign.status
      ]),
      ['', '', '', ''],
    ];

    // Recent activity section
    const recentActivityData = [
      ['RECENT ACTIVITY', '', '', ''],
      ['Activity Type', 'Description', 'Time', 'Status'],
      ...stats.recentActivity.slice(0, 10).map(activity => [
        activity.type,
        activity.description,
        new Date(activity.timestamp).toLocaleString(),
        activity.status
      ]),
    ];

    return [...mainMetrics, ...topCampaignsData, ...recentActivityData];
  };

  // Download CSV file
  const downloadCSV = (data: string[][], filename: string) => {
    const csvContent = data.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSettings = () => {
    router.push('/admin/settings');
  };

  const handleDownloadReport = () => {
    handleExportReport();
  };

  // Generate PDF report (opens print dialog)
  const handleExportPDF = () => {
    try {
      toast.info('Preparing PDF report...');
      
      // Create a new window with the report content
      const reportWindow = window.open('', '_blank');
      if (reportWindow) {
        const reportHTML = generatePDFReport();
        reportWindow.document.write(reportHTML);
        reportWindow.document.close();
        
        // Wait for content to load, then trigger print
        setTimeout(() => {
          reportWindow.print();
        }, 500);
      }
      
      toast.success('PDF report ready for download!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to generate PDF report');
    }
  };

  // Generate HTML content for PDF
  const generatePDFReport = () => {
    if (!stats) return '<html><body><h1>No data available</h1></body></html>';
    
    const timestamp = new Date().toLocaleString();
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Admin Dashboard Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 25px; }
          .section h2 { color: #333; border-bottom: 2px solid #6366f1; padding-bottom: 5px; }
          .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
          .metric { background: #f8f9fa; padding: 15px; border-radius: 8px; }
          .metric h3 { margin: 0 0 5px 0; color: #6366f1; }
          .metric p { margin: 0; font-size: 24px; font-weight: bold; }
          .campaigns table, .activity table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .campaigns th, .campaigns td, .activity th, .activity td { 
            border: 1px solid #ddd; padding: 8px; text-align: left; 
          }
          .campaigns th, .activity th { background-color: #f2f2f2; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Admin Dashboard Report</h1>
          <p>Generated on ${timestamp}</p>
        </div>
        
        <div class="section">
          <h2>Key Metrics</h2>
          <div class="metrics">
            <div class="metric">
              <h3>Total Users</h3>
              <p>${stats.totalUsers.toLocaleString()}</p>
            </div>
            <div class="metric">
              <h3>Active Campaigns</h3>
              <p>${stats.totalCampaigns.toLocaleString()}</p>
            </div>
            <div class="metric">
              <h3>Total Donations</h3>
              <p>${stats.totalDonations.toLocaleString()}</p>
            </div>
            <div class="metric">
              <h3>Total Revenue</h3>
              <p>${formatCurrency(stats.totalRevenue, currency)}</p>
            </div>
          </div>
        </div>
        
        <div class="section campaigns">
          <h2>Top Performing Campaigns</h2>
          <table>
            <thead>
              <tr>
                <th>Campaign Title</th>
                <th>Raised Amount</th>
                <th>Goal</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${stats.topCampaigns.map(campaign => `
                <tr>
                  <td>${campaign.title}</td>
                  <td>${formatCurrency(campaign.raised, currency)}</td>
                  <td>${formatCurrency(campaign.goal, currency)}</td>
                  <td>${campaign.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section activity">
          <h2>Recent Activity</h2>
          <table>
            <thead>
              <tr>
                <th>Activity Type</th>
                <th>Description</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${stats.recentActivity.slice(0, 10).map(activity => `
                <tr>
                  <td>${activity.type}</td>
                  <td>${activity.description}</td>
                  <td>${new Date(activity.timestamp).toLocaleString()}</td>
                  <td>${activity.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;
  };

  const handleReviewCampaign = (campaignId: string) => {
    router.push(`/admin/campaigns?id=${campaignId}`);
  };

  const handleReviewUser = (userId: string) => {
    router.push(`/admin/users?id=${userId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Platform overview and management
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={handleExportReport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button size="sm" className="bg-[#104901] text-white" onClick={handleSettings}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Modern Dashboard Component */}
        <ModernDashboard
          stats={stats}
          loading={loading}
          currency={currency}
          onExportReport={handleExportReport}
          onExportPDF={handleExportPDF}
          onSettings={handleSettings}
          onReviewCampaign={handleReviewCampaign}
          onReviewUser={handleReviewUser}
        />
      </div>
    </div>
  );
}
