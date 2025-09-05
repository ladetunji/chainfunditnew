import React from 'react'
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Edit, Link as LinkIcon, Users, Clock, Target, XCircle } from "lucide-react";
import Link from "next/link";
import { Campaign, transformCampaign } from "./types";
import { getCampaignStatus, getTimeRemaining } from "@/lib/utils/campaign-status";
import { formatCurrency } from "@/lib/utils/currency";

type Props = {
  campaigns: Campaign[];
}

const PastCampaigns = ({ campaigns }: Props) => {
  const isEmpty = campaigns.length === 0;
  const transformedCampaigns = campaigns.map(transformCampaign);

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
            No past campaigns
          </h3>
          <p className="font-normal text-xl text-[#104901]">
            Want to start your own fundraiser? Click the button below.
          </p>
        </section>

        <Link href="/create-campaign">
          <Button className="w-[300px] h-16 flex justify-between font-semibold text-2xl items-center">
            Create a Campaign <Plus size={24} />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 font-source 2xl:container 2xl:mx-auto">
      {transformedCampaigns.map((transformedCampaign, index) => {
        const campaign = campaigns[index]; // Get original campaign data
        return (
        <div
          key={transformedCampaign.id}
          className="border border-[#D9D9D9] bg-white py-4 pl-4 pr-6 flex justify-between items-start"
          style={{ boxShadow: "0px 4px 8px 0px #0000001A" }}
        >
          <Image
            src={transformedCampaign.image}
            alt={transformedCampaign.title}
            width={270}
            height={190}
            className="object-cover"
          />
          <div className="flex flex-col justify-end">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-2xl font-medium">{transformedCampaign.title}</h3>
              {(() => {
                const statusInfo = getCampaignStatus(campaign);
                const timeRemaining = getTimeRemaining(campaign);
                
                if (statusInfo.status === 'expired') {
                  return (
                    <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                      <Clock size={14} />
                      <span>{timeRemaining}</span>
                    </div>
                  );
                } else if (statusInfo.status === 'goal_reached') {
                  return (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      <Target size={14} />
                      <span>Goal Reached</span>
                    </div>
                  );
                } else if (statusInfo.status === 'closed') {
                  return (
                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      <XCircle size={14} />
                      <span>Closed</span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            <span className="font-normal text-base">
              {transformedCampaign.description.slice(0, 60)}...
            </span>
            <section className="flex justify-between">
              <p className="text-lg font-medium my-1 text-black">
                {formatCurrency(transformedCampaign.amountRaised, transformedCampaign.currency)} raised
              </p>
              <p className="font-medium text-lg text-[#757575] my-1">
                {formatCurrency(transformedCampaign.goal, transformedCampaign.currency)} total
              </p>
            </section>
            <div className="w-full bg-[#D9D9D9] h-2 my-1">
              <div
                className="bg-[#104901] h-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((transformedCampaign.amountRaised / transformedCampaign.goal) * 100)
                  )}%`,
                }}
              ></div>
            </div>
            <section className="flex justify-between items-center">
              <p className="text-lg text-[#868686] flex gap-1 items-center">
                <Users size={20} />
                {transformedCampaign.donors} donors
              </p>
              <p className="text-lg text-[#868686] flex gap-1 items-center">
                <LinkIcon size={20} /> {transformedCampaign.chains} chains
              </p>
            </section>
            <div className="mt-3 flex gap-2">
              <Link href={`/campaign/${transformedCampaign.id}`}>
                <Button
                  className="bg-[#F2F1E9] font-medium text-lg text-[#474553] border-[#474553]"
                  variant="outline"
                >
                  View
                  <Eye />
                </Button>
              </Link>
            </div>
          </div>
        </div>
        );
      })}

      <Link href="/create-campaign">
        <Button className="w-[300px] h-16 flex justify-between font-semibold text-2xl items-center mt-6">
          Create a Campaign <Plus size={24} />
        </Button>
      </Link>
    </div>
  );
}

export default PastCampaigns