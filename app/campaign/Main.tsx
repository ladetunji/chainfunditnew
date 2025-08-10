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
} from "lucide-react";
import CTA from "./cta";
import ChainModal from "./chain-modal";
import DonateModal from "./donate-modal";
import ShareModal from "./share-modal";

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
  minimumDonation: number;
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
}

interface MainProps {
  campaignId: string;
}

const images = [
  "/images/story-1.png",
  "/images/thumbnail1.png",
  "/images/thumbnail2.png",
  "/images/thumbnail3.png",
  "/images/thumbnail4.png",
  "/images/thumbnail5.png",
];

const donors = [
  {
    image: "/images/donor1.png",
    name: "Angela Bassett",
    amount: "₦125,000",
  },
  {
    image: "/images/donor2.png",
    name: "Alexander Iwobi",
    amount: "₦120,000",
  },
  {
    image: "/images/donor3.png",
    name: "Chichi Onwuegbo",
    amount: "₦100,000",
  },
  {
    image: "/images/donor4.png",
    name: "Kareem Kapoor",
    amount: "₦100,000",
  },
  {
    image: "/images/donor5.png",
    name: "Sergio Texeira",
    amount: "₦80,000",
  },
  {
    image: "/images/donor6.png",
    name: "Ruslev Mikhailsky",
    amount: "₦50,000",
  },
];

const chainers = [
  {
    image: "/images/donor1.png",
    name: "Angela Bassett",
    numberOfDonations: 20,
    amount: "₦125,000",
  },
  {
    image: "/images/donor6.png",
    name: "Ruslev Mikhailsky",
    numberOfDonations: 12,
    amount: "₦250,000",
  },
  {
    image: "/images/donor2.png",
    name: "Alexander Iwobi",
    numberOfDonations: 6,
    amount: "₦150,000",
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
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch campaign data
  React.useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching campaign with ID:", campaignId);
        const response = await fetch(`/api/campaigns/${campaignId}`);
        console.log("Response status:", response.status);
        if (!response.ok) {
          throw new Error(`Failed to fetch campaign: ${response.status}`);
        }
        const result = await response.json();
        console.log("API response:", result);
        if (!result.success) {
          throw new Error(result.error || "Failed to fetch campaign");
        }
        setCampaign(result.data);
      } catch (err) {
        console.error("Error fetching campaign:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch campaign"
        );
        const dummyCampaign: CampaignData = {
          id: campaignId,
          title: "Support the Thomases' move into a new flat",
          subtitle:
            "A young London caregiver's family needs your help at a better life.",
          description:
            "A little girl lost her teddy bear while visiting Glacier National Park in Montana. One year later, a family friend visiting the park spotted the bear, and now it is reunited with its owner. TODAY's Hoda Kotb has your Morning Boost.",
          reason: "Family",
          fundraisingFor: "Thomas family",
          duration: "30 days",
          videoUrl: "https://example.com/video.mp4",
          coverImageUrl: "/images/story-1.png",
          galleryImages: [
            "/images/thumbnail1.png",
            "/images/thumbnail2.png",
            "/images/thumbnail3.png",
            "/images/thumbnail4.png",
            "/images/thumbnail5.png",
          ],
          documents: [],
          goalAmount: 3000000,
          currency: "NGN",
          minimumDonation: 1000,
          chainerCommissionRate: 5.0,
          currentAmount: 1192000,
          status: "active",
          isActive: true,
          createdAt: "2024-01-15",
          updatedAt: "2024-01-15",
          creatorId: "dummy-creator-id",
          creatorName: "Donald Chopra",
          creatorAvatar: "/images/avatar-7.png",
          stats: {
            totalDonations: 35,
            totalAmount: 1192000,
            uniqueDonors: 28,
            progressPercentage: 40,
          },
        };
        setCampaign(dummyCampaign);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    if (campaignId) {
      fetchCampaign();
    }
  }, [campaignId]);

  // Use campaign data or fallback to mock data
  const campaignData = campaign || {
    title: "91 Days of Kindness Challenge",
    subtitle: "Spreading kindness across Nigeria, one act at a time",
    description: "Nigeria is a nation built on resilience, unity, and a love for community. This campaign aims to spread kindness across the country, one act at a time. Join us in making a difference! We believe that small acts of kindness can create a ripple effect that transforms communities and brings people together.",
    reason: "Community Development",
    fundraisingFor: "Ajegunle Children's Charity",
    creatorName: "Adebola Ajani",
    goalAmount: 3000000,
    currentAmount: 1201000,
    currency: "NGN",
    stats: {
      totalDonations: 35,
      uniqueDonors: 28,
      progressPercentage: 40,
    },
  };

  const raised = campaignData.currentAmount;
  const goal = campaignData.goalAmount;
  const percent = Math.min(100, Math.round((raised / goal) * 100));

  // Use campaign images if available, otherwise fallback to default images
  const campaignImages = campaign?.galleryImages && campaign.galleryImages.length > 0 
    ? campaign.galleryImages 
    : images;

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

          <p className="font-medium text-2xl text-[#757575] md:my-1 my-3">
            Organised by{" "}
            <span className="font-semibold text-[#104901]">
              {campaignData.creatorName}
            </span>{" "}
            for {" "}
            <span className="font-semibold text-[#104901]">
              {campaignData.fundraisingFor}
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
              <LinkIcon size={20} /> 2 chains
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
                <span className="absolute -top-1 -right-1 bg-[#E8F5E8] text-[#104901] text-xs rounded-full w-5 h-5 flex items-center justify-center border border-white">
                  1
                </span>
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "why-support" && (
              <div className="bg-[#F2F1E9] border-x border-b border-[#C0BFC4] font-normal text-sm md:text-xl text-[#104901] p-3 md:p-6 space-y-4">
                <p className="">
                  {campaignData.description}
                </p>

                <div className="space-y-2">
                  <p className="flex items-start gap-2">
                    <span className="">»</span>
                    <span>
                      Subscribe to TODAY:{" "}
                      <a
                        href="http://on.today.com/SubscribeToTODAY"
                        className="underline hover:text-[#0A3A0A]"
                      >
                        http://on.today.com/SubscribeToTODAY
                      </a>
                    </span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="">»</span>
                    <span>
                      Watch the latest from TODAY:{" "}
                      <a
                        href="http://bit.ly/LatestTODAY"
                        className="underline hover:text-[#0A3A0A]"
                      >
                        http://bit.ly/LatestTODAY
                      </a>
                    </span>
                  </p>
                </div>

                <div>
                  <h3 className="mb-2">About: TODAY</h3>
                  <p className="">
                    About: TODAY brings you the latest headlines and expert tips
                    on money, health and parenting. We wake up every morning to
                    give you and your family all you need to start your day. If
                    it matters to you, it matters to us. We are in the people
                    business. Subscribe to our channel for exclusive TODAY
                    archival footage & our original web series.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2">Connect with TODAY Online!</h3>
                  <div className="space-y-1">
                    <p>
                      Visit TODAY&apos;s Website:{" "}
                      <a
                        href="http://on.today.com/ReadTODAY"
                        className="underline hover:text-[#0A3A0A]"
                      >
                        http://on.today.com/ReadTODAY
                      </a>
                    </p>
                    <p>
                      Find TODAY on Facebook:{" "}
                      <a
                        href="http://on.today.com/LikeTODAY"
                        className="underline hover:text-[#0A3A0A]"
                      >
                        http://on.today.com/LikeTODAY
                      </a>
                    </p>
                    <p>
                      Follow TODAY on Twitter:{" "}
                      <a
                        href="http://on.today.com/FollowTODAY"
                        className="underline hover:text-[#0A3A0A]"
                      >
                        http://on.today.com/FollowTODAY
                      </a>
                    </p>
                    <p>
                      Follow TODAY on Instagram:{" "}
                      <a
                        href="http://on.today.com/InstaTODAY"
                        className="underline hover:text-[#0A3A0A]"
                      >
                        http://on.today.com/InstaTODAY
                      </a>
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <p className="">#NationalParks #GoodNews #TODAYShow</p>
                </div>
              </div>
            )}

            {activeTab === "updates" && (
              <div className="bg-[#F2F1E9] border-x border-b border-[#C0BFC4] font-normal text-sm md:text-xl text-[#104901] p-3 md:p-6">
                <p className="">No updates available yet.</p>
              </div>
            )}
          </div>

          {/* top donors */}
          <section>
            <h3 className="text-3xl font-semibold text-black mb-4">
              Top Donors
            </h3>
            <div className="grid md:grid-cols-6 grid-cols-3 gap-3">
              {donors.map((donor, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="relative w-20 h-20 border-2 border-white rounded-3xl overflow-hidden">
                    <Image
                      src={donor.image}
                      alt={donor.name}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <p className="font-normal text-base text-black">
                    {donor.name}
                  </p>
                  <p className="font-medium text-sm text-[#757575]">
                    {donor.amount}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="my-5 py-5 border-y border-[#ADADAD]">
            <h3 className="text-3xl font-semibold text-black mb-4">
              Top Chainers
            </h3>
            <div className="flex gap-8">
              {chainers.map((chainer, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="relative w-20 h-20 border-2 border-white rounded-3xl overflow-hidden">
                    <Image
                      src={chainer.image}
                      alt={chainer.name}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <p className="font-normal text-lg text-black">
                    {chainer.name}
                  </p>
                  <p className="font-medium text-base text-[#5F8555]">
                    {chainer.numberOfDonations} donations
                  </p>
                  <p className="font-medium text-base text-[#757575]">
                    {chainer.amount}
                  </p>
                </div>
              ))}
            </div>
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
            <ul className="my-5 py-3 px-2 bg-white space-y-3 border border-[#C0BFC4] rounded-2xl">
              <li className="flex gap-3 items-center">
                <Image src="/images/donor1.png" alt="" width={64} height={64} />
                <section>
                  <p className="font-normal text-xl text-[#5F8555]">
                    Angela Bassett
                  </p>
                  <p className="font-medium text-xl text-black">
                    ₦20,000 •{" "}
                    <span className="font-normal text-lg text-[#5F8555]">
                      Recent donation
                    </span>{" "}
                  </p>
                </section>
              </li>
              <li className="flex gap-3 items-center">
                <Image
                  src="/images/logo-bg.svg"
                  alt=""
                  width={64}
                  height={64}
                />
                <section>
                  <p className="font-normal text-xl text-[#5F8555]">
                    Anonymous
                  </p>
                  <p className="font-medium text-xl text-black">
                    ₦10,000 •{" "}
                    <span className="font-normal text-lg text-[#5F8555]">
                      Recent donation
                    </span>{" "}
                  </p>
                </section>
              </li>
              <li className="flex gap-3 items-center">
                <Image src="/images/donor4.png" alt="" width={64} height={64} />
                <section>
                  <p className="font-normal text-xl text-[#5F8555]">
                    Kareem Kapoor
                  </p>
                  <p className="font-medium text-xl text-black">
                    ₦100,000 •{" "}
                    <span className="font-normal text-lg text-[#5F8555]">
                      Recent donation
                    </span>{" "}
                  </p>
                </section>
              </li>
            </ul>
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
            {comments.map((comment) => (
              <div className="" key={comment.id}>
                <section className="bg-[#F2F1E9] w-full p-3 space-y-3 rounded-t-xl">
                  <section className="flex gap-2 items-start">
                    <Image src={comment.image} alt="" width={36} height={36} />
                    <section className="space-y-2">
                      <p className="font-semibold text-base text-[#104901]">
                        {comment.name}{" "}
                        <span className="font-normal">made a donation of </span>{" "}
                        {comment.donation}
                      </p>
                      <p className="font-name text-xs text-[#104901]">
                        {comment.time}
                      </p>
                      <p className="font-normal text-xl text-[#104901]">
                        {comment.comment}
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
                  {comment.creator && (
                    <div className="">
                      <section className="flex gap-2 items-center font-semibold text-base text-[#104901]">
                        <Heart color="black" size={20} />{" "}
                        <p>
                          Mojisola <span className="font-normal">and</span> 12
                          others
                        </p>
                      </section>
                      <p className="font-semibold text-base text-[#104901] flex gap-2 items-center">
                        {comment.creator.name}
                        <span className="font-normal text-sm text-[#104901]">
                          {comment.creator.comment}
                        </span>
                      </p>
                      <p className="text-xs text-[#104901]">
                        {comment.creator.time}
                      </p>
                    </div>
                  )}
                </section>
              </div>
            ))}
            <section className="flex justify-center">
              <Button className="bg-transparent h-12 text-[#104901] border-2 border-[#104901]">
                See all coments
              </Button>
            </section>
          </div>
        </div>
      </div>
      <CTA />
      <ChainModal
        open={chainModalOpen}
        onOpenChange={setChainModalOpen}
        campaign={campaign}
      />
      <DonateModal open={donateModalOpen} onOpenChange={setDonateModalOpen} />
      <ShareModal open={shareModalOpen} onOpenChange={setShareModalOpen} />
    </div>
  );
};

export default Main;
