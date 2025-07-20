"use client";

import  Hero  from "@/components/homepage/Hero";
import  BenefitsCarousel  from "@/components/homepage/BenefitsCarousel";

export default function CampaignsPage() {
  return (
    <div>
      <Hero />
      <BenefitsCarousel />
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Browse Campaigns</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Campaign cards will go here */}
          <div className="bg-gray-100 p-8 rounded-lg text-center">
            <p className="text-gray-500">Campaign listings coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
} 