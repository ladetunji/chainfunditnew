"use client";

import React, { useState } from "react";
import Account from "./account";
import Preferences from "./preferences";
import Payments from "./payments";

const tabs = ["Account", "Preferences", "Payments"];

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("Account");
  return (
    <div className="w-full flex flex-col gap-5 font-source">
      <h2 className="font-semibold text-6xl text-black">Settings</h2>
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
        {activeTab === "Account" && <Account />}
        {activeTab === "Preferences" && <Preferences />}
        {activeTab === "Payments" && <Payments />}
      </div>
    </div>
  );
};

export default SettingsPage;
