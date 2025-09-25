"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Phone
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAccountManagement } from '@/hooks/use-account-management';
import { toast } from 'sonner';

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
  } = useAccountManagement();

  const [formData, setFormData] = useState({
    accountNumber: '',
    bankCode: '',
  });

  const [changeRequestReason, setChangeRequestReason] = useState('');
  const [showChangeRequest, setShowChangeRequest] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVerifyAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.accountNumber || !formData.bankCode) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/account/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          accountNumber: formData.accountNumber, 
          bankCode: formData.bankCode 
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Account verification failed');
      }

      toast.success(result.message || 'Account verified successfully!');
      setFormData({ accountNumber: '', bankCode: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Account verification failed');
    }
  };


  const handleRequestChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!changeRequestReason.trim() || changeRequestReason.trim().length < 10) {
      toast.error('Please provide a detailed reason (minimum 10 characters)');
      return;
    }

    try {
      const result = await requestAccountChange(changeRequestReason);
      toast.success(result.message || 'Account change request submitted!');
      setChangeRequestReason('');
      setShowChangeRequest(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Account change request failed');
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
        <h4 className="font-semibold text-3xl text-[#104901] mb-2">Payment Settings</h4>
        <p className="font-normal text-xl text-[#104901] opacity-80">
          Manage your bank account details for receiving payouts and commissions.
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
                {accountDetails.accountVerified ? 'Account Verified' : 'Account Not Verified'}
              </span>
            </div>

            {accountDetails.accountLocked && (
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-orange-600">Account Details Locked</span>
              </div>
            )}

            {accountDetails.accountChangeRequested && (
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-600">Change Request Pending</span>
              </div>
            )}

            {accountDetails.accountVerified && accountDetails.accountVerificationDate && (
              <p className="text-sm text-gray-600">
                Verified on: {new Date(accountDetails.accountVerificationDate).toLocaleDateString()}
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
                <Label className="text-sm font-medium text-gray-600">Account Number</Label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-mono text-lg">{accountDetails.accountNumber}</span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Account Name</Label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-lg">{accountDetails.accountName}</span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Bank Name</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="text-lg">{accountDetails.bankName}</span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Bank Code</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="font-mono text-lg">{accountDetails.bankCode}</span>
                </div>
              </div>
            </div>

            {accountDetails.accountLocked && (
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  Your account details are locked and cannot be changed. If you need to update your account details, please contact our admin team.
                </AlertDescription>
              </Alert>
            )}
           
          </CardContent>
        </Card>
      )}

      {/* Account Verification Form */}
      {!accountDetails?.accountVerified && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#104901]">
              <Shield className="h-5 w-5" />
              Verify Bank Account
            </CardTitle>
            <CardDescription>
              Verify your bank account details to receive payouts and commissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyAccount} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="bankCode" className="text-lg font-medium text-[#104901]">
                    Select Bank
                  </Label>
                  <Select
                    value={formData.bankCode}
                    onValueChange={(value) => handleInputChange('bankCode', value)}
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
                  <Label htmlFor="accountNumber" className="text-lg font-medium text-[#104901]">
                    Account Number
                  </Label>
                  <Input
                    id="accountNumber"
                    type="text"
                    placeholder="Enter your account number"
                    value={formData.accountNumber}
                    onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                    className="h-12 text-lg"
                    maxLength={10}
                  />
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Once verified, your account details will be locked and cannot be changed without contacting our admin team. Please ensure the details are correct.
                </AlertDescription>
              </Alert>

              <Button
                type="submit"
                disabled={verifying || !formData.accountNumber || !formData.bankCode}
                className="w-full h-12 text-lg font-semibold"
              >
                {verifying ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Verifying Account...
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5 mr-2" />
                    Verify Account
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Account Change Request */}
      {accountDetails?.accountVerified && accountDetails.accountLocked && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#104901]">
              <Mail className="h-5 w-5" />
              Request Account Change
            </CardTitle>
            <CardDescription>
              Need to change your account details? Submit a request to our admin team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showChangeRequest ? (
              <div className="space-y-4">
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertDescription>
                    Your account details are locked for security. To change them, you need to submit a request to our admin team.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={() => setShowChangeRequest(true)}
                  className="w-full h-12 text-lg font-semibold"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Request Account Change
                </Button>
              </div>
            ) : (
              <form onSubmit={handleRequestChange} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="changeReason" className="text-lg font-medium text-[#104901]">
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
                    {changeRequestReason.length}/500 characters (minimum 10 required)
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowChangeRequest(false);
                      setChangeRequestReason('');
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
            If you're having trouble with account verification or need assistance with your account details, please contact our support team.
          </p>
          <div className="flex gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Support
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Call Support
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default Payments;