import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

type Props = {};

const Footer = (props: Props) => {
  return (
    <div className="bg-[#104901] border border-[#B5C7B080] py-10 font-source">
      <div className="px-10 py-5">
        <p className="font-normal text-base text-white">
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
        <p className="font-medium text-lg text-[#ADADAD] my-2 uppercase">
          Disclaimer: <br /> We reserve the right to open, extend, shorten or
          even close a fundraising campaign if we suspect any misuse or
          fraudulent activity.
        </p>
      </div>

      <hr color="#B5C7B080" className="w-full" />

      <div className="px-10 py-5 flex justify-between items-center">
        <section className="flex flex-col gap-2">
          <section className="flex gap-2 items-center">
            <Image
              src="/images/logo-white.png"
              alt="Chainfundit Logo"
              width={48}
              height={48}
            />
            <p className="font-bold text-[40px] text-white">Chainfundit</p>
          </section>
          <Link
            href="mailto:hello@chainfundit.com"
            className="font-normal text-xl text-white"
          >
            hello@chainfundit.com
          </Link>
          <section className="flex gap-2 items-center">
            <Facebook size={24} color="white" />
            <Instagram size={24} color="white" />
            <Twitter size={24} color="white" />
            <Linkedin size={24} color="white" />

            <span className="font-normal text-xl text-white">@chainfundit</span>
          </section>
        </section>
      </div>

      <div className="flex justify-between items-center px-10">
        <p className="font-normal text-base text-white">@ Copyright 2025 Chainfundit Limited</p>
        <section className="flex gap-3 items-center">
          {[
            { src: "/images/paystack-white.png", alt: "Paystack", width: 177 },
            { src: "/images/stripe-white.png", alt: "Stripe", width: 47 },
            { src: "/images/visa-white.png", alt: "Visa", width: 56 },
            { src: "/images/mastercard-white.png", alt: "Mastercard", width: 32 },
            { src: "/images/amex-white.png", alt: "American Express", width: 28 },
            { src: "/images/google-pay-white.png", alt: "Google Pay", width: 49 },
            { src: "/images/apple-pay-white.png", alt: "Apple Pay", width: 48 },
          ].map((img) => (
            <Image
              key={img.src}
              src={img.src}
              alt={img.alt}
              width={img.width}
              height={20}
              style={{ objectFit: "contain" }}
            />
          ))}
        </section>
      </div>
    </div>
  );
};

export default Footer;
