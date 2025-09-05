import React from "react";
import Image from "next/image";
import { useDonations } from "@/hooks/use-dashboard";

type Props = {};

const ReceivedDonations = (props: Props) => {
  const { donations, loading, error } = useDonations('completed');

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

  const receivedDonations = donations.filter(donation => donation.isSuccessful);
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
      <section className="relative w-fit">
        <Image src="/images/frame.png" alt="" width={232} height={216} />
        <section
          className="absolute -top-5 -right-4 w-[70px] h-[78px] bg-white flex items-center justify-center font-bold text-[64px] text-[#104901] rounded-2xl"
          style={{ boxShadow: "0px 4px 10px 0px #00000040" }}
        >
          {receivedDonations.length}
        </section>
      </section>

      <section>
        <h3 className="font-semibold text-3xl text-[#104901]">
          {receivedDonations.length} donation{receivedDonations.length !== 1 ? 's' : ''} received
        </h3>
        <p className="font-normal text-xl text-[#104901]">
          Total amount received: ${totalAmount.toFixed(2)}
        </p>
      </section>

      {/* Donations List */}
      <div className="mt-6 space-y-4">
        {receivedDonations.map((donation) => (
          <div key={donation.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-[#104901] rounded-full flex items-center justify-center text-white font-semibold">
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
                <p className="text-xs text-green-600">✓ Completed</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReceivedDonations;
