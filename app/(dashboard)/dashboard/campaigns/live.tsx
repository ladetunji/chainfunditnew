import { Button } from "@/components/ui/button";
import { Edit, Eye, Link as LinkIcon, Plus, PlusSquare, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Campaign, transformCampaign } from "./types";
import { formatCurrency } from "@/lib/utils/currency";

type Props = {
  campaigns: Campaign[];
};

const LiveCampaigns = ({ campaigns }: Props) => {
  const isEmpty = campaigns.length === 0;
  const transformedCampaigns = campaigns.map(transformCampaign);

  if (isEmpty) {
    return (
      <div className="text-center py-12">
        <div className="relative inline-block mb-6">
          <Image src="/images/frame.png" alt="" width={200} height={180} />
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-gray-100 flex items-center justify-center font-bold text-2xl text-gray-400 rounded-xl">
            0
          </div>
        </div>
        
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">
          No live campaigns
        </h3>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Start your fundraising journey by creating your first campaign and making a difference in your community.
        </p>
        
        <Link href="/create-campaign">
          <Button className="bg-[#104901] hover:bg-[#0d3d01] text-white px-6 py-3 rounded-lg font-medium transition-colors">
            <Plus size={20} className="mr-2" />
            Create Your First Campaign
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {transformedCampaigns.map((campaign) => (
        <div
          key={campaign.id}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex">
            <div className="relative w-80 h-48 flex-shrink-0">
              <Image
                src={campaign.image}
                alt={campaign.title}
                fill
                className="object-cover"
              />
              <div className="absolute top-4 left-4">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Live
                </span>
              </div>
            </div>
            <div className="flex-1 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{campaign.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {campaign.description.slice(0, 100)}...
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Raised</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(campaign.amountRaised, campaign.currency)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Goal</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(campaign.goal, campaign.currency)}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{Math.min(100, Math.round((campaign.amountRaised / campaign.goal) * 100))}% complete</span>
                    <span>{campaign.donors} donors</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#104901] h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.round((campaign.amountRaised / campaign.goal) * 100))}%`,
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-[#104901] border-[#104901] hover:bg-[#104901] hover:text-white"
                  >
                    <Edit size={16} className="mr-2" />
                    Edit
                  </Button>
                  <Link href={`/campaign/${campaign.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-gray-600 border-gray-300 hover:bg-gray-50"
                    >
                      <Eye size={16} className="mr-2" />
                      View Campaign
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                  >
                    <PlusSquare size={16} className="mr-2" />
                    Add Update
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="pt-6 border-t border-gray-100">
        <Link href="/create-campaign">
          <Button className="bg-[#104901] hover:bg-[#0d3d01] text-white px-6 py-3 rounded-lg font-medium transition-colors">
            <Plus size={20} className="mr-2" />
            Create New Campaign
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default LiveCampaigns;