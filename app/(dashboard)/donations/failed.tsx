import React from 'react';
import { useDonations } from "@/hooks/use-dashboard";

type Props = {};

const FailedDonations = (props: Props) => {
  const { donations, loading, error } = useDonations('failed');

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
    <div className="flex flex-col gap-4 2xl:container 2xl:mx-auto">
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
                  ${donation.amount.toFixed(2)}
                </p>
                <p className="text-xs text-red-600">✗ Failed</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FailedDonations;