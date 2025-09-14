import React, { useState, useEffect } from 'react';
import Image from "next/image";
import { useDonations } from "@/hooks/use-dashboard";
import { formatCurrency } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertCircle, CreditCard, Smartphone, ChevronDown } from "lucide-react";
import { toast } from "sonner";

type Props = {};

const FailedDonations = (props: Props) => {
  console.log('FailedDonations component rendered');
  const [currentPage, setCurrentPage] = useState(1);
  const { donations, loading, error, pagination, refreshDonations } = useDonations('failed', currentPage);
  const [retryingDonations, setRetryingDonations] = useState<Set<string>>(new Set());
  const [hasShownAlert, setHasShownAlert] = useState(false);

  // Show alert when failed donations are detected
  useEffect(() => {
    if (!loading && donations.length > 0 && !hasShownAlert) {
      toast.error(`You have ${donations.length} failed donation${donations.length !== 1 ? 's' : ''} that need attention.`, {
        duration: 5000,
        action: {
          label: 'View Details',
          onClick: () => {
            // Scroll to failed donations section or focus on it
            const failedSection = document.querySelector('[data-failed-donations]');
            if (failedSection) {
              failedSection.scrollIntoView({ behavior: 'smooth' });
            }
          }
        }
      });
      setHasShownAlert(true);
    }
  }, [donations, loading, hasShownAlert]);

  const handleRetryDonation = async (donationId: string) => {
    setRetryingDonations(prev => new Set(prev).add(donationId));
    
    try {
      // Simulate retry by updating donation status to pending
      const response = await fetch(`/api/donations/${donationId}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Refresh the donations list
        await refreshDonations();
        toast.success("Retry initiated for donation. Please check back later.");
      } else {
        toast.error("Failed to retry donation. Please try again.");
      }
    } catch (error) {
      toast.error("An error occurred while retrying the donation. Please try again.");
    } finally {
      setRetryingDonations(prev => {
        const newSet = new Set(prev);
        newSet.delete(donationId);
        return newSet;
      });
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

  // The API already filters by 'failed' status, so we don't need to filter again
  const failedDonations = donations;

  if (failedDonations.length === 0) {
    return (
      <div className="flex flex-col gap-4 2xl:container 2xl:mx-auto">
        <div className="text-center py-8">
          <h3 className="font-semibold text-3xl text-[#104901] mb-4">
            No failed donations
          </h3>
          <p className="font-normal text-xl text-[#104901]">
            All payment attempts have been successful.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 2xl:container 2xl:mx-auto" data-failed-donations>
      <div className="mb-6">
        <h3 className="font-semibold text-3xl text-[#104901] mb-2">
          {failedDonations.length} failed donation{failedDonations.length !== 1 ? 's' : ''}
        </h3>
        <p className="font-normal text-xl text-[#104901]">
          These donations failed to process. You may want to contact the donors.
        </p>
      </div>

      {/* Failed Donations List */}
      <div className="space-y-4">
        {failedDonations.map((donation) => (
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
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-semibold">
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
                      <CreditCard className="h-3 w-3" />
                    ) : (
                      <Smartphone className="h-3 w-3" />
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
              
              <div className="text-right flex gap-3 items-center">
                <p className="font-bold text-lg text-[#104901]">
                  {formatCurrency(donation.amount, donation.currency)}
                </p>
                <Badge variant="default" className="bg-red-100 text-red-800 mt-1">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Failed
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 text-xs h-8"
                  onClick={() => handleRetryDonation(donation.id)}
                  disabled={retryingDonations.has(donation.id)}
                >
                  {retryingDonations.has(donation.id) ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {pagination && pagination.totalPages > pagination.page && (
        <div className="flex justify-center mt-6">
          <Button
            onClick={() => setCurrentPage(prev => prev + 1)}
            variant="outline"
            className="text-[#104901] border-[#104901] hover:bg-[#104901] hover:text-white"
          >
            Load More ({pagination.total - (pagination.page * pagination.limit)} remaining)
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Pagination Info */}
      {pagination && (
        <div className="text-center text-sm text-gray-500 mt-4">
          Showing {donations.length} of {pagination.total} failed donations
        </div>
      )}
    </div>
  );
};

export default FailedDonations;