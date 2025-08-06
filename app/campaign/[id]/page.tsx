import Navbar from '../Navbar'
import Main from "../Main";
import React from "react";
import Cards from '../cards';
import Footer from '@/components/layout/Footer';

interface PageProps {
  params: Promise<{ id: string }>;
}

const page = async ({ params }: PageProps) => {
  const { id } = await params;
  
  console.log('Campaign page accessed with ID:', id);

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