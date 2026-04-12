import React from "react";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import Image from "next/image";
import Skills from "@/app/components/Client/Common/Skills";

const CoverletterRightPanel = () => {
  return (
    <div className="w-full lg:w-[35%] flex flex-col gap-6">
      {/* title and image */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3.5 md:gap-6 w-full md:w-auto">
          <Image src="/freelancer.jpg" alt="Freelancer image"
            width={64}
            height={64}
            className="rounded-full w-15 h-15 md:w-20 md:h-20 cursor-pointer" />
          <div className="flex flex-col gap-2">
            <div className="flex flex-row items-center gap-2 lg:gap-4 cursor-pointer">
              <h3 className="text-lg text-heading font-semibold">
                Alishan Noor
              </h3>
            </div>
            <p className="text-paragraph text-sm font-normal">
              UX/UI Designer | Expert in Website|Software...
            </p>
            <div className="flex flex-row items-center gap-10">
              <p className="text-heading text-sm font-semibold">
                100k Earned&nbsp;
              </p>
              <p className="flex gap-4 text-sm text-paragraph font-medium">
                <SvgIcon name="Star" /> 5.0 (1 Review)
              </p>
            </div>
          </div>
        </div>
        <p className="text-paragraph text-base font-semibold">
          Has 13 relevant skills to your job
        </p>
        {/*category and skills */}
        <Skills />
      </div>
      {/* buttons [desktop] */}
      <div className="flex flex-col mt-2 gap-8 w-full">
        <div className="flex flex-row gap-8">
          <button className="bg-primary font-semibold w-[180px] py-4 rounded text-white text-xs md:text-base cursor-pointer">Hire</button>
          <button className="bg-white font-semibold w-[180px] py-4 rounded text-paragraph text-xs md:text-base cursor-pointer border border-[#FAFAFA]" style={{ boxShadow: "2px 2px 50px 5px #0000000D" }}>
            Message
          </button>
        </div>
        <div className="flex flex-row gap-10 lg:justify-between">
          <button className="text-primary text-xs md:text-sm flex flex-col items-center gap-2 cursor-pointer">
            <SvgIcon name="Like" size={24} />Shortlisted
          </button>
          <button className="text-paragraph text-xs md:text-sm flex flex-col items-center gap-2 cursor-pointer">
            <SvgIcon name="Archive" size={24} />Archive
          </button>
          <button className="text-paragraph text-xs md:text-sm flex flex-col items-center gap-2 cursor-pointer">
            <SvgIcon name="Delete" size={24} />Decline proposal
          </button>
          <button className="text-paragraph text-xs md:text-sm flex flex-col items-center gap-2 cursor-pointer">
            <SvgIcon name="More" size={24} />More
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoverletterRightPanel;
