"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function DonationSuccessContent() {
  const searchParams = useSearchParams();
  const donationId = searchParams.get('donation');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Avoid hydration mismatch
  }

  return (
    <div className="min-h-screen bg-[#E5ECDE] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-[#104901] mb-4">
          Donation Successful!
        </h1>
        
        <p className="text-[#5F8555] mb-6">
          Thank you for your generous donation. Your support means the world to this campaign.
        </p>
        
        {donationId && (
          <div className="bg-[#F2F1E9] rounded-lg p-4 mb-6">
            <p className="text-sm text-[#5F8555]">
              Donation ID: <span className="font-mono text-xs">{donationId}</span>
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          <Button
            asChild
            className="w-full bg-[#104901] hover:bg-[#0d3d01] text-white"
          >
            <Link href="/dashboard/donations">
              View My Donations
            </Link>
          </Button>
          
          <Button
            asChild
            variant="outline"
            className="w-full border-[#104901] text-[#104901] hover:bg-[#104901] hover:text-white"
          >
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DonationSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#E5ECDE] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#104901] mx-auto mb-4"></div>
          <p className="text-[#5F8555]">Loading...</p>
        </div>
      </div>
    }>
      <DonationSuccessContent />
    </Suspense>
  );
}
