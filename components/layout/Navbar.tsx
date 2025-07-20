import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import React from "react";

type Props = {};

const Navbar = (props: Props) => {
  return (
    <div className="flex justify-between items-center font-source px-12 py-10">
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

      <section className="flex items-center gap-3">
         <Link href='/login' className="font-medium text-base text-black">Login</Link>
         <Button className="px-4 py-3 border-2 border-white text-base font-semibold rounded-none">Create Campaign</Button>
      </section>
    </div>
  );
};

export default Navbar;
