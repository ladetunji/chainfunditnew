"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { FaGoogle, FaDiscord } from "react-icons/fa";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

interface OAuthButtonsProps {
  mode?: "signin" | "signup";
  className?: string;
}

export function OAuthButtons({
  mode = "signin",
  className = "",
}: OAuthButtonsProps) {
  const handleOAuthSignIn = async (provider: "google" | "discord") => {
    try {
      if (provider === "google") {
        await authClient.signIn.social({ provider: "google" });
        return;
      }
      
      // Redirect to BetterAuth OAuth endpoint
      const url = `/api/auth/betterauth?provider=${provider}`;
      window.location.href = url;
    } catch (error) {
      console.error(`${provider} sign-in error:`, error);
      toast.error(`Unable to sign in with ${provider}. Please try again or use email/phone instead.`);
    }
  };

  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      <div className="flex gap-3 items-center w-full">
        <div className="w-1/3 border-b border-[#C0BFC4]"></div>
        <span className="relative z-10 font-medium md:text-xl text-xs text-black">
          Or continue with
        </span>
        <div className="w-1/3 border-b border-[#C0BFC4]"></div>
      </div>

      <div className="flex gap-3 md:gap-5 w-full">
        <Button
          className="w-1/2 md:w-[236px] h-16 bg-[#D9D9DC] border-[#8E8C95] text-[#474553] font-semibold text-2xl hover:bg-[#C9C9CC] transition-colors"
          type="button"
          onClick={() => handleOAuthSignIn("google")}
        >
          <FaGoogle color="#474553" size={32} /> Google
        </Button>

        <Button
          className="w-1/2 md:w-[236px] h-16 bg-[#D9D9DC] border-[#8E8C95] text-[#474553] font-semibold text-2xl hover:bg-[#C9C9CC] transition-colors"
          type="button"
          onClick={() => handleOAuthSignIn("discord")}
        >
          <FaDiscord size={24} /> Discord
        </Button>
      </div>

      <p className="text-center text-sm font-normal text-[#104901] mt-2">
        By continuing with Google, Discord, Email or Phone number, you agree to
        Chainfundit <span className="font-bold">Terms of Service</span> as well
        as the <span className="font-bold">Privacy Policy</span>.
      </p>
    </div>
  );
}
