"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { FaFacebook } from "react-icons/fa";
import { toast } from "sonner";

export function SignupForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_email_otp",
          email
        }),
      });
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Unexpected response from server");
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      toast.success("OTP sent successfully!");
      window.location.href = "/otp";
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className={cn("flex flex-col gap-6 w-full pt-5", className)} onSubmit={handleSubmit} {...props}>
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label
            htmlFor="email"
            className="font-normal text-xl text-[#104901]"
          >
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="tolulope.smith@gmail.com"
            className="h-16 bg-white rounded-lg border border-[#D9D9DC] outline-[#104901] placeholder:text-[#767676]"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          className="w-full h-16 flex justify-between font-semibold text-2xl"
          disabled={isLoading}
        >
          Continue with Email
          <ArrowRight />
        </Button>
        <div className="flex gap-3 items-center w-full">
          <div className="w-1/3 border-b border-[#C0BFC4]"></div>
          <span className="relative z-10 px-2 text-black">
            Or continue with
          </span>
          <div className="w-1/3 border-b border-[#C0BFC4]"></div>
        </div>
        <div className="flex gap-5">
          <Button className="w-[236px] h-16 bg-[#D9D9DC] border-[#8E8C95] text-[#474553] font-medium text-2xl" type="button" onClick={() => window.location.href = '/api/auth/[...betterauth]?provider=google'}>
            <FaGoogle color="#474553" size={32} /> Google
          </Button>
          <Button className="w-[236px] h-16 bg-[#D9D9DC] border-[#8E8C95] text-[#474553] font-semibold text-2xl" type="button" onClick={() => window.location.href = '/api/auth/[...betterauth]?provider=facebook'}>
            <FaFacebook size={24} /> Facebook
          </Button>
        </div>
      </div>
      <p className="text-center text-sm font-normal text-[#104901] mt-4">
        By continuing with Google, Apple, Email or Phone number, you agree to
        Chainfundit <span className="font-bold">Terms of Service</span> as well
        as the <span className="font-bold">Privacy Policy</span>.
      </p>
    </form>
  );
}
