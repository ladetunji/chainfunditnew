import { LoginForm } from "@/components/auth/login-form";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-2 items-center justify-center">
      <Image
        src="/images/logo.svg"
        alt="Chainfundit Logo"
        width={82}
        height={80}
      />

      <h2 className="font-semibold text-4xl text-[#104901] text-center">
        Create life-changing <br /> experiences on Chainfundit
      </h2>
      <p className="font-normal text-xl text-[#104901]">
        Please sign in below.
      </p>
      <div className="flex flex-1 items-center justify-center w-full">
        <div className="w-full max-w-lg pt-6">
          <LoginForm />
        </div>
      </div>
      <div
        className="flex gap-4 items-center px-5 py-8 mt-10 w-full"
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
            Over 100 life-changing experiences created on Chainfundit
          </p>
          <span className="font-light text-sm text-black">
            Start fundraising today!
          </span>
        </div>
      </div>
    </div>
  );
}
