import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Image from "next/image";
import React from "react";

type Campaign = {
  id: number;
  title: string;
  amountRaised: number;
  goal: number;
  donors: number;
  chains: number;
  image: string;
};

type Props = {
  campaigns: Campaign[];
};

const LiveCampaigns = ({ campaigns }: Props) => {
  const isEmpty = campaigns.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col gap-4">
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
            No live campaigns
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
  }

  return (
    <div className="flex flex-col gap-6">
      {campaigns.map((campaign) => (
        <div
          key={campaign.id}
          className="border rounded-lg bg-white shadow-sm p-4 flex gap-4 items-start"
        >
          <Image
            src={campaign.image}
            alt={campaign.title}
            width={160}
            height={100}
            className="rounded object-cover"
          />
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{campaign.title}</h3>
            <p className="text-sm mt-1 text-[#4B4B4B]">
              ₦{campaign.amountRaised.toLocaleString()} raised of ₦{campaign.goal.toLocaleString()} goal
            </p>
            <p className="text-xs text-gray-500">
              {campaign.donors} donors • {campaign.chains} chains
            </p>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" className="text-green-700 border-green-700">Edit</Button>
              <Button variant="outline">View</Button>
              <Button variant="outline" className="text-yellow-700 border-yellow-500">Add Update</Button>
            </div>
          </div>
        </div>
      ))}

      <Button className="w-[300px] h-16 flex justify-between font-semibold text-2xl items-center mt-6">
        Create a Campaign <Plus size={24} />
      </Button>
    </div>
  );
};

export default LiveCampaigns;