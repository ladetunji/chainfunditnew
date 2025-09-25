import React, { useState } from 'react';
import Image from "next/image";
import { useDonations } from "@/hooks/use-dashboard";
import { formatCurrency } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Clock, AlertCircle, RotateCcw } from "lucide-react";
import { isDonationPending, getStatusMessage, getNextRetryTime } from "@/lib/utils/donation-status";

type Props = {};

const PendingDonations = (props: Props) => {
  const { donations, loading, error, refreshDonations } = useDonations('pending');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshDonations();
    } finally {
      setRefreshing(false);
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

  // Filter donations using enhanced pending logic
  const pendingDonations = donations.filter(donation => 
    isDonationPending(donation as any)
  );

  if (pendingDonations.length === 0) {
    return (
      <div className="flex flex-col gap-4 2xl:container 2xl:mx-auto">
        <div className="text-center py-8">
          <h3 className="font-semibold text-3xl text-[#104901] mb-4">
            No pending donations
          </h3>
          <p className="font-normal text-xl text-[#104901]">
            All your donations have been processed.
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
              {pendingDonations.length} pending donation{pendingDonations.length !== 1 ? 's' : ''}
            </h3>
            <p className="font-normal text-xl text-[#104901]">
              These donations are waiting for payment completion.
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

      {/* Pending Donations List */}
      <div className="space-y-4">
        {pendingDonations.map((donation) => (
          <div key={donation.id} className="bg-white rounded-lg p-6 shadow-sm border border-yellow-200 hover:shadow-md transition-shadow">
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
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
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
              </div>
              
              <div className="text-right">
                <p className="font-bold text-lg text-[#104901]">
                  {formatCurrency(donation.amount, donation.currency)}
                </p>
                <Badge variant="default" className="bg-yellow-100 text-yellow-800 mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
                <p className="text-xs text-gray-500 mt-1">
                  {getStatusMessage(donation as any)}
                </p>
                {donation.retryAttempts && donation.retryAttempts > 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    Retry attempt {donation.retryAttempts} of 3
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingDonations;