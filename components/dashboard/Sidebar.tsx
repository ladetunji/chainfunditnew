"use client";

import { LifeBuoy, Share } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

type Props = {};

const links = [
  {
    href: "/campaigns",
    icon: <Image src="/images/piggy.svg" alt="" width={40} height={40} />,
    label: "Campaigns",
  },
  {
    href: "/donations",
    icon: <Image src="/images/donate.svg" alt="" width={40} height={40} />,
    label: "Donations",
  },
  {
    href: "/payouts",
    icon: <Share size={40} color="black" />,
    label: "Payouts",
  },
  {
    href: "/settings",
    icon: <LifeBuoy size={40} color="black" />,
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
              className={` ${pathname === link.href ? "bg-[#5F8555]" : ""}`}
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
