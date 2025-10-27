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
  Ban,
  Clock,
  CheckCircle2,
  Download,
  Upload,
  Shield,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils/currency';

interface Payout {
  id: string;
  chainerId: string;
  chainerName: string;
  chainerEmail: string;
  campaignId: string;
  campaignTitle: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'failed';
  requestDate: string;
  approvedDate?: string;
  paidDate?: string;
  paymentMethod: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    routingNumber?: string;
  };
  notes?: string;
  approvedBy?: string;
  rejectionReason?: string;
}

interface PayoutStats {
  totalPayouts: number;
  pendingPayouts: number;
  approvedPayouts: number;
  paidPayouts: number;
  rejectedPayouts: number;
  totalAmount: number;
  pendingAmount: number;
  approvedAmount: number;
  paidAmount: number;
  averageProcessingTime: number;
  recentPayouts: Payout[];
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [stats, setStats] = useState<PayoutStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPayouts, setSelectedPayouts] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPayouts();
    fetchStats();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchPayouts = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        search: searchTerm,
        status: statusFilter,
      });

      const response = await fetch(`/api/admin/payouts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch payouts');

      const data = await response.json();
      setPayouts(data.payouts);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching payouts:', error);
      toast.error('Failed to fetch payouts');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/payouts/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedPayouts.length === 0) {
      toast.error('Please select payouts to perform bulk action');
      return;
    }

    try {
      const response = await fetch('/api/admin/payouts/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutIds: selectedPayouts,
          action,
        }),
      });

      if (!response.ok) throw new Error('Failed to perform bulk action');

      const data = await response.json();
      toast.success(data.message);
      setSelectedPayouts([]);
      fetchPayouts();
      fetchStats();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  const handlePayoutAction = async (payoutId: string, action: string, notes?: string) => {
    try {
      const response = await fetch(`/api/admin/payouts/${payoutId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
      });

      if (!response.ok) throw new Error('Failed to perform action');

      const data = await response.json();
      toast.success(data.message);
      fetchPayouts();
      fetchStats();
    } catch (error) {
      console.error('Error performing action:', error);
      toast.error('Failed to perform action');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      paid: 'default',
      rejected: 'destructive',
      failed: 'destructive',
    } as const;

    const icons = {
      pending: Clock,
      approved: CheckCircle,
      paid: CheckCircle2,
      rejected: XCircle,
      failed: XCircle,
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
          <p className="mt-2 text-gray-600">Loading payouts...</p>
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
          <h1 className="text-3xl font-bold">Payout Management</h1>
          <p className="text-gray-600">Review and approve chainer payouts</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleBulkAction('approve')}
            disabled={selectedPayouts.length === 0}
            variant="default"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve Selected
          </Button>
          <Button
            onClick={() => handleBulkAction('reject')}
            disabled={selectedPayouts.length === 0}
            variant="destructive"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject Selected
          </Button>
          <Button variant="outline">
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
              <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPayouts}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingPayouts} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.pendingAmount, 'USD')}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.paidAmount, 'USD')}</div>
              <p className="text-xs text-muted-foreground">
                Successfully processed
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
                  placeholder="Search payouts..."
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
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payouts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Requests</CardTitle>
          <CardDescription>
            Review and approve chainer payout requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedPayouts.length === payouts.length && payouts.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPayouts(payouts.map(p => p.id));
                      } else {
                        setSelectedPayouts([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Chainer</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedPayouts.includes(payout.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPayouts([...selectedPayouts, payout.id]);
                        } else {
                          setSelectedPayouts(selectedPayouts.filter(id => id !== payout.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{payout.chainerName}</div>
                      <div className="text-sm text-gray-500">{payout.chainerEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{payout.campaignTitle}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {formatCurrency(payout.amount, payout.currency)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{payout.paymentMethod}</div>
                      <div className="text-sm text-gray-500">
                        {payout.bankDetails.bankName}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-gray-500">
                      {new Date(payout.requestDate).toLocaleDateString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePayoutAction(payout.id, 'view')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {payout.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handlePayoutAction(payout.id, 'approve')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handlePayoutAction(payout.id, 'reject')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {payout.status === 'approved' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handlePayoutAction(payout.id, 'pay')}
                        >
                          <DollarSign className="h-4 w-4" />
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
