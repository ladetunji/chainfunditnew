import { LoginForm } from "@/components/auth/login-form";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="w-full flex flex-col gap-2 items-center justify-center px-2 md:px-0">
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
        <div className="w-full md:max-w-lg pt-4 md:pt-6">
          <LoginForm />
        </div>
      <div
        className="flex flex-row gap-2 items-center px-5 py-8 mt-10 w-full"
        style={{
          background: "linear-gradient(0deg, #F2F1E9 0%, #FFFFFF 75%)",
        }}
      >
        <ul className="flex items-center mb-2 md:mb-0">
          <li className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-[#104901]">
            <Image
              src="/images/avatar-3.png"
              alt="avatar"
              width={32}
              height={32}
              className="md:w-10 md:h-10"
            />
          </li>
          <li className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-[#104901] -ml-2 md:-ml-3">
            <Image
              src="/images/avatar-4.png"
              alt="avatar"
              width={32}
              height={32}
              className="md:w-10 md:h-10"
            />
          </li>
          <li className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-[#104901] -ml-2 md:-ml-3">
            <Image
              src="/images/avatar-5.png"
              alt="avatar"
              width={32}
              height={32}
              className="md:w-10 md:h-10"
            />
          </li>
          <li className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-[#104901] -ml-2 md:-ml-3">
            <Image
              src="/images/avatar-6.png"
              alt="avatar"
              width={32}
              height={32}
              className="md:w-10 md:h-10"
            />
          </li>
        </ul>
        <div className="text-center md:text-left">
          <p className="font-source font-semibold text-xs md:text-sm text-black">
            Over 100 life-changing experiences created on Chainfundit
          </p>
          <span className="font-light text-xs md:text-sm text-black">
            Start fundraising today!
          </span>
        </div>
      </div>
    </div>
  );
}
