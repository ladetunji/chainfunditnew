"use client";

import React, { useState } from "react";
import Account from "./account";
import Preferences from "./preferences";
import Payments from "./payments";
import Security from "./security";

const tabs = ["Account", "Security", "Preferences", "Payments"];

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("Account");
  return (
    <div className="w-full flex flex-col gap-5 font-source 2xl:container 2xl:mx-auto">
      <h2 className="font-semibold text-3xl md:text-6xl text-black">Settings</h2>
      {/* Tabs */}
      <ul className="w-full md:w-fit bg-[#E5ECDE] flex gap-2 md:gap-4 font-medium text-sm md:text-[28px] text-[#757575] p-1 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <li
            key={tab}
            className={`cursor-pointer px-3 md:px-4 py-2 transition whitespace-nowrap flex-shrink-0 ${
              activeTab === tab ? "bg-white text-black" : "hover:bg-[#d2e3c8]"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </li>
        ))}
      </ul>
      <div className="mt-6">
        {activeTab === "Account" && <Account />}
        {activeTab === "Security" && <Security />}
        {activeTab === "Preferences" && <Preferences />}
        {activeTab === "Payments" && <Payments />}
      </div>
    </div>
  );
};

export default SettingsPage;
