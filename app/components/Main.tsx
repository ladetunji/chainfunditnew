"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { PiYoutubeLogoLight } from "react-icons/pi";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import CardDetailsDrawer from "./CardDetailsDrawer";
import { NotificationsMarquee } from "./notififications-marquee";

type Props = {};

const Main = (props: Props) => {
  const images = [
    "/images/main-3.png", // Image 1: multi-currency
    "/images/teamwork.png", // Image 2: two people lifting
    "/images/secure.png", // Image 3: secure payments
  ];

  const [currentImage, setCurrentImage] = useState(0);
  const [openCard, setOpenCard] = useState<number | null>(null);

  const cardDetails = [
    {
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
      createdFor: "Ajegunle Children’s Charity",
      percentage: "40%",
      total: "₦3,000,000 total",
      donors: 64,
    },
    {
      title: "Let’s Help Get Jeffrey off the Streets",
      description:
        "Jeffrey has been a recognisable face in Brunswick village. This campaign is dedicated to helping him find a home and a new start. Your support can change a life.",
      raised: "$121,500 raised",
      image: "/images/card-img2.png",
      extra: "Goal: $150,000. Housing secured, now raising for job training.",
      date: "April 28, 2025",
      timeLeft: "12 days left",
      avatar: "/images/avatar-7.png",
      creator: "Adebola Ajani",
      createdFor: "Ajegunle Children’s Charity",
      percentage: "93%",
      total: "₦3,000,000 total",
      donors: 64,
    },
    {
      title: "Support Kamala’s Tuition at West End Primary",
      description:
        "Kamala, our first daughter, won a part-scholarship to attend West End Primary. Help us cover the remaining tuition and give her the education she deserves!",
      raised: "£2,000 raised",
      image: "/images/card-img3.png",
      extra: "Goal: £5,000. 40% funded. Every bit helps Kamala stay in school!",
      date: "June 4, 2025",
      timeLeft: "7 days left",
      avatar: "/images/avatar-7.png",
      creator: "Adebola Ajani",
      createdFor: "Ajegunle Children’s Charity",
      percentage: "13%",
      total: "₦3,000,000 total",
      donors: 64,
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 4000); // change every 4 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="my-6">
      {/* benefits */}
      <div className="px-12 py-10 w-full h-[650px] p-3 flex gap-10">
        <section
          className="md:w-1/2 h-full bg-cover bg-no-repeat relative"
          style={{
            backgroundImage: `url(${images[currentImage]})`,
            width: "fit",
            height: "fit",
          }}
        >
          <div className="flex justify-center gap-4 mt-6 px-8 w-full absolute top-0 left-0">
            {images.map((_, idx) => (
              <div
                key={idx}
                className="w-[170px] h-[2px] bg-[#8E8C95] rounded overflow-hidden"
              >
                <div
                  className={`h-full bg-white transition-all duration-500 ease-in-out ${
                    currentImage === idx ? "w-[70%]" : "w-0"
                  }`}
                ></div>
              </div>
            ))}
          </div>
        </section>
        <section className="md:w-1/2 h-[650px] flex flex-col mx-auto gap-5">
          <h4 className="font-source font-semibold text-4xl text-black">
            Maximise your fundraising efforts
          </h4>
          <p className="font-source font-normal text-xl text-black">
            We’ll handle the grueling campaign management, so you can do what
            matters most - getting donations
          </p>
          <ul className="flex flex-col gap-2">
            <li className="w-[500px] h-fit bg-[#104901] p-5 flex flex-col gap-2">
              <p className="font-source font-medium text-xl text-white">
                Multi-currency is our thing
              </p>
              <span className="font-source font-normal text-base text-white">
                Raise donations anywhere, in your preferred currency. Explore
                our Crypto options and raise more donations
              </span>
            </li>
            <li className="w-[500px] h-fit bg-[#5F8555] p-5 flex flex-col gap-2">
              <p className="font-source font-medium text-xl text-[#C0BFC4]">
                Chained campaigns
              </p>
              <span className="font-source font-normal text-base text-[#C0BFC4]">
                Our influencer network drives traffic to your campaigns to push
                your closer to your goal even faster
              </span>
            </li>
            <li className="w-[500px] h-fit bg-[#5F8555] p-5 flex flex-col gap-2">
              <p className="font-source font-medium text-xl text-[#C0BFC4]">
                Secure payments
              </p>
              <span className="font-source font-normal text-base text-[#C0BFC4]">
                Industry-standard safety measures secure funds raised and your
                payouts
              </span>
            </li>
          </ul>
        </section>
      </div>
      {/* campaign cards */}
      <div className="p-12 w-full h-fit flex flex-col gap-5 my-5 bg-[#F2F1E9]">
        <div className="flex justify-between items-center">
          <section className="flex flex-col gap-3">
            <p className="font-source font-semibold text-3xl text-black">
              Discover inspiring fundraisers close to you
            </p>
            <span className="font-source font-normal text-base text-black">
              Support campaigns you like, or create one for yourself
            </span>
          </section>

          <Button
            variant="outline"
            className="h-14 px-6 font-source font-normal text-base text-black"
          >
            Happening worldwide <ChevronDown size={24} />
          </Button>
        </div>

        <div className="flex gap-3 w-full">
          {cardDetails.map((card, idx) => (
            <section
              key={idx}
              className="w-1/3 p-2 flex flex-col gap-2 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setOpenCard(idx)}
            >
              <Image
                src={card.image}
                alt={card.title}
                width={400}
                height={300}
              />
              <p className="font-source font-medium text-xl text-black">
                {card.title}
              </p>
              <span className="font-source font-normal text-base text-black">
                {card.description.slice(0, 60)}...
              </span>
              <span className="font-medium text-lg text-black">
                {card.raised}
              </span>
              <div className="w-full bg-[#FBFBFB] h-2">
                <div
                  className={
                    idx === 0
                      ? "w-[60%] bg-[#104901] h-full"
                      : idx === 1
                      ? "w-[93%] bg-[#104901] h-full"
                      : "w-[13%] bg-[#104901] h-full"
                  }
                ></div>
              </div>
            </section>
          ))}
          <CardDetailsDrawer
            open={openCard !== null}
            onOpenChange={(open) => !open && setOpenCard(null)}
            card={openCard !== null ? cardDetails[openCard] : null}
          />
        </div>
      </div>
      {/* features*/}
      <div className="px-12 py-10 mt-5">
        <h2 className="font-semibold text-3xl text-black">
          All you need for a successful fundraiser
        </h2>
        <p className="font-normal text-base text-black">
          Modern, powerful tools to help your fundraisers reach their goals
          quick
        </p>
        <div className="flex gap-5 w-full h-fit my-5">
          <section className="bg-[url('/images/main-1.png')] bg-cover bg-no-repeat md:w-2/3 h-[500px]">
            <section className="bg-[linear-gradient(180deg,rgba(255,255,255,0)_70%,#fff_100%)] h-full px-4 py-6 flex flex-col gap-3">
              <div className="w-[365px] h-fit p-4 rounded-xl bg-white flex items-start gap-3 font-dm">
                <Image
                  src="/images/avatar-1.png"
                  alt="avatar"
                  width={50}
                  height={50}
                />
                <section className="flex flex-col gap-1">
                  <span className="font-normal text-base text-black">You</span>
                  <p className="font-semibold text-base text-black text-wrap">
                    Create a campaign to cover my tuition at Berkshire College.
                    Goal is $24,000.
                  </p>
                </section>
              </div>
              <div className="w-[365px] h-fit p-4 rounded-xl bg-white flex items-start gap-3 font-dm">
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
                  width={50}
                  height={50}
                />
              </div>

              <div className="flex flex-col gap-1 justify-end mt-auto">
                <p className="font-dm font-medium text-xl text-black">
                  AI-powered writing
                </p>
                <span className="font-source font-normal text-base text-black">
                  Create captivating campaign stories with the power of AI
                </span>
              </div>
            </section>
          </section>
          <section className="bg-[url('/images/main-2.png')] bg-cover bg-no-repeat md:w-1/3 h-[500px]">
            <section className="bg-[linear-gradient(180deg,rgba(255,255,255,0)_70%,#fff_100%)] h-full px-4 py-6 flex flex-col gap-3">
              <div className="w-[300px] h-fit p-4 rounded-xl bg-white flex items-start gap-3 font-dm">
                <Image
                  src="/images/avatar-2.png"
                  alt="avatar"
                  width={50}
                  height={50}
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
                <p className="font-dm font-medium text-xl text-black">
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
      <div className="px-12 flex gap-5 w-full h-fit my-5">
        <section className="bg-[url('/images/video.png')] bg-cover bg-no-repeat md:w-1/3 h-[650px]">
          <section className="bg-[linear-gradient(180deg,rgba(255,255,255,0)_70%,#F2F1E9_100%)] h-full px-4 py-6 flex flex-col">
            <section className="flex items-center justify-center my-auto">
              <PiYoutubeLogoLight color="white" size={100} strokeWidth={0.1} />
            </section>
            <div className="flex flex-col gap-1 justify-end ">
              <p className="font-dm font-medium text-xl text-black">
                Video explainers
              </p>
              <span className="font-source font-normal text-base text-black">
                Maximise engagement with campaign videos
              </span>
            </div>
          </section>
        </section>
        <section className="bg-[#F5F5F5] md:w-2/3 h-[650px] ">
          <section className="bg-[linear-gradient(180deg,rgba(255,255,255,0)_70%,#fff_100%)] h-full px-4 py-6 flex flex-col">
            {/* <div className="flex flex-col items-center gap-1 mt-24">
              <section className="w-[660px] h-fit p-3 flex justify-between items-center bg-white rounded-xl">
                <Image
                  src="/images/stripe.png"
                  alt="Stripe Logo"
                  width={94}
                  height={56}
                />
                <div className="flex flex-col gap-2">
                  <span className="font-source font-normal text-base text-black">
                    Thomas’ Tuition
                  </span>
                  <p className="font-dm font-semibold text-lg text-black">
                    You received a donation of $1,300 from DeSean
                  </p>
                </div>

                <Image
                  src="/images/logo.svg"
                  alt="Chainfundit Logo"
                  width={36}
                  height={36}
                />
              </section>
              <section className="w-[680px] h-fit p-3 flex justify-between items-center bg-white rounded-xl">
                <Image
                  src="/images/paystack.png"
                  alt="Paystack Logo"
                  width={112}
                  height={20}
                />
                <div className="flex flex-col gap-2">
                  <span className="font-source font-normal text-base text-black">
                    Thomas’ Tuition
                  </span>
                  <p className="font-dm font-semibold text-lg text-black">
                    You received a donation of ₦100,000 from Abdullahi
                  </p>
                </div>

                <Image
                  src="/images/logo.svg"
                  alt="Chainfundit Logo"
                  width={36}
                  height={36}
                />
              </section>
              <section className="w-[700px] h-fit p-3 flex justify-between items-center bg-white rounded-xl">
                <Image
                  src="/images/stripe.png"
                  alt="Stripe Logo"
                  width={94}
                  height={56}
                />
                <div className="flex flex-col gap-2">
                  <span className="font-source font-normal text-base text-black">
                    Thomas’ Tuition
                  </span>
                  <p className="font-dm font-semibold text-lg text-black">
                    You received a donation of $2,000 from Carlos
                  </p>
                </div>

                <Image
                  src="/images/logo.svg"
                  alt="Chainfundit Logo"
                  width={36}
                  height={36}
                />
              </section>
              <section className="w-[720px] h-fit p-3 flex justify-between items-center bg-white rounded-xl">
                <Image
                  src="/images/stripe.png"
                  alt="Stripe Logo"
                  width={94}
                  height={56}
                />
                <div className="flex flex-col gap-2">
                  <span className="font-source font-normal text-base text-black">
                    Thomas’ Tuition
                  </span>
                  <p className="font-dm font-semibold text-lg text-black">
                    You received a donation of £300 from Jessica
                  </p>
                </div>

                <Image
                  src="/images/logo.svg"
                  alt="Chainfundit Logo"
                  width={36}
                  height={36}
                />
              </section>
            </div> */}

            <NotificationsMarquee />

            <div className="flex flex-col gap-1 justify-end mt-auto">
              <p className="font-dm font-medium text-xl text-black">
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
