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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Mail,
  Phone,
  Building2,
  User,
  Clock,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

interface AccountChangeRequest {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  accountNumber?: string;
  bankCode?: string;
  bankName?: string;
  accountName?: string;
  accountVerified: boolean;
  accountLocked: boolean;
  accountChangeRequested: boolean;
  accountChangeReason?: string;
  updatedAt: string;
  createdAt: string;
}

export default function AdminAccountRequestsPage() {
  const [requests, setRequests] = useState<AccountChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] =
    useState<AccountChangeRequest | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [newAccountNumber, setNewAccountNumber] = useState("");
  const [newBankCode, setNewBankCode] = useState("");
  const [newBankName, setNewBankName] = useState("");
  const [newAccountName, setNewAccountName] = useState("");
  const [banks, setBanks] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchRequests();
    fetchBanks();
  }, [currentPage]);

  const fetchBanks = async () => {
    try {
      const response = await fetch("/api/banks");
      const result = await response.json();
      if (result.success) {
        setBanks(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching banks:", error);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      });

      const response = await fetch(
        `/api/admin/account-requests?${params.toString()}`
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error("Authentication required");
          return;
        }
        throw new Error("Failed to fetch requests");
      }

      const data = await response.json();
      setRequests(data.requests || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
    } catch (error) {
      console.error("Error fetching account change requests:", error);
      toast.error("Failed to fetch account change requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setActionLoading(true);
    try {
      const response = await fetch(
        `/api/admin/account-requests/${selectedRequest.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "approve",
            notes: approvalNotes.trim() || undefined,
            ...(newAccountNumber && newBankCode
              ? {
                  newAccountNumber: newAccountNumber.trim(),
                  newBankCode: newBankCode.trim(),
                  newBankName: newBankName.trim() || undefined,
                  newAccountName: newAccountName.trim() || undefined,
                }
              : {}),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to approve request");
      }

      toast.success("Account change request approved successfully");
      setShowApproveDialog(false);
      setSelectedRequest(null);
      setApprovalNotes("");
      setNewAccountNumber("");
      setNewBankCode("");
      setNewBankName("");
      setNewAccountName("");
      fetchRequests();
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to approve request"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    if (!rejectionReason.trim() || rejectionReason.trim().length < 10) {
      toast.error("Please provide a rejection reason (minimum 10 characters)");
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(
        `/api/admin/account-requests/${selectedRequest.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "reject",
            notes: rejectionReason.trim(),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reject request");
      }

      toast.success("Account change request rejected");
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectionReason("");
      fetchRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to reject request"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getBankName = (bankCode?: string) => {
    if (!bankCode) return "N/A";
    const bank = banks.find((b) => b.code === bankCode);
    return bank?.name || bankCode;
  };

  if (loading && requests.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#104901]">
              Account Change Requests
            </h1>
            <p className="text-gray-600 mt-2">
              Review and manage bank account change requests
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#104901]"></div>
              <p className="ml-4 text-gray-600">Loading requests...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#104901]">
              Account Change Requests
            </h1>
            <p className="text-gray-600 mt-2">
              Review and manage bank account change requests ({totalCount}{" "}
              pending)
            </p>
          </div>
        </div>

        {requests.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Pending Requests
                </h3>
                <p className="text-gray-600">
                  There are no pending account change requests at this time.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Pending Requests
                </CardTitle>
                <CardDescription>
                  Review each request and approve or reject based on
                  verification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Current Account</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {request.fullName}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {request.email}
                            </div>
                            {request.phone && (
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {request.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {request.accountNumber ? (
                            <div className="space-y-1">
                              <div className="font-mono text-sm">
                                {request.accountNumber}
                              </div>
                              <div className="text-xs text-gray-500">
                                {getBankName(request.bankCode)}
                              </div>
                              {request.accountName && (
                                <div className="text-xs text-gray-500">
                                  {request.accountName}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">No account</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-sm line-clamp-2">
                              {request.accountChangeReason ||
                                "No reason provided"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {formatDate(request.updatedAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-yellow-50 text-yellow-700"
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRequest(request)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-green-600"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowApproveDialog(true);
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowRejectDialog(true);
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
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
                    <div className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
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
          </>
        )}

        {/* View Details Dialog */}
        {selectedRequest && !showApproveDialog && !showRejectDialog && (
          <Dialog
            open={!!selectedRequest}
            onOpenChange={() => setSelectedRequest(null)}
          >
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Change Request Details
                </DialogTitle>
                <DialogDescription>
                  Review all details before making a decision
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* User Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">User Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-600">
                          Full Name
                        </Label>
                        <p className="font-medium">
                          {selectedRequest.fullName}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Email</Label>
                        <p className="font-medium">{selectedRequest.email}</p>
                      </div>
                      {selectedRequest.phone && (
                        <div>
                          <Label className="text-sm text-gray-600">Phone</Label>
                          <p className="font-medium">{selectedRequest.phone}</p>
                        </div>
                      )}
                      <div>
                        <Label className="text-sm text-gray-600">User ID</Label>
                        <p className="font-mono text-xs">
                          {selectedRequest.id}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Current Account Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Current Account Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedRequest.accountNumber ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-600">
                            Account Number
                          </Label>
                          <p className="font-mono font-medium">
                            {selectedRequest.accountNumber}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Bank</Label>
                          <p className="font-medium">
                            {getBankName(selectedRequest.bankCode)}
                          </p>
                        </div>
                        {selectedRequest.accountName && (
                          <div>
                            <Label className="text-sm text-gray-600">
                              Account Name
                            </Label>
                            <p className="font-medium">
                              {selectedRequest.accountName}
                            </p>
                          </div>
                        )}
                        <div>
                          <Label className="text-sm text-gray-600">
                            Status
                          </Label>
                          <div className="flex items-center gap-2">
                            {selectedRequest.accountVerified ? (
                              <Badge
                                variant="default"
                                className="bg-green-100 text-green-800"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline">Not Verified</Badge>
                            )}
                            {selectedRequest.accountLocked && (
                              <Badge
                                variant="outline"
                                className="bg-orange-50 text-orange-700"
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Locked
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        No account details on file
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Change Reason */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Reason for Change
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                      <p className="whitespace-pre-wrap text-sm">
                        {selectedRequest.accountChangeReason ||
                          "No reason provided"}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Requested on: {formatDate(selectedRequest.updatedAt)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSelectedRequest(null)}
                >
                  Close
                </Button>
                <Button
                  variant="default"
                  className="bg-green-600"
                  onClick={() => {
                    setShowApproveDialog(true);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Request
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowRejectDialog(true);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Approve Dialog */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Approve Account Change Request
              </DialogTitle>
              <DialogDescription>
                Approving this request will unlock the user's account so they
                can update their bank details.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="approval-notes">Admin Notes (Optional)</Label>
                <Textarea
                  id="approval-notes"
                  placeholder="Add any notes or instructions for the user..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowApproveDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                className="bg-green-600"
                onClick={handleApprove}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                Reject Account Change Request
              </DialogTitle>
              <DialogDescription>
                Please provide a clear reason for rejection. This will be sent
                to the user via email.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="rejection-reason">
                  Rejection Reason <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Explain why this request cannot be approved (minimum 10 characters)..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={5}
                  minLength={10}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {rejectionReason.length}/500 characters (minimum 10 required)
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={actionLoading || rejectionReason.trim().length < 10}
              >
                {actionLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
