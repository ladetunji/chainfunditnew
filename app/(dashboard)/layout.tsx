"use client";

import React from "react";
import Navbar from "@/components/dashboard/Navbar";
import Sidebar from "@/components/dashboard/Sidebar";
import ClientToaster from "@/components/ui/client-toaster";
import { NotificationAlert } from "@/components/dashboard/NotificationAlert";

type Props = {};

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-[#F2F1E9] max-w-[1440px] h-screen mx-auto">
      <Navbar />
      <div className="w-full px-2 md:px-14 py-4 md:py-10 bg-[#F2F1E9] bg-[url('/images/logo-bg.svg')] bg-[length:60%] md:bg-[length:30%] min-h-screen bg-no-repeat bg-left-bottom flex flex-col md:flex-row gap-4 md:gap-5">
        <div className="w-full md:w-1/5 mb-4 md:mb-0">
          {/* Sidebar Component */}
          <Sidebar />
        </div>
        <div className="w-full md:w-4/5 px-10">
          {/* Notification Alert */}
          <div className="fixed top-20 right-4 z-40">
            <NotificationAlert />
          </div>
          {children}
        </div>
      </div>
      <ClientToaster />
    </div>
  );
};

export default layout;
