import { Button } from "@/components/ui/button";
import {
  Edit,
  Eye,
  Link as LinkIcon,
  Plus,
  PlusSquare,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Campaign, transformCampaign } from "./types";
import { formatCurrency } from "@/lib/utils/currency";
import { R2Image } from "@/components/ui/r2-image";
import { EmojiFallbackImage } from "@/components/ui/emoji-fallback-image";
import { needsEmojiFallback } from "@/lib/utils/campaign-emojis";

type Props = {
  campaigns: Campaign[];
};

const LiveCampaigns = ({ campaigns }: Props) => {
  const isEmpty = campaigns.length === 0;
  const transformedCampaigns = campaigns.map(transformCampaign);

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
            No Live Campaigns
          </h3>
          <p className="font-normal text-xl text-[#104901] opacity-80">
            Start your fundraising journey by creating your first campaign and
            making a difference in your community.
          </p>
        </div>

        <Link href="/create-campaign">
          <Button className="bg-gradient-to-r from-green-600 to-[#104901] text-white hover:from-green-600 hover:to-[#104901] hover:text-white rounded-xl px-8 py-4 hover:shadow-lg transition-all duration-300 flex items-center gap-3 font-semibold text-xl">
            Create a Campaign <Plus size={24} />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-8">
        {transformedCampaigns.map((campaign) => (
          <div
            key={campaign.id}
            className="group relative overflow-hidden rounded-2xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
          >
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                {needsEmojiFallback(campaign.image) ? (
                  <EmojiFallbackImage
                    category={campaigns.find(c => c.id === campaign.id)?.reason || 'Uncategorized'}
                    title={campaign.title}
                    fill
                    className="group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <R2Image
                    src={campaign.image}
                    alt={campaign.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                {/* Status badge */}
                <div className="absolute top-4 right-4">
                  {campaign.status === 'active' ? (
                    <div className="bg-gradient-to-r from-green-600 to-[#104901] text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      Live
                    </div>
                  ) : campaign.status === 'closed' ? (
                    <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Closed
                    </div>
                  ) : (
                    <div className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-3 space-y-2">
                <h3 className="font-bold text-[#104901] text-xl">
                  {campaign.title.slice(0, 15)}...
                </h3>
                <p className="text-[#104901] opacity-80 text-sm">
                  {campaign.description.slice(0, 40)}...
                </p>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#104901] opacity-80">Raised</span>
                    <span className="font-semibold">
                      {formatCurrency(campaign.amountRaised, campaign.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#104901] opacity-80">Goal</span>
                    <span className="font-semibold">
                      {formatCurrency(campaign.goal, campaign.currency)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#104901] to-green-500 h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            (campaign.amountRaised / campaign.goal) * 100
                          )
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>
                      {Math.min(
                        100,
                        Math.round(
                          (campaign.amountRaised / campaign.goal) * 100
                        )
                      )}
                      % complete
                    </span>
                    <div className="flex items-center gap-1">
                      <Users size={16} />
                      {campaign.donors} donors
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Link href={`/dashboard/campaigns/edit/${campaign.slug}`}>
                      <Button
                        variant="outline"
                        className="w-full text-[#104901] border-[#104901] hover:bg-[#104901] hover:text-white rounded-xl py-2 transition-all duration-300"
                      >
                        <Edit size={16} className="mr-2" />
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/campaign/${campaign.slug}`}>
                      <Button className="w-full bg-gradient-to-r from-green-600 to-[#104901] text-white rounded-xl py-2 hover:shadow-lg hover:from-green-600 hover:to-[#104901] hover:text-white transition-all duration-300">
                        <Eye size={16} className="mr-2" />
                        View
                      </Button>
                    </Link>
                  </div>
                  <Button
                    onClick={() =>
                      window.open(`/campaign/${campaign.slug}`, "_blank")
                    }
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl py-2 hover:shadow-lg hover:text-white transition-all duration-300"
                  >
                    <PlusSquare size={16} className="mr-2" />
                    Update Campaign
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <Link href="/create-campaign">
          <Button className="bg-gradient-to-r from-green-600 to-[#104901] hover:from-green-600 hover:to-[#104901] hover:text-white rounded-xl px-8 py-4 hover:shadow-lg transition-all duration-300 flex items-center gap-3 font-semibold text-xl">
            Create a Campaign <Plus size={24} />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default LiveCampaigns;
