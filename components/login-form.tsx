'use client'

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { ArrowRight, Smartphone } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { BsApple } from "react-icons/bs";
import React from "react";

function OtpInput({ value, onChange, length = 6, ...props }: { value: string; onChange: (val: string) => void; length?: number }) {
  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, idx) => (
        <Input
          key={idx}
          type="text"
          inputMode="numeric"
          maxLength={1}
          className="w-12 h-12 text-center text-2xl border border-[#D9D9DC] rounded"
          value={value[idx] || ""}
          onChange={e => {
            const val = e.target.value.replace(/\D/g, "");
            if (val.length <= 1) {
              const newValue = value.substring(0, idx) + val + value.substring(idx + 1);
              onChange(newValue.padEnd(length, ""));
            }
          }}
          {...props}
        />
      ))}
    </div>
  );
}

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const [step, setStep] = useState<"input" | "otp">("input");
  const [isPhone, setIsPhone] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpTimer, setOtpTimer] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Timer for resend code
  React.useEffect(() => {
    if (step === "otp" && otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer, step]);

  const handleInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/[...betterauth]", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isPhone
            ? { action: "request_phone_otp", phone }
            : { action: "request_email_otp", email }
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setStep("otp");
      setOtpTimer(60);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/[...betterauth]", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isPhone
            ? { action: "verify_phone_otp", phone, otp }
            : { action: "verify_email_otp", email, otp }
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP");
      // Success: redirect or show success message
      // window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className={cn("flex flex-col gap-6 w-full pt-5", className)} {...props}>
      {step === "input" && (
        <div className="grid gap-6">
          <div className="grid gap-2">
            <section className="flex justify-between items-center">
              <Label
                htmlFor={isPhone ? "phone" : "email"}
                className="font-normal text-xl text-[#104901]"
              >
                {isPhone ? "Phone Number" : "Email"}
              </Label>
              <section
                className="flex gap-3 items-center cursor-pointer select-none"
                onClick={() => setIsPhone((prev) => !prev)}
              >
                <Smartphone />
                <p className="font-normal text-xl text-[#104901]">
                  {isPhone ? "Use Email" : "Use Phone Number"}
                </p>
              </section>
            </section>
            <Input
              id={isPhone ? "phone" : "email"}
              type={isPhone ? "tel" : "email"}
              placeholder={isPhone ? "+44 0123 456 7890" : "tolulope.smith@gmail.com"}
              className="h-16 bg-white rounded-lg border border-[#D9D9DC] outline-[#104901] placeholder:text-[#767676]"
              required
              value={isPhone ? phone : email}
              onChange={e => isPhone ? setPhone(e.target.value) : setEmail(e.target.value)}
              pattern={isPhone ? "[+]?\d{1,3}[\s-]?\d{1,14}(?:x.+)?" : undefined}
            />
          </div>
          <Button
            type="submit"
            className="w-full h-16 flex justify-between font-semibold text-2xl"
            disabled={isLoading}
            onClick={handleInputSubmit}
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
            <Button className="w-[236px] h-16 bg-[#D9D9DC] border-[#8E8C95] text-[#474553] font-medium text-2xl" type="button">
              <FaGoogle color="#474553" size={32} /> Google
            </Button>
            <Button className="w-[236px] h-16 bg-[#8E8C95] border-[#2C2C2C] font-semibold text-2xl text-[#F5F5F6]" type="button">
              <BsApple size={24} /> Apple
            </Button>
          </div>
        </div>
      )}
      {step === "otp" && (
        <div className="grid gap-6">
          <div className="flex flex-col items-center gap-2">
            <h2 className="font-normal text-2xl text-[#104901]">Enter Code</h2>
            <p className="text-base">Please enter the 6 digit code we sent to:<br /><span className="font-semibold text-[#104901]">{isPhone ? phone : email}</span></p>
            <OtpInput value={otp} onChange={setOtp} length={6} />
            <div className="flex gap-2 mt-2">
              <Button type="button" variant="outline" className="px-4" onClick={() => setOtp('')}>Paste code</Button>
              <span className="text-sm text-gray-500">Resend code in {otpTimer}s</span>
            </div>
          </div>
          <Button type="submit" className="w-full h-16 font-semibold text-2xl" disabled={isLoading || otp.length !== 6} onClick={handleOtpSubmit}>Continue <ArrowRight /></Button>
        </div>
      )}
      <p className="text-center text-sm font-normal text-[#104901] mt-4">
        By continuing with Google, Apple, Email or Phone number, you agree to
        Chainfundit <span className="font-bold">Terms of Service</span> as well
        as the <span className="font-bold">Privacy Policy</span>.
      </p>
      {error && <p className="text-center text-red-500">{error}</p>}
    </form>
  );
}
