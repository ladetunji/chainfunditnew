import { Button } from "@/components/ui/button";
import {
  Eye,
  Calendar,
  Target,
  CheckCircle,
  Clock,
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

const ClosedCampaigns = ({ campaigns }: Props) => {
  const isEmpty = campaigns.length === 0;
  const transformedCampaigns = campaigns.map(transformCampaign);

  const getClosedReason = (campaign: Campaign) => {
    return 'Closed';
  };

  const getClosedIcon = (campaign: Campaign) => {
    const progressPercentage = Math.round((campaign.currentAmount / campaign.goalAmount) * 100);
    
    if (progressPercentage >= 100) {
      return <CheckCircle className="h-4 w-4" />;
    } else {
      return <Clock className="h-4 w-4" />;
    }
  };

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative inline-block mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-purple-800 rounded-full blur opacity-20"></div>
          <div className="relative bg-white/80 backdrop-blur-sm p-8 rounded-full">
            <Image src="/images/frame.png" alt="" width={200} height={180} />
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-800 flex items-center justify-center font-bold text-4xl text-white rounded-2xl shadow-lg">
              0
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h3 className="font-bold text-3xl text-[#104901] mb-3">
            No Closed Campaigns
          </h3>
          <p className="font-normal text-xl text-[#104901] opacity-80">
            Your closed campaigns will appear here once they reach their goal or expire.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {transformedCampaigns.map((campaign) => {
          const originalCampaign = campaigns.find(c => c.id === campaign.id);
          const closedReason = originalCampaign ? getClosedReason(originalCampaign) : 'Closed';
          const closedIcon = originalCampaign ? getClosedIcon(originalCampaign) : <Clock className="h-4 w-4" />;
          
          return (
            <div
              key={campaign.id}
              className="group relative overflow-hidden rounded-2xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
            >
              <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                  {needsEmojiFallback(campaign.image) ? (
                    <EmojiFallbackImage
                      category={originalCampaign?.reason || 'Uncategorized'}
                      title={campaign.title}
                      fill
                      className="group-hover:scale-110 transition-transform duration-500 opacity-75"
                    />
                  ) : (
                    <R2Image
                      src={campaign.image}
                      alt={campaign.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500 opacity-75"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                  
                  {/* Closed badge */}
                  <div className="absolute top-4 right-4">
                    <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      {closedIcon}
                      {closedReason}
                    </div>
                  </div>

                  {/* Closed date */}
                  {originalCampaign?.closedAt && (
                    <div className="absolute bottom-4 left-4">
                      <div className="bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Closed {new Date(originalCampaign.closedAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-4 space-y-3">
                  <h3 className="font-bold text-[#104901] text-lg line-clamp-2">
                    {campaign.title}
                  </h3>
                  
                  <p className="text-[#104901] opacity-80 text-sm line-clamp-2">
                    {campaign.description}
                  </p>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Final Progress</span>
                      <span className="font-semibold text-[#104901]">{Math.round((campaign.amountRaised / campaign.goal) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          (campaign.amountRaised / campaign.goal) * 100 >= 100 
                            ? 'bg-gradient-to-r from-green-500 to-green-600' 
                            : 'bg-gradient-to-r from-purple-500 to-purple-600'
                        }`}
                        style={{ width: `${Math.min((campaign.amountRaised / campaign.goal) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{formatCurrency(campaign.amountRaised, campaign.currency)} raised</span>
                      <span>Goal: {formatCurrency(campaign.goal, campaign.currency)}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex justify-between text-sm text-gray-600 pt-2 border-t border-gray-100">
                    <span className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                       {campaign.donors} donations
                    </span>
                    <span>{campaign.donors} donors</span>
                  </div>

                  {/* Action */}
                  <div className="pt-2">
                    <Link href={`/campaign/${campaign.slug}`}>
                      <Button 
                        variant="outline" 
                        className="w-full text-[#104901] border-[#104901] hover:bg-[#104901] hover:text-white"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Campaign
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClosedCampaigns;
