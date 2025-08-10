"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import CardDetailsDrawer from "@/components/homepage/CardDetailsDrawer";
import CampaignCreatorAvatar from "@/components/ui/campaign-creator-avatar";

const cardDetails = [
  {
    id: "1",
    title: "91 Days of Kindness Challenge",
    description:
      "Nigeria is a nation built on resilience, unity, and a love for community. This campaign aims to spread kindness across the country, one act at a time. Join us in making a difference!",
    raised: "₦1,201,000 raised",
    image: "/images/card-img1.png",
    extra: "Goal: ₦2,000,000. Over 500 acts of kindness completed so far!",
    date: "March 24, 2025",
    timeLeft: "5 days left",
    avatar: "/images/avatar-7.png",
    creator: "Adebola Ajani",
    createdFor: "Ajegunle Children's Charity",
    percentage: "40%",
    total: "₦3,000,000 total",
    donors: 64,
  },
  {
    id: "2",
    title: "Let's Help Get Jeffrey off the Streets",
    description:
      "Jeffrey has been a recognisable face in Brunswick village. This campaign is dedicated to helping him find a home and a new start. Your support can change a life.",
    raised: "$121,500 raised",
    image: "/images/card-img2.png",
    extra: "Goal: $150,000. Housing secured, now raising for job training.",
    date: "April 28, 2025",
    timeLeft: "12 days left",
    avatar: "/images/avatar-7.png",
    creator: "Adebola Ajani",
    createdFor: "Ajegunle Children's Charity",
    percentage: "93%",
    total: "₦3,000,000 total",
    donors: 64,
  },
  {
    id: "3",
    title: "Support Kamala's Tuition at Westfield",
    description:
      "Kamala, our first daughter won a part-scholarship to Westfield College. We need your help to cover the remaining tuition fees and ensure her education continues.",
    raised: "₦12,035,000 raised",
    image: "/images/card-img3.png",
    extra: "Goal: ₦20,000,000. Every donation brings us closer to Kamala's dream.",
    date: "May 15, 2025",
    timeLeft: "8 days left",
    avatar: "/images/avatar-7.png",
    creator: "Adebola Ajani",
    createdFor: "Ajegunle Children's Charity",
    percentage: "60%",
    total: "₦3,000,000 total",
    donors: 64,
  },
];

const Cards = ({ campaignId }: { campaignId: string }) => {
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [relatedCampaigns, setRelatedCampaigns] = useState(cardDetails);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const fetchRelatedCampaigns = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/campaigns?limit=5');
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
                     // Transform API data to match cardDetails format
           const transformedCampaigns = result.data.map((campaign: any) => {
             // Format currency symbol
             const getCurrencySymbol = (currency: string) => {
               switch (currency.toUpperCase()) {
                 case 'USD': return '$';
                 case 'CAD': return 'C$';
                 case 'EUR': return '€';
                 case 'GBP': return '£';
                 case 'NGN': return '₦';
                 case 'JPY': return '¥';
                 case 'AUD': return 'A$';
                 case 'CHF': return 'CHF';
                 case 'CNY': return '¥';
                 case 'INR': return '₹';
                 default: return currency;
               }
             };
             
             const currencySymbol = getCurrencySymbol(campaign.currency);
             
                            // Get the first image from gallery or use cover image as fallback
               const getImageUrl = () => {
                 if (campaign.galleryImages && campaign.galleryImages.length > 0) {
                   const firstImage = campaign.galleryImages[0];
                   // Check if it's a valid image path (not an upload path that might not exist)
                   if (firstImage && !firstImage.startsWith('/uploads/')) {
                     return firstImage;
                   }
                 }
                 return campaign.coverImageUrl && !campaign.coverImageUrl.startsWith('/uploads/') 
                   ? campaign.coverImageUrl 
                   : "/images/card-img1.png";
               };
               
               return {
                 id: campaign.id,
                 title: campaign.title,
                 description: campaign.description,
                 raised: `${currencySymbol}${campaign.currentAmount.toLocaleString()} raised`,
                 image: getImageUrl(),
                 extra: `Goal: ${currencySymbol}${campaign.goalAmount.toLocaleString()}. ${Math.round((campaign.currentAmount / campaign.goalAmount) * 100)}% funded!`,
                 date: new Date(campaign.createdAt).toLocaleDateString(),
                 timeLeft: "5 days left", // This would need to be calculated
                 avatar: campaign.creatorAvatar || "/images/avatar-7.png",
                 creator: campaign.creatorName,
                 createdFor: campaign.fundraisingFor,
                 percentage: `${Math.round((campaign.currentAmount / campaign.goalAmount) * 100)}%`,
                 total: `${currencySymbol}${campaign.goalAmount.toLocaleString()} total`,
                 donors: campaign.stats?.uniqueDonors || 0,
               };
           });
          setRelatedCampaigns(transformedCampaigns);
        }
      } catch (err) {
        console.error('Error fetching related campaigns:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch related campaigns');
        // Keep using the default cardDetails as fallback
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedCampaigns();
  }, [campaignId]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -400,
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 400,
        behavior: "smooth",
      });
    }
  };

  const handleCardClick = (card: any) => {
    setSelectedCard(card);
    setIsDrawerOpen(true);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-semibold text-2xl md:text-3xl text-black">
          Related campaigns
        </h2>
        <div className="flex gap-2">
          <button
            onClick={scrollLeft}
            className="w-10 h-10 bg-white border border-[#D9D9D9] rounded-full flex items-center justify-center hover:bg-gray-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={scrollRight}
            className="w-10 h-10 bg-white border border-[#D9D9D9] rounded-full flex items-center justify-center hover:bg-gray-50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#104901]"></div>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Error loading related campaigns: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#104901] text-white rounded-lg hover:bg-[#0a3a01]"
          >
            Try Again
          </button>
        </div>
      )}

      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
      >
        {relatedCampaigns.map((card) => (
          <div
            key={card.id}
            className="min-w-[300px] md:min-w-[400px] bg-white border border-[#D9D9D9] rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleCardClick(card)}
          >
            <div className="relative">
              <Image
                src={card.image}
                alt={card.title}
                width={400}
                height={200}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-4 left-4">
                <span className="bg-[#104901] text-white px-3 py-1 rounded-full text-sm font-medium">
                  {card.percentage}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg text-black mb-2 line-clamp-2">
                {card.title}
              </h3>
              <p className="text-sm text-[#757575] mb-3 line-clamp-2">
                {card.description}
              </p>
              <div className="flex items-center gap-2 mb-3">
                <CampaignCreatorAvatar
                  creatorName={card.creator}
                  creatorAvatar={card.avatar}
                  size={24}
                />
                <span className="text-sm text-[#757575]">
                  by {card.creator}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg text-black">
                  {card.raised}
                </span>
                <span className="text-sm text-[#757575]">
                  {card.donors} donors
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <CardDetailsDrawer
        card={selectedCard}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        currentIndex={0}
        totalCards={relatedCampaigns.length}
        onPrevious={() => {}}
        onNext={() => {}}
      />
    </div>
  );
};

export default Cards;