"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PayoutDetailsModal } from "@/components/payments/payout-details-modal";
import {
  PayoutSuccessModal,
  type PayoutSuccessData,
} from "@/components/payments/payout-success-modal";

import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Info,
  Send,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { toast } from "sonner";
import { useGeolocation, useCurrencyConversion } from "@/hooks/use-geolocation";
import {
  fetchUserProfile,
  fetchPayoutData,
  fetchCampaignDetails,
  // requestPayout,
  type CampaignPayout,
  type PayoutData,
} from "@/app/utils/api/payouts"

const REQUEST_PAYOUT_TIMEOUT_MS = 15000;

async function requestPayout(params: any): Promise<any> {
  const { campaignId, amount, currency, payoutProvider } = params;
  
  try {
    const abortController = new AbortController();
    const timeoutId = window.setTimeout(
      () => abortController.abort(),
      REQUEST_PAYOUT_TIMEOUT_MS
    );

    try {
      const response = await fetch("/api/payouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId,
          amount,
          currency,
          payoutProvider,
        }),
        signal: abortController.signal,
      });

    // Handle non-OK responses
      if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Failed to process payout" }));
      

      if (response.status === 409 && errorData.existingPayout) {
        return {
          success: false,
          error: errorData.error,
          existingPayout: errorData.existingPayout,
        };
      }

      return {
        success: false,
        error: errorData.error || `Server error: ${response.status}`,
      };
    }

      // Parse successful response
      const result = await response.json();

      if (result.success) {
      return {
        success: true,
        data: result.data,
      };
      } else {
        return {
          success: false,
          error: result.error || "Failed to process payout",
        };
      }
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    
    // Handle timeout errors
    if (error instanceof Error && error.name === "AbortError") {
      return {
        success: false,
        error: "Request timeout. The server took too long to respond.",
      };
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return {
        success: false,
        error: "Network error. Please check your connection.",
      };
    }

    // Generic error handler
    const errorMessage =
      error instanceof Error ? error.message : "Failed to process payout";
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}


const PayoutsPage = () => {
  const [payoutData, setPayoutData] = useState<PayoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPayouts, setProcessingPayouts] = useState<Set<string>>(
    new Set()
  );
  const [selectedCampaign, setSelectedCampaign] =
    useState<CampaignPayout | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [payoutSuccessData, setPayoutSuccessData] =
    useState<PayoutSuccessData | null>(null);

  // Get user's geolocation and currency conversion capabilities
  const { geolocation, loading: geolocationLoading } = useGeolocation();
  const { formatAmount, loading: conversionLoading } =
    useCurrencyConversion(geolocation);

  useEffect(() => {
    loadPayoutData();
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    const profile = await fetchUserProfile();
    if (profile) {
      setUserProfile(profile);
    }
  };

  const loadPayoutData = async () => {
    try {
      setLoading(true);
      const { data, error } = await fetchPayoutData();
      if (data) {
        setPayoutData(data);
      } else {
        setError(error || "Failed to fetch payout data");
      }
    } catch (err) {
      setError("Failed to fetch payout data");
    } finally {
      setLoading(false);
    }
  };

  const handlePayoutClick = async (campaign: CampaignPayout) => {
    try {
      const chainerDonations =
        payoutData?.chainerDonations?.filter(
          (donation) => donation.campaignId === campaign.id
        ) || [];

      const campaignDetails = await fetchCampaignDetails(campaign.id);
      const commissionRate = campaignDetails
        ? Number(campaignDetails.chainerCommissionRate)
        : 0;

      const chainerDonationsTotal = chainerDonations.reduce(
        (sum, d) => sum + parseFloat(d.amount),
        0
      );
      const chainerCommissionsTotal = chainerDonations.reduce((sum, d) => {
        const commissionEarned = (d as any).chainerCommissionEarned;

        if (commissionEarned && parseFloat(commissionEarned) > 0) {
          return sum + parseFloat(commissionEarned);
        }
        const calculatedCommission =
          parseFloat(d.amount) * (commissionRate / 100);
        return sum + calculatedCommission;
      }, 0);

      const enhancedCampaign = {
        ...campaign,
        chainerDonations,
        chainerDonationsTotal,
        chainerDonationsInNGN: chainerDonations.reduce((sum, d) => {
          const amount = parseFloat(d.amount);
          return sum + (d.currency === "NGN" ? amount : amount * 0.001);
        }, 0),
        chainerCommissionRate: commissionRate,
        chainerCommissionsTotal,
        chainerCommissionsInNGN:
          campaign.totalRaised > 0
            ? chainerCommissionsTotal *
              (campaign.totalRaisedInNGN / campaign.totalRaised)
            : 0,
      };

      setSelectedCampaign(enhancedCampaign);
      setShowPayoutModal(true);
    } catch (error) {
      setSelectedCampaign(campaign);
      setShowPayoutModal(true);
    }
  };

  const handleConfirmPayout = async (
    campaignId: string,
    amount: number,
    currency: string,
    payoutProvider: string
  ) => {
    const campaignTitle = selectedCampaign?.title;
    const loadingToastId = toast.loading("Submitting payout request...");

    setProcessingPayouts((prev) => new Set(prev).add(campaignId));
    setShowPayoutModal(false);
    setSelectedCampaign(null);

    try {
      const result = await requestPayout({
        campaignId,
        amount,
        currency,
        payoutProvider,
      });

      if (result.success && result.data) {
        toast.success(result.data.message);
        setPayoutSuccessData({
          ...result.data,
          campaignTitle,
        });
        setShowSuccessModal(true);
        setTimeout(() => {
          loadPayoutData().catch((err) =>
            toast.error("Failed to refresh payout data: " + err)
          );
        }, 500);
      } else {
        let errorMessage = result.error || "Failed to process payout";

        if (result.existingPayout) {
          const existing = result.existingPayout;
          errorMessage =
            `${result.error}\n\n` +
            `Existing Request Details:\n` +
            `- Status: ${existing.status}\n` +
            `- Amount: ${formatCurrency(
              parseFloat(existing.requestedAmount),
              currency
            )}\n` +
            `- Requested: ${new Date(existing.createdAt).toLocaleDateString()}`;
        }

        setShowSuccessModal(false);
        setPayoutSuccessData(null);
        toast.error(errorMessage);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to process payout";
      setShowSuccessModal(false);
      setPayoutSuccessData(null);
      toast.error(errorMessage);
    } finally {
      toast.dismiss(loadingToastId);
      setProcessingPayouts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(campaignId);
        return newSet;
      });
    }
  };

  const CurrencyDisplay = ({
    amount,
    currency,
  }: {
    amount: number;
    currency: string;
  }) => {
    const [formattedAmount, setFormattedAmount] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const formatCurrencyWithConversion = async () => {
        // Validate amount - handle NaN, null, undefined
        const validAmount =
          typeof amount === "number" && !isNaN(amount) && isFinite(amount)
            ? amount
            : 0;

        if (!geolocation) {
          setFormattedAmount(formatCurrency(validAmount, currency));
          setIsLoading(false);
          return;
        }

        try {
          const result = await formatAmount(validAmount, currency);
          if (
            result.originalAmount &&
            result.originalCurrency &&
            result.originalCurrency !== result.currency
          ) {
            setFormattedAmount(
              `${formatCurrency(
                result.amount,
                result.currency
              )} (${formatCurrency(
                result.originalAmount,
                result.originalCurrency
              )})`
            );
          } else {
            setFormattedAmount(formatCurrency(result.amount, result.currency));
          }
        } catch (error) {
          setFormattedAmount(formatCurrency(validAmount, currency));
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

  const renderActivePayoutNotice = (campaign: CampaignPayout) => {
    if (!campaign.activePayout) {
      return null;
    }

    const { status } = campaign.activePayout;

    if (status === "approved") {
      return (
        <div className="flex items-center gap-2 text-green-600 my-2">
          <CheckCircle className="h-5 w-5" />
          <span className="text-sm font-medium">
            Payout approved! Your funds are on the way.
          </span>
        </div>
      );
    }

    if (status === "processing") {
      return (
        <div className="flex items-center gap-2 text-green-600 my-2">
          <Send className="h-5 w-5" />
          <span className="text-sm">
            Payout is being processed. We&apos;ll notify you once it lands.
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-gray-500 my-2">
        <Clock className="h-5 w-5" />
        <span className="text-sm">
          Payout request submitted. Awaiting approval.
        </span>
      </div>
    );
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "stripe":
        return (
          <Image src="/icons/stripe.png" alt="Stripe" width={16} height={16} />
        );
      case "paystack":
        return (
          <Image
            src="/icons/paystack.png"
            alt="Paystack"
            width={16}
            height={16}
          />
        );
      default:
        return <DollarSign className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-800 capitalize"
          >
            Active
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="default"
            className="bg-blue-100 text-blue-800 capitalize"
          >
            Completed
          </Badge>
        );
      case "paused":
        return (
          <Badge variant="secondary" className="capitalize">
            Paused
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error Loading Payouts
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={loadPayoutData} variant="outline">
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Payout Data
            </h2>
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
            Manage your campaign earnings and request payouts to your bank
            account.
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
                {payoutData.summary.totalCampaigns} campaign
                {payoutData.summary.totalCampaigns !== 1 ? "s" : ""} •{" "}
                {payoutData.summary.campaignsWithPayouts} ready for payout
              </p>
              {Object.keys(payoutData.currencyBreakdown).length > 1 && (
                <div className="mt-2 text-sm text-[#104901] opacity-70">
                  <p className="font-medium">Currency Breakdown:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.entries(payoutData.currencyBreakdown).map(
                      ([currency, amount]) => (
                        <span
                          key={currency}
                          className="bg-white bg-opacity-50 px-2 py-1 rounded text-xs"
                        >
                          {currency}: {formatCurrency(amount, currency)}
                        </span>
                      )
                    )}
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

        {/* Chainer Donations Section */}
        {/* {payoutData.chainerDonations.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#104901] mb-2">
                    Chainer Donations
                  </h2>
                  <p className="text-lg text-[#104901] opacity-80">
                    {payoutData.summary.chainerDonationsCount} donation{payoutData.summary.chainerDonationsCount !== 1 ? 's' : ''} earned through referrals
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-[#104901]">
                    ₦{payoutData.chainerDonationsInNGN.toLocaleString()}
                  </p>
                  <p className="text-sm text-[#104901] opacity-60">
                    Total Earned (NGN)
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {payoutData.chainerDonations.map((donation) => (
                <Card key={donation.id} className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-[#104901] truncate">
                      {donation.campaignTitle}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      {new Date(donation.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-[#104901]">
                          {formatCurrency(parseFloat(donation.amount), donation.currency)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {donation.currency} • {donation.paymentStatus}
                        </p>
                      </div>
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )} */}

        {/* Campaigns List */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-[#104901]">
            Your Campaigns
          </h2>

          {payoutData.campaigns.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardContent className="text-center py-16">
                <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Campaigns Found
                </h3>
                <p className="text-gray-600 mb-6">
                  You don&apos;t have any campaigns yet. Create your first
                  campaign to start receiving donations.
                </p>
                <Button asChild>
                  <a href="/create-campaign">Create Campaign</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            payoutData.campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-[#104901] mb-2">
                        {campaign.title}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>
                          Target:{" "}
                          <CurrencyDisplay
                            amount={campaign.targetAmount}
                            currency={campaign.currencyCode}
                          />
                        </span>
                        <span>
                          Raised:{" "}
                          <CurrencyDisplay
                            amount={campaign.totalRaised}
                            currency={campaign.currencyCode}
                          />{" "}
                          (₦{campaign.totalRaisedInNGN.toLocaleString()})
                        </span>
                        <span>
                          Progress:{" "}
                          {campaign.targetAmount > 0
                            ? Math.round(
                                (campaign.totalRaised / campaign.targetAmount) *
                                  100
                              )
                            : 0}
                          %
                        </span>
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
                        style={{
                          width: `${Math.min(
                            campaign.targetAmount > 0
                              ? (campaign.totalRaised / campaign.targetAmount) *
                                  100
                              : 0,
                            100
                          )}%`,
                        }}
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
                              Payout Available:{" "}
                              <CurrencyDisplay
                                amount={campaign.availableAmount || 0}
                                currency={campaign.currencyCode}
                              />{" "}
                              (₦
                              {(
                                campaign.availableAmountInNGN ?? 0
                              ).toLocaleString()}
                              )
                            </span>
                          </div>
                        )}
                      </div>

                      {campaign.payoutSupported &&
                        campaign.availableForPayout &&
                        (campaign.availableAmount || 0) > 0 && (
                        <div className="flex items-center gap-3 my-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            {getProviderIcon(campaign.payoutProvider!)}
                            <span className="capitalize">
                              {campaign.payoutProvider}
                            </span>
                          </div>
                          <Button
                            onClick={() => handlePayoutClick(campaign)}
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

                      {campaign.payoutSupported &&
                        !campaign.availableForPayout &&
                        renderActivePayoutNotice(campaign)}

                      {campaign.payoutSupported &&
                        (campaign.availableAmount || 0) <= 0 &&
                        campaign.totalRaised > 0 && (
                          <div className="flex items-center gap-2 text-gray-500 my-2">
                            <AlertCircle className="h-5 w-5" />
                            <span className="text-sm">
                              All available funds have been paid out. New
                              donations will unlock your next payout.
                            </span>
                          </div>
                        )}

                      {campaign.payoutSupported &&
                        campaign.totalRaised === 0 && (
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
                            <p className="font-medium mb-1">
                              {campaign.payoutConfig.name}
                            </p>
                            <p className="mb-2">
                              {campaign.payoutConfig.description}
                            </p>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="font-medium">
                                  Processing Time:
                                </span>
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

        {/* Payout Details Modal */}
        {selectedCampaign && selectedCampaign.payoutProvider && (
          <PayoutDetailsModal
            isOpen={showPayoutModal}
            onClose={() => {
              setShowPayoutModal(false);
              setSelectedCampaign(null);
            }}
            campaign={selectedCampaign}
            userProfile={userProfile}
            onConfirmPayout={handleConfirmPayout}
            isProcessing={processingPayouts.has(selectedCampaign.id)}
          />
        )}
      <PayoutSuccessModal
        isOpen={showSuccessModal}
        data={payoutSuccessData}
        onClose={() => {
          setShowSuccessModal(false);
          setTimeout(() => setPayoutSuccessData(null), 200);
        }}
      />
      </div>
    </div>
  );
};

export default PayoutsPage;
