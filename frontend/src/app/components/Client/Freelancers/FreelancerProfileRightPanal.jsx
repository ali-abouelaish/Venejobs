import React from "react";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import Skills from "@/app/components/Client/Common/Skills";

const FreelancerProfileRightPanal = () => {
  const freelancerLanguages = [
    { language: "English Level", proficiency: "Fluent" },
    { language: "Urdu Level", proficiency: "Fluent" },
    { language: "Russia Level", proficiency: "Native or Bilingual" },
  ];

  return (
    <div className="w-full lg:w-[27%] flex flex-col gap-10">
      <div className="flex flex-col gap-10 rounded-lg px-4 py-8" style={{ boxShadow: "0px 6px 50px 0px #404F680D" }}>
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <SvgIcon name="Language" size={24} />
            <h2 className="font-semibold text-lg">Language</h2>
          </div>
          {freelancerLanguages?.map((item) => (
            <div className="flex flex-col gap-8" key={item.language}>
              <div className="flex items-center justify-between">
                <h2 className="font-medium text-heading">{item.language}</h2>
                <p className="text-paragraph">{item.proficiency}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-4">
          <h6 className="font-semibold text-lg text-heading">Skills</h6>
          {/*category and skills */}
          <Skills />
        </div>
      </div>
      {/* buttons [desktop] */}
      <div className="flex flex-row gap-4">
        <button className="bg-primary font-semibold w-[177px] py-4 rounded text-white text-xs md:text-base cursor-pointer">Hire</button>
        <button className="bg-white font-semibold w-[177px] py-4 rounded text-paragraph text-xs md:text-base cursor-pointer border border-[#FAFAFA]" style={{ boxShadow: "2px 2px 50px 5px #0000000D" }}>
          Message
        </button>
      </div>
    </div>
  );
};

export default FreelancerProfileRightPanal;
