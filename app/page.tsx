import Image from "next/image";
import "./globals.css";

import React from "react";
import Navbar from "@/components/layout/Navbar";
import Main from '@/components/homepage/Main'
import Partners from '@/components/homepage/Partners'
import Hero from '@/components/homepage/Hero'
import CustomerStories from '@/components/homepage/CustomerStories'
import FAQs from '@/components/homepage/faqs'
import Footer from "@/components/layout/Footer";

type Props = {};

const page = (props: Props) => {
  return (
    <div className="">
      <Navbar />
      <Hero />
      <Partners />
      <Main />
      <CustomerStories />
      <FAQs />
      <Footer />
    </div>
  );
};

export default page;
