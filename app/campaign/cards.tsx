"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { R2Image } from "@/components/ui/r2-image";
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



const Cards = ({ campaignId }: { campaignId: string }) => {
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [relatedCampaigns, setRelatedCampaigns] = useState<any[]>([]);
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
              // Check if gallery has valid images
              if (campaign.galleryImages && campaign.galleryImages.length > 0) {
                const firstImage = campaign.galleryImages[0];
                // Check if it's a valid image URL
                if (firstImage && firstImage !== 'undefined') {
                  return firstImage;
                }
              }
              
              // Check cover image
              if (campaign.coverImageUrl && campaign.coverImageUrl !== 'undefined') {
                return campaign.coverImageUrl;
              }
              
              // Use fallback image
              return "/images/card-img1.png";
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
        } else {
          // If no campaigns found, show empty state
          setRelatedCampaigns([]);
        }
      } catch (err) {
        console.error('Error fetching related campaigns:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch related campaigns');
        setRelatedCampaigns([]);
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

  // Show loading state
  if (loading) {
    return (
      <div className="w-full px-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-semibold text-2xl md:text-3xl text-black">
            Related campaigns
          </h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#104901] mx-auto mb-2"></div>
            <p className="text-sm text-[#757575]">Loading related campaigns...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="w-full px-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-semibold text-2xl md:text-3xl text-black">
            Related campaigns
          </h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-sm text-[#757575] mb-2">Couldn't load related campaigns</p>
            <button 
              onClick={() => window.location.reload()} 
              className="text-[#104901] text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state
  if (relatedCampaigns.length === 0) {
    return (
      <div className="w-full px-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-semibold text-2xl md:text-3xl text-black">
            Related campaigns
          </h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-sm text-[#757575]">No related campaigns found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6">
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

      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
      >
        {relatedCampaigns.map((card: any) => (
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