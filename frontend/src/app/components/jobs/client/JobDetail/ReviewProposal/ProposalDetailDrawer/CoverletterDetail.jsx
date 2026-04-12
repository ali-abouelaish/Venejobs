import React from "react";
import Skills from "@/app/components/Client/Common/Skills";
import WorkExperience from "@/app/components/Client/Common/WorkExperience";
import Education from "@/app/components/Client/Common/Education";
import Reviews from "@/app/components/Client/Common/Reviews";
import Portfolio from "@/app/components/Client/Common/Portfolio";

export default function CoverletterDetail() {

  return (
    <div className="w-full lg:w-[65%] flex flex-col gap-6 lg:gap-10">
      <div className="flex flex-col gap-6 lg:gap-10 border-b lg:border-r border-[#44444414] pb-8 lg:pb-10 lg:pr-8">
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-2xl md:text-[32px] text-heading">
            Cover letter
          </h2>
          <div className="flex flex-col gap-5">
            <p className="text-paragraph text-xs md:text-base leading-7">
              Hi 👋,<br></br>
              You are looking for a skilled web designer to create a personal website for the CEO of a venture capital firm. I can help with that and get this job done as efficiently as possible, saving you money and time., so I can start.</p>
            <p className="text-paragraph text-xs md:text-base leading-7">
              About me:<br></br>
              I have over 4 years of experience in creating engaging digital experiences for websites, apps, and dashboards. My process starts with understanding client needs, sketching wireframe concepts, and developing high-fidelity designs. I welcome feedback at all stages, though most clients prefer to provide it at the high-fidelity stage. My goal is to ensure the design meets the client's vision perfectly.</p>
            <p className="text-paragraph text-xs md:text-base leading-7">
              I believe communication is key to any successful project, and I'd like to start things on the right foot but suggesting to have a call or chat to discuss this further.You can book a meeting from
              https://calendly.com/alishannoor/30min?month=2024-05</p>
            <p className="text-paragraph text-xs md:text-base leading-7">
              Portfolio:<br></br>
              https://www.behance.net/alishannoor001</p>
            <p className="text-paragraph text-xs md:text-base leading-7">
              Looking forward to hearing from you.
            </p>
            <p className="text-paragraph text-xs md:text-base leading-7">
              Kind regards,<br></br>
              Alishan Noor
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-6 md:gap-8 border-b border-[#44444414] pb-2">
        <h2 className="font-semibold text-2xl md:text-[32px] text-black">
          Completed jobs (4)
        </h2>
        <Reviews />
      </div>
      <div className="flex flex-col gap-8 border-b border-[#44444414] pb-2">
        <h2 className="font-semibold text-2xl md:text-[32px] text-black">
          Portfolio (4)
        </h2>
        <Portfolio />
      </div>
      <div className="flex flex-col gap-3 border-b border-[#44444414] pb-8">
        <h2 className="font-semibold text-2xl md:text-[32px] mb-3 text-heading">Education</h2>
        <Education />
      </div>
      <div className="flex flex-col gap-3 border-b border-[#44444414] pb-8">
        <h2 className="font-semibold text-2xl md:text-[32px] mb-3 text-heading">Work & Experience</h2>
        <WorkExperience />
      </div>
      <div className="flex flex-col gap-6">
        <h2 className="font-semibold text-2xl md:text-[32px] text-heading">
          Skills
        </h2>
        <Skills />
      </div>
    </div>
  );
}
