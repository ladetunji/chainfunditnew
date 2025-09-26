"use client";

import React, { useState, useEffect, useMemo } from "react";
import LiveCampaigns from "./live";
import PastCampaigns from "./past";
import Chains from "./chains";
import Favourites from "./favourites";
import Comments from "./comments";
import { useAuth } from "@/hooks/use-auth";
import { Campaign } from "./types";
import { isLiveCampaign, isPastCampaign } from "@/lib/utils/campaign-status";

const tabs = ["Live", "Past", "Chains", "Favourites", "Comments"];

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState("Live");
  const { user, loading: authLoading } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter campaigns to only show those created by the current user
  const userCampaigns = useMemo(() => {
    if (!user?.id) return [];
    return campaigns.filter(campaign => campaign.creatorId === user.id);
  }, [campaigns, user?.id]);

  // Filter campaigns based on active tab
  const filteredCampaigns = useMemo(() => {
    switch (activeTab) {
      case "Live":
        return userCampaigns.filter(campaign => isLiveCampaign(campaign));
      case "Past":
        return userCampaigns.filter(campaign => isPastCampaign(campaign));
      case "Chains":
        // For now, return campaigns that have been chained (you might need to add a chainId field)
        return userCampaigns.filter(campaign => campaign.status === 'active');
      case "Favourites":
        // For now, return empty array (you might need to implement favorites functionality)
        return [];
      case "Comments":
        // For now, return empty array (comments are handled separately)
        return [];
      default:
        return userCampaigns;
    }
  }, [activeTab, userCampaigns]);

  // Fetch campaigns from backend
  const fetchCampaigns = async () => {
    if (!user?.id) return;
    
    try {
      setCampaignsLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append('creatorId', user.id);
      params.append('limit', '50');
      
      const response = await fetch(`/api/dashboard/campaigns`);
      const data = await response.json();
      
      if (data.success) {
        setCampaigns(data.campaigns || []);
      } else {
        setError(data.error || 'Failed to load campaigns');
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setError('Failed to load campaigns');
    } finally {
      setCampaignsLoading(false);
    }
  };

  // Fetch campaigns when user is available
  useEffect(() => {
    if (user?.id && !authLoading) {
      fetchCampaigns();
    }
  }, [user?.id, authLoading]);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#104901] mb-2">Campaigns</h1>
          <p className="text-lg text-gray-600">Manage and track your fundraising campaigns</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 inline-flex">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab 
                    ? "bg-[#104901] text-white shadow-md" 
                    : "text-gray-600 hover:text-[#104901] hover:bg-green-50"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {!authLoading && campaignsLoading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#104901] mb-4"></div>
              <p className="text-[#104901] text-lg font-medium">Loading your campaigns...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {!authLoading && !campaignsLoading && error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="text-red-500 mb-4">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-bold text-2xl text-red-600 mb-3">Error Loading Campaigns</h3>
              <p className="text-red-500 text-center mb-6">{error}</p>
              <button 
                onClick={fetchCampaigns} 
                className="bg-[#104901] hover:bg-[#0d3d01] text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Not Authenticated State
        {!authLoading && !campaignsLoading && !error && !user && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="text-[#104901] mb-4">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-bold text-2xl text-[#104901] mb-3">Please Sign In</h3>
              <p className="text-[#104901] text-center mb-6">You need to be signed in to view your campaigns.</p>
              <a href="/signin" className="bg-[#104901] hover:bg-[#0d3d01] text-white px-6 py-3 rounded-lg font-medium transition-colors">
                Sign In
              </a>
            </div>
          </div>
        )} */}

        {/* Campaigns Content */}
        {!authLoading && !campaignsLoading && !error && user && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {activeTab === "Live" && <LiveCampaigns campaigns={filteredCampaigns} />}
            {activeTab === "Past" && <PastCampaigns campaigns={filteredCampaigns} />}
            {activeTab === "Chains" && <Chains />}
            {activeTab === "Favourites" && <Favourites campaigns={filteredCampaigns} />}
            {activeTab === "Comments" && <Comments campaigns={userCampaigns} />}
          </div>
        )}
      </div>
    </div>
  );
}
