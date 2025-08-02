import { LoginForm } from "@/components/auth/login-form";
import Image from "next/image";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="w-full h-[calc(100vh-190px)] flex flex-col gap-5 px-3">
      <div className="flex flex-col items-center justify-center">
        <Image
          src="/images/logo.svg"
          alt="Chainfundit Logo"
          width={64}
          height={62}
          className="md:w-[82px] md:h-[80px]"
        />

        <h2 className="font-semibold text-2xl md:text-4xl text-[#104901] text-center">
          Create life-changing <br /> experiences on Chainfundit
        </h2>
        <p className="font-normal text-base md:text-xl text-[#104901]">
          Please sign in below.
        </p>
      </div>

      <Suspense fallback={<></>}>
        <div className="w-full max-w-sm md:max-w-lg pt-4 md:pt-6">
          <LoginForm />
        </div>
      </Suspense>
    </div>
  );
}
