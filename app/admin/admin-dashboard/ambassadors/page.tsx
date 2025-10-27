"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  Filter,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Ban,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils/currency";

interface Chainer {
  id: string;
  userId: string;
  campaignId: string;
  campaignTitle: string;
  userName: string;
  userEmail: string;
  totalReferrals: number;
  totalRaised: number;
  commissionEarned: number;
  commissionRate: number;
  currency: string;
  status: "active" | "suspended" | "banned";
  isVerified: boolean;
  notes?: string;
  suspendedAt?: string;
  suspendedReason?: string;
  lastActivity: string;
  createdAt: string;
}

interface ChainerStats {
  totalChainers: number;
  activeChainers: number;
  suspendedChainers: number;
  bannedChainers: number;
  totalCommissions: number;
  totalRaised: number;
  averageCommissionRate: number;
  topPerformers: Chainer[];
  recentActivity: any[];
}

export default function ChainersPage() {
  const [chainers, setChainers] = useState<Chainer[]>([]);
  const [stats, setStats] = useState<ChainerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedChainers, setSelectedChainers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchChainers();
    fetchStats();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchChainers = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        search: searchTerm,
        status: statusFilter,
      });

      const response = await fetch(`/api/admin/chainers?${params}`);
      if (!response.ok) throw new Error("Failed to fetch ambassadors");

      const data = await response.json();
      setChainers(data.chainers);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching ambassadors:", error);
      toast.error("Failed to fetch ambassadors");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/chainers/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedChainers.length === 0) {
      toast.error("Please select ambassadors to perform bulk action");
      return;
    }

    try {
      const response = await fetch("/api/admin/chainers/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chainerIds: selectedChainers,
          action,
        }),
      });

      if (!response.ok) throw new Error("Failed to perform bulk action");

      const data = await response.json();
      toast.success(data.message);
      setSelectedChainers([]);
      fetchChainers();
      fetchStats();
    } catch (error) {
      console.error("Error performing bulk action:", error);
      toast.error("Failed to perform bulk action");
    }
  };

  const handleChainerAction = async (chainerId: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/chainers/${chainerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) throw new Error("Failed to perform action");

      const data = await response.json();
      toast.success(data.message);
      fetchChainers();
      fetchStats();
    } catch (error) {
      console.error("Error performing action:", error);
      toast.error("Failed to perform action");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      suspended: "secondary",
      banned: "destructive",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "default"}>
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
      </Badge>
    );
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading ambassadors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Ambassador Management</h1>
            <p className="text-gray-600">
              Manage ambassadors and track commissions
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handleBulkAction("suspend")}
              disabled={selectedChainers.length === 0}
              variant="outline"
            >
              <UserX className="h-4 w-4 mr-2" />
              Suspend Selected
            </Button>
            <Button
              onClick={() => handleBulkAction("ban")}
              disabled={selectedChainers.length === 0}
              variant="destructive"
            >
              <Ban className="h-4 w-4 mr-2" />
              Ban Selected
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Chainers
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalChainers}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeChainers} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Commissions
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.totalCommissions, 'USD')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.averageCommissionRate}% avg rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Raised
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.totalRaised, 'USD')}
                </div>
                <p className="text-xs text-muted-foreground">
                  Through chainer referrals
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
                    placeholder="Search chainers..."
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Chainers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Ambassadors</CardTitle>
            <CardDescription>
              Manage ambassador accounts and monitor their performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={
                        selectedChainers.length === chainers.length &&
                        chainers.length > 0
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedChainers(chainers.map((c) => c.id));
                        } else {
                          setSelectedChainers([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Ambassador</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chainers.map((chainer) => (
                  <TableRow key={chainer.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedChainers.includes(chainer.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedChainers([
                              ...selectedChainers,
                              chainer.id,
                            ]);
                          } else {
                            setSelectedChainers(
                              selectedChainers.filter((id) => id !== chainer.id)
                            );
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{chainer.userName}</div>
                        <div className="text-sm text-gray-500">
                          {chainer.userEmail}
                        </div>
                        <div className="text-xs text-gray-400">
                          Joined{" "}
                          {new Date(chainer.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{chainer.campaignTitle}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {chainer.totalReferrals} referrals
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(chainer.totalRaised, chainer.currency || 'USD')} raised
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {formatCurrency(chainer.commissionEarned, chainer.currency || 'USD')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {chainer.commissionRate}% rate
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(chainer.status)}
                      {chainer.isVerified && (
                        <span title="Verified" className="ml-2">
                          <CheckCircle className="h-4 w-4 text-blue-500" />
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleChainerAction(chainer.id, "view")
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {chainer.status === "active" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleChainerAction(chainer.id, "suspend")
                            }
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleChainerAction(chainer.id, "activate")
                            }
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleChainerAction(chainer.id, "ban")}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
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
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
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
