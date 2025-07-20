"use client";

import { useParams } from "next/navigation";

export default function ChainerReferralPage() {
  const params = useParams();
  const referralCode = params.referral_code as string;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Chainer Referral</h1>
      <div className="max-w-2xl">
        <p className="text-gray-600 mb-6">
          You were referred by: <strong>{referralCode}</strong>
        </p>
        <div className="bg-blue-50 p-8 rounded-lg text-center">
          <p className="text-blue-600">Redirecting to campaign...</p>
          <p className="text-sm text-gray-500 mt-2">
            Chainer referral system coming soon...
          </p>
        </div>
      </div>
    </div>
  );
} 