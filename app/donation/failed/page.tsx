"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function DonationFailedContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'missing_reference':
        return 'Payment reference is missing. Please try again.';
      case 'verification_failed':
        return 'Payment verification failed. Please contact support.';
      case 'donation_not_found':
        return 'Donation record not found. Please contact support.';
      case 'callback_error':
        return 'An error occurred while processing your payment.';
      default:
        return 'Your donation could not be processed. Please try again.';
    }
  };

  if (!mounted) {
    return null; // Avoid hydration mismatch
  }

  return (
    <div className="min-h-screen bg-[#E5ECDE] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-[#104901] mb-4">
          Donation Failed
        </h1>
        
        <p className="text-[#5F8555] mb-6">
          {getErrorMessage(error)}
        </p>
        
        <div className="space-y-3">
          <Button
            asChild
            className="w-full bg-[#104901] hover:bg-[#0d3d01] text-white"
          >
            <Link href="javascript:history.back()">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
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
        
        <div className="mt-6 p-4 bg-[#F2F1E9] rounded-lg">
          <p className="text-sm text-[#5F8555]">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@chainfundit.com" className="font-medium underline">
              support@chainfundit.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DonationFailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#E5ECDE] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#104901] mx-auto mb-4"></div>
          <p className="text-[#5F8555]">Loading...</p>
        </div>
      </div>
    }>
      <DonationFailedContent />
    </Suspense>
  );
}
