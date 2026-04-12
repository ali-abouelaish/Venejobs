import ReadMoreBtn from "@/app/components/button/ReadMoreBtn";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import Image from "next/image";
import React from "react";

export default function ProfileData() {

  return (
    <div className="flex flex-col gap-6 lg:gap-10 px-3 py-4 md:px-8 md:py-10 rounded-2xl" style={{ boxShadow: "2px 2px 50px 0px #0000000D" }}>
      {/* title and image */}
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex items-center gap-3.5 md:gap-8 w-full md:w-auto">
          <Image src="/freelancer.jpg" alt="Freelancer image"
            width={64}
            height={64}
            className="rounded-full w-15 h-15 md:w-25 md:h-25 cursor-pointer" />
          <div className="flex flex-col gap-2 md:gap-3">
            <div className="flex flex-row items-center gap-2 lg:gap-4 cursor-pointer">
              <h3 className="text-lg md:text-2xl text-heading font-semibold">
                Alishan Noor
              </h3>
            </div>
            <p className="text-paragraph text-sm md:text-lg font-normal">
              UX/UI Designer | Expert in Website|Software...
            </p>
            <div className="flex flex-row items-center justify-between md:justify-normal md:gap-10 md:mt-3">
              <p className="text-heading text-sm md:text-[15px] font-semibold">
                100k Earned&nbsp;
              </p>
              <p className="flex gap-4 text-sm md:text-[15px] text-paragraph font-medium">
                <SvgIcon name="Star" /> 5.0 (1 Review)
              </p>
            </div>
          </div>
        </div>
        <p className="text-paragraph text-[15px] md:text-base font-medium">Last seen 2 days ago</p>
      </div>
      <div className="flex justify-between md:justify-normal md:gap-15 w-full ">
        <div className="flex gap-6 items-center">
          <SvgIcon name="PiggyBank" size={32} color="#666666" />
          <div className="flex flex-col gap-2">
            <h6 className="text-sm md:text-lg font-semibold text-heading">
              Total Earning
            </h6>
            <p className="text-paragraph text-xs md:text-sm">100k Earned</p>
          </div>
        </div>
        <div className="flex gap-6 items-center">
          <SvgIcon name="Brifcase" size={32} color="#666666" />
          <div className="flex flex-col gap-2">
            <h6 className="text-sm md:text-lg font-semibold text-heading">
              Total Jobs
            </h6>
            <p className="text-paragraph text-xs md:text-sm">20</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 mt-2 md:mt-5">
        <h5 className="font-semibold text-lg md:text-2xl text-heading">
          About Freelancer
        </h5>
        <div>
          <p className="text-paragraph text-sm md:text-base leading-7 md:leading-9">Hello and Welcome to my profile!</p>
          <ReadMoreBtn text="Looking for a freelancer to work on your next project? As a Google-certified UX/UI Designer with 4+ years of expertise, I specialize in creating captivating digital experiences for websites, apps, and dashboards. Whether you need to boost user engagement, streamline navigation, or enhance visual appeal, I've got you covered., I'm here to help.Looking for a freelancer to work on your next project? As a Google-certified UX/UI Designer with 4+ years of expertise, I specialize in creating captivating digital experiences for websites, apps, and dashboards. Whether you need to boost user engagement, streamline navigation, or enhance visual appeal, I've got you covered., I'm here to help." paragraphFont="font-normal leading-7 md:leading-9" font="text-primary font-semibold" clampClass="line-clamp-6 lg:line-clamp-3" />
        </div>
      </div>
    </div>
  );
}
