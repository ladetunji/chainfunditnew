import React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Bell, Search } from "lucide-react";

type Props = {};

const Navbar = (props: Props) => {
  return (
    <div className="px-10 py-5 flex justify-between items-center font-source border-b border-[#C0BFC4]">
      <section className="flex gap-1 items-center">
        <Image
          src="/images/logo.svg"
          alt="Chainfundit Logo"
          width={30}
          height={30}
        />
        <p className="font-semibold text-xl text-[#104901]">Chainfundit</p>
      </section>
      <ul className="flex justify-between gap-3 font-semibold text-base text-black">
        <li>
          <Link href="#">For Individuals</Link>
        </li>
        <li>
          <Link href="#">For Charities</Link>
        </li>
        <li>
          <Link href="#">Virtual Giving Mall</Link>
        </li>
        <li>
          <Link href="#" className="">
            FAQs
          </Link>
        </li>
      </ul>

      <section className="flex gap-5 items-center">
        <Button className="">Create Campaign</Button>
          <Search color="#757575" size={24} />
          <Bell color="#757575" size={24} />
        <Image src='/images/user.png' alt="User" width={48} height={48} />
      </section>
    </div>
  );
};

export default Navbar;
