import React from "react";
import Navbar from "@/components/dashboard/Navbar";
import Sidebar from "@/components/dashboard/Sidebar";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

type Props = {};

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-full bg-[#F2F1E9]">
      <Navbar />
      <div className="w-full px-2 md:px-14 py-4 md:py-10 bg-[url('/images/logo-bg.svg')] bg-[length:60%] md:bg-[length:40%] h-auto md:h-screen bg-no-repeat bg-left-bottom flex flex-col md:flex-row gap-4 md:gap-5">
        <div className="w-full md:w-1/5 mb-4 md:mb-0">
          {/* Sidebar Component */}
          <Sidebar />
        </div>
        <div className="w-full md:w-4/5 px-10">{children}</div>
      </div>
    </div>
  );
};

export default layout;
