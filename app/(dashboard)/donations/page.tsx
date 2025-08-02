"use client";

import React from "react";
import ReceivedDonations from "./received";
import PendingDonations from "./pending";
import FailedDonations from "./failed";

const tabs = ["Received", "Pending", "Failed"];

const DonationsPage = () => {
  const [activeTab, setActiveTab] = React.useState(tabs[0]);
  return (
    <div className="w-full flex flex-col gap-5 font-source 2xl:container 2xl:mx-auto">
      <h2 className="font-semibold text-6xl text-black">Donations</h2>
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
        {activeTab === "Received" && <ReceivedDonations />}
        {activeTab === "Pending" && <PendingDonations />}
        {activeTab === "Failed" && <FailedDonations />}
      </div>
    </div>
  );
};

export default DonationsPage;
