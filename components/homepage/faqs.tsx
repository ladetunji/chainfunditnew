import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import React from "react";
import { FaqsAccordion } from "./accordion";

type Props = {};

const FAQs = (props: Props) => {
  return (
    <div className="px-2 md:px-4 py-10 md:py-16 w-full bg-[#F2F1E9] flex flex-col md:flex-row gap-6 md:gap-10 justify-between font-source">
      <section className="w-full md:w-1/3 flex flex-col gap-3 mb-6 md:mb-0">
        <p className="font-semibold text-2xl md:text-3xl text-black">FAQs</p>
        <span className="font-normal text-base text-black">
          Get answers to your most pressing questions about fundraising on
          Chainfundit.
        </span>
        <Button className="w-full h-14 md:h-24 flex justify-between items-center font-semibold text-lg md:text-2xl">Contact us <ArrowRight /></Button>
      </section>

      <section className="w-full md:w-2/3">
         <FaqsAccordion />
      </section>
    </div>
  );
};

export default FAQs;
