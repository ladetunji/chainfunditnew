"use client";

import React, { useState, useEffect } from "react";
import LiveCampaigns from "./live";
import PastCampaigns from "./past";
import Chains from "./chains";
import Favourites from "./favourites";
import Comments from "./comments";
import { useCampaigns } from "@/hooks/use-campaigns";

const tabs = ["Live", "Past", "Chains", "Favourites", "Comments"];

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState("Live");
  const { campaigns, loading, error, fetchCampaigns } = useCampaigns();

  // Filter campaigns based on active tab
  const getFilteredCampaigns = () => {
    switch (activeTab) {
      case "Live":
        return campaigns.filter(campaign => campaign.status === 'active' && campaign.isActive);
      case "Past":
        return campaigns.filter(campaign => campaign.status === 'closed' || !campaign.isActive);
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
  };

  const filteredCampaigns = getFilteredCampaigns();

  // Debug logging
  useEffect(() => {
    console.log('CampaignsPage - loading:', loading);
    console.log('CampaignsPage - error:', error);
    console.log('CampaignsPage - campaigns count:', campaigns.length);
  }, [loading, error, campaigns.length]);

  return (
    <div className="w-full flex flex-col gap-5 font-source 2xl:container 2xl:mx-auto">
      <h2 className="font-semibold text-6xl text-black">Campaigns</h2>
      {/* Tabs */}
      <ul className="w-fit bg-[#E5ECDE] flex gap-4 font-medium text-[28px] text-[#757575] p-1">
        {tabs.map((tab) => (
          <li
            key={tab}
            className={`cursor-pointer px-4 py-2 transition ${
              activeTab === tab ? "bg-white text-black" : "hover:bg-[#d2e3c8]"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </li>
        ))}
      </ul>
      <div className="mt-6">
        {activeTab === "Live" && <LiveCampaigns campaigns={filteredCampaigns} />}
        {activeTab === "Past" && <PastCampaigns campaigns={filteredCampaigns} />}
        {activeTab === "Chains" && <Chains campaigns={filteredCampaigns} />}
        {activeTab === "Favourites" && <Favourites campaigns={filteredCampaigns} />}
        {activeTab === "Comments" && <Comments />}
      </div>
    </div>
  );
}
