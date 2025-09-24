"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import UserAvatar from "@/components/ui/user-avatar";
import SessionStatusIndicator from "./SessionStatusIndicator";
import { NotificationAlert } from "./NotificationAlert";

type Props = {};

const Navbar = (props: Props) => {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <nav className="px-2 md:px-10 py-3 md:py-5 flex flex-col md:flex-row justify-between items-center font-source border-b border-[#C0BFC4] w-full">
      <div className="flex w-full md:w-auto justify-between items-center">
        <Link href="/dashboard" className="flex gap-1 items-center">
          <Image
            src="/images/logo.svg"
            alt="Chainfundit Logo"
            width={30}
            height={30}
          />
          <p className="font-semibold text-xl text-[#104901]">Chainfundit</p>
        </Link>
        {/* Hamburger for mobile */}
        <button
          className="md:hidden flex flex-col gap-1 focus:outline-none"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span className="block w-6 h-0.5 bg-black"></span>
          <span className="block w-6 h-0.5 bg-black"></span>
          <span className="block w-6 h-0.5 bg-black"></span>
        </button>
      </div>
      {/* Desktop nav */}
      <ul className="hidden md:flex justify-between gap-6 font-semibold text-base text-black">
        <li>
          <Link href="/campaigns">Campaigns</Link>
        </li>
        <li>
          <Link href="#">About</Link>
        </li>
        <li>
          <Link href="/virtual-giving-mall">Virtual Giving Mall</Link>
        </li>
        <li>
          <Link href="/faq" className="">
            FAQs
          </Link>
        </li>
      </ul>
      <section className="hidden md:flex gap-5 items-center">
        <SessionStatusIndicator />
        <Button className="">
          <Link
            href="/create-campaign"
            className="w-full h-full flex items-center justify-center"
          >
            Create Campaign
          </Link>
        </Button>
        <NotificationAlert />
        <Link href="/settings">
          <UserAvatar size={32} className="w-8 h-8" />
        </Link>
      </section>
      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden mt-4 flex flex-col gap-4 w-full animate-fade-in">
          <ul className="flex flex-col gap-2 font-semibold text-base text-black">
            <li>
              <Link href="/campaigns-page" onClick={() => setMenuOpen(false)}>
                Campaigns
              </Link>
            </li>
            <li>
              <Link href="#" onClick={() => setMenuOpen(false)}>
                About
              </Link>
            </li>
            <li>
              <Link href="#" onClick={() => setMenuOpen(false)}>About</Link>
              <Link href="/virtual-giving-mall" onClick={() => setMenuOpen(false)}>
                Virtual Giving Mall
              </Link>
            </li>
            <li>
              <Link href="/faqs" onClick={() => setMenuOpen(false)}>
                FAQs
              </Link>
            </li>
          </ul>
          <div className="flex flex-col gap-2">
            <Button className="w-full">Create Campaign</Button>
            <div className="flex gap-3 items-center justify-center">
              <NotificationAlert />
              <Link href="/settings">
                <UserAvatar size={32} className="w-8 h-8" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
