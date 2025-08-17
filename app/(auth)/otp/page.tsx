"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Clipboard } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

function isSafeRedirect(url: string | null): boolean {
  // Only allow relative paths, not protocol-relative or absolute URLs
  return !!url && url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/\\");
}

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

function OtpPageInner() {
  const [otp, setOtp] = useState("");
  const [otpTimer, setOtpTimer] = useState(40);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [identifier, setIdentifier] = useState<string | null>(null);
  const [loginType, setLoginType] = useState<"email" | "phone" | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  // Determine identifier and type (signup: query, login: localStorage)
  useEffect(() => {
    const email = searchParams.get("email");
    const phone = searchParams.get("phone");
    if (email) {
      setIdentifier(email);
      setLoginType("email");
      console.log('OTP Page: identifier set from email param:', email);
    } else if (phone) {
      setIdentifier(phone);
      setLoginType("phone");
      console.log('OTP Page: identifier set from phone param:', phone);
    } else {
      // fallback to login localStorage
      const t = localStorage.getItem("otp_login_type");
      const id = localStorage.getItem("otp_login_identifier");
      if (t === "email" || t === "phone") {
        setLoginType(t);
        setIdentifier(id);
        console.log('OTP Page: identifier set from localStorage:', { t, id });
      }
    }
  }, [searchParams]);

  // Determine mode (login or signup)
  const mode = searchParams.get("mode") || "signin";

  // Timer for resend code
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  // Check for required data
  if (!identifier || !loginType) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Missing Information</h1>
          <p className="text-gray-600 mb-4">Unable to verify your account. Please start the sign-in process again.</p>
          <Button onClick={() => window.location.href = "/signin"} className="bg-blue-600 hover:bg-blue-700">
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }

  const [isResending, setIsResending] = useState(false);

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (isResending || !identifier || !loginType) return;
    setIsResending(true);
    console.log('OTP Page: Resending OTP for', { identifier, loginType });
    try {
      let payload, endpoint;
      if (loginType === "email") {
        payload = { action: "request_email_otp", email: identifier };
        endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/signin";
      } else {
        const email = searchParams.get("email");
        payload = { action: "request_phone_otp", phone: identifier };
        endpoint = "/api/auth/signin";
      }
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        let userMessage = data.error;
        if (data.error?.includes("No account found")) {
          userMessage = loginType === "phone" 
            ? "No account found with this phone number. Please sign up first."
            : "No account found with this email. Please sign up first.";
        } else if (data.error?.includes("Failed to send")) {
          userMessage = loginType === "phone"
            ? "Unable to send verification code to your phone. Please check the number and try again."
            : "Unable to send verification code to your email. Please check your email address and try again.";
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
    if (otp.length !== 6 || isLoading || !identifier || !loginType) return;
    setIsLoading(true);
    setError("");
    console.log('OTP Page: Submitting OTP', { otp, identifier, loginType, mode });
    try {
      let payload, endpoint;
      if (loginType === "email") {
        payload = { action: "verify_email_otp", email: identifier, otp };
        endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/signin";
      } else {
        // For phone, also send the email from query params if available
        const email = searchParams.get("email");
        payload = { action: "verify_phone_otp", phone: identifier, otp, email };
        endpoint = "/api/auth/signin";
      }
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        // Map API errors to user-friendly messages
        let userMessage = data.error;
        if (data.error?.includes("No OTP found") || data.error?.includes("OTP expired")) {
          userMessage = "Verification code has expired or is invalid. Please request a new code.";
        } else if (data.error?.includes("Invalid OTP")) {
          userMessage = "Incorrect verification code. Please check the code and try again.";
        } else if (data.error?.includes("already have an account")) {
          userMessage = "An account with this email already exists. Please sign in instead.";
        } else if (data.error?.includes("Email and OTP are required") || data.error?.includes("Phone number, email, and OTP are required")) {
          userMessage = "Please enter the 6-digit verification code.";
        }
        throw new Error(userMessage || "Verification failed. Please try again.");
      }
      // On success, clear login localStorage (if any)
      localStorage.removeItem("otp_login_type");
      localStorage.removeItem("otp_login_identifier");
      toast.success("Verification successful! Redirecting...");
      // Redirect logic based on mode and loginType
      if (mode === "signup" && loginType === "email") {
        if (redirect && isSafeRedirect(redirect)) {
          router.replace(redirect);
        } else {
          router.push(`/phone?email=${encodeURIComponent(identifier ?? "")}&mode=signup`);
        }
      } else {
        if (redirect && isSafeRedirect(redirect)) {
          router.replace(redirect);
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      setError(err.message || "Verification failed. Please try again.");
      toast.error(err.message || "Verification failed. Please try again.");
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
      <div className="h-full flex flex-col gap-2 items-center justify-center flex-1 px-3 md:p-0">
        <div className="w-full max-w-sm md:max-w-lg pt-6">
          <form className="flex flex-col gap-6 w-full pt-5 px-2">
            <div className="grid gap-8">
              <div className="flex flex-col gap-6">
                <h2 className="font-normal text-2xl text-[#104901]">
                  Enter Code
                </h2>
                <p className="text-base">
                  Please enter the 6 digit code we sent to:
                  <br />
                  <span className="font-semibold text-[#104901]">
                    {identifier ? (
                      identifier
                    ) : (
                      <span className="text-red-600">
                        No identifier found. Please go back and enter your email
                        or phone.
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

export default function OtpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OtpPageInner />
    </Suspense>
  );
}
