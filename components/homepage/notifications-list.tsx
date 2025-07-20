"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { AnimatedList } from "@/components/magicui/animated-list";

interface Item {
  name: string;
  message: string;
  paymentChannel: string;
  logo: string;
  alt: string;
}

let notifications = [
  {
    name: "Thomas’ Tuition",
    message: "You received a donation of $1,300 from DeSean",
    paymentChannel: "/images/stripe.png",
    logo: "/images/logo.svg",
    alt: "Stripe Logo",
  },
  {
    name: "Thomas’ Tuition",
    message: "You received a donation of ₦100,000 from Abdullahi",
    paymentChannel: "/images/paystack.png",
    logo: "/images/logo.svg",
    alt: "Paystack Logo",
  },
  {
    name: "Thomas’ Tuition",
    message: "You received a donation of $2,000 from Carlos",
    paymentChannel: "/images/stripe.png",
    logo: "/images/logo.svg",
    alt: "Stripe Logo",
  },
  {
    name: "Thomas’ Tuition",
    message: "You received a donation of £300 from Jessica",
    paymentChannel: "/images/stripe.png",
    logo: "/images/logo.svg",
    alt: "Stripe Logo",
  },
];

notifications = Array.from({ length: 10 }, () => notifications).flat();

const Notification = ({ name, message, paymentChannel, logo, alt }: Item) => {
  return (
    <figure
      className={cn(
        "relative mx-auto min-h-fit w-full max-w-[720px] cursor-pointer overflow-hidden rounded-2xl p-4",
        // animation styles
        "transition-all duration-200 ease-in-out hover:scale-[103%]",
        // light styles
        "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
        // dark styles
        "transform-gpu dark:bg-transparent dark:backdrop-blur-md dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]"
      )}
    >
      <section className="w-[660px] h-fit p-3 flex justify-between items-center bg-white rounded-xl">
        <section className="flex gap-3">
          <div className="w-[94px] h-[56px] flex items-center justify-center">
            <Image
              src={paymentChannel}
              alt={alt}
              width={94}
              height={56}
              className="object-contain"
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-source font-normal text-base text-black">
              {name}
            </span>
            <p className="font-dm font-semibold text-lg text-black">
              {message}
            </p>
          </div>
        </section>

        <Image src={logo} alt="Chainfundit Logo" width={36} height={36} />
      </section>
    </figure>
  );
};

export function NotificationsList({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex h-[500px] w-full flex-col overflow-hidden p-2",
        className
      )}
    >
      <AnimatedList>
        {notifications.map((item, idx) => (
          <Notification {...item} key={idx} />
        ))}
      </AnimatedList>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-background"></div>
    </div>
  );
}