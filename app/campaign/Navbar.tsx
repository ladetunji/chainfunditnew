"use client";

import { NotificationAlert } from "@/components/dashboard/NotificationAlert";
import { Button } from "@/components/ui/button";
import { Bell, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";

type Props = {};

const Navbar = (props: Props) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 z-50 w-full bg-white shadow font-source px-4 py-4 md:px-12 md:py-6">
      <div className="flex justify-between items-center">
        <Link href="/" className="flex gap-1 items-center">
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
        {/* Desktop nav */}
        <ul className="hidden md:flex justify-between gap-3 font-semibold text-base text-black">
          <li>
            <Link href="/campaigns">Campaigns</Link>
          </li>
          <li>
            <Link href="#">For Individuals</Link>
          </li>
          <li>
            <Link href="#">For Charities</Link>
          </li>
          <li>
            <Link href="/virtual-giving-mall">Virtual Giving Mall</Link>
          </li>
          <li>
            <Link href="/faqs" className="">
              FAQs
            </Link>
          </li>
        </ul>
        <section className="hidden md:flex items-center gap-4">
          <Link href="/create-campaign">
            <Button className="px-4 py-3 border-2 border-white text-base font-semibold rounded-none">
              Create Campaign
            </Button>
          </Link>
          <Search color="#757575" size={24} />
          <NotificationAlert />
         
          <Link href="/settings">
            <Image
              src="/images/user.png"
              alt="User"
              width={32}
              height={32}
              className="w-8 h-8"
            />
          </Link>
        </section>
      </div>
      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden mt-4 flex flex-col gap-4 animate-fade-in">
          <ul className="flex flex-col gap-2 font-semibold text-base text-black">
            <li>
              <Link href="/campaigns">Campaigns</Link>
            </li>
            <li>
              <Link href="#" onClick={() => setMenuOpen(false)}>
                For Individuals
              </Link>
            </li>
            <li>
              <Link href="#" onClick={() => setMenuOpen(false)}>
                For Charities
              </Link>
            </li>
            <li>
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
          <div className="flex flex-col gap-4">
            <Link href="/create-campaign">
              <Button className="w-full px-4 py-3 border-2 border-white text-base font-semibold rounded-none">
                Create Campaign
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <Search color="#757575" size={24} />
              <NotificationAlert />
              <Bell color="#757575" size={24} />
            </div>
            <Link href="/settings">
              <Image
                src="/images/user.png"
                alt="User"
                width={32}
                height={32}
                className="w-8 h-8"
              />
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
