import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type Props = {};

const Chains = (props: Props) => {
  return (
    <div className="flex flex-col gap-4 2xl:container 2xl:mx-auto">
      <section className="relative w-fit">
        <Image src="/images/frame.png" alt="" width={232} height={216} />
        <section
          className="absolute -top-5 -right-4 w-[70px] h-[78px] bg-white flex items-center justify-center font-bold text-[64px] text-[#C0BFC4] rounded-2xl"
          style={{ boxShadow: "0px 4px 10px 0px #00000040" }}
        >
          0
        </section>
      </section>

      <section>
        <h3 className="font-semibold text-3xl text-[#104901]">
          No Chains Found
        </h3>
        <p className="font-normal text-xl text-[#104901]">
          Want to start your own fundraiser? Click the button below.
        </p>
      </section>

      <Button className="w-[300px] h-16 flex justify-between font-semibold text-2xl items-center">
        Create a Campaign <Plus size={24} />
      </Button>
    </div>
  );
};

export default Chains;
