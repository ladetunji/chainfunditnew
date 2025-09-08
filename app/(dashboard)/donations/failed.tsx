import React, { useState, useEffect } from 'react';
import { useDonations } from "@/hooks/use-dashboard";
import { formatCurrency } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type Props = {};

const FailedDonations = (props: Props) => {
  const { donations, loading, error, refreshDonations } = useDonations('failed');
  const [retryingDonations, setRetryingDonations] = useState<Set<string>>(new Set());
  const [hasShownAlert, setHasShownAlert] = useState(false);

  // Show alert when failed donations are detected
  useEffect(() => {
    if (!loading && donations.length > 0) {
      const failedDonations = donations.filter(donation => donation.paymentStatus === 'failed');
      if (failedDonations.length > 0 && !hasShownAlert) {
        toast.error(`You have ${failedDonations.length} failed donation${failedDonations.length !== 1 ? 's' : ''} that need attention.`, {
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
        console.log(`Retry initiated for donation ${donationId}`);
      } else {
        toast.error("Failed to retry donation. Please try again.");
        console.error('Failed to retry donation');
      }
    } catch (error) {
      toast.error("An error occurred while retrying the donation. Please try again.");
      console.error('Error retrying donation:', error);
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

  const failedDonations = donations.filter(donation => donation.paymentStatus === 'failed');

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
          <div key={donation.id} className="bg-white rounded-lg p-4 shadow-sm border border-red-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {donation.isAnonymous ? 'A' : 'D'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#104901]">
                      {donation.isAnonymous ? 'Anonymous Donation' : 'Your Donation'}
                    </h4>
                    <p className="text-sm text-gray-600">{donation.campaignTitle}</p>
                  </div>
                </div>
                {donation.message && (
                  <p className="text-gray-700 text-sm mb-2">"{donation.message}"</p>
                )}
                <p className="text-xs text-gray-500">
                  {new Date(donation.createdAt).toLocaleDateString()} • {donation.paymentMethod}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-[#104901]">
                  {formatCurrency(donation.amount, donation.currency)}
                </p>
                <p className="text-xs text-red-600">✗ Failed</p>
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
    </div>
  );
};

export default FailedDonations;