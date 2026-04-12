"use client";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import Image from "next/image";

export default function ProjectSummary() {
  return (
    <>
      <div className="flex flex-col lg:flex-row gap-8 lg:pb-15 p-6 lg:p-8 rounded-2xl" style={{ boxShadow: "2px 2px 50px 0px #0000000D" }}>
        <div className="w-full flex flex-col gap-6 md:gap-8">
          <div className="flex flex-col md:flex-row items-start gap-10 lg:justify-between">
            <h1 className="text-2xl lg:text-[32px] text-heading font-semibold tracking-normal">
              Project Summary
            </h1>
            <div className="hidden md:flex flex-row gap-8">
              <button className="bg-primary font-semibold w-[150px] lg:w-[180px] py-4 rounded text-white text-xs md:text-base cursor-pointer">Dispute</button>
              <button className="text-paragraph text-xs md:text-sm flex flex-col items-center gap-2 cursor-pointer">
                <SvgIcon name="More" size={24} />More
              </button>
            </div>
          </div>
          {/* title and image */}
          <div className="flex items-center gap-3 md:gap-6">
            <Image
              src="/freelancer.jpg"
              alt="Freelancer image"
              width={60}
              height={60}
              className="rounded-full w-20 h-20 md:w-25 md:h-25"
            />
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-row items-center gap-2 lg:gap-4">
                <h3 className="text-lg lg:text-2xl text-heading font-semibold">
                  Alishan Noor
                </h3>
              </div>
              <p className="text-paragraph text-sm lg:text-lg font-medium">
                Social Media Marketing Campaign
              </p>
              <div className="flex flex-row items-center gap-10">
                <p className="flex gap-4 text-sm text-paragraph lg:text-lg font-semibold">
                  Started Date : 13 Dec
                </p>
                <p className="text-sm text-paragraph lg:text-lg font-semibold">
                  End Date : 13 Dec
                </p>
              </div>
            </div>
          </div>
          <div className="flex">
            <div className="w-1/2 md:w-[60%] flex flex-col md:flex-row gap-10 lg:gap-20 md:border-r md:border-[#6666664D]">
              <div className="flex flex-col gap-2">
                <h2 className="text-heading lg:text-2xl font-semibold">Project Price</h2>
                <p className="text-paragraph text-sm lg:text-lg font-medium">$1500.00</p>
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-heading lg:text-2xl font-semibold">Secured Funds</h2>
                <p className="text-paragraph text-sm lg:text-lg font-medium">$1500.00</p>
              </div>
            </div>
            <div className="w-1/2 md:w-[40%] flex flex-row gap-20 justify-center md:justify-end">
              <div className="flex flex-col gap-2">
                <h2 className="text-heading lg:text-2xl font-semibold">Total Charges</h2>
                <p className="text-paragraph text-sm lg:text-lg font-medium">$1500.00</p>
              </div>
            </div>
          </div>
          <div className="flex md:hidden flex-row gap-8 mt-3">
            <button className="bg-primary font-semibold w-[150px] lg:w-[180px] py-4 rounded text-white text-xs md:text-base cursor-pointer">Message</button>
            <button className="text-paragraph text-xs md:text-sm flex flex-col items-center gap-2 cursor-pointer">
              <SvgIcon name="More" size={24} />More
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
