'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  DollarSign,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  CheckCircle2,
  Download,
  RefreshCw,
  Heart
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils/currency';
import { useGeolocationCurrency } from '@/hooks/use-geolocation-currency';
import Link from 'next/link';

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

interface CharityPayout {
  id: string;
  charityId: string;
  amount: string;
  currency: string;
  status: string;
  paymentMethod: string;
  reference: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  donationIds: string[];
  failureReason?: string;
  processedAt?: string;
  createdAt: string;
  charity: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
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
  const [charityPayouts, setCharityPayouts] = useState<CharityPayout[]>([]);
  const [stats, setStats] = useState<PayoutStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [charityLoading, setCharityLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [charityStatusFilter, setCharityStatusFilter] = useState('all');
  const [selectedPayouts, setSelectedPayouts] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processing, setProcessing] = useState<string | null>(null);
  const { locationInfo } = useGeolocationCurrency();
  const currency = locationInfo?.currency?.code || 'USD';

  useEffect(() => {
    fetchPayouts();
    fetchCharityPayouts();
    fetchStats();
  }, [currentPage, searchTerm, statusFilter, charityStatusFilter]);

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

  const fetchCharityPayouts = async () => {
    setCharityLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (charityStatusFilter !== "all") {
        params.append("status", charityStatusFilter);
      }

      const response = await fetch(
        `/api/charities/payouts?${params.toString()}`
      );
      const data = await response.json();
      setCharityPayouts(data.payouts || []);
    } catch (error) {
      console.error("Error fetching charity payouts:", error);
      toast.error("Failed to fetch charity payouts");
    } finally {
      setCharityLoading(false);
    }
  };

  const handleProcessCharityPayout = async (
    payoutId: string,
    status: "completed" | "failed"
  ) => {
    setProcessing(payoutId);
    try {
      const response = await fetch(`/api/charities/payouts/${payoutId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          failureReason:
            status === "failed" ? "Manual review failed" : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update payout");
      }

      toast.success(
        `Payout ${status === "completed" ? "completed" : "failed"} successfully`
      );
      fetchCharityPayouts();
    } catch (error) {
      console.error("Error processing payout:", error);
      toast.error("Failed to process payout");
    } finally {
      setProcessing(null);
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

  const getCharityStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-blue-500">
            <RefreshCw className="h-3 w-3 mr-1" />
            Processing
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const formatCharityCurrency = (amount: string, currency: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(num);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate charity stats
  const charityStats = {
    total: charityPayouts.length,
    pending: charityPayouts.filter((p) => p.status === "pending").length,
    processing: charityPayouts.filter((p) => p.status === "processing").length,
    completed: charityPayouts.filter((p) => p.status === "completed").length,
    failed: charityPayouts.filter((p) => p.status === "failed").length,
    totalAmount: charityPayouts.reduce((sum, p) => sum + parseFloat(p.amount), 0),
  };

  if (loading && charityLoading) {
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
            <p className="text-gray-600">Review and approve all platform payouts</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <Tabs defaultValue="campaign-payouts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="campaign-payouts">Campaign Payouts</TabsTrigger>
            <TabsTrigger value="charity-payouts">Charity Payouts</TabsTrigger>
          </TabsList>

          <TabsContent value="campaign-payouts" className="space-y-6">
            {/* Campaign Payouts Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Campaign Payouts</h2>
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
              </div>
            </div>

            {/* Campaign Stats Cards */}
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
                    <div className="text-2xl font-bold">{formatCurrency(stats.pendingAmount, currency)}</div>
                    <p className="text-xs text-muted-foreground">
                      Awaiting approval
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.paidAmount, currency)}</div>
                    <p className="text-xs text-muted-foreground">
                      Successfully processed
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Campaign Filters */}
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

            {/* Campaign Payouts Table */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Payout Requests</CardTitle>
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
                          {getStatusBadge(payout.status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {new Date(payout.requestDate).toLocaleDateString()}
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
          </TabsContent>

          <TabsContent value="charity-payouts" className="space-y-6">
            {/* Charity Payouts Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Charity Payouts</h2>
                <p className="text-gray-600">Manage and process payouts to charities</p>
              </div>
              <Button onClick={fetchCharityPayouts} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Charity Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
                  <DollarSign className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{charityStats.total}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCharityCurrency(charityStats.totalAmount.toString(), "NGN")} total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {charityStats.pending}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Awaiting processing</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {charityStats.completed}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Successfully processed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Failed</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {charityStats.failed}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Failed payouts</p>
                </CardContent>
              </Card>
            </div>

            {/* Charity Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <Select value={charityStatusFilter} onValueChange={setCharityStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payouts</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Charity Payouts List */}
            <div className="space-y-4">
              {charityLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                  <p className="text-gray-500 mt-4">Loading charity payouts...</p>
                </div>
              ) : charityPayouts.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500">No charity payouts found</p>
                  </CardContent>
                </Card>
              ) : (
                charityPayouts.map((payout) => (
                  <Card key={payout.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {payout.charity.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Reference: {payout.reference}
                          </CardDescription>
                        </div>
                        {getCharityStatusBadge(payout.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Amount</p>
                          <p className="text-lg font-semibold">
                            {formatCharityCurrency(payout.amount, payout.currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Bank Details</p>
                          <p className="text-sm font-medium">{payout.bankName}</p>
                          <p className="text-xs text-gray-600">
                            {payout.accountNumber}
                          </p>
                          <p className="text-xs text-gray-600">
                            {payout.accountName}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Donations</p>
                          <p className="text-lg font-semibold">
                            {payout.donationIds?.length || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Created</p>
                          <p className="text-sm">{formatDate(payout.createdAt)}</p>
                          {payout.processedAt && (
                            <>
                              <p className="text-xs text-gray-500 mt-1">
                                Processed
                              </p>
                              <p className="text-xs">
                                {formatDate(payout.processedAt)}
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      {payout.failureReason && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800">
                            <strong>Failure Reason:</strong> {payout.failureReason}
                          </p>
                        </div>
                      )}

                      {(payout.status === "pending" ||
                        payout.status === "processing") && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() =>
                              handleProcessCharityPayout(payout.id, "completed")
                            }
                            disabled={processing === payout.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Completed
                          </Button>
                          <Button
                            onClick={() => handleProcessCharityPayout(payout.id, "failed")}
                            disabled={processing === payout.id}
                            variant="destructive"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Mark as Failed
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}