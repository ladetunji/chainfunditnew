"use client";

import React from "react";
import Navbar from "@/components/dashboard/Navbar";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileSidebar from "@/components/dashboard/MobileSidebar";
import ClientToaster from "@/components/ui/client-toaster";
import SessionTimeoutProvider from "@/components/providers/SessionTimeoutProvider";
import { TokenRefreshProvider } from "@/hooks/use-token-refresh";

type Props = {};

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <TokenRefreshProvider>
      <SessionTimeoutProvider config={{ timeoutMinutes: 120, warningMinutes: 15 }}>
        <div className="bg-whitesmoke max-w-[1440px] min-h-screen mx-auto">
          <Navbar />
          {/* Mobile sidebar */}
          <MobileSidebar />
          <div className="w-full px-2 md:px-14 py-4 md:py-10 bg-[#f7f6f5] bg-[url('/images/logo-bg.svg')] bg-[length:60%] md:bg-[length:30%] min-h-screen bg-no-repeat bg-left-bottom flex flex-row gap-4 md:gap-5">
            {/* Desktop sidebar */}
            <div className="hidden md:block w-full md:w-1/5 mb-4 md:mb-0">
              <Sidebar />
            </div>
            <div className="w-full md:w-4/5 px-2 md:px-10">
              {children}
            </div>
          </div>
          <ClientToaster />
        </div>
      </SessionTimeoutProvider>
    </TokenRefreshProvider>
  );
};

export default layout;
