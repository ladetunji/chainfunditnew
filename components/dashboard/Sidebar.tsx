"use client";

import { Share, PackageOpen, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { LifeBuoy } from "react-feather";
import { BiDonateHeart } from "react-icons/bi";
import { toast } from "sonner";

type Props = {};

const links = [
  {
    href: "/dashboard/campaigns",
    icon: <PackageOpen size={40} />,
    label: "Campaigns",
  },
  {
    href: "/donations",
    icon: <BiDonateHeart size={40} />,
    label: "Donations",
  },
  {
    href: "/payouts",
    icon: <Share size={40} />,
    label: "Payouts",
  },
  {
    href: "/settings",
    icon: <LifeBuoy size={40} />,
    label: "Settings",
  },
];

const Sidebar = (props: Props) => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Logged out successfully');
        router.push('/signin');
      } else {
        toast.error('Failed to logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  return (
    <div className="w-full font-source font-semibold text-[28px] text-[#8E8C95]">
      <div className="flex flex-col gap-2 p-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex gap-3 items-center p-4 ${
              pathname === link.href
                ? "bg-[#FFFEF8] text-[#104901] shadow-sm"
                : ""
            }`}
          >
            <section
              className={` ${pathname === link.href ? " text-[#5F8555]" : "text-black"}`}
            >
              {link.icon}
            </section>

            {link.label}
          </Link>
        ))}
        
        {/* Logout Button */}
        {/* <button
          onClick={handleLogout}
          className="flex gap-3 p-4 text-left text-[#8E8C95] hover:bg-[#FFFEF8] hover:text-[#104901] transition-colors"
        >
          <LogOut size={40} className="text-black" />
          Logout
        </button> */}
      </div>
    </div>
  );
};

export default Sidebar;
