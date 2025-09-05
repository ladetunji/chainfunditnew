"use client";

import { Share, PiggyBank } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { LifeBuoy } from "react-feather";
import { BiDonateHeart } from "react-icons/bi";

type Props = {};

const links = [
  {
    href: "/dashboard/campaigns",
    icon: <PiggyBank size={40} />,
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
      </div>
    </div>
  );
};

export default Sidebar;
