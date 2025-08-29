"use client";

import React from "react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Props = {};

const carouselData = [
  {
    image: "/images/plant.jpg",
    buttonText: "Fundraise",
    text: "Start raising funds for causes you love on the Chainfundit platform, using modern tools for fundraising like Stripe, PayPal, Paystack and more to get your funds quickly.",
  },
  {
    image: "/images/signin-2.png",
    buttonText: "Chain campaigns",
    text: "Start raising funds for causes you love on the Chainfundit platform, using modern tools for fundraising  like Stripe, PayPal, Paystack and more to get your funds quickly.",
  },
  {
    image: "/images/signin-3.png",
    buttonText: "Activate tax incentives",
    text: "Start raising funds for causes you love on the Chainfundit platform, using modern tools for fundraising  like Stripe, PayPal, Paystack and more to get your funds quickly.",
  },
];

function Carousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const progressRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!emblaApi) return;

    const interval = setInterval(() => {
      if (isPlaying) emblaApi.scrollNext();
    }, 5000);

    emblaApi.on("select", () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    });

    return () => clearInterval(interval);
  }, [emblaApi, isPlaying]);

  return (
    <div
      className="w-full h-screen overflow-y-auto"
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
    >
      <div className="embla" ref={emblaRef}>
        <div className="embla__container flex">
          {carouselData.map((item, index) => (
            <div
              className="embla__slide flex-[0_0_100%] relative h-screen overflow-hidden"
              key={index}
            >
              <div
                className="absolute inset-0 bg-cover bg-center z-0"
                style={{
                  backgroundImage: `url(${item.image})`,
                  height: "100%",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "contain",
                }}
              ></div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-8 left-8 right-8 bg-[#56864D] text-white rounded-xl p-6 flex flex-col gap-4 z-10">
        <div className="flex gap-2">
          {[0, 1, 2].map((barIdx) => (
            <div
              key={barIdx}
              ref={(el) => {
                progressRefs.current[barIdx] = el;
              }}
              className={`h-1 bg-white/70 rounded w-full overflow-hidden`}
            >
              <div
                className={`h-full bg-white ${
                  selectedIndex === barIdx ? "animate-fill-bar" : "w-0"
                }`}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center">
          <div className="flex -space-x-3">
            {[...Array(selectedIndex + 1)].map((_, i) => (
              <span
                key={i}
                className="w-[36px] h-[36px] border-[3px] border-white rounded-full bg-transparent"
              />
            ))}
          </div>
          <Button
            className="rounded-[30px] -ml-3 border-[3px] border-white hover:text-white hover:bg-transparent px-10 py-3 bg-transparent"
            variant="outline"
          >
            {carouselData[selectedIndex].buttonText}
          </Button>
        </div>
        <div className="text-sm">{carouselData[selectedIndex].text}</div>
      </div>
    </div>
  );
}

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full flex gap-5 md:p-5 p-2 font-source min-h-screen overflow-y-hidden max-w-[1440px] mx-auto">
      <div
        className="w-full md:w-2/5 flex flex-col gap-5 justify-between items-center"
        style={{
          background:
            "linear-gradient(180deg, #F2F1E9 80%, #FFF 85%, #F2F1E9 100%)",
        }}
      >
        <div className="w-full flex flex-col gap-3 py-3">{children}</div>

        {/* lower section */}
        <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center px-2 py-6 md:py-8 mt-6 md:mt-10 w-full">
          <ul className="flex items-center mb-2 md:mb-0">
            <li className="w-10 h-10 rounded-full border-2 border-[#104901]">
              <Image
                src="/images/avatar-3.png"
                alt="avatar"
                width={40}
                height={40}
              />
            </li>
            <li className="w-10 h-10 rounded-full border-2 border-[#104901] -ml-3">
              <Image
                src="/images/avatar-4.png"
                alt="avatar"
                width={40}
                height={40}
              />
            </li>
            <li className="w-10 h-10 rounded-full border-2 border-[#104901] -ml-3">
              <Image
                src="/images/avatar-5.png"
                alt="avatar"
                width={40}
                height={40}
              />
            </li>
            <li className="w-10 h-10 rounded-full border-2 border-[#104901] -ml-3">
              <Image
                src="/images/avatar-6.png"
                alt="avatar"
                width={40}
                height={40}
              />
            </li>
          </ul>
          <div className="text-center md:text-left">
            <p className="font-source font-semibold text-xs md:text-sm text-black">
              Over 100 Chainfunders can&apos;t be wrong
            </p>
            <span className="font-light text-xs md:text-sm text-black">
              Start fundraising today!
            </span>
          </div>
        </div>
      </div>
{/* right */}
      <div className="md:w-3/5 relative hidden lg:block">
        <Carousel />
      </div>
    </div>
  );
};

export default layout;
