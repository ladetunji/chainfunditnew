"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Clipboard } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { parseCookies } from "nookies";

function OtpInput({
  value,
  onChange,
  length = 6,
}: {
  value: string;
  onChange: (val: string) => void;
  length?: number;
}) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const focusNext = (index: number) => {
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const focusPrev = (index: number) => {
    if (index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleChange = (index: number, val: string) => {
    const newValue =
      value.substring(0, index) + val + value.substring(index + 1);
    onChange(newValue.padEnd(length, ""));
    if (val && index < length - 1) {
      focusNext(index);
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      focusPrev(index);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text/plain")
      .replace(/\D/g, "")
      .slice(0, length);
    if (pastedData.length === length) {
      onChange(pastedData);
      inputRefs.current[length - 1]?.focus();
    }
  };

  return (
    <div className="flex gap-2 w-full">
      {Array.from({ length }).map((_, idx) => (
        <Input
          key={idx}
          ref={(el) => {
            inputRefs.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          className="w-16 h-16 text-center text-2xl bg-white border border-[#D9D9DC] rounded"
          value={value[idx] || ""}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "");
            if (val.length <= 1) {
              handleChange(idx, val);
            }
          }}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          autoFocus={idx === 0}
        />
      ))}
    </div>
  );
}

function PhoneOtpPageInner() {
  const [otp, setOtp] = useState("");
  const [otpTimer, setOtpTimer] = useState(21);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isResending, setIsResending] = useState(false);

  // Always prioritize query string for phone/email
  useEffect(() => {
    const p = searchParams.get("phone");
    const e = searchParams.get("email");
    if (p) {
      setPhone(p);
      localStorage.setItem("link_phone_number", p);
    } else {
      setPhone(localStorage.getItem("link_phone_number"));
    }
    if (e) {
      setEmail(e);
      localStorage.setItem("link_phone_email", e);
    } else {
      const localEmail = localStorage.getItem("link_phone_email");
      if (localEmail) {
        setEmail(localEmail);
      } else {
        try {
          const cookies = parseCookies();
          const token = cookies["auth_token"];
          if (token) {
            const payload = JSON.parse(atob(token.split(".")[1]));
            if (payload.email) {
              setEmail(payload.email);
              localStorage.setItem("link_phone_email", payload.email);
            }
          }
        } catch {}
      }
    }
  }, [searchParams]);

  // Timer for resend code
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  // Check for required data
  if (!phone || !email) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Missing Information</h1>
          <p className="text-gray-600 mb-4">Unable to verify your phone number. Please start the process again.</p>
          <Button onClick={() => window.location.href = "/phone"} className="bg-blue-600 hover:bg-blue-700">
            Go to Phone Verification
          </Button>
        </div>
      </div>
    );
  }

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (isResending || !phone || !email) return;
    setIsResending(true);
    try {
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
        throw new Error(userMessage || "Unable to resend verification code. Please try again.");
      }
      toast.success("New verification code sent!");
      setOtp("");
      setOtpTimer(40);
    } catch (err: any) {
      toast.error(err.message || "Unable to resend verification code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  // Auto-submit when OTP is complete
  useEffect(() => {
    if (otp.length === 6 && !isLoading) {
      handleOtpSubmit();
    }
    // eslint-disable-next-line
  }, [otp]);

  const handleOtpSubmit = async () => {
    if (otp.length !== 6 || isLoading || !phone || !email) return;
    setIsLoading(true);
    setError("");
    try {
      console.log("Verifying OTP with:", { phone, otp, email });
      const res = await fetch("/api/auth/link-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_link_otp",
          phone,
          otp,
          email,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        let userMessage = data.error;
        if (data.error?.includes("No OTP found")) {
          userMessage = "Verification code has expired or is invalid. Please request a new code.";
        } else if (data.error?.includes("Invalid OTP")) {
          userMessage = "Incorrect verification code. Please check the code and try again.";
        } else if (data.error?.includes("Phone, OTP, and email are required")) {
          userMessage = "Please enter the 6-digit verification code.";
        } else if (data.error?.includes("User not found")) {
          userMessage = "Account not found. Please sign in again.";
        }
        toast.error(userMessage || "Verification failed. Please try again.");
        throw new Error(userMessage || "Verification failed. Please try again.");
      }
      // On success, clear localStorage
      localStorage.removeItem("link_phone_number");
      localStorage.removeItem("link_phone_email");
      toast.success("Phone number linked successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteCode = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const code = text.replace(/\D/g, "").slice(0, 6);
      if (code.length === 6) {
        setOtp(code);
      } else {
        toast.error("No valid 6-digit verification code found in clipboard.");
      }
    } catch {
      toast.error("Unable to read from clipboard. Please paste the code manually.");
    }
  };

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-200px)] overflow-y-hidden">
      <div className="flex flex-col gap-2 items-center justify-center flex-1 px-3 md:p-0">
        <div className="w-full max-w-sm md:max-w-lg pt-6">
          <form className="flex flex-col gap-6 w-full pt-5">
            <div className="grid gap-6">
              <div className="flex flex-col gap-5">
                <h2 className="font-normal text-2xl text-[#104901]">
                  Enter Code
                </h2>
                <p className="text-base">
                  Please enter the 6 digit code we sent to:
                  <br />
                  <span className="font-semibold text-[#104901]">
                    {phone ? (
                      phone
                    ) : (
                      <span className="text-red-600">
                        No phone number found. Please go back and enter your
                        phone.
                      </span>
                    )}
                  </span>
                </p>
                <OtpInput value={otp} onChange={setOtp} length={6} />
                <hr />
                <div className="flex justify-between mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="px-4"
                    onClick={handlePasteCode}
                  >
                    <Clipboard /> Paste code
                  </Button>
                  {otpTimer > 0 ? (
                    <span className="text-sm text-[#8E8C95]">
                      Resend code in {otpTimer}s
                    </span>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-4 ml-2 text-white"
                      onClick={handleResendOtp}
                      disabled={isResending}
                    >
                      Resend OTP
                    </Button>
                  )}
                </div>
              </div>
            </div>
            {/* {error && <p className="text-center text-red-500">{error}</p>} */}
            {isLoading && (
              <p className="text-center text-[#104901]">Verifying...</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default function PhoneOtpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PhoneOtpPageInner />
    </Suspense>
  );
}
