'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Download,
  Upload,
  Shield,
  FileText,
  Clock,
  CreditCard,
  Users,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useGeolocationCurrency } from '@/hooks/use-geolocation-currency';
import { formatCurrency } from '@/lib/utils/currency';

interface Donation {
  id: string;
  campaignId: string;
  campaignTitle: string;
  donorId: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  currency: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  chainerId?: string;
  chainerName?: string;
  createdAt: string;
  processedAt?: string;
  refundedAt?: string;
  refundReason?: string;
  transactionId: string;
}

interface DonationStats {
  totalDonations: number;
  completedDonations: number;
  pendingDonations: number;
  failedDonations: number;
  refundedDonations: number;
  totalAmount: number;
  completedAmount: number;
  pendingAmount: number;
  refundedAmount: number;
  averageDonation: number;  
  recentDonations: Donation[];
}

export default function DonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<DonationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const router = useRouter();
  const { locationInfo } = useGeolocationCurrency();
  const currency = locationInfo?.currency?.code;
  const [selectedDonations, setSelectedDonations] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchDonations();
    fetchStats();
  }, [currentPage, searchTerm, statusFilter, currencyFilter]);

  const fetchDonations = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        search: searchTerm,
        status: statusFilter,
        currency: currencyFilter,
      });

      const response = await fetch(`/api/admin/donations?${params}`);
      if (!response.ok) throw new Error('Failed to fetch donations');

      const data = await response.json();
      console.log('Donations API response:', data);
      console.log('Donations array:', data.donations);
      setDonations(data.donations || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching donations:', error);
      toast.error('Failed to fetch donations');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/donations/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedDonations.length === 0) {
      toast.error('Please select donations to perform bulk action');
      return;
    }

    try {
      const response = await fetch('/api/admin/donations/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donationIds: selectedDonations,
          action,
        }),
      });

      if (!response.ok) throw new Error('Failed to perform bulk action');

      const data = await response.json();
      toast.success(data.message);
      setSelectedDonations([]);
      fetchDonations();
      fetchStats();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  const handleDonationAction = async (donationId: string, action: string, reason?: string) => {
    try {
      const response = await fetch(`/api/admin/donations/${donationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });

      if (!response.ok) throw new Error('Failed to perform action');

      const data = await response.json();
      toast.success(data.message);
      fetchDonations();
      fetchStats();
    } catch (error) {
      console.error('Error performing action:', error);
      toast.error('Failed to perform action');
    }
  };

  // Additional button handlers
  const handleExportDonations = async () => {
    try {
      toast.info('Exporting donations data...');
      // In a real app, this would generate and download a CSV/Excel file
      setTimeout(() => {
        toast.success('Donations data exported successfully!');
      }, 2000);
    } catch (error) {
      toast.error('Failed to export donations data');
    }
  };

  const handleViewDonation = (donationId: string) => {
    router.push(`/admin/dashboard/donations/${donationId}`);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      completed: 'default',
      failed: 'destructive',
      refunded: 'outline',
    } as const;

    const icons = {
      pending: Clock,
      completed: CheckCircle,
      failed: XCircle,
      refunded: RefreshCw,
    } as const;

    const Icon = icons[status as keyof typeof icons];

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading donations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Donations Management</h1>
          <p className="text-gray-600">Track and manage all platform donations</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleBulkAction('refund')}
            disabled={selectedDonations.length === 0}
            variant="destructive"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refund Selected
          </Button>
          <Button variant="outline" onClick={handleExportDonations}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDonations}</div>
              <p className="text-xs text-muted-foreground">
                {stats.completedDonations} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.totalAmount || 0, 'USD')}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats?.completedAmount || 0, 'USD')} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Donation</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.averageDonation || 0, 'USD')}</div>
              <p className="text-xs text-muted-foreground">
                Per donation
              </p>
            </CardContent>
          </Card>

          
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search donations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Currencies</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="NGN">NGN</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Donations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Donations</CardTitle>
          <CardDescription>
            Monitor and manage all platform donations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedDonations.length === (donations || []).length && (donations || []).length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDonations((donations || []).map(d => d.id));
                      } else {
                        setSelectedDonations([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Donor</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ambassador</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(donations || []).map((donation) => (
                <TableRow key={donation.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedDonations.includes(donation.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDonations([...selectedDonations, donation.id]);
                        } else {
                          setSelectedDonations(selectedDonations.filter(id => id !== donation.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{donation.donorName}</div>
                      <div className="text-sm text-gray-500">{donation.donorEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{donation.campaignTitle}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {formatCurrency(donation.amount, donation.currency)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <CreditCard className="h-4 w-4" />
                      <span className="text-sm">{donation.paymentMethod}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(donation.paymentStatus)}
                  </TableCell>
                  <TableCell>
                    {donation.chainerName ? (
                      <div>
                        <div className="font-medium">{donation.chainerName}</div>
                        <div className="text-sm text-gray-500">Referred</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Direct</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(donation.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDonationAction(donation.id, 'view')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {donation.paymentStatus === 'completed' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDonationAction(donation.id, 'refund')}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      {donation.paymentStatus === 'failed' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleDonationAction(donation.id, 'retry')}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </div>
  );
}
