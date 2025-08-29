"use client";

import React, { useState, useEffect, useMemo } from "react";
import LiveCampaigns from "./live";
import PastCampaigns from "./past";
import Chains from "./chains";
import Favourites from "./favourites";
import Comments from "./comments";
import { useCampaigns } from "@/hooks/use-campaigns";
import { isLiveCampaign, isPastCampaign } from "@/lib/utils/campaign-status";

const tabs = ["Live", "Past", "Chains", "Favourites", "Comments"];

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState("Live");
  const { campaigns, loading, error, fetchCampaigns } = useCampaigns();

  // Filter campaigns based on active tab - memoized to prevent infinite re-renders
  const filteredCampaigns = useMemo(() => {
    switch (activeTab) {
      case "Live":
        return campaigns.filter(campaign => isLiveCampaign(campaign));
      case "Past":
        return campaigns.filter(campaign => isPastCampaign(campaign));
      case "Chains":
        // For now, return campaigns that have been chained (you might need to add a chainId field)
        return campaigns.filter(campaign => campaign.status === 'active');
      case "Favourites":
        // For now, return empty array (you might need to implement favorites functionality)
        return [];
      case "Comments":
        // For now, return empty array (comments are handled separately)
        return [];
      default:
        return campaigns;
    }
  }, [activeTab, campaigns]);

  // Memoize campaign IDs to prevent infinite re-renders in child components
  const campaignIds = useMemo(() => 
    filteredCampaigns.map(campaign => campaign.id), 
    [filteredCampaigns]
  );

  // Debug logging
  useEffect(() => {
    console.log('CampaignsPage - loading:', loading);
    console.log('CampaignsPage - error:', error);
    console.log('CampaignsPage - campaigns count:', campaigns.length);
  }, [loading, error, campaigns.length]);

  return (
    <div className="w-full flex flex-col gap-8 font-source 2xl:container 2xl:mx-auto p-6 bg-gradient-to-br from-green-50 via-white to-green-50 min-h-screen">
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-[#104901] rounded-3xl blur opacity-10"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
          <h2 className="font-bold text-5xl text-[#104901] mb-6">Campaigns</h2>
          
          {/* Tabs */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-[#104901] rounded-2xl blur opacity-5"></div>
            <div className="relative bg-[#E5ECDE]/80 backdrop-blur-sm rounded-2xl p-2">
              <ul className="flex gap-2 font-medium text-xl text-[#757575]">
                {tabs.map((tab) => (
                  <li
                    key={tab}
                    className={`cursor-pointer px-6 py-3 rounded-xl transition-all duration-300 ${
                      activeTab === tab 
                        ? "bg-white text-[#104901] shadow-lg transform scale-105" 
                        : "hover:bg-white/50 hover:text-[#104901]"
                    }`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-[#104901] rounded-3xl blur opacity-5"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
          {activeTab === "Live" && <LiveCampaigns campaigns={filteredCampaigns} />}
          {activeTab === "Past" && <PastCampaigns campaigns={filteredCampaigns} />}
          {activeTab === "Chains" && <Chains campaigns={filteredCampaigns} />}
          {activeTab === "Favourites" && <Favourites campaigns={filteredCampaigns} />}
          {activeTab === "Comments" && <Comments />}
        </div>
      </div>
    </div>
  );
}
