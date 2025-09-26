"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  DollarSign, 
  CreditCard, 
  Building2, 
  User, 
  Mail, 
  Clock, 
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  Send
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { toast } from 'sonner';

interface PayoutDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: {
    id: string;
    title: string;
    currency: string;
    currencyCode: string;
    totalRaised: number;
    totalRaisedInNGN: number;
    payoutProvider: string | null;
    payoutConfig: any;
    chainerDonations?: Array<{
      id: string;
      amount: string;
      currency: string;
      campaignTitle: string;
      createdAt: string;
    }>;
    chainerDonationsTotal?: number;
    chainerDonationsInNGN?: number;
    chainerCommissionRate?: number;
    chainerCommissionsTotal?: number;
    chainerCommissionsInNGN?: number;
  };
  userProfile?: {
    fullName: string;
    email: string;
    accountNumber?: string;
    bankName?: string;
    accountName?: string;
    accountVerified?: boolean;
  };
  onConfirmPayout: (campaignId: string, amount: number, currency: string, payoutProvider: string) => Promise<void>;
  isProcessing?: boolean;
}

export function PayoutDetailsModal({
  isOpen,
  onClose,
  campaign,
  userProfile,
  onConfirmPayout,
  isProcessing = false
}: PayoutDetailsModalProps) {
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);

  // Calculate fees and net amount
  const calculateFees = () => {
    const baseAmount = campaign.totalRaised;
    let feePercentage = 0;
    let fixedFee = 0;

    // Fee structure based on provider
    const provider = campaign.payoutProvider || 'default';
    switch (provider) {
      case 'stripe':
        feePercentage = 0.025; // 2.5%
        fixedFee = 0.30; // $0.30
        break;
      case 'paystack':
        feePercentage = 0.015; // 1.5%
        fixedFee = 0; // No fixed fee
        break;
      default:
        feePercentage = 0.02; // 2% default
        fixedFee = 0;
    }

    const percentageFee = baseAmount * feePercentage;
    const totalFees = percentageFee + fixedFee;
    const netAmount = baseAmount - totalFees;

    return {
      baseAmount,
      percentageFee,
      fixedFee,
      totalFees,
      netAmount,
      feePercentage: feePercentage * 100
    };
  };

  const fees = calculateFees();

  const handleConfirmPayout = async () => {
    try {
      await onConfirmPayout(
        campaign.id,
        campaign.totalRaised,
        campaign.currencyCode,
        campaign.payoutProvider || 'default'
      );
      setShowEmailConfirmation(true);
    } catch (error) {
      console.error('Payout confirmation error:', error);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'stripe':
        return <CreditCard className="h-5 w-5 text-blue-600" />;
      case 'paystack':
        return <Building2 className="h-5 w-5 text-green-600" />;
      default:
        return <DollarSign className="h-5 w-5 text-gray-600" />;
    }
  };

  if (showEmailConfirmation) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-green-600">
              <CheckCircle className="h-12 w-12 mx-auto mb-4" />
              Payout Request Submitted
            </DialogTitle>
            <DialogDescription className="text-center">
              Your payout request has been processed and a confirmation email has been sent to your registered email address.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">Check your email for:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Payout confirmation details</li>
                    <li>• Transaction reference number</li>
                    <li>• Estimated processing time</li>
                    <li>• Bank account verification status</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button 
                onClick={onClose} 
                className="flex-1"
                variant="outline"
              >
                Close
              </Button>
              <Button 
                onClick={() => window.open('mailto:', '_blank')}
                className="flex-1"
              >
                <Mail className="h-4 w-4 mr-2" />
                Open Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#104901]">
            Payout Details
          </DialogTitle>
          <DialogDescription>
            Review your payout details before confirming the request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Campaign Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-[#104901] flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Campaign Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Campaign:</span>
                <span className="text-right">{campaign.title}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Raised:</span>
                <div className="text-right">
                  <div className="font-semibold">
                    {formatCurrency(campaign.totalRaised, campaign.currencyCode)}
                  </div>
                  <div className="text-sm text-gray-500">
                    ₦{campaign.totalRaisedInNGN.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Payout Provider:</span>
                <div className="flex items-center gap-2">
                  {getProviderIcon(campaign.payoutProvider || 'default')}
                  <span className="capitalize">{campaign.payoutProvider || 'N/A'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chainer Payouts */}
          {campaign.chainerDonations && campaign.chainerDonations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-[#104901] flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Chainer Payouts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Chainer Donations:</span>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(campaign.chainerDonationsTotal || 0, campaign.currencyCode)}
                    </div>
                    <div className="text-sm text-gray-500">
                      ₦{campaign.chainerDonationsInNGN?.toLocaleString() || '0'}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Number of Donations:</span>
                  <span className="font-semibold">{campaign.chainerDonations.length}</span>
                </div>
                {campaign.chainerCommissionRate && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Commission Rate:</span>
                    <span className="font-semibold text-blue-600">{campaign.chainerCommissionRate}%</span>
                  </div>
                )}
                {campaign.chainerCommissionsTotal && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Commissions:</span>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        {formatCurrency(campaign.chainerCommissionsTotal, campaign.currencyCode)}
                      </div>
                      <div className="text-sm text-gray-500">
                        ₦{campaign.chainerCommissionsInNGN?.toLocaleString() || '0'}
                      </div>
                    </div>
                  </div>
                )}
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Recent Chainer Donations:</p>
                  {campaign.chainerDonations.slice(0, 3).map((donation) => {
                    const donationAmount = parseFloat(donation.amount);
                    const commissionAmount = campaign.chainerCommissionRate 
                      ? (donationAmount * campaign.chainerCommissionRate) / 100 
                      : 0;
                    
                    return (
                      <div key={donation.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                        <div>
                          <span className="font-medium">{donation.campaignTitle}</span>
                          <div className="text-xs text-gray-500">
                            {new Date(donation.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            {formatCurrency(donationAmount, donation.currency)}
                          </div>
                          {commissionAmount > 0 && (
                            <div className="text-xs text-blue-600">
                              Commission: {formatCurrency(commissionAmount, donation.currency)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {campaign.chainerDonations.length > 3 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{campaign.chainerDonations.length - 3} more donations
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fee Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-[#104901] flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Fee Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Gross Amount:</span>
                <span className="font-semibold">
                  {formatCurrency(fees.baseAmount, campaign.currencyCode)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  Platform Fee ({fees.feePercentage}%):
                </span>
                <span className="text-red-600">
                  -{formatCurrency(fees.percentageFee, campaign.currencyCode)}
                </span>
              </div>
              {fees.fixedFee > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Fixed Fee:</span>
                  <span className="text-red-600">
                    -{formatCurrency(fees.fixedFee, campaign.currencyCode)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-medium text-lg">Net Amount:</span>
                <span className="font-bold text-lg text-green-600">
                  {formatCurrency(fees.netAmount, campaign.currencyCode)}
                </span>
              </div>
              <div className="text-right text-sm text-gray-500">
                ₦{(fees.netAmount * (campaign.totalRaisedInNGN / campaign.totalRaised)).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          {/* Bank Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-[#104901] flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Bank Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {userProfile?.accountVerified ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Account Name:</span>
                    <div className="flex items-center gap-2">
                      <span>{userProfile.accountName || 'N/A'}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(userProfile.accountName || '', 'Account name')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Account Number:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{userProfile.accountNumber || 'N/A'}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(userProfile.accountNumber || '', 'Account number')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Bank Name:</span>
                    <span>{userProfile.bankName || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Account Verified
                    </Badge>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-3">
                    Bank account details not verified. Please complete your profile setup.
                  </p>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Complete Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Processing Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-[#104901] flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Processing Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Processing Time:</span>
                <span>{campaign.payoutConfig?.processingTime || '1-3 business days'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Payment Method:</span>
                <span className="capitalize">{campaign.payoutProvider || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Email Notification:</span>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">{userProfile?.email || 'N/A'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={onClose} 
              variant="outline" 
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmPayout}
              className="flex-1 bg-[#104901] text-white"
              disabled={isProcessing || !userProfile?.accountVerified || !campaign.payoutProvider}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Confirm Payout Request
                </>
              )}
            </Button>
          </div>

          {!userProfile?.accountVerified && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Account Verification Required</p>
                  <p>Please verify your bank account details in your profile settings before requesting a payout.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
