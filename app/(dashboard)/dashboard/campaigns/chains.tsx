import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Users,
  DollarSign,
  TrendingUp,
  Gift,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useChainerDonations } from "@/hooks/use-chainer-donations";
import { formatCurrency } from "@/lib/utils/currency";

const Chains = () => {
  const { data: chainerData, loading, error, refetch } = useChainerDonations();

  const isEmpty = !loading && (!chainerData || chainerData.donations.length === 0);

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative inline-block mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-[#104901] rounded-full blur opacity-20"></div>
          <div className="relative bg-white/80 backdrop-blur-sm p-8 rounded-full">
            <Image src="/images/frame.png" alt="" width={200} height={180} />
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-r from-green-600 to-[#104901] flex items-center justify-center font-bold text-4xl text-white rounded-2xl shadow-lg">
              0
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h3 className="font-bold text-3xl text-[#104901] mb-3">
            No Chainer Donations Yet
          </h3>
          <p className="font-normal text-xl text-[#104901] opacity-80">
            No donations have been raised through chainers for your campaigns yet. Encourage people to chain your campaigns to help spread the word!
          </p>
        </div>

        <Link href="/campaigns">
          <Button className="bg-gradient-to-r from-green-600 to-[#104901] text-white hover:from-green-600 hover:to-[#104901] hover:text-white rounded-xl px-8 py-4 hover:shadow-lg transition-all duration-300 flex items-center gap-3 font-semibold text-xl">
            Browse Campaigns <Plus size={24} />
          </Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#104901]"></div>
        <p className="mt-4 text-[#104901] opacity-80">Loading chainer donations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-center mb-8">
          <h3 className="font-bold text-3xl text-red-600 mb-3">
            Error Loading Data
          </h3>
          <p className="font-normal text-xl text-red-600 opacity-80 mb-4">
            {error}
          </p>
          <Button 
            onClick={refetch}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-600 hover:to-red-700 hover:text-white rounded-xl px-8 py-4 hover:shadow-lg transition-all duration-300 flex items-center gap-3 font-semibold text-xl"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Stats Overview */}
      {chainerData && chainerData.stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-600 to-[#104901] text-white p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Chainer Donations</p>
                <p className="text-3xl font-bold">{chainerData.stats.totalChainedDonations}</p>
              </div>
              <Gift className="h-8 w-8 text-green-100" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Amount Raised by Chainers</p>
                <p className="text-3xl font-bold">{formatCurrency(chainerData.stats.totalChainedAmount, 'NGN')}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-100" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Chainers</p>
                <p className="text-3xl font-bold">{chainerData.stats.totalChainers}</p>
              </div>
              <Users className="h-8 w-8 text-purple-100" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Commissions Paid</p>
                <p className="text-3xl font-bold">{formatCurrency(chainerData.stats.totalCommissionsPaid, 'NGN')}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-100" />
            </div>
          </div>
        </div>
      )}

      {/* Campaign Stats */}
      {chainerData && chainerData.campaigns.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#104901] mb-6">Campaign Performance</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {chainerData.campaigns.map((campaign) => (
              <div
                key={campaign.campaignId}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden">
                    <Image
                      src={campaign.campaignCoverImage || '/images/default-campaign.jpg'}
                      alt={campaign.campaignTitle}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[#104901] text-lg mb-2">
                      {campaign.campaignTitle}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Gift size={14} />
                        {campaign.chainedDonations} donations
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {campaign.totalChainers} chainers
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Raised by Chainers</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(campaign.chainedAmount, campaign.campaignCurrency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Commissions Paid</span>
                    <span className="font-semibold text-blue-600">
                      {formatCurrency(campaign.totalCommissionsPaid, campaign.campaignCurrency)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[#104901] to-green-500 h-2 rounded-full"
                      style={{ width: `${campaign.progressPercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{campaign.progressPercentage}% of goal reached</span>
                    <span>{formatCurrency(campaign.campaignCurrent, campaign.campaignCurrency)} / {formatCurrency(campaign.campaignGoal, campaign.campaignCurrency)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Chainer Donations */}
      {chainerData && chainerData.donations.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-[#104901] mb-6">Recent Chainer Donations</h2>
          <div className="space-y-4">
            {chainerData.donations.slice(0, 10).map((donation) => (
              <div
                key={donation.id}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden">
                      <Image
                        src={donation.campaignCoverImage || '/images/default-campaign.jpg'}
                        alt={donation.campaignTitle}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#104901] text-lg">
                        {donation.campaignTitle}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Donated by <span className="font-medium">{donation.donorName}</span>
                      </p>
                      <p className="text-gray-500 text-xs flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(donation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(donation.amount, donation.currency)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Via referral: <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {donation.chainerReferralCode}
                      </span>
                    </div>
                    <div className="text-xs text-blue-600">
                      Commission: {formatCurrency(donation.chainerCommissionEarned, donation.currency)}
                    </div>
                  </div>
                </div>
                
                {donation.message && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 text-sm italic">"{donation.message}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center mt-8">
        <Link href="/campaigns">
          <Button className="bg-gradient-to-r from-green-600 to-[#104901] hover:from-green-600 hover:to-[#104901] hover:text-white rounded-xl px-8 py-4 hover:shadow-lg transition-all duration-300 flex items-center gap-3 font-semibold text-xl">
            View All Campaigns <Plus size={24} />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Chains;
