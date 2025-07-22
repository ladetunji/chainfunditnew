"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CompleteProfile from "../complete-profile";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const [showWelcome, setShowWelcome] = useState(false);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setShowWelcome(true);
  }, []);

  return (
    <div className="">
      {/* Welcome Modal */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className='w-[700px] bg-[url("/images/piggy-bank.png")] bg-cover h-[600px] px-10 bg-no-repeat rounded-none outline-none font-source'>
          <DialogHeader>
            <div className="h-[3px] w-full bg-[#2C2C2C] rounded-none overflow-hidden mb-4">
              <div
                className="h-full bg-white animate-grow"
                style={{
                  animation: "grow 3s linear forwards",
                }}
              ></div>
            </div>
            <DialogTitle className="flex gap-2 items-center">
              <Image src="/images/logo.svg" alt="" width={32} height={32} />
              <p className="font-semibold text-4xl text-[#104901]">
                Welcome to Chainfundit
              </p>
            </DialogTitle>
          </DialogHeader>
          <DialogFooter className="flex items-end">
            <Button
              className="w-full h-[72px] font-sans font-semibold text-2xl flex justify-between items-center"
              onClick={() => {
                setShowWelcome(false);
                setShowCompleteProfile(true);
              }}
            >
              Complete your profile
              <ArrowRight />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Profile Modal */}
      <Dialog open={showCompleteProfile} onOpenChange={setShowCompleteProfile}>
        <DialogContent className="bg-[#F5F5F5] max-w-[550px] rounded-none font-source">
          <DialogHeader>
            <DialogTitle className="font-source font-semibold text-4xl text-[#104901]">
              Complete Your Profile
            </DialogTitle>
            <p className="font-normal text-xl text-[#104901]">
              Enter your name and choose an avatar so your friends can recognise
              you.
            </p>
          </DialogHeader>
          <div className="py-5">
            <CompleteProfile />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button onClick={() => {router.push('/settings')}} className="w-full h-[72px] flex justify-between items-center font-semibold text-2xl">Here we go! <ArrowRight size={24} /></Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
