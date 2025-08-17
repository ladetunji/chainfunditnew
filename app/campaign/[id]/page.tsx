import Navbar from '../Navbar'
import Main from "../Main";
import React from "react";
import Cards from '../cards';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

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
          {error || "The campaign you&apos;re looking for doesn&apos;t exist or has been removed."}
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-[#104901] text-white rounded-lg hover:bg-[#0a3a01] transition-colors"
        >
          Go Back Home
        </Link>
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
      <Main campaignId={id} />
      <Cards campaignId={id} />
      <Footer />
    </div>
  );
};

export default page;