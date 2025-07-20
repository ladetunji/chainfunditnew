"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Clipboard, Copy } from "lucide-react";
import Image from "next/image";
import { useRouter } from 'next/navigation';

function OtpInput({ value, onChange, length = 6 }: { value: string; onChange: (val: string) => void; length?: number }) {
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
    const newValue = value.substring(0, index) + val + value.substring(index + 1);
    onChange(newValue.padEnd(length, ""));
    
    if (val && index < length - 1) {
      focusNext(index);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      focusPrev(index);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, length);
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
          onChange={e => {
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

export default function OtpPage() {
  const [otp, setOtp] = useState("");
  const [otpTimer, setOtpTimer] = useState(40);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Timer for resend code
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  // Auto-submit when OTP is complete
  useEffect(() => {
    if (otp.length === 6 && !isLoading) {
      handleOtpSubmit();
    }
  }, [otp]);

  const handleOtpSubmit = async () => {
    if (otp.length !== 6 || isLoading) return;
    
    setIsLoading(true);
    setError("");
    try {
      // TODO: Call Better Auth API to verify OTP
      console.log("OTP submitted:", otp);
      router.push('/auth/phone');
    } catch (err: any) {
      setError(err.message || "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-2 items-center justify-center flex-1">
        
        <div className="flex justify-center w-full">
          <div className="w-full max-w-lg pt-6">
            <form className="flex flex-col gap-6 w-full pt-5">
              <div className="grid gap-6">
                <div className="flex flex-col gap-5">
                  <h2 className="font-normal text-2xl text-[#104901]">Enter Code</h2>
                  <p className="text-base">Please enter the 6 digit code we sent to:<br /><span className="font-semibold text-[#104901]">tolulope.smith@gmail.com</span></p>
                  <OtpInput value={otp} onChange={setOtp} length={6} />
                  <hr />
                  <div className="flex justify-between mt-2">
                    <Button type="button" variant="outline" className="px-4" onClick={() => setOtp('')}><Clipboard/> Paste code</Button>
                    <span className="text-sm text-gray-500">Resend code in {otpTimer}s</span>
                  </div>
                </div>
              </div>
              {error && <p className="text-center text-red-500">{error}</p>}
              {isLoading && <p className="text-center text-[#104901]">Verifying...</p>}
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
            Over 100 Chainfunders can't be wrong
          </p>
          <span className="font-light text-sm text-black">
            Start fundraising today!
          </span>
        </div>
      </div>
    </div>
  );
}

