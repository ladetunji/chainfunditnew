"use client";

import React, { useState } from "react";
import LiveCampaigns from "./live";
import PastCampaigns from "./past";
import Chains from "./chains";
import Favourites from "./favourites";
import Comments from "./comments";

const tabs = ["Live", "Past", "Chains", "Favourites", "Comments"];

const mockCampaigns = [
  {
    id: 0,
    title: "91 Days of Kindness Challenge",
    description: "Nigeria is a nation built on resilience, unity, and a",
    amountRaised: 1201000,
    goal: 3000000,
    donors: 35,
    chains: 2,
    image: "/images/card-img1.png",
  },
  {
    id: 1,
    title: "Let’s Help Get Jeffrey off the Streets",
    description: "Jeffrey has been a recognisable face in Brunswick",
    amountRaised: 5450000,
    goal: 6000000,
    donors: 127,
    chains: 0,
    image: "/images/card-img2.png",
  },
  {
    id: 2,
    title: "Support Kamala’s Tuition at Westfield",
    description: "Kamala, our first daughter won a part-scholarship to",
    amountRaised: 12035000,
    goal: 20000000,
    donors: 235,
    chains: 8,
    image: "/images/card-img3.png",
  },
  // Add more items or leave empty to test empty UI
];

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState("Live");

  return (
    <div className="w-full flex flex-col gap-5 font-source 2xl:container 2xl:mx-auto">
      <h2 className="font-semibold text-6xl text-black">Campaigns</h2>
      {/* Tabs */}
      <ul className="w-fit bg-[#E5ECDE] flex gap-4 font-medium text-[28px] text-[#757575] p-1">
        {tabs.map((tab) => (
          <li
            key={tab}
            className={`cursor-pointer px-4 py-2 transition ${
              activeTab === tab ? "bg-white text-black" : "hover:bg-[#d2e3c8]"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </li>
        ))}
      </ul>
      <div className="mt-6">
        {activeTab === "Live" && <LiveCampaigns campaigns={mockCampaigns} />}
        {activeTab === "Past" && <PastCampaigns />}
        {activeTab === "Chains" && <Chains />}
        {activeTab === "Favourites" && <Favourites />}
        {activeTab === "Comments" && <Comments />}
      </div>
    </div>
  );
}
