import Navbar from '../Navbar'
import Main from "../Main";
import React from "react";
import Cards from '../cards';
import Footer from '@/components/layout/Footer';
import { db } from '@/lib/db';
import { campaigns } from '@/lib/schema/campaigns';
import { eq, or } from 'drizzle-orm';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const page = async ({ params }: PageProps) => {
  const { slug } = await params;

  // Handle undefined slug
  if (!slug || slug === 'undefined') {
    notFound();
  }

  // Find campaign by slug only
  const campaign = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.slug, slug))
    .limit(1);

  if (!campaign.length) {
    notFound();
  }

  const campaignData = campaign[0];

  return (
    <div className='h-full'>
      <Navbar />
      <Main campaignId={campaignData.id} />
      <Cards campaignId={campaignData.id} />
      <Footer />
    </div>
  );
};

export default page;

