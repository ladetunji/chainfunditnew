import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import React from "react";
import { FaqsAccordion } from "./accordion";

type Props = {};

const FAQs = (props: Props) => {
  return (
    <div className="px-4 py-16 w-full bg-[#F2F1E9] flex gap-10 justify-between font-source">
      <section className="w-1/3 flex flex-col gap-3">
        <p className="font-semibold text-3xl text-black">FAQs</p>
        <span className="font-normal text-base text-black">
          Get answers to your most pressing questions about fundraising on
          Chainfundit.
        </span>
        <Button className="w-full h-24 flex justify-between items-center font-semibold text-2xl">Contact us <ArrowRight /></Button>
      </section>

      <section className="w-2/3">
         <FaqsAccordion />
      </section>
    </div>
  );
};

export default FAQs;
