import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

type Props = {};

const Footer = (props: Props) => {
  return (
    <div className="bg-[#104901] border border-[#B5C7B080] py-8 md:py-12 font-source">
      <div className="p-4 md:p-10">
        <p className="font-normal text-sm md:text-base text-white">
          ChainFundIt Limited is a For-Profit Organization operating a
          “Donation-based” Crowdfunding Platform. <br /> Registered in England
          (13253451) <br />
          Please note ChainFundIt has obtained a no-objection from the Financial
          Conduct Authority (“FCA”) to operate a “donation”-based crowdfunding
          platform in the United Kingdom (“UK”). <br /> Kindly also note for
          fundraising campaigns in the United States of America (“US”),
          ChainFundIt does not offer “equity” or “lending”-based crowdfunding
          services, thus is therefore not subject to the United States
          Securities and Exchange Commission (“US SEC”) regulations for
          crowdfunding.
        </p>
        <p className="font-medium text-xs md:text-lg text-[#ADADAD] my-2 uppercase">
          Disclaimer: <br /> We reserve the right to open, extend, shorten or
          even close a fundraising campaign if we suspect any misuse or
          fraudulent activity.
        </p>
      </div>

      <hr color="#B5C7B080" className="w-full" />

      <div className="p-4 md:p-10 w-full flex flex-col md:flex-row md:justify-between md:items-center gap-8 md:gap-0">
        <section className="w-full md:w-1/3 flex flex-col gap-2 mb-6 md:mb-0">
          <section className="flex gap-2 items-center">
            <Image
              src="/images/logo-white.png"
              alt="Chainfundit Logo"
              width={40}
              height={40}
              className="md:w-[48px] md:h-[48px]"
            />
            <p className="font-bold text-2xl md:text-[40px] text-white">Chainfundit</p>
          </section>
          <Link
            href="mailto:hello@chainfundit.com"
            className="font-normal text-base md:text-xl text-white"
          >
            hello@chainfundit.com
          </Link>
          <section className="flex gap-2 items-center flex-wrap">
            <Facebook size={20} className="md:w-6 md:h-6" color="white" />
            <Instagram size={20} className="md:w-6 md:h-6" color="white" />
            <Twitter size={20} className="md:w-6 md:h-6" color="white" />
            <Linkedin size={20} className="md:w-6 md:h-6" color="white" />
            <span className="font-normal text-base md:text-xl text-white">@chainfundit</span>
          </section>
        </section>

        <div className="w-full md:w-2/3 flex flex-col md:flex-row md:justify-between gap-6 md:gap-0">
          <section className="w-full md:w-1/3 flex flex-col gap-2">
            <p className="font-bold text-base text-white uppercase">
              chainfund for
            </p>
            <ul className="flex flex-col gap-2 font-normal text-sm md:text-base text-white">
              <li>Medical Emergencies</li>
              <li>Business</li>
              <li>Memorials</li>
              <li>Events & Weddings</li>
              <li>Education</li>
              <li>Sports</li>
              <li>Charity</li>
            </ul>
          </section>
          <section className="w-full md:w-1/3 flex flex-col gap-2">
            <p className="font-bold text-base text-white uppercase">
              discover
            </p>
            <ul className="flex flex-col gap-2 font-normal text-sm md:text-base text-white">
              <li>About us</li>
              <li>How ChainFundIt works</li>
              <li>Join the Chain Reaction</li>
              <li>Careers</li>
              <li>Success stories</li>
              <li>Pricing</li>
              <li>Blog</li>
            </ul>
          </section>
          <section className="w-full md:w-1/3 flex flex-col gap-2">
            <p className="font-bold text-base text-white uppercase">
              resources
            </p>
            <ul className="flex flex-col gap-2 font-normal text-sm md:text-base text-white">
              <li>Privacy policy</li>
              <li>Terms and Conditions</li>
              <li>Ambassador Agreement</li>
              <li>Fundraising tips</li>
              <li>Fundraising ideas</li>
              <li>Contact us</li>
              <li>Disclaimer</li>
            </ul>
          </section>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center px-4 md:px-10 gap-4 md:gap-0 mt-4">
        <p className="font-normal text-xs md:text-base text-white text-center md:text-left">
          @ Copyright 2025 Chainfundit Limited
        </p>
        <section className="flex flex-wrap gap-2 md:gap-3 items-center justify-center md:justify-end">
          {[
            { src: "/images/paystack-white.png", alt: "Paystack", width: 80 },
            { src: "/images/stripe-white.png", alt: "Stripe", width: 32 },
            { src: "/images/visa-white.png", alt: "Visa", width: 36 },
            {
              src: "/images/mastercard-white.png",
              alt: "Mastercard",
              width: 24,
            },
            {
              src: "/images/amex-white.png",
              alt: "American Express",
              width: 20,
            },
            {
              src: "/images/google-pay-white.png",
              alt: "Google Pay",
              width: 28,
            },
            { src: "/images/apple-pay-white.png", alt: "Apple Pay", width: 28 },
          ].map((img) => (
            <Image
              key={img.src}
              src={img.src}
              alt={img.alt}
              width={img.width}
              height={16}
              className="object-contain"
            />
          ))}
        </section>
      </div>
    </div>
  );
};

export default Footer;
