"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NotificationsList } from "@/components/homepage/notifications-list";
import BenefitsCarousel from "./BenefitsCarousel";
import { useCharities } from "@/hooks/use-charities";
import { ShieldCheck } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";
type Props = {};

const Main = (props: Props) => {
  const images = [
    "/images/main-3.png", // Image 1: multi-currency
    "/images/teamwork.png", // Image 2: two people lifting
    "/images/secure.png", // Image 3: secure payments
  ];

  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const {
    charities,
    loading: charitiesLoading,
    error: charitiesError,
  } = useCharities({
    verified: true,
    active: true,
    limit: 12,
  });

  const toggleVideoPlayPause = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  // Filter charities based on selected filter
  const filteredCharities = charities.filter((charity) => {
    const category = charity.category?.toLowerCase() ?? "";

    switch (selectedFilter) {
      case "health":
        return (
          category.includes("health") ||
          category.includes("medical")
        );
      case "education":
        return (
          category.includes("education") ||
          category.includes("youth") ||
          category.includes("children")
        );
      case "environment":
        return (
          category.includes("environment") ||
          category.includes("climate") ||
          category.includes("wildlife")
        );
      default:
        return true;
    }
  });

  const displayCharities = filteredCharities.slice(0, 3);

  // Transform charity data to match the expected format
  const cardDetails = displayCharities.map((charity) => {
    const focusAreas =
      charity.focusAreas && charity.focusAreas.length > 0
        ? charity.focusAreas.slice(0, 3).join(", ")
        : null;

    return {
      id: charity.id,
      slug: charity.slug,
      title: charity.name,
      description:
        charity.description ||
        charity.mission ||
        "Learn more about this charity's impact.",
      image:
        charity.coverImage ||
        charity.logo ||
        "/images/card-img1.png",
      category: charity.category || "Community",
      country: charity.country || "International",
      focusAreas,
      isVerified: charity.isVerified,
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
      {/* charity cards */}
      <div className="p-4 md:p-12 w-full h-fit flex flex-col gap-5 my-5 bg-whitesmoke">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 md:gap-0">
          <section className="flex flex-col gap-2 md:gap-3">
            <p className="font-source font-semibold text-2xl md:text-3xl text-black">
              Discover inspiring charities to support
            </p>
            <span className="font-source font-normal text-base text-black">
              Support verified causes from the Virtual Giving Mall
            </span>
          </section>

          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-full md:w-[250px] h-12 md:h-14 px-4 md:px-6 font-source font-normal text-base text-black border-2 border-[#0F4201] rounded-none">
              <SelectValue placeholder="All charities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="capitalize cursor-pointer">
                All verified charities
              </SelectItem>
              <SelectItem value="health" className="capitalize cursor-pointer">
                Health & medical initiatives
              </SelectItem>
              <SelectItem
                value="education"
                className="capitalize cursor-pointer"
              >
                Education & youth programmes
              </SelectItem>
              <SelectItem
                value="environment"
                className="capitalize cursor-pointer"
              >
                Environment & climate action
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col md:flex-row gap-3 w-full">
          {/* Loading State */}
          {charitiesLoading && (
            <div className="flex items-center justify-center w-full py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#104901] mb-4"></div>
              <p className="text-[#104901] text-xl ml-4">
                Loading charities...
              </p>
            </div>
          )}

          {/* Error State */}
          {charitiesError && !charitiesLoading && (
            <div className="flex flex-col items-center justify-center w-full py-16">
              <div className="text-red-500 mb-4">
                <svg
                  className="w-16 h-16"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-2xl text-red-600 mb-3">
                Error Loading Charities
              </h3>
              <p className="text-red-500 text-center mb-4">{charitiesError}</p>
            </div>
          )}

          {/* No Charities State */}
          {!charitiesLoading &&
            !charitiesError &&
            cardDetails.length === 0 && (
            <div className="flex flex-col items-center justify-center w-full py-16">
              <div className="text-[#104901] mb-4">
                <svg
                  className="w-16 h-16"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-2xl text-[#104901] mb-3">
                No Charities Available
              </h3>
              <p className="text-[#104901] text-center">
                Check back later for inspiring charities!
              </p>
            </div>
          )}

          {/* Charity Cards */}
          {!charitiesLoading &&
            !charitiesError &&
            cardDetails.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-8">
              {cardDetails.map((card) => (
                <div
                  key={card.id}
                  className="group relative overflow-hidden rounded-2xl hover:shadow-2xl transition-all duration-500 cursor-pointer"
                  onClick={() =>
                    router.push(`/virtual-giving-mall/${card.slug}`)
                  }
                >
                  <div className="relative h-[500px] bg-whitesmoke backdrop-blur-sm rounded-2xl overflow-hidden">
                    <div className="relative w-full flex items-center justify-center h-[200px] bg-gradient-to-br from-gray-100 to-gray-200">
                      <Image
                        src={card.image}
                        alt={card.title}
                        height={200}
                        width={200}
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {card.isVerified && (
                        <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[#104901] shadow-sm">
                          <ShieldCheck className="h-3 w-3" />
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="p-6 h-full bg-[#F5F5F5]">
                      <h3 className="font-bold text-[#104901] mb-3 text-xl">
                        {card.title.length > 40
                          ? `${card.title.slice(0, 40)}...`
                          : card.title}
                      </h3>
                      <p className="text-gray-600 text-base mb-4 line-clamp-2">
                        {card.description}
                      </p>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#104901] opacity-80">
                            Category
                          </span>
                          <span className="font-semibold text-right">
                            {card.category}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#104901] opacity-80">
                            Location
                          </span>
                          <span className="font-semibold text-right">
                            {card.country}
                          </span>
                        </div>
                        {card.focusAreas && (
                          <div className="text-sm text-gray-500">
                            Focus: {card.focusAreas}
                          </div>
                        )}
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>
                            {card.isVerified
                              ? "Verified charity"
                              : "Verification in progress"}
                          </span>
                        </div>
                          <div className="flex justify-center items-center">
                            <Button variant="outline" className="text-[#104901] font-semibold">
                              <Link href={`/virtual-giving-mall/${card.slug}`}>
                                View details
                              </Link>
                            </Button>
                          </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
          <section className="bg-[url('/images/main-1.jpg')] bg-cover bg-no-repeat w-full md:w-2/3 h-60 md:h-[500px]">
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
          <section className="bg-[url('/images/main-2.jpg')] bg-cover bg-no-repeat w-full md:w-1/3 h-60 md:h-[500px]">
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
        <section className="w-full md:w-1/3 h-60 md:h-[650px] relative overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src="/video/chain-podcast.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <section className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0)_70%,whitesmoke_100%)] h-full px-2 md:px-4 py-4 md:py-6">
            <div className="space-y-1 absolute bottom-5 flex flex-col gap-1 justify-end mt-auto">
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
