"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";

export default function ChainerReferralPage() {
  const params = useParams();
  const router = useRouter();
  const referralCode = params.referral_code as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        setLoading(true);
        
        // Call the API to track the click and get redirect URL
        const response = await fetch(`/api/c/${referralCode}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Invalid referral code');
        }
        
        const data = await response.json();
        
        if (data.success && data.redirectUrl) {
          // Track referral link click
          track("referral_link_clicked", {
            referral_code: referralCode,
            campaign_id: data.campaignId,
            chainer_id: data.chainerId,
          });
          
          // Redirect to the campaign page
          window.location.href = data.redirectUrl;
        } else {
          throw new Error('Failed to get redirect URL');
        }
      } catch (err) {
        console.error('Redirect error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    if (referralCode) {
      handleRedirect();
    }
  }, [referralCode]);

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-red-600">Error</h1>
        <div className="max-w-2xl">
          <p className="text-gray-600 mb-6">
            Referral code: <strong>{referralCode}</strong>
          </p>
          <div className="bg-red-50 p-8 rounded-lg text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Ambassador Referral</h1>
      <div className="max-w-2xl">
        <p className="text-gray-600 mb-6">
          You were referred by: <strong>{referralCode}</strong>
        </p>
        <div className="bg-blue-50 p-8 rounded-lg text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-blue-600">Redirecting to campaign...</p>
          <p className="text-sm text-gray-500 mt-2">
            Please wait while we redirect you to the campaign.
          </p>
        </div>
      </div>
    </div>
  );
} 