"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { OAuthButtons } from "./oauth-buttons";

export function SignupForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_email_otp",
          email: email.trim()
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Unable to connect to our servers. Please check your internet connection and try again.");
      }

      const data = await res.json();
      
      if (!res.ok) {
        // Handle rate limiting
        if (res.status === 429) {
          throw new Error("Too many requests. Please wait a minute before trying again.");
        }
        
        // Map API errors to user-friendly messages
        let userMessage = data.error;
        if (data.error?.includes("Email is required")) {
          userMessage = "Please enter your email address to continue.";
        } else if (data.error?.includes("Failed to send")) {
          userMessage = "Unable to send verification code to your email. Please check your email address and try again.";
        }
        throw new Error(userMessage || "Unable to send verification code. Please try again.");
      }

      toast.success("Verification code sent! Check your email.");
      
      // Use router.push for better performance instead of window.location
      let otpUrl = `/otp?email=${encodeURIComponent(email.trim())}&mode=signup`;
      if (redirect) otpUrl += `&redirect=${encodeURIComponent(redirect)}`;
      
      // Small delay to ensure toast is shown
      setTimeout(() => {
        window.location.href = otpUrl;
      }, 500);
      
    } catch (err: any) {
      if (err.name === 'AbortError') {
        toast.error("Request timed out. Please check your internet connection and try again.");
      } else {
        toast.error(err.message || "Something went wrong. Please try again.");
        
        // Auto-redirect for existing account errors
        if (err.message && err.message.toLowerCase().includes("already exists")) {
          setTimeout(() => {
            window.location.href = "/signin";
          }, 2000);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [email, redirect]);

  return (
    <form className={cn("flex flex-col w-full pt-3 px-2", className)} onSubmit={handleSubmit} {...props}>
      <div className="grid gap-4">
        <div className="grid gap-3">
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
            className="w-[360px] md:w-full bg-white rounded-lg border border-[#D9D9DC] outline-[#104901] placeholder:text-[#767676]"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={isLoading}
            autoComplete="email"
          />
        </div>
        <Button
          type="submit"
          className="w-[360px] md:w-full h-16 flex justify-between font-semibold text-2xl"
          disabled={isLoading || !email.trim()}
        >
          {isLoading ? "Sending..." : "Continue with Email"}
          <ArrowRight className={isLoading ? "animate-pulse" : ""} />
        </Button>
        <OAuthButtons mode="signup" />
      </div>
      <p className="text-center text-sm font-normal text-[#104901] mt-4">
        Already have an account? <Link href='/signin' className="font-medium text-base underline">Sign in</Link>
      </p>
    </form>
  );
}
