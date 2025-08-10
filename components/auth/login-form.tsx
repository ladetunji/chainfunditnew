"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { ArrowRight, Smartphone } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { OAuthButtons } from "./oauth-buttons";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const [isPhone, setIsPhone] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isPhone
            ? { action: "request_phone_otp", phone }
            : { action: "request_email_otp", email }
        ),
      });
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Unexpected response from server");
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      toast.success("OTP sent successfully!");
      // Store identifier and type for /otp page
      if (isPhone) {
        localStorage.setItem("otp_login_type", "phone");
        localStorage.setItem("otp_login_identifier", phone);
      } else {
        localStorage.setItem("otp_login_type", "email");
        localStorage.setItem("otp_login_identifier", email);
      }
      // --- Correction: Pass redirect param to OTP page ---
      let otpUrl = "/otp?mode=signin";
      if (redirect) otpUrl += `&redirect=${encodeURIComponent(redirect)}`;
      window.location.href = otpUrl;
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className={cn("flex flex-col w-full pt-3 px-2", className)} onSubmit={handleSubmit} {...props}>
      <div className="grid gap-4">
        <div className="grid gap-3">
          <section className="flex justify-between items-center">
            <Label
              htmlFor={isPhone ? "phone" : "email"}
              className="font-normal text-xl text-[#104901]"
            >
              {isPhone ? "Phone Number" : "Email"}
            </Label>
            <section
              className="flex gap-2 items-center cursor-pointer select-none"
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
            className="w-[360px] md:w-full bg-white rounded-lg border border-[#D9D9DC] outline-[#104901] placeholder:text-[#767676]"
            required
            value={isPhone ? phone : email}
            onChange={e => isPhone ? setPhone(e.target.value) : setEmail(e.target.value)}
            pattern={isPhone ? "[+]?\d{1,3}[\s-]?\d{1,14}(?:x.+)?" : undefined}
          />
        </div>
        <Button
          type="submit"
          className="w-[360px] md:w-full h-16 flex justify-between font-semibold text-2xl"
          disabled={isLoading}
        >
          Continue with {isPhone ? "Phone" : "Email"}
          <ArrowRight />
        </Button>
        {error && (
          <p className="text-center text-red-500 text-sm mt-2">{error}</p>
        )}
        <OAuthButtons mode="signin" />
      </div>
      <p className="text-center text-sm text-gray-600 my-2">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-base underline">
          Sign up
        </Link>
      </p>
      {/* {error && <p className="text-center text-red-500">{error}</p>} */}
    </form>
  );
}
