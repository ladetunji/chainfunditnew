"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { parseCookies } from "nookies";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Suspense } from "react";
import Link from "next/link";

export default function PhonePageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PhonePage />
    </Suspense>
  );
}

function PhonePage() {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();

  // Get email from query string if present
  const emailFromQuery = searchParams.get("email") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      // Prefer email from query string, fallback to cookie
      let email = emailFromQuery;
      if (!email) {
        try {
          const cookies = parseCookies();
          const token = cookies["auth_token"];
          if (token) {
            const payload = JSON.parse(atob(token.split(".")[1]));
            email = payload.email;
          }
        } catch {}
      }
      // Call API to send phone OTP here
      const res = await fetch("/api/auth/link-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_link_otp",
          phone,
          email,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        let userMessage = data.error;
        if (data.error?.includes("Phone number is required")) {
          userMessage = "Please enter your phone number to continue.";
        } else if (data.error?.includes("WhatsApp OTP service not configured")) {
          userMessage = "Phone verification is temporarily unavailable. Please contact support or try again later.";
        } else if (data.error?.includes("Failed to send")) {
          userMessage = "Unable to send verification code to your phone. Please check the number and try again.";
        }
        throw new Error(userMessage || "Unable to send verification code. Please try again.");
      }
      
      // Handle success with method information
      if (data.method === 'sms' && data.fallback) {
        toast.success("Verification code sent via SMS! (WhatsApp unavailable)");
      } else if (data.method === 'whatsapp') {
        toast.success("Verification code sent! Check your WhatsApp.");
      } else {
        toast.success("Verification code sent! Check your WhatsApp.");
      }
      window.location.href = `/phone-otp?phone=${encodeURIComponent(
          phone
        )}&email=${encodeURIComponent(email)}`;
    } catch (err: any) {
      toast.error("Unable to connect to our servers. Please check your internet connection and try again.");
      setError("Unable to connect to our servers. Please check your internet connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-2 items-center justify-center flex-1">
        <Image
          src="/images/logo.svg"
          alt="Chainfundit Logo"
          width={82}
          height={80}
        />

        <h2 className="font-semibold text-4xl text-[#104901] text-center">
          Link Phone number
        </h2>

        <div className="flex justify-center w-full p-2">
          <div className="w-full max-w-lg pt-6">
            <form
              className="flex flex-col gap-6 w-full pt-5"
              onSubmit={handleSubmit}
            >
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label
                    htmlFor="phone"
                    className="font-normal text-xl text-[#104901]"
                  >
                    Link Phone Number
                  </Label>
                  <p className="text-base text-[#104901]">
                    Link your phone number to receive notifications via SMS or
                    WhatsApp, and verify your account with us.
                  </p>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+44 0123 456 7890"
                    className="w-[420px] md:w-full bg-white rounded-lg border border-[#D9D9DC] outline-[#104901] placeholder:text-[#767676]"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    pattern="[+]?\d{1,3}[\s-]?\d{1,14}(?:x.+)?"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-[420px] md:w-full h-16 flex justify-between font-semibold text-2xl"
                  disabled={isLoading}
                >
                  Continue
                  <ArrowRight />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full h-16 font-semibold text-2xl"
                  onClick={() => (window.location.href = "/dashboard")}
                >
                  Skip
                </Button>
              </div>
              {/* {error && <p className="text-center text-red-500">{error}</p>} */}
            </form>
          </div>
        </div>
      </div>

      <div
        className="flex gap-4 items-center px-5 py-8 w-full"
        style={{
          background: "linear-gradient(0deg, #F2F1E9 0%, #FFFFFF 75%)",
        }}
      >
        <ul className="flex items-center">
          <li className="w-10 h-10 rounded-full border-2 border-[#104901]">
            <Image
              src="/images/avatar-3.png"
              alt="avatar"
              width={40}
              height={40}
            />
          </li>
          <li className="w-10 h-10 rounded-full border-2 border-[#104901] -ml-3">
            <Image
              src="/images/avatar-4.png"
              alt="avatar"
              width={40}
              height={40}
            />
          </li>
          <li className="w-10 h-10 rounded-full border-2 border-[#104901] -ml-3">
            <Image
              src="/images/avatar-5.png"
              alt="avatar"
              width={40}
              height={40}
            />
          </li>
          <li className="w-10 h-10 rounded-full border-2 border-[#104901] -ml-3">
            <Image
              src="/images/avatar-6.png"
              alt="avatar"
              width={40}
              height={40}
            />
          </li>
        </ul>
        <div>
          <p className="font-source font-semibold text-xs text-black">
            Over 100 Chainfunders can&apos;t be wrong
          </p>
          <span className="font-light text-sm text-black">
            Start fundraising today!
          </span>
        </div>
      </div>
    </div>
  );
}
