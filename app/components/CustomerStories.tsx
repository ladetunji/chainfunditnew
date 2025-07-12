"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";

type Props = {};

const CustomerStories = (props: Props) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const stories = [
    {
      id: 1,
      name: "Thomas",
      image: "/images/story-1.png",
      description:
        "A new chapter began at a new home for the Thomases and their young family.",
    },
    {
      id: 2,
      name: "Bolu",
      image: "/images/story-2.png",
      description:
        "Hearing aids help a young girl experience the world for the first time.",
    },
    {
      id: 3,
      name: "Mariam",
      image: "/images/story-3.png",
      description:
        "Mariam raised funds for a prosthetic arm. Just taking part in life is truly a win for her!",
    },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => {
      if (prev < stories.length - 1) {
        return prev + 1;
      }
      return prev; // Do not wrap around
    });
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => {
      if (prev > 0) {
        return prev - 1;
      }
      return prev;
    });
  };

  return (
    <div className="w-full font-source my-6">
      <div className="bg-[#F2F1E9] px-4 py-12 flex flex-col gap-4">
        <div className="w-full flex justify-between items-start">
          <section className="flex flex-col gap-2">
            <p className="font-semibold text-3xl text-black">
              Loved by over 400 individuals and charities just like you
            </p>
            <span className="font-normal text-base text-black">
              Campaign creators share how their lives changed partnering with
              Chainfundit
            </span>
          </section>
          <section className="flex gap-3 self-start mt-2">
            <Button
              className="w-14 h-14"
              onClick={prevSlide}
              disabled={currentSlide === 0}
            >
              <ArrowLeft size={32} />
            </Button>
            <Button
              className="w-14 h-14"
              onClick={nextSlide}
              disabled={currentSlide >= stories.length - 2}
            >
              <ArrowRight size={32} />
            </Button>
          </section>
        </div>

        <div className="w-full overflow-x-hidden">
          <div
            className="flex gap-6 pr-16 transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * (645 + 24)}px)` }} // 645px width + 24px gap
          >
            {stories.map((story) => (
              <div
                key={story.id}
                className="w-[645px] h-[380px] flex border border-[#B5C7B0] bg-[#F5F5F5]"
              >
                <div className="w-[420px] h-full relative">
                  <Image
                    src={story.image}
                    alt={`${story.name}'s story`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="w-[225px] h-full flex flex-col justify-between p-6 bg-white">
                  <p className="text-3xl font-semibold text-green-800">
                    {story.name}
                  </p>
                  <span className="text-base text-black">
                    {story.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="my-5 pl-5 w-full h-[340px] flex justify-between">
        <section className="flex items-center w-2/3">
          <p className="font-bold text-5xl text-black">
            Launch your campaign for free and begin raising funds in minutes.
          </p>
        </section>
        <section className="w-1/3 bg-[url('/images/logo-bg.png')] bg-cover bg-no-repeat h-full flex items-center">
          <Button className="w-[426px] h-24 flex justify-between items-center font-semibold text-2xl">
            Get Started <ArrowRight />
          </Button>
        </section>
      </div>
    </div>
  );
};

export default CustomerStories;
