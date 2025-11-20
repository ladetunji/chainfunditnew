"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, LogOut, Settings } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import UserAvatar from "@/components/ui/user-avatar";
import { useUserProfile } from "@/hooks/use-user-profile";
import SessionStatusIndicator from "./SessionStatusIndicator";
import { NotificationAlert } from "./NotificationAlert";

type Props = {};

const Navbar = (props: Props) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const { profile } = useUserProfile();

  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast.success("Logged out successfully");
        router.push("/signin");
      } else {
        toast.error("Failed to logout");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const userName = profile?.fullName || "Your Account";
  const userEmail = profile?.email || "user@chainfundit.com";
  const avatarSrc = profile?.avatar || "/images/user.png";
  const avatarInitial =
    profile?.fullName?.charAt(0)?.toUpperCase() ||
    userEmail?.charAt(0)?.toUpperCase() ||
    "U";

  return (
    <nav className="px-2 md:px-10 py-3 md:py-5 flex flex-col md:flex-row justify-between items-center font-source border-b border-[#C0BFC4] w-full">
      <div className="flex w-full md:w-auto justify-between items-center">
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
      </div>
      {/* Desktop nav */}
      <ul className="hidden md:flex justify-between gap-6 font-semibold text-base text-black">
        <li>
          <Link href="/dashboard">My Dashboard</Link>
        </li>
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-3 border border-gray-100 rounded bg-transparent px-3 py-2 transition hover:bg-[#F8F8F8] focus:outline-none"
            >
              <UserAvatar size={32} className="w-8 h-8" />
              <div className="flex flex-col text-left">
                <span className="text-sm font-semibold text-[#104901]">
                  {userName}
                </span>
                <span className="text-xs text-[#6B7280]">{userEmail}</span>
              </div>
              <ChevronsUpDown className="h-4 w-4 text-[#6B7280]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 rounded-2xl border border-[#E8E8E8] p-3"
          >
            <DropdownMenuLabel className="flex items-center gap-3 p-0">
              <Avatar className="h-9 w-9 border border-[#E8E8E8]">
                <AvatarImage src={avatarSrc} alt={userName} />
                <AvatarFallback className="text-sm font-semibold text-[#104901]">
                  {avatarInitial}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[#104901]">
                  {userName}
                </span>
                <span className="text-xs text-[#6B7280]">{userEmail}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-2" />
            <DropdownMenuItem asChild>
              <Link
                href="/settings"
                className="flex items-center gap-2 text-sm text-[#1F2937] cursor-pointer"
              >
                <Settings className="h-4 w-4 text-[#6B7280]" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-2" />
            <DropdownMenuItem
              onSelect={handleLogout}
              disabled={isLoggingOut}
              className="text-red-600 focus:text-red-600 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? "Logging out..." : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </section>
      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden mt-4 flex flex-col gap-4 w-full animate-fade-in">
          <ul className="flex flex-col gap-2 font-semibold text-base text-black">
            <li>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                My Dashboard
              </Link>
            </li>
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
              <Link
                href="/virtual-giving-mall"
                onClick={() => setMenuOpen(false)}
              >
                Virtual Giving Mall
              </Link>
            </li>
            <li>
              <Link href="/faq" onClick={() => setMenuOpen(false)}>
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
