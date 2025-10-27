"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import useEmblaCarousel from "embla-carousel-react";
import ClientToaster from "@/components/ui/client-toaster";

const carouselData = [
  {
    image: "/images/signin-1.jpg",
    buttonText: "Create campaigns",
    text: "Start raising funds for causes you love on the Chainfundit platform, using modern tools for fundraising  like Stripe, PayPal, Paystack and more to get your funds quickly.",
  },
  {
    image: "/images/signin-2.jpg",
    buttonText: "Chain campaigns",
    text: "Start raising funds for causes you love on the Chainfundit platform, using modern tools for fundraising  like Stripe, PayPal, Paystack and more to get your funds quickly.",
  },
  {
    image: "/images/signin-3.jpg",
    buttonText: "Activate tax incentives",
    text: "Start raising funds for causes you love on the Chainfundit platform, using modern tools for fundraising  like Stripe, PayPal, Paystack and more to get your funds quickly.",
  },
];

// Optimized carousel slide component
const CarouselSlide = React.memo(({ item, index, isActive }: { 
  item: typeof carouselData[0]; 
  index: number; 
  isActive: boolean; 
}) => (
  <div className="embla__slide flex-[0_0_100%] relative h-screen overflow-hidden">
    <Image
      src={item.image}
      alt={`Carousel slide ${index + 1}`}
      fill
      className="object-cover object-center"
      priority={index === 0} 
      loading={index === 0 ? "eager" : "lazy"}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
      sizes="100vw"
    />
  </div>
));

CarouselSlide.displayName = 'CarouselSlide';

function Carousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const progressRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Optimized interval management
  useEffect(() => {
    if (!emblaApi) return;

    const interval = setInterval(() => {
      if (isPlaying) emblaApi.scrollNext();
    }, 5000);

    const handleSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on("select", handleSelect);

    return () => {
      clearInterval(interval);
      emblaApi.off("select", handleSelect);
    };
  }, [emblaApi, isPlaying]);

  return (
    <div
      className="w-full h-screen overflow-hidden"
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
    >
      <div className="embla" ref={emblaRef}>
        <div className="embla__container flex">
          {carouselData.map((item, index) => (
            <CarouselSlide
              key={item.image} // Use image path as key for better React performance
              item={item}
              index={index}
              isActive={selectedIndex === index}
            />
          ))}
        </div>
      </div>
      
      {/* Progress indicators and content */}
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
                className={`h-full bg-white transition-all duration-500 ease-out ${
                  selectedIndex === barIdx ? "w-full" : "w-0"
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
            className="rounded-[30px] -ml-3 border-[3px] border-white hover:text-white hover:bg-transparent px-10 py-3 bg-transparent transition-all duration-300"
            variant="outline"
          >
            {carouselData[selectedIndex].buttonText}
          </Button>
        </div>
        
        <div className="text-sm leading-relaxed">
          {carouselData[selectedIndex].text}
        </div>
      </div>
    </div>
  );
}

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full flex gap-5 md:p-5 p-2 font-source h-screen overflow-y-auto overflow-x-hidden max-w-[1440px] mx-auto">
      <div
        className="w-full md:w-2/5 flex flex-col justify-between items-center"
        style={{
          background:
            "linear-gradient(180deg, whitesmoke 80%, #FFF 85%, whitesmoke 100%)",
        }}
      >
        <div className="w-full flex flex-col gap-3 py-3">{children}</div>
        <ClientToaster />

        {/* lower section */}
        <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center px-2 w-full">
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
      <div className="md:w-3/5 relative hidden lg:block h-screen">
        <Carousel />
      </div>
    </div>
  );
};

export default layout;
