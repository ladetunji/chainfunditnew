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
import { useGeolocation, useCurrencyConversion } from '@/hooks/use-geolocation';

interface CampaignPayout {
  id: string;
  title: string;
  currency: string;
  currencyCode: string;
  targetAmount: number;
  currentAmount: number;
  totalRaised: number;
  totalRaisedInNGN: number; // Amount in Naira
  status: string;
  createdAt: string;
  payoutSupported: boolean;
  payoutProvider: string | null;
  payoutConfig: any;
  goalProgress: number;
  hasReached50Percent: boolean;
  availableForPayout: boolean;
  donationsByStatus?: Array<{
    status: string;
    total: string;
    count: string;
  }>;
}

interface PayoutData {
  campaigns: CampaignPayout[];
  totalAvailableForPayout: number;
  totalAvailableForPayoutInNGN: number; // Total available in Naira
  totalRaisedInNGN: number; // Total raised in Naira
  currencyBreakdown: { [key: string]: number }; // Breakdown by original currency
  summary: {
    totalCampaigns: number;
    campaignsWithPayouts: number;
    totalRaised: number;
    totalRaisedInNGN: number; // Total raised in Naira
  };
}

const PayoutsPage = () => {
  const [payoutData, setPayoutData] = useState<PayoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPayouts, setProcessingPayouts] = useState<Set<string>>(new Set());
  
  // Get user's geolocation and currency conversion capabilities
  const { geolocation, loading: geolocationLoading } = useGeolocation();
  const { formatAmount, loading: conversionLoading } = useCurrencyConversion(geolocation);

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
        // Handle specific 50% requirement error
        if (result.error && result.error.includes('50%')) {
          toast.error(result.error, {
            description: result.details ? 
              `Current progress: ${result.details.currentProgress}% (Needs ${result.details.requiredProgress}%)` : 
              undefined,
            duration: 6000
          });
        } else {
          toast.error(result.error || 'Failed to process payout');
        }
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

  // Component for async currency formatting
  const CurrencyDisplay = ({ amount, currency }: { amount: number; currency: string }) => {
    const [formattedAmount, setFormattedAmount] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const formatCurrencyWithConversion = async () => {
        if (!geolocation) {
          setFormattedAmount(formatCurrency(amount, currency));
          setIsLoading(false);
          return;
        }
        
        try {
          const result = await formatAmount(amount, currency);
          if (result.originalAmount && result.originalCurrency && result.originalCurrency !== result.currency) {
            setFormattedAmount(`${formatCurrency(result.amount, result.currency)} (${formatCurrency(result.originalAmount, result.originalCurrency)})`);
          } else {
            setFormattedAmount(formatCurrency(result.amount, result.currency));
          }
        } catch (error) {
          console.error('Currency conversion error:', error);
          setFormattedAmount(formatCurrency(amount, currency));
        } finally {
          setIsLoading(false);
        }
      };

      formatCurrencyWithConversion();
    }, [amount, currency, geolocation, formatAmount]);

    if (isLoading) {
      return <span className="animate-pulse">...</span>;
    }

    return <span>{formattedAmount}</span>;
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
        return <Badge variant="default" className="bg-green-100 text-green-800 capitalize">Active</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-blue-100 text-blue-800 capitalize">Completed</Badge>;
      case 'paused':
        return <Badge variant="secondary" className="capitalize">Paused</Badge>;
      default:
        return <Badge variant="outline">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
    }
  };

  if (loading || geolocationLoading) {
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#104901] mb-2">Payouts</h1>
          <p className="text-gray-600 mb-4">
            Manage your campaign earnings and request payouts to your bank account.
          </p>
        </div>

        {/* Summary Section */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#104901] mb-2">
                Payouts Summary
              </h2>
              <p className="text-lg text-[#104901] opacity-80">
                {payoutData.summary.totalCampaigns} campaign{payoutData.summary.totalCampaigns !== 1 ? 's' : ''} • {payoutData.summary.campaignsWithPayouts} ready for payout
              </p>
              {Object.keys(payoutData.currencyBreakdown).length > 1 && (
                <div className="mt-2 text-sm text-[#104901] opacity-70">
                  <p className="font-medium">Currency Breakdown:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.entries(payoutData.currencyBreakdown).map(([currency, amount]) => (
                      <span key={currency} className="bg-white bg-opacity-50 px-2 py-1 rounded text-xs">
                        {currency}: {formatCurrency(amount, currency)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[#104901]">
                ₦{payoutData.totalRaisedInNGN.toLocaleString()}
              </p>
              <p className="text-sm text-[#104901] opacity-60">
                Total Raised (NGN)
              </p>
              <p className="text-xl font-semibold text-[#104901] mt-2">
                ₦{payoutData.totalAvailableForPayoutInNGN.toLocaleString()}
              </p>
              <p className="text-xs text-[#104901] opacity-60">
                Available for Payout
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#5F8555]">
                Total Raised (NGN)
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-[#104901]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#104901]">
                ₦{payoutData.summary.totalRaisedInNGN.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500">
                Across {payoutData.summary.totalCampaigns} campaigns
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#5F8555]">
                Available for Payout (NGN)
              </CardTitle>
              <DollarSign className="h-4 w-4 text-[#104901]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#104901]">
                ₦{payoutData.totalAvailableForPayoutInNGN.toLocaleString()}
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
                        <span>Target: <CurrencyDisplay amount={campaign.targetAmount} currency={campaign.currencyCode} /></span>
                        <span>Raised: <CurrencyDisplay amount={campaign.totalRaised} currency={campaign.currencyCode} /> (₦{campaign.totalRaisedInNGN.toLocaleString()})</span>
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
                    <div className="w-full bg-gray-200 rounded-full h-2 relative">
                      <div 
                        className="bg-gradient-to-r from-[#104901] to-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((campaign.totalRaised / campaign.targetAmount) * 100, 100)}%` }}
                      ></div>
                      {/* Progress percentage text */}
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Payout Information */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 mt-2">
                        {!campaign.payoutSupported ? (
                          <div className="flex items-center gap-2 text-gray-500">
                            <AlertCircle className="h-5 w-5" />
                            <span className="text-sm">
                              Payout not supported for {campaign.currencyCode}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-green-600 my-2">
                            <CheckCircle className="h-5 w-5" />
                            <span className="text-sm font-medium">
                              Payout Available: <CurrencyDisplay amount={campaign.totalRaised} currency={campaign.currencyCode} /> (₦{campaign.totalRaisedInNGN.toLocaleString()})
                            </span>
                          </div>
                        )}
                      </div>

                      {campaign.payoutSupported && campaign.totalRaised > 0 && (
                        <div className="flex items-center gap-3 my-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            {getProviderIcon(campaign.payoutProvider!)}
                            <span className="capitalize">{campaign.payoutProvider}</span>
                          </div>
                          <Button
                            onClick={() => handlePayout(campaign)}
                            disabled={processingPayouts.has(campaign.id)}
                            className="mt-2 bg-[#104901] text-white"
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
                      
                      {campaign.payoutSupported && campaign.totalRaised === 0 && (
                        <div className="flex items-center gap-2 text-gray-500 my-2">
                          <AlertCircle className="h-5 w-5" />
                          <span className="text-sm">
                            No donations received yet - payout not available
                          </span>
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