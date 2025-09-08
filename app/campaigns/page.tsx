"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAllCampaigns } from "@/hooks/use-all-campaigns";
import { CampaignCard } from "@/components/campaign/CampaignCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Heart,
  Share2,
  Eye,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import ClientToaster from "@/components/ui/client-toaster";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/app/campaign/Navbar";
import { useGeolocation, useCampaignFiltering, useCurrencyConversion } from "@/hooks/use-geolocation";
import { formatCurrencyWithConversion } from "@/lib/utils/currency";
const campaignReasons = [
  "Emergency",
  "Business",
  "Memorials",
  "Education",
  "Sports",
  "Religion",
  "Family",
  "Medical",
  "Welfare",
  "Charity",
  "Community",
  "Creative",
  "Uncategorized",
];

const campaignStatuses = ["active", "completed", "paused", "cancelled"];

// Component to handle async currency conversion
function CampaignCardWithConversion({ 
  campaign, 
  viewMode, 
  geolocation, 
  formatAmount 
}: {
  campaign: any;
  viewMode: 'grid' | 'list';
  geolocation: any;
  formatAmount: (amount: number, currency: string) => Promise<any>;
}) {
  const [convertedAmounts, setConvertedAmounts] = React.useState<{
    currentAmount: { amount: number; currency: string; originalAmount?: number; originalCurrency?: string };
    goalAmount: { amount: number; currency: string; originalAmount?: number; originalCurrency?: string };
  } | null>(null);

  React.useEffect(() => {
    const convertAmounts = async () => {
      try {
        const convertedCurrentAmount = await formatAmount(campaign.currentAmount, campaign.currency);
        const convertedGoalAmount = await formatAmount(campaign.goalAmount, campaign.currency);
        
        setConvertedAmounts({
          currentAmount: convertedCurrentAmount,
          goalAmount: convertedGoalAmount,
        });
      } catch (error) {
        console.error('Failed to convert amounts:', error);
        // Fallback to original amounts
        setConvertedAmounts({
          currentAmount: { amount: campaign.currentAmount, currency: campaign.currency },
          goalAmount: { amount: campaign.goalAmount, currency: campaign.currency },
        });
      }
    };

    convertAmounts();
  }, [campaign.currentAmount, campaign.goalAmount, campaign.currency, formatAmount]);

  return (
    <CampaignCard
      campaign={campaign}
      viewMode={viewMode}
      geolocation={geolocation}
      convertedAmounts={convertedAmounts}
    />
  );
}

export default function AllCampaignsPage() {
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "amount" | "popular"
  >("newest");
  const [timeoutError, setTimeoutError] = useState(false);

  const { campaigns, loading, error, fetchCampaigns, hasMore, loadMore } =
    useAllCampaigns();
  
  // Geolocation and filtering
  const { geolocation, loading: locationLoading, error: locationError } = useGeolocation();
  const { shouldShowCampaign } = useCampaignFiltering(geolocation);
  const { formatAmount } = useCurrencyConversion(geolocation);

  // Add timeout for loading
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        if (loading) {
          setTimeoutError(true);
          console.warn(
            "Campaigns loading timeout - taking longer than expected"
          );
        }
      }, 10000); // 10 seconds timeout

      return () => clearTimeout(timer);
    } else {
      setTimeoutError(false);
    }
  }, [loading]);

  // Filter and sort campaigns
  const filteredCampaigns = useMemo(() => {
    let filtered = campaigns;

    console.log("Starting filtering with:", {
      totalCampaigns: campaigns.length,
      searchQuery,
      selectedReason,
      selectedStatus,
      activeTab,
      sortBy,
      geolocation: geolocation?.country,
      userCurrency: geolocation?.currency,
    });

    // Filter by geolocation/currency
    if (geolocation) {
      filtered = filtered.filter((campaign) => shouldShowCampaign(campaign.currency));
      console.log("After geolocation filter:", filtered.length);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (campaign) =>
          campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          campaign.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          campaign.creatorName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      console.log("After search filter:", filtered.length);
    }

    // Filter by reason
    if (selectedReason) {
      filtered = filtered.filter(
        (campaign) => campaign.reason === selectedReason
      );
      console.log("After reason filter:", filtered.length);
    }

    // Filter by status
    if (selectedStatus) {
      filtered = filtered.filter(
        (campaign) => campaign.status === selectedStatus
      );
      console.log("After status filter:", filtered.length);
    }

    // Filter by active tab
    if (activeTab === "Live") {
      filtered = filtered.filter((campaign) => campaign.status === "active");
      console.log("After Live tab filter:", filtered.length);
    } else if (activeTab === "Completed") {
      filtered = filtered.filter((campaign) => campaign.status === "completed");
      console.log("After Completed tab filter:", filtered.length);
    } else if (activeTab === "Trending") {
      // Show campaigns with high engagement (you can customize this logic)
      filtered = filtered.filter(
        (campaign) =>
          campaign.status === "active" &&
          (campaign.stats?.totalDonations || 0) > 10
      );
      console.log("After Trending tab filter:", filtered.length);
    }

    console.log("Final filtered campaigns:", filtered.length);

    // Sort campaigns
    switch (sortBy) {
      case "newest":
        filtered = filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "oldest":
        filtered = filtered.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "amount":
        filtered = filtered.sort(
          (a, b) => (b.stats?.totalAmount || 0) - (a.stats?.totalAmount || 0)
        );
        break;
      case "popular":
        filtered = filtered.sort(
          (a, b) =>
            (b.stats?.totalDonations || 0) - (a.stats?.totalDonations || 0)
        );
        break;
    }

    return filtered;
  }, [
    campaigns,
    searchQuery,
    selectedReason,
    selectedStatus,
    activeTab,
    sortBy,
    geolocation,
    shouldShowCampaign,
  ]);

  // Handle search with debouncing
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedReason("");
    setSelectedStatus("");
    setSortBy("newest");
  };

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error("Campaigns error:", error);
      toast.error(`Failed to load campaigns: ${error}`);
    }
  }, [error]);

  // Debug logging
  useEffect(() => {
    console.log("Campaigns state:", {
      loading,
      error,
      campaignsCount: campaigns.length,
      filteredCount: filteredCampaigns.length,
      hasMore,
      activeTab,
      selectedReason,
      selectedStatus,
      sortBy,
    });

    // Log individual campaigns to see their structure
    if (campaigns.length > 0) {
      console.log("First campaign:", campaigns[0]);
      console.log(
        "All campaign statuses:",
        campaigns.map((c) => ({ id: c.id, status: c.status, reason: c.reason }))
      );
    }
  }, [
    loading,
    error,
    campaigns.length,
    filteredCampaigns.length,
    hasMore,
    activeTab,
    selectedReason,
    selectedStatus,
    sortBy,
    campaigns,
  ]);

  const tabs = ["All", "Live", "Completed", "Trending"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <Navbar />
      {/* Hero Section */}
      <div className="mt-20 relative bg-gradient-to-r from-green-600 to-[#104901] text-white py-16">
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Discover Amazing Campaigns
          </h1>
          <p className="text-xl md:text-2xl text-white max-w-3xl mx-auto">
            Support causes you care about and make a difference in people's
            lives
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Location Indicator */}
        {geolocation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-blue-800">
              <MapPin className="h-4 w-4" />
              <span className="font-medium">
                Showing campaigns for {geolocation.country} 
                {geolocation.canSeeAllCurrencies ? ' (All currencies)' : ` (${geolocation.currency} only)`}
              </span>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search */}
            <div className="flex-1">
              <Label
                htmlFor="search"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Search Campaigns
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search by title, description, or creator..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Reason Filter */}
            <div className="lg:w-48">
              <Label
                htmlFor="reason"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Category
              </Label>
              <Select
                value={selectedReason}
                onValueChange={(value) => setSelectedReason(value)}
              >
                <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {campaignReasons.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="lg:w-48">
              <Label
                htmlFor="status"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Status
              </Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) => setSelectedStatus(value)}
              >
                <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {campaignStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="lg:w-48">
              <Label
                htmlFor="sort"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Sort By
              </Label>
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as any)}
              >
                <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="amount">Highest Amount</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchQuery || selectedReason || selectedStatus) && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="text-gray-600 hover:text-gray-800"
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-[#104901] text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              {filteredCampaigns.length} campaign
              {filteredCampaigns.length !== 1 ? "s" : ""} found
            </span>
          </div>

          <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-[#5F8555] text-white"
                  : "text-[#104901]"
              }`}
            >
              <Grid3X3 className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-[#5F8555] text-white"
                  : "text-[#104901]"
              }`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Campaigns Grid/List */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
            {timeoutError ? (
              <>
                <div className="text-orange-500 mb-4">
                  <Search className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Loading is taking longer than expected
                </h3>
                <p className="text-gray-500 mb-4">
                  This might be due to a slow database connection or network
                  issue
                </p>
                <Button
                  onClick={() => {
                    setTimeoutError(false);
                    fetchCampaigns();
                  }}
                  className="bg-[#5F8555] hover:bg-[#104901] text-white"
                >
                  Retry Loading
                </Button>
              </>
            ) : (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5F8555] mb-4"></div>
                <p className="text-gray-600">Loading campaigns...</p>
              </>
            )}
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No campaigns found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search criteria or filters
            </p>
          </div>
        ) : (
          <>
            <div
              className={`${
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }`}
            >
              {filteredCampaigns.map((campaign) => (
                <CampaignCardWithConversion
                  key={campaign.id}
                  campaign={campaign}
                  viewMode={viewMode}
                  geolocation={geolocation}
                  formatAmount={formatAmount}
                />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-8">
                <Button
                  onClick={loadMore}
                  className="bg-[#5F8555] text-white px-8 py-3"
                >
                  More Campaigns
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      <ClientToaster />
    </div>
  );
}
