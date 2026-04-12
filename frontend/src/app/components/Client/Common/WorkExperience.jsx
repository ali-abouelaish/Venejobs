import React from "react";

export default function WorkExperience() {
  return (
    <div className="flex flex-row gap-6">
      <div className="md:hidden flex flex-col items-center gap-2">
        <div className="w-[30px] h-[30px] rounded-full bg-[#5BBB7B4D]" />
        <div className="border-l-2 border-dashed border-l-[#5BBB7BCC] h-[38%]"></div>
        <div className="w-[30px] h-[30px] rounded-full bg-[#5BBB7B4D]" />
      </div>
      <div>
        <div>
          <p className="inline-block cursor-pointer overflow-hidden bg-[#FAFAFA] px-6 py-1 font-medium text-paragraph rounded-full text-base transition-all duration-300 relative z-10 before:content-[''] before:absolute before:inset-0 before:bg-gray-200 before:-translate-x-full before:transition-transform before:duration-300 before:-z-10 hover:before:translate-x-0">
            December 2023 - Present
          </p>
          <h6 className="text-heading text-base md:text-lg font-semibold my-3">Senior UXUI Designer | Freelancer</h6>
          <p className="text-paragraph text-xs md:text-base font-normal leading-7.5">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin a ipsum tellus. Interdum et malesuada fames ac ante ipsum primis in faucibus.</p>
        </div>
        <div>
          <p className="inline-block cursor-pointer overflow-hidden bg-[#FAFAFA] px-6 py-1 font-medium text-paragraph rounded-full text-base transition-all duration-300 relative z-10 before:content-[''] before:absolute before:inset-0 before:bg-gray-200 before:-translate-x-full before:transition-transform before:duration-300 before:-z-10 hover:before:translate-x-0">
            July 2023 - November 2023
          </p>
          <h6 className="text-heading text-base md:text-lg font-semibold my-3">Senior UXUI Designer | Design Arena</h6>
          <p className="text-paragraph text-xs md:text-base font-normal leading-7.5">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin a ipsum tellus. Interdum et malesuada fames ac ante ipsum primis in faucibus.</p>
        </div>
      </div>
    </div>
  );
}
