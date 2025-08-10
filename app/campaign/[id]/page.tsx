import Navbar from '../Navbar'
import Main from "../Main";
import React from "react";
import Cards from '../cards';
import Footer from '@/components/layout/Footer';
import { Suspense } from 'react';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Loading component for the campaign page
const CampaignLoading = () => (
  <div className="h-full">
    <Navbar />
    <div className="max-w-[1440px] mx-auto mt-16 md:mt-22 h-full p-5 md:p-12">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-8"></div>
        <div className="h-96 bg-gray-200 rounded mb-4"></div>
        <div className="flex gap-4 mb-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-20 h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    </div>
    <Footer />
  </div>
);

// Error component for the campaign page
const CampaignError = ({ error }: { error: string }) => (
  <div className="h-full">
    <Navbar />
    <div className="max-w-[1440px] mx-auto mt-16 md:mt-22 h-full p-5 md:p-12">
      <div className="text-center py-12">
        <h1 className="text-2xl font-semibold text-red-600 mb-4">
          Campaign Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          {error || "The campaign you're looking for doesn't exist or has been removed."}
        </p>
        <a 
          href="/"
          className="px-6 py-3 bg-[#104901] text-white rounded-lg hover:bg-[#0a3a01] transition-colors"
        >
          Go Back Home
        </a>
      </div>
    </div>
    <Footer />
  </div>
);

const page = async ({ params }: PageProps) => {
  const { id } = await params;
  
  // Validate campaign ID format (basic validation)
  if (!id || id.trim() === '') {
    return <CampaignError error="Invalid campaign ID" />;
  }

  return (
    <div className='h-full'>
      <Navbar />
      <Suspense fallback={<CampaignLoading />}>
        <Main campaignId={id} />
        <Cards campaignId={id} />
      </Suspense>
      <Footer />
    </div>
  );
};

export default page;