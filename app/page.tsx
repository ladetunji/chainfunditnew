import Image from "next/image";
import "./globals.css";

import React from "react";
import Navbar from "./components/Navbar";
import Main from "./components/Main";
import Partners from "./components/Partners";
import Hero from "./components/Hero";
import CustomerStories from "./components/CustomerStories";
import FAQs from "./components/faqs";
import Footer from "./components/Footer";

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
