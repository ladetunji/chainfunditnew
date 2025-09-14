import React, { useState } from "react";
import Image from "next/image";
import { useDonations } from "@/hooks/use-dashboard";
import { formatCurrency } from "@/lib/utils/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Smartphone, CheckCircle, ChevronDown } from "lucide-react";

type Props = {};

const ReceivedDonations = (props: Props) => {
  console.log('ReceivedDonations component rendered');
  const [currentPage, setCurrentPage] = useState(1);
  const { donations, loading, error, pagination, refreshDonations } = useDonations('completed', currentPage);

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

  // The API already filters by 'completed' status, so we don't need to filter again
  const receivedDonations = donations;
  const totalAmount = receivedDonations.reduce((sum, donation) => sum + donation.amount, 0);

  if (receivedDonations.length === 0) {
    return (
      <div className="flex flex-col gap-4 2xl:container 2xl:mx-auto">
        <section className="relative w-fit">
          <Image src="/images/frame.png" alt="" width={232} height={216} />
          <section
            className="absolute -top-5 -right-4 w-[70px] h-[78px] bg-white flex items-center justify-center font-bold text-[64px] text-[#C0BFC4] rounded-2xl"
            style={{ boxShadow: "0px 4px 10px 0px #00000040" }}
          >
            0
          </section>
        </section>

        <section>
          <h3 className="font-semibold text-3xl text-[#104901]">
            No donations received
          </h3>
          <p className="font-normal text-xl text-[#104901]">
            Keep sharing your campaigns on social media and offline channels to
            increase the success of your fundraiser.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 2xl:container 2xl:mx-auto">
      {/* <section className="relative w-fit">
        <Image src="/images/frame.png" alt="" width={232} height={216} />
        <section
          className="absolute -top-5 -right-4 w-[70px] h-[78px] bg-white flex items-center justify-center font-bold text-[64px] text-[#104901] rounded-2xl"
          style={{ boxShadow: "0px 4px 10px 0px #00000040" }}
        >
          {receivedDonations.length}
        </section>
      </section> */}

      <section>
        <h3 className="font-semibold text-3xl text-[#104901]">
          {receivedDonations.length} donation{receivedDonations.length !== 1 ? 's' : ''} received
        </h3>
        <p className="font-normal text-xl text-[#104901]">
          Total amount received: {formatCurrency(totalAmount, 'NGN')}
        </p>
      </section>

      {/* Donations List */}
      <div className="mt-6 space-y-4">
        {receivedDonations.map((donation) => (
          <div key={donation.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
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
                    <div className="w-10 h-10 bg-gradient-to-br from-[#104901] to-green-600 rounded-full flex items-center justify-center text-white font-semibold">
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
              
              <div className="text-right">
                <p className="font-bold text-lg text-[#104901]">
                  {formatCurrency(donation.amount, donation.currency)}
                </p>
                <Badge variant="default" className="bg-green-100 text-green-800 mt-1">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
                {donation.processedAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    Processed: {new Date(donation.processedAt).toLocaleDateString()}
                  </p>
                )}
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
          Showing {donations.length} of {pagination.total} donations
        </div>
      )}
    </div>
  );
};

export default ReceivedDonations;
