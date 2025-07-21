import React from "react";
import Navbar from "@/components/dashboard/Navbar";

type Props = {};

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-full bg-[#F2F1E9]">
      <Navbar />
      <div className="px-14 py-6 bg-[url('/images/logo-bg.svg')] bg-[length:40%] h-screen bg-no-repeat bg-left-bottom">
        {children}
      </div>
    </div>
  );
};

export default layout;
