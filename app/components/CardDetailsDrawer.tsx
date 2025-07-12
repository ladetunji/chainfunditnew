import React from "react";
import Image from "next/image";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerClose,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  ArrowLeft,
  ArrowRight,
  ChevronsRight,
  Clock,
  Copy,
  ExternalLink,
  Table2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VisuallyHidden } from "radix-ui";

interface CardDetails {
  title: string;
  description: string;
  raised: string;
  image: string;
  extra: string;
  date: string;
  timeLeft: string;
  avatar: string;
  creator: string;
  createdFor: string;
  percentage: string;
  total: string;
  donors: number;
}

interface CardDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: CardDetails | null;
}

const CardDetailsDrawer: React.FC<CardDetailsDrawerProps> = ({
  open,
  onOpenChange,
  card,
}) => {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent
        aria-describedby={undefined}
        className="right-0 left-auto fixed w-2/5 h-screen rounded-none bg-white font-source overflow-y-auto"
        style={{ boxShadow: "-2px 2px 12px 0px #0000001A" }}
      >
        <DrawerHeader className="bg-[#F5F5F5] w-full py-2 px-4 flex justify-between items-center">
          <section className="flex gap-3 items-center">
            <DrawerClose asChild>
              <Button
                variant="secondary"
                className="text-white"
                aria-label="Close"
              >
                <ChevronsRight size={32} />
              </Button>
            </DrawerClose>
            <Button variant="secondary" className="text-white">
              <Copy />
              Copy Link
            </Button>
            <Button className="text-white" variant="secondary">
              Campaign Page <ExternalLink />
            </Button>
          </section>
          <section className=" flex gap-3 justify-end">
            <Button className="w-8 h-8 text-white" variant="secondary">
              <ArrowLeft />
            </Button>
            <Button className="w-8 h-8 text-white" variant="secondary">
              <ArrowRight />
            </Button>
          </section>
          {/* <DrawerTitle></DrawerTitle> */}
        </DrawerHeader>
        {card && (
          <div className="flex flex-col items-center gap-4 mt-4">
            <Image src={card.image} alt={card.title} width={560} height={300} />
            <div className="bg-[#F5F5F5] w-full p-4">
              <div className="flex justify-between items-center mb-2">
                <section className="flex gap-3">
                  <Badge variant="charity" className="font-medium text-base">
                    <Table2 /> Charity
                  </Badge>
                  <Badge variant="community" className="font-medium text-base">
                    <Users /> Community
                  </Badge>
                </section>
                <section className="flex gap-3 items-center">
                  <span className="font-normal text-lg text-[#868686]">
                    {card ? card.date : ""}
                  </span>
                  <span className="font-semibold text-xl text-black flex gap-1 items-center">
                    <Clock />
                    {card ? card.timeLeft : ""}
                  </span>
                </section>
              </div>
              <p className="font-semibold text-3xl text-black">
                {card ? card.title : ""}
              </p>
              <section className="flex gap-3 items-center my-2">
                <Image
                  src={card ? card.avatar : ""}
                  alt={card.title}
                  width={32}
                  height={32}
                />
                <p className="font-normal text-xl text-[#868686]">
                  Created by{" "}
                  <span className="font-semibold">
                    {card ? card.creator : ""}
                  </span>{" "}
                  for{" "}
                  <span className="font-semibold">
                    {card ? card.createdFor : ""}
                  </span>{" "}
                </p>
              </section>
            </div>
            {/* amount raised */}
            <div className="px-5 py-3 w-full">
              <section className="flex justify-between">
                <span className="font-medium text-xl text-black">
                  {card ? card.raised : ""} ({card ? card.percentage : ""})
                </span>
                <span className="font-medium text-xl text-black">
                  {card ? card.total : ""}
                </span>
              </section>
              {/* Progress bar section from Main.tsx */}
              <div className="w-full bg-[#B5C7B0] h-2 mt-2">
                <div
                  className={
                    card?.title === "91 Days of Kindness Challenge"
                      ? "w-[60%] bg-[#104901] h-full"
                      : card?.title === "Let’s Help Get Jeffrey off the Streets"
                      ? "w-[93%] bg-[#104901] h-full"
                      : "w-[13%] bg-[#104901] h-full"
                  }
                ></div>
              </div>
              <span className="font-medium text-lg text-[#868686] my-2 flex justify-end">
                {card ? card.donors : ""} donors have supported this campaign
              </span>
            </div>
            <div className="bg-[#F5F5F5] w-full p-4">
              <p className="font-semibold text-lg text-black uppercase">
                CAMPAIGN CREATOR FLOW
              </p>
              <ul className="flex flex-col gap-1 font-semibold text-sm text-black mb-3">
                <li className="capitalize">
                  - add authentication to login flow arm
                </li>
                <li className="capitalize">- liked campaigns (yea/nae)</li>
                <li className="capitalize">- add chained campaigns</li>
                <li className="capitalize">- retool "blank screen"</li>
                <li className="capitalize">- forgot password flow</li>
              </ul>
              <p className="font-semibold text-lg text-black uppercase">
                Donor FLOW
              </p>
              <ul className="flex flex-col gap-1 font-semibold text-sm text-black mb-3">
                <li className="capitalize">
                  - add thank you/confirmation steps after donation step
                </li>
                <li className="capitalize">
                  - add prompting steps for further action
                </li>
              </ul>

              <p className="font-semibold text-lg text-black uppercase">
                admin FLOW
              </p>
              <ul className="flex flex-col gap-1 font-semibold text-sm text-black mb-3">
                <li className="capitalize">
                  - add step for non-techies to send you info about campaign to
                  help create for them
                </li>
              </ul>
            </div>
            <Button variant='default' className="w-full h-20 flex justify-between font-semibold text-2xl">
              Donate
              <ArrowRight size={32} />
            </Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default CardDetailsDrawer;
