"use client";

import { useEffect, useState, useRef } from "react";
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
  const [profileChecked, setProfileChecked] = useState(false);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null) as React.RefObject<HTMLFormElement>;

  useEffect(() => {
    async function checkProfile() {
      try {
        const res = await fetch('/api/user/profile', { method: 'GET' });
        const data = await res.json();
        if (data.success && data.user && !data.user.hasCompletedProfile) {
          setShowWelcome(true);
        }
      } catch {
        // fallback: show modal if error
        setShowWelcome(true);
      } finally {
        setProfileChecked(true);
      }
    }
    checkProfile();
  }, []);

  if (!profileChecked) return null;

  return (
    <div className="w-full 2xl:container 2xl:mx-auto">
      {/* Welcome Modal */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className='w-[80%] max-w-md md:max-w-xl bg-[url("/images/piggy-bank.png")] bg-cover h-[400px] md:h-[600px] px-4 md:px-10 bg-no-repeat rounded-none outline-none font-source'>
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
              <Image src="/images/logo.svg" alt="" width={24} height={24} className="md:w-8 md:h-8" />
              <p className="font-semibold text-2xl md:text-4xl text-[#104901]">
                Welcome to Chainfundit
              </p>
            </DialogTitle>
          </DialogHeader>
          <DialogFooter className="flex items-end">
            <Button
              className="w-full h-14 md:h-[72px] font-sans font-semibold text-lg md:text-2xl flex justify-between items-center"
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
        <DialogContent className="bg-[#F5F5F5] max-w-md md:max-w-xl rounded-none font-source">
          <DialogHeader>
            <DialogTitle className="font-source font-semibold text-left text-2xl md:text-4xl text-[#104901]">
              Complete Your Profile
            </DialogTitle>
            <p className="font-normal text-base md:text-xl text-[#104901] text-left text-wrap">
              Enter your name and choose an avatar so your friends can recognise
              you.
            </p>
          </DialogHeader>
          <div className="py-4 md:py-5">
            <CompleteProfile formRef={formRef} />
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                formRef.current?.requestSubmit();
              }}
              className="w-full h-14 md:h-[72px] flex justify-between items-center font-semibold text-lg md:text-2xl"
            >
              Here we go! <ArrowRight size={20} className="md:w-6 md:h-6" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      
    </div>
  );
}
