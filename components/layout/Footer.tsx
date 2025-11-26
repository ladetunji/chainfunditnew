import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { BsTiktok } from "react-icons/bs";

type Props = {};

const Footer = (props: Props) => {
  return (
    <div className="bg-[#104901] border border-[#B5C7B080] py-8 md:py-12 font-source">
      <div className="p-4 md:p-10">
        <p className="font-normal text-sm md:text-base text-white text-left ">
          ChainFundIt Limited is a For-Profit Organization operating a
          “Donation-based” Crowdfunding Platform. Registered in England
          (13253451). Please note ChainFundIt has obtained a no-objection from
          the Financial Conduct Authority (“FCA”) to operate a “donation”-based
          crowdfunding platform in the United Kingdom (“UK”). <br />
          <br /> Kindly also note for fundraising campaigns in the United States
          of America (“US”), ChainFundIt does not offer “equity” or
          “lending”-based crowdfunding services, thus is therefore not subject
          to the United States Securities and Exchange Commission (“US SEC”)
          regulations for crowdfunding.
        </p>
        <p className="font-medium text-xs md:text-lg text-[#ADADAD] my-2 uppercase text-left">
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
            <p className="font-bold text-2xl md:text-[40px] text-white">
              Chainfundit
            </p>
          </section>
          <Link
            href="mailto:campaigns@chainfundit.com"
            className="font-normal text-base md:text-xl text-white"
          >
            campaigns@chainfundit.com
          </Link>
          <section className="flex gap-2 items-center flex-wrap">
            <Link href="https://www.facebook.com/share/1YrZpf7FbC/?mibextid=wwXIfr" target="_blank">
              <Facebook size={20} className="md:w-6 md:h-6" color="white" />
            </Link>
            <Link href="https://www.instagram.com/chainfundit" target="_blank">
              <Instagram size={20} className="md:w-6 md:h-6" color="white" />
            </Link>
            <Link href="https://x.com/chainfundit?s=11" target="_blank">
              <Twitter size={20} className="md:w-6 md:h-6" color="white" />
            </Link>
            <Link href="https://www.linkedin.com/company/chainfundit11/" target="_blank">
              <Linkedin size={20} className="md:w-6 md:h-6" color="white" />
            </Link>
            <Link href="https://www.tiktok.com/@chainfundit?_r=1&_t=ZS-91f2JUhl7um" target="_blank">
              <BsTiktok size={20} className="md:w-6 md:h-6" color="white" />
            </Link>
            <span className="font-normal text-base md:text-xl text-white">
              @chainfundit
            </span>
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
            <p className="font-bold text-base text-white uppercase">discover</p>
            <ul className="flex flex-col gap-2 font-normal text-sm md:text-base text-white">
              <li>
                <Link href="/about">About us</Link>
              </li>
              <li>
                <Link href="/faq">How ChainFundIt works</Link>
              </li>
              <li>
                <Link href="/create-campaign">Join the Chain Reaction</Link>
              </li>
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
              <Link href="/terms-and-conditions">Terms and Conditions</Link>
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
            { src: "/images/paystack-white.png", alt: "Paystack", width: 150 },
            { src: "/images/stripe-white.png", alt: "Stripe", width: 40 },
            { src: "/images/visa-white.png", alt: "Visa", width: 40 },
            {
              src: "/images/mastercard-white.png",
              alt: "Mastercard",
              width: 40,
            },
            {
              src: "/images/amex-white.png",
              alt: "American Express",
              width: 40,
            },
            {
              src: "/images/google-pay-white.png",
              alt: "Google Pay",
              width: 40,
            },
            { src: "/images/apple-pay-white.png", alt: "Apple Pay", width: 40 },
          ].map((img) => (
            <Image
              key={img.src}
              src={img.src}
              alt={img.alt}
              width={img.width}
              height={20}
              className="object-contain"
            />
          ))}
        </section>
      </div>
    </div>
  );
};

export default Footer;
