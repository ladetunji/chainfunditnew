"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Clipboard } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from "sonner";
import { parseCookies } from 'nookies';

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

function PhoneOtpPageInner() {
  const [otp, setOtp] = useState("");
  const [otpTimer, setOtpTimer] = useState(21);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get phone and email from query or localStorage
  useEffect(() => {
    const p = searchParams.get("phone");
    const e = searchParams.get("email");
    console.log('phone from query:', p, 'email from query:', e);
    if (p) setPhone(p);
    else setPhone(localStorage.getItem("link_phone_number"));
    if (e) {
      setEmail(e);
      localStorage.setItem("link_phone_email", e);
    } else {
      const localEmail = localStorage.getItem("link_phone_email");
      if (localEmail) {
        setEmail(localEmail);
        console.log('email from localStorage:', localEmail);
      } else {
        // Try to get email from JWT cookie
        try {
          const cookies = parseCookies();
          const token = cookies['auth_token'];
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.email) {
              setEmail(payload.email);
              localStorage.setItem("link_phone_email", payload.email);
              console.log('email from JWT cookie:', payload.email);
            } else {
              console.log('No email in JWT payload:', payload);
            }
          } else {
            console.log('No auth_token cookie found');
          }
        } catch (err) {
          console.log('Error parsing JWT cookie:', err);
        }
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

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (!phone || !email) {
      toast.error('Missing phone or email.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/link-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_link_otp',
          phone,
          email,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOtp("");
        setOtpTimer(21);
        toast.success('OTP resent!');
      } else {
        toast.error(data.error || 'Failed to resend OTP');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
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
      console.log('Verifying OTP with:', { phone, otp, email });
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
      if (!res.ok) throw new Error(data.error || "Invalid OTP");
      // On success, clear localStorage
      localStorage.removeItem("link_phone_number");
      localStorage.removeItem("link_phone_email");
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteCode = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const code = text.replace(/\D/g, '').slice(0, 6);
      if (code.length === 6) setOtp(code);
      else toast.error("Clipboard does not contain a valid 6-digit code.");
    } catch {
      toast.error("Failed to read from clipboard.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-2 items-center justify-center flex-1 p-2 md:p-0">
        <div className="flex justify-center w-full">
          <div className="w-full max-w-lg pt-6">
            <form className="flex flex-col gap-6 w-full pt-5">
              <div className="grid gap-6">
                <div className="flex flex-col gap-5">
                  <h2 className="font-normal text-2xl text-[#104901]">Enter Code</h2>
                  <p className="text-base">Please enter the 6 digit code we sent to:<br /><span className="font-semibold text-[#104901]">{phone ? phone : <span className="text-red-600">No phone number found. Please go back and enter your phone.</span>}</span></p>
                  <OtpInput value={otp} onChange={setOtp} length={6} />
                  <hr />
                  <div className="flex justify-between mt-2">
                    <Button type="button" variant="outline" className="px-4" onClick={handlePasteCode}><Clipboard/> Paste code</Button>
                    {otpTimer > 0 ? (
                      <span className="text-sm text-gray-500">Resend code in {otpTimer}s</span>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        className="px-4 ml-2"
                        onClick={handleResendOtp}
                        disabled={isLoading}
                      >
                        Resend OTP
                      </Button>
                    )}
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

export default function PhoneOtpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PhoneOtpPageInner />
    </Suspense>
  );
}
