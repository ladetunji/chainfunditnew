import React from "react";
import Navbar from "@/components/dashboard/Navbar";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="2xl:container 2xl:mx-auto bg-[#F2F1E9] h-[130vh]">
      <Navbar />
      <div className="w-full px-2 md:px-14 py-4 md:py-10 bg-[#F2F1E9] bg-[url('/images/logo-bg.svg')] bg-[length:60%] md:bg-[length:30%] h-auto md:h-full bg-no-repeat bg-left-bottom flex flex-col md:flex-row gap-4 md:gap-5">
        <div className="w-full px-10">{children}</div>
      </div>
    </div>
  );
};

export default layout;
