"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  AlertTriangle,
  CreditCard,
  Building2,
  User,
  Shield,
  Mail,
  Phone,
  Globe,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAccountManagement } from "@/hooks/use-account-management";
import { toast } from "sonner";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type Props = {};

const Payments = (props: Props) => {
  const {
    accountDetails,
    banks,
    loading,
    error,
    verifying,
    verifyAccount,
    requestAccountChange,
    refetch,
  } = useAccountManagement();

  const [formData, setFormData] = useState({
    accountNumber: "",
    bankCode: "",
  });

  // International bank account form state
  const [internationalFormData, setInternationalFormData] = useState({
    accountNumber: "",
    routingNumber: "",
    sortCode: "",
    iban: "",
    swiftBic: "",
    country: "",
    bankName: "",
    accountName: "",
  });

  const [internationalAccountDetails, setInternationalAccountDetails] = useState<any>(null);
  const [loadingInternational, setLoadingInternational] = useState(false);
  const [savingInternational, setSavingInternational] = useState(false);

  const [changeRequestReason, setChangeRequestReason] = useState("");
  const [showChangeRequest, setShowChangeRequest] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [verificationData, setVerificationData] = useState<{
    accountNumber: string;
    bankCode: string;
    bankName: string;
    accountName: string;
  } | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInternationalInputChange = (field: string, value: string) => {
    setInternationalFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Fetch international bank account details on mount
  React.useEffect(() => {
    const fetchInternationalAccount = async () => {
      try {
        setLoadingInternational(true);
        const response = await fetch("/api/account/international", {
          credentials: "include",
        });
        const result = await response.json();
        if (result.success && result.data) {
          setInternationalAccountDetails(result.data);
          // Pre-fill form if account exists
          if (result.data.internationalBankAccountNumber) {
            setInternationalFormData({
              accountNumber: result.data.internationalBankAccountNumber || "",
              routingNumber: result.data.internationalBankRoutingNumber || "",
              sortCode: "",
              iban: result.data.internationalBankAccountNumber || "",
              swiftBic: result.data.internationalBankSwiftBic || "",
              country: result.data.internationalBankCountry || "",
              bankName: result.data.internationalBankName || "",
              accountName: result.data.internationalAccountName || "",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching international account:", error);
      } finally {
        setLoadingInternational(false);
      }
    };
    fetchInternationalAccount();
  }, []);

  // Refresh account details when page becomes visible (user returns to tab)
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !loading) {
       
        refetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleVerifyAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.accountNumber || !formData.bankCode) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const response = await fetch("/api/account/verify/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          accountNumber: formData.accountNumber,
          bankCode: formData.bankCode,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Account verification failed");
      }

      const selectedBank = banks.find(
        (bank) => bank.code === formData.bankCode
      );

      setVerificationData({
        accountNumber: formData.accountNumber,
        bankCode: formData.bankCode,
        bankName: selectedBank?.name || result.data.bank_name || "Unknown Bank",
        accountName: result.data.account_name,
      });
      setShowConfirmationModal(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Account verification failed"
      );
    }
  };

  const handleConfirmVerification = async () => {
    if (!verificationData) return;

    try {
      const result = await verifyAccount(
        verificationData.accountNumber,
        verificationData.bankCode
      );
      toast.success(result.message || "Account verified successfully!");
      setFormData({ accountNumber: "", bankCode: "" });
      setShowConfirmationModal(false);
      setVerificationData(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Account verification failed"
      );
    }
  };

  const handleCancelVerification = () => {
    setShowConfirmationModal(false);
    setVerificationData(null);
  };

  const handleRequestChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!changeRequestReason.trim() || changeRequestReason.trim().length < 10) {
      toast.error("Please provide a detailed reason (minimum 10 characters)");
      return;
    }

    try {
      const result = await requestAccountChange(changeRequestReason);
      toast.success(result.message || "Account change request submitted!");
      setChangeRequestReason("");
      setShowChangeRequest(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Account change request failed"
      );
    }
  };

  const handleSaveInternationalAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields based on country
    if (!internationalFormData.accountNumber || !internationalFormData.country || !internationalFormData.accountName) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Country-specific validation
    if (internationalFormData.country === "US" && !internationalFormData.routingNumber) {
      toast.error("Routing number is required for US accounts");
      return;
    }

    if (internationalFormData.country === "GB" && !internationalFormData.sortCode) {
      toast.error("Sort code is required for UK accounts");
      return;
    }

    try {
      setSavingInternational(true);
      const response = await fetch("/api/account/international", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          accountNumber: internationalFormData.accountNumber,
          routingNumber: internationalFormData.routingNumber || undefined,
          sortCode: internationalFormData.sortCode || undefined,
          iban: internationalFormData.iban || undefined,
          swiftBic: internationalFormData.swiftBic || undefined,
          country: internationalFormData.country,
          bankName: internationalFormData.bankName || undefined,
          accountName: internationalFormData.accountName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save international bank account");
      }

      toast.success("International bank account saved successfully!");
      setInternationalAccountDetails(result.data);
      
      // Refresh the page data
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save international bank account"
      );
    } finally {
      setSavingInternational(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#104901]"></div>
        <p className="ml-4 text-[#104901]">Loading account details...</p>
      </div>
    );
  }

  return (
    <div className="2xl:container 2xl:mx-auto space-y-8">
      <div>
        <h4 className="font-semibold text-3xl text-[#104901] mb-2">
          Payment Settings
        </h4>
        <p className="font-normal text-xl text-[#104901] opacity-80">
          Manage your bank account details for receiving payouts and
          commissions.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Account Status Card */}
      {accountDetails && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#104901]">
              <CreditCard className="h-5 w-5" />
              Account Status
            </CardTitle>
            <CardDescription>
              Current account verification and lock status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              {accountDetails.accountVerified ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium">
                {accountDetails.accountVerified
                  ? "Account Verified"
                  : "Account Not Verified"}
              </span>
            </div>

            {accountDetails.accountLocked && (
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-orange-600">
                  Account Details Locked
                </span>
              </div>
            )}

            {!accountDetails.accountLocked && accountDetails.accountVerified && !accountDetails.accountChangeRequested && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Unlock className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-green-900">
                        Account Unlocked
                      </span>
                      <Badge variant="outline" className="bg-green-100 text-green-700">
                        Ready for Changes
                      </Badge>
                    </div>
                    <p className="text-sm text-green-800">
                      Your account has been unlocked. You can now update your bank account details if needed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {accountDetails.accountChangeRequested && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-blue-900">
                        Change Request Pending
                      </span>
                      <Badge variant="outline" className="bg-blue-100 text-blue-700">
                        Under Review
                      </Badge>
                    </div>
                    <p className="text-sm text-blue-800 mb-2">
                      Your request to change your bank account details is being reviewed by our admin team. 
                      You will receive an email notification once a decision has been made.
                    </p>
                    {accountDetails.accountChangeReason && (
                      <div className="bg-white bg-opacity-50 rounded p-3 mt-2">
                        <p className="text-xs font-medium text-blue-900 mb-1">Your Request Reason:</p>
                        <p className="text-xs text-blue-700 whitespace-pre-wrap">
                          {accountDetails.accountChangeReason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {accountDetails.accountVerified &&
              accountDetails.accountVerificationDate && (
                <p className="text-sm text-gray-600">
                  Verified on:{" "}
                  {new Date(
                    accountDetails.accountVerificationDate
                  ).toLocaleDateString()}
                </p>
              )}
          </CardContent>
        </Card>
      )}

      {/* Account Details Display */}
      {accountDetails?.accountVerified && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#104901]">
              <Building2 className="h-5 w-5" />
              Verified Account Details
            </CardTitle>
            <CardDescription>
              Your verified bank account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">
                  Account Number
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-mono text-lg">
                    {accountDetails.accountNumber}
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">
                  Account Name
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-lg">{accountDetails.accountName}</span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">
                  Bank Name
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="text-lg">
                    {accountDetails.bankName ||
                      banks.find(
                        (bank) => bank.code === accountDetails.bankCode
                      )?.name ||
                      "Unknown Bank"}
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">
                  Bank Code
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="font-mono text-lg">
                    {accountDetails.bankCode}
                  </span>
                </div>
              </div>
            </div>

            {accountDetails.accountLocked && (
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  Your account details are locked and cannot be changed. If you
                  need to update your account details, please contact our admin
                  team.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Account Verification Form */}
      {/* Show form if account is not verified OR if account is unlocked (after approval) */}
      {(!accountDetails?.accountVerified || (accountDetails?.accountVerified && !accountDetails?.accountLocked)) && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#104901]">
              <Shield className="h-5 w-5" />
              {accountDetails?.accountVerified && !accountDetails?.accountLocked 
                ? "Update Bank Account" 
                : "Verify Bank Account"}
            </CardTitle>
            <CardDescription>
              {accountDetails?.accountVerified && !accountDetails?.accountLocked
                ? "Your account has been unlocked. You can now update your bank account details."
                : "Verify your bank account details to receive payouts and commissions"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyAccount} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="bankCode"
                    className="text-lg font-medium text-[#104901]"
                  >
                    Select Bank
                  </Label>
                  <Select
                    value={formData.bankCode}
                    onValueChange={(value) =>
                      handleInputChange("bankCode", value)
                    }
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Choose your bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((bank) => (
                        <SelectItem key={bank.code} value={bank.code}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="accountNumber"
                    className="text-lg font-medium text-[#104901]"
                  >
                    Account Number
                  </Label>
                  <Input
                    id="accountNumber"
                    type="text"
                    placeholder="Enter your account number"
                    value={formData.accountNumber}
                    onChange={(e) =>
                      handleInputChange("accountNumber", e.target.value)
                    }
                    className="h-12 text-lg"
                    maxLength={10}
                  />
                </div>
              </div>

              {accountDetails?.accountVerified && !accountDetails?.accountLocked ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> After updating your account details, they will be verified and locked again for security. Please ensure the new details are correct.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> Once verified, your account
                    details will be locked and cannot be changed without
                    contacting our admin team. Please ensure the details are
                    correct.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={
                  verifying || !formData.accountNumber || !formData.bankCode
                }
                className="w-full h-12 text-lg font-semibold"
              >
                {verifying ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {accountDetails?.accountVerified && !accountDetails?.accountLocked 
                      ? "Updating Account..." 
                      : "Verifying Account..."}
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5 mr-2" />
                    {accountDetails?.accountVerified && !accountDetails?.accountLocked 
                      ? "Update Account" 
                      : "Verify Account"}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Account Change Request */}
      {/* Only show this section if account is locked (not unlocked after approval) */}
      {accountDetails?.accountVerified && accountDetails?.accountLocked && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#104901]">
              <Mail className="h-5 w-5" />
              Request Account Change
            </CardTitle>
            <CardDescription>
              Need to change your account details? Submit a request to our admin
              team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showChangeRequest ? (
              <div className="space-y-4">
                <Alert className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <AlertDescription>
                    Your account details are locked. To change them, you need to
                    submit a request to our admin team.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={() => setShowChangeRequest(true)}
                  className="h-12 text-lg font-semibold"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Request Account Change
                </Button>
              </div>
            ) : (
              <form onSubmit={handleRequestChange} className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="changeReason"
                    className="text-lg font-medium text-[#104901]"
                  >
                    Reason for Change
                  </Label>
                  <Textarea
                    id="changeReason"
                    placeholder="Please provide a detailed reason for changing your account details..."
                    value={changeRequestReason}
                    onChange={(e) => setChangeRequestReason(e.target.value)}
                    className="min-h-[120px] text-lg"
                    maxLength={500}
                  />
                  <p className="text-sm text-gray-600">
                    {changeRequestReason.length}/500 characters (minimum 10
                    required)
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowChangeRequest(false);
                      setChangeRequestReason("");
                    }}
                    className="flex-1 h-12 text-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={changeRequestReason.trim().length < 10}
                    className="flex-1 h-12 text-lg font-semibold"
                  >
                    <Mail className="h-5 w-5 mr-2" />
                    Submit Request
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* International Bank Account Section */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#104901]">
            <Globe className="h-5 w-5" />
            International Bank Account
          </CardTitle>
          <CardDescription>
            Add your international bank account details to receive payouts in foreign currencies (USD, EUR, GBP, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingInternational ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#104901]"></div>
            </div>
          ) : internationalAccountDetails?.internationalAccountVerified ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-600">International Account Verified</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Account Name</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-lg">{internationalAccountDetails.internationalAccountName}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Account Number</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    <span className="font-mono text-lg">{internationalAccountDetails.internationalBankAccountNumber}</span>
                  </div>
                </div>
                {internationalAccountDetails.internationalBankRoutingNumber && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Routing Number</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="font-mono text-lg">{internationalAccountDetails.internationalBankRoutingNumber}</span>
                    </div>
                  </div>
                )}
                {internationalAccountDetails.internationalBankSwiftBic && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">SWIFT/BIC</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <span className="font-mono text-lg">{internationalAccountDetails.internationalBankSwiftBic}</span>
                    </div>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-600">Bank Name</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="text-lg">{internationalAccountDetails.internationalBankName || "N/A"}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Country</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <span className="text-lg">{internationalAccountDetails.internationalBankCountry}</span>
                  </div>
                </div>
              </div>

              {internationalAccountDetails.internationalAccountVerificationDate && (
                <p className="text-sm text-gray-600">
                  Verified on: {new Date(internationalAccountDetails.internationalAccountVerificationDate).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSaveInternationalAccount} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-lg font-medium text-[#104901]">
                    Country <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={internationalFormData.country}
                    onValueChange={(value) => {
                      handleInternationalInputChange("country", value);
                      // Clear country-specific fields when country changes
                      if (value !== "US") handleInternationalInputChange("routingNumber", "");
                      if (value !== "GB") handleInternationalInputChange("sortCode", "");
                    }}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="GB">United Kingdom</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                      <SelectItem value="DE">Germany</SelectItem>
                      <SelectItem value="FR">France</SelectItem>
                      <SelectItem value="IT">Italy</SelectItem>
                      <SelectItem value="ES">Spain</SelectItem>
                      <SelectItem value="NL">Netherlands</SelectItem>
                      <SelectItem value="BE">Belgium</SelectItem>
                      <SelectItem value="CH">Switzerland</SelectItem>
                      <SelectItem value="IE">Ireland</SelectItem>
                      <SelectItem value="AT">Austria</SelectItem>
                      <SelectItem value="SE">Sweden</SelectItem>
                      <SelectItem value="NO">Norway</SelectItem>
                      <SelectItem value="DK">Denmark</SelectItem>
                      <SelectItem value="FI">Finland</SelectItem>
                      <SelectItem value="PL">Poland</SelectItem>
                      <SelectItem value="PT">Portugal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountName" className="text-lg font-medium text-[#104901]">
                    Account Holder Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="accountName"
                    type="text"
                    placeholder="Enter account holder name"
                    value={internationalFormData.accountName}
                    onChange={(e) => handleInternationalInputChange("accountName", e.target.value)}
                    className="h-12 text-lg"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankName" className="text-lg font-medium text-[#104901]">
                    Bank Name
                  </Label>
                  <Input
                    id="bankName"
                    type="text"
                    placeholder="e.g., Sterling Bank UK, Citi Bank US"
                    value={internationalFormData.bankName}
                    onChange={(e) => handleInternationalInputChange("bankName", e.target.value)}
                    className="h-12 text-lg"
                  />
                </div>

                {internationalFormData.country === "US" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="routingNumber" className="text-lg font-medium text-[#104901]">
                        Routing Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="routingNumber"
                        type="text"
                        placeholder="9-digit routing number"
                        value={internationalFormData.routingNumber}
                        onChange={(e) => handleInternationalInputChange("routingNumber", e.target.value)}
                        className="h-12 text-lg"
                        maxLength={9}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber" className="text-lg font-medium text-[#104901]">
                        Account Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="accountNumber"
                        type="text"
                        placeholder="Enter account number"
                        value={internationalFormData.accountNumber}
                        onChange={(e) => handleInternationalInputChange("accountNumber", e.target.value)}
                        className="h-12 text-lg"
                        required
                      />
                    </div>
                  </>
                )}

                {internationalFormData.country === "GB" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="sortCode" className="text-lg font-medium text-[#104901]">
                        Sort Code <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="sortCode"
                        type="text"
                        placeholder="6-digit sort code (e.g., 123456)"
                        value={internationalFormData.sortCode}
                        onChange={(e) => handleInternationalInputChange("sortCode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="h-12 text-lg"
                        maxLength={6}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber" className="text-lg font-medium text-[#104901]">
                        Account Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="accountNumber"
                        type="text"
                        placeholder="8-digit account number"
                        value={internationalFormData.accountNumber}
                        onChange={(e) => handleInternationalInputChange("accountNumber", e.target.value)}
                        className="h-12 text-lg"
                        maxLength={8}
                        required
                      />
                    </div>
                  </>
                )}

                {internationalFormData.country && 
                 internationalFormData.country !== "US" && 
                 internationalFormData.country !== "GB" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="iban" className="text-lg font-medium text-[#104901]">
                        IBAN or Account Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="iban"
                        type="text"
                        placeholder="Enter IBAN or account number"
                        value={internationalFormData.accountNumber}
                        onChange={(e) => {
                          handleInternationalInputChange("accountNumber", e.target.value);
                          handleInternationalInputChange("iban", e.target.value);
                        }}
                        className="h-12 text-lg"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="swiftBic" className="text-lg font-medium text-[#104901]">
                        SWIFT/BIC Code
                      </Label>
                      <Input
                        id="swiftBic"
                        type="text"
                        placeholder="e.g., CHASUS33"
                        value={internationalFormData.swiftBic}
                        onChange={(e) => handleInternationalInputChange("swiftBic", e.target.value.toUpperCase())}
                        className="h-12 text-lg"
                        maxLength={11}
                      />
                    </div>
                  </>
                )}
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Please ensure all bank account details are correct. 
                </AlertDescription>
              </Alert>

              <Button
                type="submit"
                disabled={savingInternational || !internationalFormData.accountNumber || !internationalFormData.country || !internationalFormData.accountName}
                className="w-full h-12 text-lg font-semibold"
              >
                {savingInternational ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Globe className="h-5 w-5 mr-2" />
                    Save International Bank Account
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="border-2 bg-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#104901]">
            <Phone className="h-5 w-5" />
            Need Help?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-4">
            If you&apos;re having trouble with account verification or need
            assistance with your account details, please contact our support
            team.
          </p>
          <div className="flex gap-4">
            <Button variant="outline">
              <Link
                href="mailto:campaigns@chainfundit.com"
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Email Support
              </Link>
            </Button>
            <Button variant="outline">
              <Link
                href="tel:+442038380360"
                className="flex items-center gap-2"
              >
                <Phone className="h-4 w-4" />
                Call Support
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Verification Confirmation Modal */}
      <Dialog
        open={showConfirmationModal}
        onOpenChange={setShowConfirmationModal}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#104901]">
              <Shield className="h-5 w-5" />
              Confirm Account Details
            </DialogTitle>
            <DialogDescription>
              Please verify that the account details below are correct before
              proceeding. Once confirmed, these details will be locked and
              cannot be changed without contacting our admin team.
            </DialogDescription>
          </DialogHeader>

          {verificationData && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Account Number
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-mono text-lg font-semibold">
                      {verificationData.accountNumber}
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Bank Name
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="text-lg font-semibold">
                      {verificationData.bankName}
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Account Name
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-lg font-semibold text-[#104901]">
                      {verificationData.accountName}
                    </span>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Please double-check that the
                  account name above matches your bank account. Once you
                  confirm, these details will be permanently saved and locked
                  for security purposes.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelVerification}
              className="flex-1 h-12 text-lg"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmVerification}
              disabled={verifying}
              className="flex-1 h-12 text-lg font-semibold"
            >
              {verifying ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Confirm & Save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payments;
