"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { PiYoutubeLogoLight } from "react-icons/pi";
import CardDetailsDrawer from "@/components/homepage/CardDetailsDrawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NotificationsList } from "@/components/homepage/notifications-list";
import BenefitsCarousel from "./BenefitsCarousel";
import { usePublicCampaigns } from "@/hooks/use-public-campaigns";
import { formatCurrency } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

type Props = {};

const Main = (props: Props) => {
  
  const images = [
    "/images/main-3.png", // Image 1: multi-currency
    "/images/teamwork.png", // Image 2: two people lifting
    "/images/secure.png", // Image 3: secure payments
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [openCard, setOpenCard] = useState<number | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("live campaigns");
  
  // Fetch public campaigns
  const { campaigns, loading: campaignsLoading, error: campaignsError, updateFilters } = usePublicCampaigns();

  const handlePreviousCard = () => {
    if (openCard !== null && openCard > 0) {
      setOpenCard(openCard - 1);
    }
  };

  const handleNextCard = () => {
    if (openCard !== null && openCard < campaigns.length - 1) {
      setOpenCard(openCard + 1);
    }
  };

  // Filter campaigns based on selected filter
  const filteredCampaigns = campaigns.filter(campaign => {
    const progressPercentage = campaign.stats.progressPercentage;
    
    switch (selectedFilter) {
      case "live campaigns":
        return campaign.status === 'active';
      case "need momentum":
        return campaign.status === 'active' && progressPercentage >= 0 && progressPercentage <= 10;
      case "close to target":
        return campaign.status === 'active' && progressPercentage >= 90;
      default:
        return true;
    }
  });

  // Transform campaigns data to match the expected format
  const cardDetails = filteredCampaigns.map(campaign => {
    console.log('Campaign currency:', campaign.currency, 'Amount:', campaign.currentAmount);
    return {
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      raised: `${formatCurrency(campaign.currentAmount, campaign.currency)} raised`,
      image: campaign.coverImageUrl || "/images/card-img1.png",
      extra: `Goal: ${formatCurrency(campaign.goalAmount, campaign.currency)}. ${campaign.stats.totalDonations} donations so far!`,
      date: new Date(campaign.createdAt).toLocaleDateString(),
      timeLeft: campaign.status === 'active' ? "Active" : "Completed",
      avatar: campaign.creatorAvatar || "/images/avatar-7.png",
      creator: campaign.creatorName || "Anonymous",
      createdFor: campaign.fundraisingFor || "Charity",
      percentage: `${campaign.stats.progressPercentage}%`,
      total: `${formatCurrency(campaign.goalAmount, campaign.currency)} total`,
      donors: campaign.stats.uniqueDonors,
      // New fields for dashboard-style cards
      amountRaised: campaign.currentAmount,
      goal: campaign.goalAmount,
      currency: campaign.currency,
    };
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="my-6">
      {/* benefits */}
      <BenefitsCarousel />
      {/* campaign cards */}
      <div className="p-4 md:p-12 w-full h-fit flex flex-col gap-5 my-5 bg-[#F2F1E9]">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 md:gap-0">
          <section className="flex flex-col gap-2 md:gap-3">
            <p className="font-source font-semibold text-2xl md:text-3xl text-black">
              Discover inspiring fundraisers close to you
            </p>
            <span className="font-source font-normal text-base text-black">
              Support campaigns you like, or create one for yourself
            </span>
          </section>

          <Select>
            <SelectTrigger className="w-full md:w-[250px] h-12 md:h-14 px-4 md:px-6 font-source font-normal text-base text-black border-2 border-[#0F4201] rounded-none">
              <SelectValue placeholder="Happening worldwide" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                value="live campaigns"
                className="capitalize cursor-pointer"
              >
                Live campaigns anywhere (worldwide)
              </SelectItem>
              <SelectItem
                value="need momentum"
                className="capitalize cursor-pointer"
              >
                Need momentum (campaigns between 0-10%)
              </SelectItem>
              <SelectItem
                value="close to target"
                className="capitalize cursor-pointer"
              >
                Close to target (campaigns above 90%)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col md:flex-row gap-3 w-full">
          {/* Loading State */}
          {campaignsLoading && (
            <div className="flex items-center justify-center w-full py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#104901] mb-4"></div>
              <p className="text-[#104901] text-xl ml-4">Loading campaigns...</p>
            </div>
          )}

          {/* Error State */}
          {campaignsError && !campaignsLoading && (
            <div className="flex flex-col items-center justify-center w-full py-16">
              <div className="text-red-500 mb-4">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-bold text-2xl text-red-600 mb-3">Error Loading Campaigns</h3>
              <p className="text-red-500 text-center mb-4">{campaignsError}</p>
            </div>
          )}

          {/* No Campaigns State */}
          {!campaignsLoading && !campaignsError && cardDetails.length === 0 && (
            <div className="flex flex-col items-center justify-center w-full py-16">
              <div className="text-[#104901] mb-4">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-bold text-2xl text-[#104901] mb-3">No Campaigns Available</h3>
              <p className="text-[#104901] text-center">Check back later for inspiring campaigns!</p>
            </div>
          )}

          {/* Campaign Cards */}
          {!campaignsLoading && !campaignsError && cardDetails.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {cardDetails.map((card, idx) => (
            <div
              key={card.id}
              className="group relative overflow-hidden rounded-2xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer"
              onClick={() => setOpenCard(idx)}
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-[#104901] mb-3 text-lg">
                    {card.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {card.description.slice(0, 80)}...
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#104901] opacity-80">Raised</span>
                      <span className="font-semibold">
                        {formatCurrency(card.amountRaised || 0, card.currency || 'USD')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#104901] opacity-80">Goal</span>
                      <span className="font-semibold">
                        {formatCurrency(card.goal || 0, card.currency || 'USD')}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#104901] to-green-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: card.percentage }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{card.percentage} complete</span>
                      <span>{card.donors} donors</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-6 text-[#104901] border-[#104901] hover:bg-[#104901] hover:text-white rounded-xl py-3 transition-all duration-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenCard(idx);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Campaign
                  </Button>
                </div>
              </div>
            </div>
              ))}
            </div>
          )}
          
          <CardDetailsDrawer
            open={openCard !== null}
            onOpenChange={(open) => !open && setOpenCard(null)}
            card={openCard !== null ? cardDetails[openCard] : null}
            currentIndex={openCard !== null ? openCard : 0}
            totalCards={cardDetails.length}
            onPrevious={handlePreviousCard}
            onNext={handleNextCard}
          />
        </div>
      </div>
      {/* features*/}
      <div className="px-4 md:px-12 py-6 md:py-10 mt-5">
        <h2 className="font-semibold text-2xl md:text-3xl text-black">
          All you need for a successful fundraiser
        </h2>
        <p className="font-normal text-base text-black">
          Modern, powerful tools to help your fundraisers reach their goals
          quick
        </p>
        <div className="flex flex-col md:flex-row gap-24 md:gap-5 w-full h-fit my-5">
          <section className="bg-[url('/images/main-1.png')] bg-cover bg-no-repeat w-full md:w-2/3 h-60 md:h-[500px]">
            <section className="bg-[linear-gradient(180deg,rgba(255,255,255,0)_70%,#fff_100%)] h-full px-2 md:px-4 py-4 md:py-6 flex flex-col gap-2 md:gap-3">
              <div className="w-full md:w-[365px] h-fit p-2 md:p-4 rounded-xl bg-white flex items-start gap-2 md:gap-3 font-dm">
                <Image
                  src="/images/avatar-1.png"
                  alt="avatar"
                  width={40}
                  height={40}
                  className="md:w-[50px] md:h-[50px]"
                />
                <section className="flex flex-col gap-1">
                  <span className="font-normal text-base text-black">You</span>
                  <p className="font-semibold text-base text-black text-wrap">
                    Create a campaign to cover my tuition at Berkshire College.
                    Goal is $24,000.
                  </p>
                </section>
              </div>
              <div className="w-full md:w-[365px] h-fit p-2 md:p-4 rounded-xl bg-white flex items-start gap-2 md:gap-3 font-dm">
                <section className="flex flex-col gap-1">
                  <span className="font-normal text-base text-black">
                    Chainfundit
                  </span>
                  <p className="font-semibold text-base text-black text-wrap">
                    College sounds like fun. New campaign coming right up...
                  </p>
                </section>
                <Image
                  src="/images/logo.svg"
                  alt="avatar"
                  width={40}
                  height={40}
                  className="md:w-[50px] md:h-[50px]"
                />
              </div>

              <div className="flex flex-col gap-1 justify-end mt-4 mb-5 md:my-0 md:mt-auto">
                <p className="font-dm font-medium text-lg md:text-xl text-black">
                  AI-powered writing
                </p>
                <span className="font-source font-normal text-base text-black">
                  Create captivating campaign stories with the power of AI
                </span>
              </div>
            </section>
          </section>
          <section className="bg-[url('/images/main-2.png')] bg-cover bg-no-repeat w-full md:w-1/3 h-60 md:h-[500px]">
            <section className="bg-[linear-gradient(180deg,rgba(255,255,255,0)_70%,#fff_100%)] h-full px-2 md:px-4 py-4 md:py-6 flex flex-col gap-2 md:gap-3">
              <div className="w-full md:w-[300px] h-fit p-2 md:p-4 rounded-xl bg-white flex items-start gap-2 md:gap-3 font-dm">
                <Image
                  src="/images/avatar-2.png"
                  alt="avatar"
                  width={40}
                  height={40}
                  className="md:w-[50px] md:h-[50px]"
                />
                <section className="flex flex-col gap-1">
                  <span className="font-normal text-base text-black">
                    Children’s Ground
                  </span>
                  <p className="font-semibold text-base text-black text-wrap">
                    Thanks to your support, our building plan has been approved.
                  </p>
                </section>
              </div>

              <div className="flex flex-col gap-1 justify-end mt-auto">
                <p className="font-dm font-medium text-lg md:text-xl text-black">
                  Campaign updates
                </p>
                <span className="font-source font-normal text-base text-black">
                  Inform donors of progress made on your projects
                </span>
              </div>
            </section>
          </section>
        </div>
      </div>
      <div className="px-4 md:px-12 flex flex-col md:flex-row gap-4 md:gap-5 w-full h-fit my-5">
        <section className="bg-[url('/images/video.png')] bg-cover bg-no-repeat w-full md:w-1/3 h-60 md:h-[650px]">
          <section className="bg-[linear-gradient(180deg,rgba(255,255,255,0)_70%,#F2F1E9_100%)] h-full px-2 md:px-4 py-4 md:py-6 flex flex-col">
            <section className="flex items-center justify-center my-auto">
              <PiYoutubeLogoLight color="white" size={48} strokeWidth={0.1} className="md:w-[100px] md:h-[100px] w-[48px] h-[48px]" />
            </section>
            <div className="flex flex-col gap-1 justify-end ">
              <p className="font-dm font-medium text-lg md:text-xl text-black">
                Video explainers
              </p>
              <span className="font-source font-normal text-base text-black">
                Maximise engagement with campaign videos
              </span>
            </div>
          </section>
        </section>
        <section className="bg-[#F5F5F5] w-full md:w-2/3 h-60 md:h-[650px] ">
          <section className="bg-[linear-gradient(180deg,rgba(255,255,255,0)_70%,#fff_100%)] h-full px-2 md:px-4 py-4 md:py-6 flex flex-col">
            <NotificationsList />

            <div className="flex flex-col gap-1 justify-end mt-auto">
              <p className="font-dm font-medium text-lg md:text-xl text-black">
                Instant notifications
              </p>
              <span className="font-source font-normal text-base text-black">
                Never miss out on any donation, get notifications on-the-go
              </span>
            </div>
          </section>
        </section>
      </div>
    </div>
  );
};

export default Main;