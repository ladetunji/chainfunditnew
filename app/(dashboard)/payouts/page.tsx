"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  CreditCard,
  Smartphone,
  ExternalLink,
  Info
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { getPayoutProvider, getPayoutConfig, isPayoutSupported } from '@/lib/payments/payout-config';
import { getCurrencyCode } from '@/lib/utils/currency';
import { toast } from 'sonner';

interface CampaignPayout {
  id: string;
  title: string;
  currency: string;
  currencyCode: string;
  targetAmount: number;
  currentAmount: number;
  totalRaised: number;
  status: string;
  createdAt: string;
  payoutSupported: boolean;
  payoutProvider: string | null;
  payoutConfig: any;
  availableForPayout: boolean;
}

interface PayoutData {
  campaigns: CampaignPayout[];
  totalAvailableForPayout: number;
  summary: {
    totalCampaigns: number;
    campaignsWithPayouts: number;
    totalRaised: number;
  };
}

const PayoutsPage = () => {
  const [payoutData, setPayoutData] = useState<PayoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPayouts, setProcessingPayouts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPayoutData();
  }, []);

  const fetchPayoutData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payouts');
      const result = await response.json();
      
      if (result.success) {
        setPayoutData(result.data);
      } else {
        setError(result.error || 'Failed to fetch payout data');
      }
    } catch (err) {
      setError('Failed to fetch payout data');
    } finally {
      setLoading(false);
    }
  };

  const handlePayout = async (campaign: CampaignPayout) => {
    try {
      setProcessingPayouts(prev => new Set(prev).add(campaign.id));
      
      const response = await fetch('/api/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: campaign.id,
          amount: campaign.totalRaised,
          currency: campaign.currency,
          payoutProvider: campaign.payoutProvider,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(result.data.message);
        // Refresh payout data
        await fetchPayoutData();
      } else {
        toast.error(result.error || 'Failed to process payout');
      }
    } catch (err) {
      toast.error('Failed to process payout');
    } finally {
      setProcessingPayouts(prev => {
        const newSet = new Set(prev);
        newSet.delete(campaign.id);
        return newSet;
      });
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'stripe':
        return <CreditCard className="h-5 w-5" />;
      case 'paystack':
        return <Smartphone className="h-5 w-5" />;
      default:
        return <DollarSign className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Payouts</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={fetchPayoutData} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!payoutData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16">
            <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Payout Data</h2>
            <p className="text-gray-600">Unable to load payout information.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#104901] mb-2">Payouts</h1>
          <p className="text-gray-600">
            Manage your campaign earnings and request payouts to your bank account.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#5F8555]">
                Total Raised
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-[#104901]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#104901]">
                {formatCurrency(payoutData.summary.totalRaised, 'USD')}
              </div>
              <p className="text-xs text-gray-500">
                Across {payoutData.summary.totalCampaigns} campaigns
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#5F8555]">
                Available for Payout
              </CardTitle>
              <DollarSign className="h-4 w-4 text-[#104901]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#104901]">
                {formatCurrency(payoutData.totalAvailableForPayout, 'USD')}
              </div>
              <p className="text-xs text-gray-500">
                {payoutData.summary.campaignsWithPayouts} campaigns ready
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#5F8555]">
                Payout Status
              </CardTitle>
              <Clock className="h-4 w-4 text-[#104901]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#104901]">
                {payoutData.summary.campaignsWithPayouts}
              </div>
              <p className="text-xs text-gray-500">
                Campaigns with available funds
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns List */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-[#104901]">Your Campaigns</h2>
          
          {payoutData.campaigns.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardContent className="text-center py-16">
                <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Campaigns Found</h3>
                <p className="text-gray-600 mb-6">
                  You don&apos;t have any campaigns yet. Create your first campaign to start receiving donations.
                </p>
                <Button asChild>
                  <a href="/create-campaign">Create Campaign</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            payoutData.campaigns.map((campaign) => (
              <Card key={campaign.id} className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-[#104901] mb-2">
                        {campaign.title}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Target: {formatCurrency(campaign.targetAmount, campaign.currencyCode)}</span>
                        <span>Raised: {formatCurrency(campaign.totalRaised, campaign.currencyCode)}</span>
                        <span>Progress: {Math.round((campaign.totalRaised / campaign.targetAmount) * 100)}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(campaign.status)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-[#104901] to-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((campaign.totalRaised / campaign.targetAmount) * 100, 100)}%` }}
                      ></div>
                    </div>

                    {/* Payout Information */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {campaign.payoutSupported ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-5 w-5" />
                            <span className="text-sm font-medium">
                              Payout Available: {formatCurrency(campaign.totalRaised, campaign.currencyCode)}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-500">
                            <AlertCircle className="h-5 w-5" />
                            <span className="text-sm">
                              Payout not supported for {campaign.currencyCode}
                            </span>
                          </div>
                        )}
                      </div>

                      {campaign.payoutSupported && campaign.totalRaised > 0 && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            {getProviderIcon(campaign.payoutProvider!)}
                            <span className="capitalize">{campaign.payoutProvider}</span>
                          </div>
                          <Button
                            onClick={() => handlePayout(campaign)}
                            disabled={processingPayouts.has(campaign.id)}
                            className="bg-[#104901] hover:bg-[#0d3a01] text-white"
                          >
                            {processingPayouts.has(campaign.id) ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Processing...
                              </>
                            ) : (
                              <>
                                Request Payout
                                <ExternalLink className="h-4 w-4 ml-2" />
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Payout Details */}
                    {campaign.payoutSupported && campaign.payoutConfig && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                          <div className="text-sm text-gray-600">
                            <p className="font-medium mb-1">{campaign.payoutConfig.name}</p>
                            <p className="mb-2">{campaign.payoutConfig.description}</p>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="font-medium">Processing Time:</span>
                                <br />
                                {campaign.payoutConfig.processingTime}
                              </div>
                              <div>
                                <span className="font-medium">Fees:</span>
                                <br />
                                {campaign.payoutConfig.fees}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PayoutsPage;