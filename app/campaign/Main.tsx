"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Bitcoin,
  CheckCircle,
  Users,
  LinkIcon,
  Heart,
  MessageSquare,
  Send,
  PlusSquare,
} from "lucide-react";
import CTA from "./cta";
import ChainModal from "./chain-modal";
import DonateModal from "./donate-modal";
import ShareModal from "./share-modal";
import UpdateModal from "./update-modal";
import CommentModal from "./comment-modal";
import { useCampaignDonations } from "@/hooks/use-campaign-donations";
import { useTopChainers } from "@/hooks/use-top-chainers";
import ClientToaster from "@/components/ui/client-toaster";

interface CampaignData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  reason: string;
  fundraisingFor: string;
  duration: string;
  videoUrl?: string;
  coverImageUrl?: string;
  galleryImages: string[];
  documents: string[];
  goalAmount: number;
  currency: string;
  minimumDonation: string;
  chainerCommissionRate: number;
  currentAmount: number;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  stats: {
    totalDonations: number;
    totalAmount: number;
    uniqueDonors: number;
    progressPercentage: number;
  };
  canEdit?: boolean;
}

interface CampaignUpdate {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CampaignComment {
  id: string;
  content: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
}

interface MainProps {
  campaignId: string;
}

// Mock data for fallback when API doesn't return data
const mockDonors = [
  {
    id: "mock-1",
    donorName: "Angela Bassett",
    amount: "125000",
    currency: "₦",
    isAnonymous: false,
    donorAvatar: "/images/donor1.png",
  },
  {
    id: "mock-2", 
    donorName: "Ruslev Mikhailsky",
    amount: "250000",
    currency: "₦",
    isAnonymous: false,
    donorAvatar: "/images/donor6.png",
  },
  {
    id: "mock-3",
    donorName: "Alexander Iwobi", 
    amount: "150000",
    currency: "₦",
    isAnonymous: false,
    donorAvatar: "/images/donor2.png",
  },
  {
    id: "mock-4",
    donorName: "Sarah Johnson",
    amount: "75000", 
    currency: "₦",
    isAnonymous: false,
    donorAvatar: "/images/donor3.png",
  },
  {
    id: "mock-5",
    donorName: "Michael Brown",
    amount: "200000",
    currency: "₦", 
    isAnonymous: false,
    donorAvatar: "/images/donor4.png",
  },
  {
    id: "mock-6",
    donorName: "Emily Davis",
    amount: "90000",
    currency: "₦",
    isAnonymous: false,
    donorAvatar: "/images/donor5.png",
  },
];

const mockChainers = [
  {
    id: "mock-chainer-1",
    userName: "Angela Bassett",
    totalReferrals: 20,
    totalRaised: 125000,
    userAvatar: "/images/donor1.png",
  },
  {
    id: "mock-chainer-2", 
    userName: "Ruslev Mikhailsky",
    totalReferrals: 12,
    totalRaised: 250000,
    userAvatar: "/images/donor6.png",
  },
  {
    id: "mock-chainer-3",
    userName: "Alexander Iwobi",
    totalReferrals: 6, 
    totalRaised: 150000,
    userAvatar: "/images/donor2.png",
  },
];


const comments = [
  {
    id: 1,
    image: "/images/donor1.png",
    name: "Angela Bassett",
    donation: "₦20,000",
    time: "32 minutes ago",
    comment:
      "This is such a cool cause! Hope you and your kids get the best flat available in Knightsbridge.",
    creator: {
      name: "Donald Chopra",
      comment: "Thank you so much Angie!",
      time: "22 minutes ago",
    },
  },
  {
    id: 2,
    image: "/images/donor1.png",
    name: "Angela Bassett",
    donation: "₦20,000",
    time: "32 minutes ago",
    comment: "Let’s effing goooooo!",
    creator: {
      name: "Donald Chopra",
      comment: "Thank you so much Angie!",
      time: "22 minutes ago",
    },
  },
  {
    id: 3,
    image: "/images/donor1.png",
    name: "Angela Bassett",
    donation: "₦20,000",
    time: "32 minutes ago",
    comment: "God will make a way for you and your family Donald.",
    creator: {
      name: "Donald Chopra",
      comment: "Thank you so much Angie!",
      time: "22 minutes ago",
    },
  },
];

const Main = ({ campaignId }: MainProps) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState("why-support");
  const [chainModalOpen, setChainModalOpen] = useState(false);
  const [donateModalOpen, setDonateModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updates, setUpdates] = useState<CampaignUpdate[]>([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [comments, setComments] = useState<CampaignComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [chainCount, setChainCount] = useState(0);
  const [loadingChains, setLoadingChains] = useState(false);

  // Fetch donations data
  const { donations, loading: loadingDonations } =
    useCampaignDonations(campaignId);
  const { topChainers, loading: loadingTopChainers } =
    useTopChainers(campaignId);

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 Campaign Main Debug:', {
      campaignId,
      donations: donations?.length || 0,
      loadingDonations,
      topChainers: topChainers?.length || 0,
      loadingTopChainers,
    });
  }, [campaignId, donations, loadingDonations, topChainers, loadingTopChainers]);

  // Fetch campaign updates
  const fetchUpdates = React.useCallback(async () => {
    try {
      setLoadingUpdates(true);
      const response = await fetch(`/api/campaigns/${campaignId}/updates`);

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setUpdates(result.data);
        }
      }
    } catch (err) {
      console.error("Error fetching updates:", err);
    } finally {
      setLoadingUpdates(false);
    }
  }, [campaignId]);

  // Fetch campaign comments
  const fetchComments = React.useCallback(async () => {
    try {
      setLoadingComments(true);
      const response = await fetch(`/api/campaigns/${campaignId}/comments`);

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setComments(result.data);
        }
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setLoadingComments(false);
    }
  }, [campaignId]);

  // Fetch campaign chain count
  const fetchChainCount = React.useCallback(async () => {
    try {
      setLoadingChains(true);
      const response = await fetch(`/api/campaigns/${campaignId}/chains`);

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setChainCount(result.data.chainCount);
        }
      }
    } catch (err) {
      console.error("Error fetching chain count:", err);
    } finally {
      setLoadingChains(false);
    }
  }, [campaignId]);

  // Fetch campaign data and updates
  const fetchCampaign = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching campaign with ID:", campaignId);
      const response = await fetch(`/api/campaigns/${campaignId}`);
      console.log("Response status:", response.status);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Campaign not found");
        }
        throw new Error(`Failed to fetch campaign: ${response.status}`);
      }

      const result = await response.json();
      console.log("API response:", result);

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch campaign");
      }

      let campaignData = result.data;

      // Ensure creator information has fallback values
      if (!campaignData.creatorName) {
        campaignData = {
          ...campaignData,
          creatorName: "Unknown Creator",
          fundraisingFor: campaignData.fundraisingFor || "Unknown Cause",
        };
      }

      setCampaign(campaignData);

      // Fetch campaign updates, comments, and chain count
      await Promise.all([fetchUpdates(), fetchComments(), fetchChainCount()]);
    } catch (err) {
      console.error("Error fetching campaign:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch campaign");
    } finally {
      setLoading(false);
    }
  }, [campaignId, fetchUpdates, fetchComments]);

  React.useEffect(() => {
    if (campaignId) {
      fetchCampaign();
    }
  }, [campaignId, fetchCampaign]);

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-[1440px] mx-auto mt-16 md:mt-22 h-full p-5 md:p-12 font-source">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#104901] mx-auto mb-4"></div>
            <p className="text-lg text-[#757575]">Loading campaign...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !campaign) {
    return (
      <div className="max-w-[1440px] mx-auto mt-16 md:mt-22 h-full p-5 md:p-12 font-source">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-6xl mb-4">😔</div>
            <h2 className="text-2xl font-semibold text-black mb-2">
              {error === "Campaign not found"
                ? "Campaign Not Found"
                : "Something went wrong"}
            </h2>
            <p className="text-lg text-[#757575] mb-4">
              {error === "Campaign not found"
                ? "The campaign you're looking for doesn't exist or has been removed."
                : "We couldn't load the campaign. Please try again later."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#104901] text-white px-6 py-3 rounded-lg hover:bg-[#0d3a01] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const campaignData = campaign;

  const raised = campaignData.currentAmount;
  const goal = campaignData.goalAmount;
  const percent = Math.min(100, Math.round((raised / goal) * 100));

  // Use campaign images if available, otherwise show empty state
  const campaignImages =
    campaign?.galleryImages && campaign.galleryImages.length > 0
      ? campaign.galleryImages.filter(
          (img) => img && !img.startsWith("/uploads/") && img !== "undefined"
        )
      : [];

  return (
    <div className="max-w-[1440px] bg-[url('/images/logo-bg.svg')] bg-[length:60%] md:bg-[length:30%] md:h-full bg-no-repeat bg-right-bottom mx-auto mt-16 md:mt-22 h-full p-5 md:p-12 font-source">
      <div className="flex md:flex-row md:gap-5 flex-col">
        {/* Left Side */}
        <div className="w-full md:w-3/4">
          <div className="flex flex-col gap-2">
            <h1 className="md:text-4xl text-2xl font-semibold text-black">
              {campaignData.title}
            </h1>
            <p className="font-normal text-base md:text-2xl text-black">
              {campaignData.subtitle}
            </p>
          </div>
          {/* Main Image */}
          {campaignImages.length > 0 ? (
            <>
              <div className="w-full flex mb-4 mt-10">
                <div className="relative md:w-[900px] md:h-[600px] overflow-hidden">
                  <Image
                    src={campaignImages[selectedImage]}
                    alt={`Gallery image ${selectedImage + 1}`}
                    style={{ objectFit: "cover" }}
                    width={900}
                    height={600}
                    priority
                  />
                </div>
              </div>
              {/* Thumbnails */}
              <div className="flex gap-4 overflow-x-auto">
                {campaignImages.map((img, idx) => (
                  <button
                    key={img}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative md:w-[137px] w-[60px] md:h-[84px] h-[60px] border-2 ${
                      selectedImage === idx
                        ? "border-[#104901]"
                        : "border-transparent"
                    } overflow-hidden focus:outline-none`}
                    aria-label={`Show image ${idx + 1}`}
                  >
                    <Image
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="w-full flex mb-4 mt-10">
              <div className="relative md:w-[900px] md:h-[600px] overflow-hidden bg-gray-200 flex items-center justify-center">
                <Image
                  src="/images/card-img1.png"
                  alt="Default campaign image"
                  width={900}
                  height={600}
                  style={{ objectFit: "cover" }}
                />
              </div>
            </div>
          )}

          <p className="font-medium text-2xl text-[#757575] md:my-1 my-3">
            Organised by{" "}
            <span className="font-semibold text-[#104901]">
              {campaignData.creatorName || "Unknown Creator"}
            </span>{" "}
            for{" "}
            <span className="font-semibold text-[#104901]">
              {campaignData.fundraisingFor || "Unknown Cause"}
            </span>
          </p>

          <div className="flex md:flex-row flex-col gap-2 justify-between md:items-center pb-5 border-b border-[#ADADAD]">
            <section className="flex gap-2 items-center">
              <p className="font-medium text-sm md:text-xl text-[#757575]">
                Category:
              </p>
              <span className="font-medium text-sm md:text-xl text-[#104901]">
                {campaignData.reason}
              </span>
            </section>

            <section className="flex gap-2 items-center">
              <Button
                className="font-medium text-lg text-[#2C2C2C] rounded-lg border-2 border-[#E7C9A5]"
                style={{
                  background:
                    "linear-gradient(180deg, #FFFAD2 0%, #FFAF69 100%)",
                }}
              >
                <CheckCircle /> Verified
              </Button>
              <Button
                className="font-medium text-lg text-[#2C2C2C] rounded-lg border-2 border-[#A5C7E7]"
                style={{
                  background:
                    "linear-gradient(180deg, #D2F3FF 0%, #45BFFD 100%)",
                }}
              >
                <Bitcoin />
                Accepts Crypto
              </Button>
            </section>
          </div>

          <section className="flex justify-between items-center mt-5">
            <p className="text-xl md:text-3xl font-medium my-1 text-black">
              ₦{raised.toLocaleString()} raised
            </p>
            <p className="font-medium text-lg md:text-2xl text-[#757575]">
              {percent}% of ₦{goal.toLocaleString()} goal
            </p>
          </section>
          {/* Progress bar */}
          <div className="w-full bg-[#D9D9D9] h-2 my-1">
            <div
              className="bg-[#104901] h-full transition-all duration-500"
              style={{
                width: `${percent}%`,
              }}
            ></div>
          </div>
          <section className="flex justify-between items-center">
            <p className="text-lg text-[#868686] flex gap-1 items-center">
              <Users size={20} />
              {campaignData.stats.uniqueDonors} donors
            </p>
            <p className="text-lg text-[#868686] flex gap-1 items-center">
              <LinkIcon size={20} />
              {loadingChains ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                `${chainCount} chain${chainCount === 1 ? "" : "s"}`
              )}
            </p>
          </section>

          {/* Tabbed Interface */}
          <div className="p-6 my-5">
            {/* Tabs */}
            <div className="flex w-fit">
              <button
                onClick={() => setActiveTab("why-support")}
                className={`md:px-5 px-2 py-3 border-x border-t border-[#C0BFC4] rounded-t-lg font-semibold text-lg md:text-3xl ${
                  activeTab === "why-support"
                    ? "bg-[#E7EDE6] text-[#104901]"
                    : "text-[#868686]"
                }`}
              >
                Why support my campaign
              </button>
              <button
                onClick={() => setActiveTab("updates")}
                className={`md:px-5 px-2 py-3 border-r border-t border-[#C0BFC4] rounded-tr-lg font-semibold text-lg md:text-3xl relative ${
                  activeTab === "updates"
                    ? "bg-[#E7EDE6] text-[#104901]"
                    : "text-[#868686]"
                }`}
              >
                Updates
                {updates.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#E8F5E8] text-[#104901] text-xs rounded-full w-5 h-5 flex items-center justify-center border border-white">
                    {updates.length}
                  </span>
                )}
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "why-support" && (
              <div className="bg-[#F2F1E9] border-x border-b border-[#C0BFC4] font-normal text-sm md:text-xl text-[#104901] p-3 md:p-6 space-y-4">
                <p className="">{campaignData.description}</p>
              </div>
            )}

            {activeTab === "updates" && (
              <div className="bg-[#F2F1E9] border-x border-b border-[#C0BFC4] font-normal text-sm md:text-xl text-[#104901] p-3 md:p-6">
                {loadingUpdates ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#104901] mx-auto mb-4"></div>
                    <p className="text-[#757575]">Loading updates...</p>
                  </div>
                ) : updates.length > 0 ? (
                  <div className="space-y-6">
                    {updates.map((update) => (
                      <div
                        key={update.id}
                        className="bg-white rounded-xl p-4 border border-[#C0BFC4]"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-lg text-[#104901]">
                            {update.title}
                          </h4>
                          <span className="text-sm text-[#757575]">
                            {new Date(update.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[#474553] leading-relaxed">
                          {update.content}
                        </p>
                        {!update.isPublic && (
                          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                            <span>🔒</span>
                            <span>Private Update</span>
                          </div>
                        )}
                      </div>
                    ))}
                    {/* Add Update Button - Always show when user can edit */}
                    {campaign?.canEdit && (
                      <div className="text-center pt-4">
                        <Button
                          onClick={() => setUpdateModalOpen(true)}
                          className="bg-gradient-to-r from-green-600 to-[#104901] text-white rounded-xl px-6 py-2 hover:shadow-lg transition-all duration-300"
                        >
                          <PlusSquare className="h-4 w-4 mr-2" />
                          Add another update
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-[#757575] mb-4">
                      No updates available yet.
                    </p>
                    {campaign?.canEdit && (
                      <Button
                        onClick={() => setUpdateModalOpen(true)}
                        className="bg-gradient-to-r from-green-600 to-[#104901] text-white rounded-xl px-6 py-2 hover:shadow-lg transition-all duration-300"
                      >
                        <PlusSquare className="h-4 w-4 mr-2" />
                        Add update
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* top donors */}
          <section>
            <h3 className="text-3xl font-semibold text-black mb-4">
              Top Donors
            </h3>
            {loadingDonations ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#104901]"></div>
              </div>
            ) : (donations && donations.length > 0) || (!loadingDonations && (!donations || donations.length === 0)) ? (
              <div className="grid md:grid-cols-6 grid-cols-3 gap-3">
                {(donations && donations.length > 0 ? donations.slice(0, 6) : mockDonors).map((donation, index) => (
                  <div key={donation.id} className="flex flex-col items-center">
                    <div className="relative w-20 h-20 border-2 border-white rounded-3xl overflow-hidden">
                      {donation.donorAvatar && !donation.isAnonymous ? (
                        <Image
                          src={donation.donorAvatar}
                          alt={donation.donorName || "Donor"}
                          fill
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#104901] to-[#5F8555] flex items-center justify-center text-white font-bold text-xl">
                          {donation.isAnonymous
                            ? "A"
                            : donation.donorName
                            ? donation.donorName.charAt(0).toUpperCase()
                            : "D"}
                        </div>
                      )}
                    </div>
                    <p className="font-normal text-base text-black">
                      {donation.isAnonymous
                        ? "Anonymous"
                        : donation.donorName || "Donor"}
                    </p>
                    <p className="font-medium text-sm text-[#757575]">
                      {donation.currency} {parseFloat(donation.amount).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-[#757575]">
                  No donors yet. Be the first to donate!
                </p>
              </div>
            )}
          </section>

          <section className="my-5 py-5 border-y border-[#ADADAD]">
            <h3 className="text-3xl font-semibold text-black mb-4">
              Top Chainers
            </h3>
            {loadingTopChainers ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#104901]"></div>
              </div>
            ) : (topChainers && topChainers.length > 0) || (!loadingTopChainers && (!topChainers || topChainers.length === 0)) ? (
              <div className="flex gap-8">
                {(topChainers && topChainers.length > 0 ? topChainers : mockChainers).map((chainer, index) => (
                  <div key={chainer.id} className="flex flex-col items-center">
                    <div className="relative w-20 h-20 border-2 border-white rounded-3xl overflow-hidden">
                      {chainer.userAvatar ? (
                        <Image
                          src={chainer.userAvatar}
                          alt={chainer.userName}
                          fill
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#FFAF69] to-[#FFD4AE] flex items-center justify-center text-white font-bold text-xl">
                          {chainer.userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <p className="font-normal text-lg text-black">
                      {chainer.userName}
                    </p>
                    <p className="font-medium text-base text-[#5F8555]">
                      {chainer.totalReferrals} referrals
                    </p>
                    <p className="font-medium text-base text-[#757575]">
                      ₦{chainer.totalRaised.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-[#757575]">
                  No chainers yet. Start the chain!
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Right side */}
        <div className="w-full md:w-1/4 space-y-10">
          <div className="mb-5 py-3 px-2 bg-[#E7EDE6] rounded-2xl">
            <section className="w-full flex gap-3 mb-5">
              <Button
                className="w-1/2 h-12 px-4 py-2 font-semibold text-[28px] text-[#474553] rounded-lg border-2 border-[#E7C9A5]"
                style={{
                  background:
                    "linear-gradient(180deg, #FFFAD2 0%, #FFAF69 100%)",
                }}
                onClick={() => setDonateModalOpen(true)}
              >
                Donate
              </Button>
              <Button
                className="w-1/2 h-12 px-4 py-2 font-semibold text-[28px] text-[#474553] rounded-lg border-2 border-[#E7C9A5]"
                style={{
                  background:
                    "linear-gradient(360deg, #FFFAD2 0%, #FFD4AE 100%)",
                }}
                onClick={() => setShareModalOpen(true)}
              >
                Share
              </Button>
            </section>
            <section className="bg-white space-y-3 px-5 py-6 rounded-2xl">
              <p className="font-semibold text-xl text-[#5F8555]">
                Fundraising is more fun with friends! Invite others with your
                own custom link.
              </p>
              <span className="font-normal text-base text-[#5F8555]">
                Click the button below to join other chainers, bring in
                referrals, and get recognition for your efforts!
              </span>

              <section className="flex justify-between gap-4">
                <ul className="flex">
                  <li>
                    <Image
                      src="/images/donor1.png"
                      alt=""
                      width={40}
                      height={40}
                      className="border-2 border-white"
                    />
                  </li>
                  <li className="-ml-4">
                    <Image
                      src="/images/donor6.png"
                      alt=""
                      width={40}
                      height={40}
                      className=""
                    />
                  </li>
                  <li className="w-10 h-10 bg-[#E7EDE6] flex justify-center items-center rounded-2xl border-2 border-white -ml-4 font-semibold text-[28px] text-[#104901]">
                    +1
                  </li>
                </ul>

                <Button
                  className="h-12"
                  onClick={() => setChainModalOpen(true)}
                >
                  Chain Campaign <LinkIcon />
                </Button>
              </section>
            </section>
            {loadingDonations ? (
              <div className="my-5 py-8 bg-white border border-[#C0BFC4] rounded-2xl">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#104901] mr-3"></div>
                  <span className="text-[#5F8555]">
                    Loading recent donations...
                  </span>
                </div>
              </div>
            ) : donations.length > 0 ? (
              <ul className="my-5 py-3 px-2 bg-white space-y-3 border border-[#C0BFC4] rounded-2xl">
                {donations.slice(0, 3).map((donation) => {
                  // Get status styling
                  const getStatusStyle = (status: string) => {
                    switch (status) {
                      case "completed":
                        return "bg-green-100 text-green-700 border-green-200";
                      case "pending":
                        return "bg-yellow-100 text-yellow-700 border-yellow-200";
                      case "failed":
                        return "bg-red-100 text-red-700 border-red-200";
                      default:
                        return "bg-gray-100 text-gray-700 border-gray-200";
                    }
                  };

                  const getStatusText = (status: string) => {
                    switch (status) {
                      case "completed":
                        return "✓ Completed";
                      case "pending":
                        return "⏳ Pending";
                      case "failed":
                        return "✗ Failed";
                      default:
                        return status;
                    }
                  };

                  return (
                    <li key={donation.id} className="flex gap-3 items-center">
                      {donation.donorAvatar && !donation.isAnonymous ? (
                        <Image
                          src={donation.donorAvatar}
                          alt={donation.donorName || "Donor"}
                          width={64}
                          height={64}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-[#E7EDE6] rounded-full flex items-center justify-center text-[#104901] font-semibold text-xl">
                          {donation.isAnonymous
                            ? "?"
                            : donation.donorName?.charAt(0).toUpperCase() ||
                              "D"}
                        </div>
                      )}
                      <section className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-normal text-xl text-[#5F8555]">
                            {donation.donorName}
                          </p>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyle(
                              donation.paymentStatus
                            )}`}
                          >
                            {getStatusText(donation.paymentStatus)}
                          </span>
                        </div>
                        <p className="font-medium text-xl text-black">
                          {donation.currency}
                          {parseFloat(donation.amount).toLocaleString()} •{" "}
                          <span className="font-normal text-lg text-[#5F8555]">
                            {new Date(donation.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </p>
                        {donation.message && (
                          <p className="font-normal text-sm text-[#757575] italic mt-1">
                            "{donation.message}"
                          </p>
                        )}
                      </section>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="my-5 py-8 bg-white border border-[#C0BFC4] rounded-2xl">
                <div className="text-center">
                  <p className="text-[#5F8555] text-lg">No donations yet</p>
                  <p className="text-[#757575] text-sm mt-1">
                    Be the first to support this campaign!
                  </p>
                </div>
              </div>
            )}
            <section className="flex justify-center">
              <Button
                className="bg-white h-12 font-semibold text-[#104901] text-lg px-4 py-1.5 border-2 border-[#104901] rounded-none"
                variant="ghost"
              >
                See all donors
              </Button>
            </section>
          </div>

          {/* comments */}
          <div className="space-y-3">
            <h3 className="font-semibold text-3xl text-[#104901]">
              Top Comments
            </h3>
            {loadingComments ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#104901] mx-auto mb-4"></div>
                  <p className="text-[#757575]">Loading comments...</p>
                </div>
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {comments.slice(0, 5).map((comment) => (
                  <div className="" key={comment.id}>
                    <section className="bg-[#F2F1E9] w-full p-3 space-y-3 rounded-t-xl">
                      <section className="flex gap-2 items-start">
                        <div className="w-9 h-9 bg-[#E7EDE6] rounded-full flex items-center justify-center text-[#104901] font-semibold text-sm overflow-hidden">
                          {comment.userAvatar ? (
                            <Image
                              src={comment.userAvatar}
                              alt={comment.userName}
                              width={36}
                              height={36}
                              className="w-9 h-9 rounded-full object-cover"
                            />
                          ) : (
                            comment.userName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <section className="space-y-2">
                          <p className="font-semibold text-base text-[#104901]">
                            {comment.userName}{" "}
                            <span className="font-normal">made a donation</span>
                          </p>
                          <p className="font-normal text-xs text-[#104901]">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </p>
                          <p className="font-normal text-xl text-[#104901]">
                            {comment.content}
                          </p>
                          <div className="flex justify-between gap-3 items-center">
                            <section className="flex gap-2 items-center font-normal text-sm text-[#104901]">
                              <Heart color="black" size={20} /> Like
                            </section>
                            <section className="flex gap-2 items-center font-normal text-sm text-[#104901]">
                              <MessageSquare color="black" size={20} /> Comment
                            </section>
                            <section className="flex gap-2 items-center font-normal text-sm text-[#104901]">
                              <Send color="black" size={20} /> Share
                            </section>
                          </div>
                        </section>
                      </section>
                    </section>
                    <section className="bg-[#D9D9D9] w-full p-5 shadow-lg rounded-b-xl">
                      <div className="">
                        <section className="flex gap-2 items-center font-semibold text-base text-[#104901]">
                          <Heart color="black" size={20} />{" "}
                          <p>
                            <span className="font-normal">
                              Liked by the campaign creator
                            </span>
                          </p>
                        </section>
                      </div>
                    </section>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-[#757575]">
                  No comments yet. Be the first to comment!
                </p>
              </div>
            )}
            <section className="flex justify-center">
              <Button
                onClick={() => setCommentModalOpen(true)}
                className="bg-transparent h-12 text-[#104901] border-2 border-[#104901] hover:bg-[#104901] hover:text-white transition-colors"
              >
                Add a comment <PlusSquare />
              </Button>
            </section>
          </div>
        </div>
      </div>
      <CTA />
      <ChainModal
        open={chainModalOpen}
        onOpenChange={setChainModalOpen}
        campaign={campaign || undefined}
      />
      <DonateModal
        open={donateModalOpen}
        onOpenChange={setDonateModalOpen}
        campaign={campaign || undefined}
      />
      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        campaign={campaign || undefined}
      />
      <UpdateModal
        isOpen={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        campaignId={campaignId}
        onUpdateCreated={fetchUpdates}
      />
      <CommentModal
        isOpen={commentModalOpen}
        onClose={() => setCommentModalOpen(false)}
        campaignId={campaignId}
        onCommentCreated={fetchComments}
      />
      <ClientToaster />
    </div>
  );
};

export default Main;
