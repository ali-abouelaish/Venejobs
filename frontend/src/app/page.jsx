"use client";

import Navbar from "./components/navbar/Navbar";
import HeroSection from "./components/home/HeroSection";
import HowItWorks from "./components/home/HowItWorks";
import BrowseCategories from "./components/home/BrowseCategories";
import FreelancerPromo from "./components/home/FreelancerPromo";
import MostPopular from "./components/home/MostPopular";
import { footerClientConfig } from "./utils/footer/footerClientConfig";
import Footer from "./components/Footer/Footer";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <div className="w-full h-[90vh] md:h-screen xl:h-[90vh] bg-primary relative flex flex-col bg-cover bg-center">
        <Image
          src="/bg-image.png"
          width={1800}
          height={1500}
          alt="Hero background"
          className="absolute inset-0 w-full h-full object-cover -z-10"
        />
        <div className="w-full lg:max-w-[960px] xl:max-w-[1240px] 2xl:max-w-[1600px] mx-auto">
          <Navbar />
        </div>
        <div className="w-full max-w-[90%] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1240px] 2xl:max-w-[1600px] mx-auto flex-1 flex justify-center items-center">
          <HeroSection />
        </div>
      </div>
      ``
      {/* FIXED layout: proper wrapper */}
      <main className="w-full max-w-[90%] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1240px] 2xl:max-w-[1600px] mx-auto flex flex-col gap-20 lg:gap-30 my-20 lg:my-30">
        <HowItWorks />

        {/* <BrowseCategories />

        <FreelancerPromo />
        <MostPopular /> */}
      </main>
      <Footer {...footerClientConfig} />
    </>
  );
}
