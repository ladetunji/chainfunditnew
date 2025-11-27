"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useCallback } from "react";
import { ArrowRight, Smartphone } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { OAuthButtons } from "./oauth-buttons";
import { track } from "@/lib/analytics";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const [isPhone, setIsPhone] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  // Handle error parameters from URL (e.g., OAuth failures)
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      let errorMessage = "";
      switch (errorParam) {
        case "oauth_failed":
          errorMessage =
            "Social login failed. Please try again or use email/phone instead.";
          break;
        case "invalid_callback":
          errorMessage = "Login session expired. Please try signing in again.";
          break;
        default:
          errorMessage = "Something went wrong. Please try again.";
      }
      toast.error(errorMessage);
    }
  }, [searchParams]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const identifier = isPhone ? phone.trim() : email.trim();
      if (!identifier) {
        toast.error(
          isPhone
            ? "Please enter your phone number"
            : "Please enter your email address"
        );
        return;
      }

      setIsLoading(true);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const res = await fetch("/api/auth/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isPhone
              ? { action: "request_phone_otp", phone: identifier }
              : { action: "request_email_otp", email: identifier }
          ),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error(
            "Unable to connect to our servers. Please check your internet connection and try again."
          );
        }

        const data = await res.json();

        if (!res.ok) {
          // Handle rate limiting
          if (res.status === 429) {
            throw new Error(
              "Too many requests. Please wait a minute before trying again."
            );
          }

          let userMessage = data.error;
          if (data.error?.includes("No account found")) {
            userMessage = isPhone
              ? "No account found with this phone number. Please sign up first or try a different number."
              : "No account found with this email. Please sign up first or check your email address.";
          } else if (
            data.error?.includes("WhatsApp OTP service not configured")
          ) {
            userMessage =
              "Phone verification is temporarily unavailable. Please use email instead or contact support.";
          } else if (data.error?.includes("Failed to send")) {
            userMessage = isPhone
              ? "Unable to send verification code to your phone. Please check the number and try again."
              : "Unable to send verification code to your email. Please check your email address and try again.";
          } else if (
            data.error?.includes("Email is required") ||
            data.error?.includes("Phone number is required")
          ) {
            userMessage = isPhone
              ? "Please enter your phone number to continue."
              : "Please enter your email address to continue.";
          }
          throw new Error(
            userMessage || "Unable to send verification code. Please try again."
          );
        }

        // Handle success with method information
        if (data.method === "sms" && data.fallback) {
          toast.success(
            "Verification code sent via SMS! (WhatsApp unavailable)"
          );
        } else if (data.method === "whatsapp") {
          toast.success("Verification code sent! Check your WhatsApp.");
        } else {
          toast.success(
            "Verification code sent! Check your " +
              (isPhone ? "WhatsApp" : "email") +
              "."
          );
        }

        // Track OTP sent event
        track("otp_sent", {
          user_email: isPhone ? undefined : identifier,
          category: "authentication",
          label: "signin",
        });

        // Store identifier and type for /otp page
        if (isPhone) {
          localStorage.setItem("otp_login_type", "phone");
          localStorage.setItem("otp_login_identifier", identifier);
        } else {
          localStorage.setItem("otp_login_type", "email");
          localStorage.setItem("otp_login_identifier", identifier);
        }

        // Pass redirect param to OTP page
        let otpUrl = "/otp?mode=signin";
        if (redirect) otpUrl += `&redirect=${encodeURIComponent(redirect)}`;

        // Small delay to ensure toast is shown
        setTimeout(() => {
          window.location.href = otpUrl;
        }, 500);
      } catch (err: any) {
        if (err.name === "AbortError") {
          toast.error(
            "Request timed out. Please check your internet connection and try again."
          );
        } else {
          toast.error(err.message || "Something went wrong. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isPhone, email, phone, redirect]
  );

  return (
    <form
      className={cn("flex flex-col w-full pt-3 px-2", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <div className="grid gap-4">
        <div className="grid gap-3">
          <div className="flex justify-between">
            <Label
              htmlFor={isPhone ? "phone" : "email"}
              className="font-normal text-xl text-[#104901]"
            >
              {isPhone ? "Phone Number" : "Email"}
            </Label>
            {/* <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => setIsPhone(!isPhone)}
              className="text-base text-[#104901] hover:text-[#0a3a01] hover:bg-transparent transition-colors"
              disabled={isLoading}
            >
              <Smartphone className="w-5 h-5" />
              {isPhone ? "Use Email Instead" : "Use Phone Instead"}
            </Button> */}
          </div>

          {isPhone ? (
            <Input
              id="phone"
              type="tel"
              placeholder="+234 801 234 5678"
              className="w-[360px] md:w-full bg-white rounded-lg border border-[#D9D9DC] outline-[#104901] placeholder:text-[#767676]"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
              autoComplete="tel"
            />
          ) : (
            <Input
              id="email"
              type="email"
              placeholder="tolulope.smith@gmail.com"
              className="w-[360px] md:w-full bg-white rounded-lg border border-[#D9D9DC] outline-[#104901] placeholder:text-[#767676]"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              autoComplete="email"
            />
          )}
        </div>
        <Button
          type="submit"
          className="w-[360px] md:w-full h-16 flex justify-between font-semibold text-2xl"
          disabled={isLoading || !(isPhone ? phone.trim() : email.trim())}
        >
          {isLoading
            ? "Sending OTP"
            : `Continue with ${isPhone ? "Phone" : "Email"}`}
          <ArrowRight className={isLoading ? "animate-pulse" : ""} />
        </Button>
        <OAuthButtons mode="signin" />
      </div>

      <p className="text-center text-sm font-normal text-[#104901] mt-3">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-base underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
