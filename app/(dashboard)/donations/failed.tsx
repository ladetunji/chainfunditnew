import React, { useState } from 'react';
import Image from "next/image";
import { useDonations } from "@/hooks/use-dashboard";
import { formatCurrency } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, XCircle, RotateCcw, AlertTriangle } from "lucide-react";
import { isDonationFailed, getStatusMessage, isRetryable, getNextRetryTime } from "@/lib/utils/donation-status";

type Props = {};

const FailedDonations = (props: Props) => {
  const { donations, loading, error, refreshDonations } = useDonations('failed');
  const [refreshing, setRefreshing] = useState(false);
  const [retryingDonation, setRetryingDonation] = useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshDonations();
    } finally {
      setRefreshing(false);
    }
  };

  const handleRetryPayment = async (donationId: string) => {
    setRetryingDonation(donationId);
    try {
      const response = await fetch('/api/payments/retry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ donationId }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Refresh donations to show updated status
        await refreshDonations();
      } else {
        console.error('Retry failed:', result.error);
        // TODO: Show error toast
      }
    } catch (error) {
      console.error('Retry error:', error);
      // TODO: Show error toast
    } finally {
      setRetryingDonation(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 2xl:container 2xl:mx-auto">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 2xl:container 2xl:mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Error loading donations: {error}
        </div>
      </div>
    );
  }

  // Filter donations using enhanced failed logic
  const failedDonations = donations.filter(donation => 
    isDonationFailed(donation as any)
  );

  if (failedDonations.length === 0) {
    return (
      <div className="flex flex-col gap-4 2xl:container 2xl:mx-auto">
        <div className="text-center py-8">
          <h3 className="font-semibold text-3xl text-[#104901] mb-4">
            No failed donations
          </h3>
          <p className="font-normal text-xl text-[#104901]">
            All your donations have been processed successfully.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 2xl:container 2xl:mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-3xl text-[#104901] mb-2">
              {failedDonations.length} failed donation{failedDonations.length !== 1 ? 's' : ''}
            </h3>
            <p className="font-normal text-xl text-[#104901]">
              These donations could not be processed successfully.
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Failed Donations List */}
      <div className="space-y-4">
        {failedDonations.map((donation) => {
          const canRetry = isRetryable(donation as any);
          const nextRetryTime = getNextRetryTime(donation as any);
          
          return (
            <div key={donation.id} className="bg-white rounded-lg p-6 shadow-sm border border-red-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {donation.donorAvatar ? (
                      <Image
                        src={donation.donorAvatar}
                        alt={donation.isAnonymous ? 'Anonymous' : donation.donorName || 'Donor'}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {donation.isAnonymous ? 'A' : (donation.donorName?.[0] || 'D').toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-[#104901]">
                        {donation.isAnonymous ? 'Anonymous Donation' : (donation.donorName || 'Donor')}
                      </h4>
                      <p className="text-sm text-gray-600">{donation.campaignTitle}</p>
                    </div>
                  </div>
                  
                  {donation.message && (
                    <p className="text-gray-700 text-sm mb-3 italic">&ldquo;{donation.message}&rdquo;</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{new Date(donation.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      {donation.paymentProvider === 'stripe' ? (
                        <Image src='/icons/stripe.png' alt='Stripe' width={16} height={16}/>
                      ) : (
                        <Image src='/icons/paystack.png' alt='Paystack' width={16} height={16}/>
                      )}
                      <span className="capitalize">{donation.paymentProvider}</span>
                    </div>
                    {donation.transactionId && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-xs">#{donation.transactionId.slice(-8)}</span>
                      </>
                    )}
                  </div>
                  
                  {donation.failureReason && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      <div className="flex items-center gap-1 mb-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="font-medium">Failure Reason:</span>
                      </div>
                      <span>{donation.failureReason}</span>
                    </div>
                  )}
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-lg text-[#104901]">
                    {formatCurrency(donation.amount, donation.currency)}
                  </p>
                  <Badge variant="destructive" className="mt-1">
                    <XCircle className="h-3 w-3 mr-1" />
                    Failed
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {getStatusMessage(donation as any)}
                  </p>
                  
                  {canRetry ? (
                    <Button
                      onClick={() => handleRetryPayment(donation.id)}
                      disabled={retryingDonation === donation.id}
                      size="sm"
                      variant="outline"
                      className="mt-2 text-xs"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      {retryingDonation === donation.id ? 'Retrying...' : 'Retry Payment'}
                    </Button>
                  ) : nextRetryTime ? (
                    <p className="text-xs text-orange-600 mt-2">
                      Can retry after {nextRetryTime.toLocaleDateString()}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-2">
                      Cannot retry
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FailedDonations;