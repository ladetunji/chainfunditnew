"use client";

import React from "react";
import { useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";

type Props = {};

const carouselData = [
  {
    image: "/images/signin-1.png",
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
      className="w-full h-screen overflow-y-auto relative"
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
    <div className="w-full flex gap-5 p-5 font-source h-screen">
      <div
        className="w-2/5 flex flex-col gap-3 pt-5"
        style={{
          background:
            "linear-gradient(180deg, #F2F1E9 75%, rgba(255, 255, 255, 0.5) 100%)",
        }}
      >
        {children}
      </div>

      <div className="w-3/5 relative hidden lg:block">
        <Carousel />
      </div>
    </div>
  );
};

export default layout;
