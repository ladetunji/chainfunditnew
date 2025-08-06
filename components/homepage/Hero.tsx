"use client";

import React from "react";
import { ArrowRight, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Props = {};

const Hero = (props: Props) => {
  const router = useRouter();

  const handleCreateCampaign = () => {
    router.push("/create-campaign");
  };

  return (
    <div className="mt-24 md:mt-36 mb-6 font-source px-4 md:px-12">
      <div className="flex flex-col md:flex-row gap-5 w-full h-fit my-5">
        <section className="w-full md:w-2/3 bg-[url('/images/bolu.png')] bg-cover bg-no-repeat h-60 md:h-[600px] flex">
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 mt-auto ml-4 md:ml-16 -mb-3">
            <section className="w-fit h-fit bg-[#FFFFFF33] rounded-xl backdrop-blur-sm p-2.5 mb-2 md:mb-0">
              <div className="flex gap-2">
                <p className="w-6 h-6 bg-[#104901] rounded-sm flex justify-center items-center font-source font-bold text-lg text-white">
                  ₦
                </p>
                <span className="font-source font-semibold text-base text-white">Amount raised</span>
              </div>
              <p className="font-source font-semibold text-2xl md:text-3xl text-white">400,000</p>
            </section>
            <section className="w-fit h-fit bg-[#FFFFFF33] rounded-xl backdrop-blur-sm p-2.5">
              <div className="flex gap-2">
                <p className="w-6 h-6 bg-[#104901] rounded-sm flex justify-center items-center font-source font-bold text-base text-white">
                  <Headphones size={16} />
                </p>
                <span className="font-source font-semibold text-base text-white">Campaign goal</span>
              </div>
              <p className="font-source font-semibold text-2xl md:text-3xl text-white">Hearing aids for Bolu</p>
            </section>
          </div>
        </section>
        <section className="w-full md:w-1/3 flex flex-col mt-4 md:mt-auto gap-3">
          <div className="flex gap-2 items-center">
            <ul className="flex">
              <li className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white">
                <Image
                  src="/images/avatar-3.png"
                  alt="avatar"
                  width={32}
                  height={32}
                  className="md:w-10 md:h-10"
                />
              </li>
              <li className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white -ml-3">
                <Image
                  src="/images/avatar-4.png"
                  alt="avatar"
                  width={32}
                  height={32}
                  className="md:w-10 md:h-10"
                />
              </li>
              <li className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white -ml-3">
                <Image
                  src="/images/avatar-5.png"
                  alt="avatar"
                  width={32}
                  height={32}
                  className="md:w-10 md:h-10"
                />
              </li>
              <li className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white -ml-3">
                <Image
                  src="/images/avatar-6.png"
                  alt="avatar"
                  width={32}
                  height={32}
                  className="md:w-10 md:h-10"
                />
              </li>
            </ul>
            <p className="font-source font-normal text-xs md:text-sm text-black">
              Over 100 life-changing experiences created on Chainfundit
            </p>
          </div>

          <p className="font-source font-bold text-3xl md:text-5xl text-black">
            Change the world{" "}
            <span className="font-serif font-semibold italic">
              one donation{" "}
            </span>
            at a time
          </p>
          <span className="font-source font-medium text-base text-black">
            Support causes you love with fundraisers built on modern tools
          </span>
          <Button 
            className="h-12 md:h-16 flex justify-between font-source font-semibold text-lg md:text-2xl"
            onClick={handleCreateCampaign}
          >
            Create Campaign <ArrowRight size={24} className="md:text-3xl" />{" "}
          </Button>
        </section>
      </div>
    </div>
  );
};

export default Hero;
