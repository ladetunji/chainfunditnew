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

type Props = {};

const Main = (props: Props) => {
  
  const images = [
    "/images/main-3.png", // Image 1: multi-currency
    "/images/teamwork.png", // Image 2: two people lifting
    "/images/secure.png", // Image 3: secure payments
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [openCard, setOpenCard] = useState<number | null>(null);

  const handlePreviousCard = () => {
    if (openCard !== null && openCard > 0) {
      setOpenCard(openCard - 1);
    }
  };

  const handleNextCard = () => {
    if (openCard !== null && openCard < cardDetails.length - 1) {
      setOpenCard(openCard + 1);
    }
  };

  const cardDetails = [
    {
      id: "kindness-challenge",
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
      id: "jeffrey-streets",
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
      id: "kamala-tuition",
      title: "Support Kamala's Tuition at West End Primary",
      description:
        "Kamala, our first daughter, won a part-scholarship to attend West End Primary. Help us cover the remaining tuition and give her the education she deserves!",
      raised: "£2,000 raised",
      image: "/images/card-img3.png",
      extra: "Goal: £5,000. 40% funded. Every bit helps Kamala stay in school!",
      date: "June 4, 2025",
      timeLeft: "7 days left",
      avatar: "/images/avatar-7.png",
      creator: "Adebola Ajani",
      createdFor: "Ajegunle Children's Charity",
      percentage: "13%",
      total: "₦3,000,000 total",
      donors: 64,
    },
  ];

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
                live campaigns anywhere (worldwide)
              </SelectItem>
              <SelectItem
                value="need momentum"
                className="capitalize cursor-pointer"
              >
                need momentum (campaigns between 0-10%)
              </SelectItem>
              <SelectItem
                value="close to target"
                className="capitalize cursor-pointer"
              >
                close to target (campaigns above 90%)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col md:flex-row gap-3 w-full">
          {cardDetails.map((card, idx) => (
            <section
              key={idx}
              className="w-full md:w-1/3 p-2 flex flex-col gap-2 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setOpenCard(idx)}
            >
              <Image
                src={card.image}
                alt={card.title}
                width={400}
                height={300}
                className="w-full h-40 md:h-60 object-cover"
              />
              <p className="font-source font-medium text-lg md:text-xl text-black">
                {card.title}
              </p>
              <span className="font-source font-normal text-sm md:text-base text-black">
                {card.description.slice(0, 60)}...
              </span>
              <span className="font-medium text-base md:text-lg text-black">
                {card.raised}
              </span>
              <div className="w-full bg-[#FBFBFB] h-2">
                <div
                  className="bg-[#104901] h-full transition-all duration-500"
                  style={{
                    width: card.percentage
                      ? card.percentage
                      : idx === 0
                      ? "60%"
                      : idx === 1
                      ? "93%"
                      : "13%",
                  }}
                ></div>
              </div>
            </section>
          ))}
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
