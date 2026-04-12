"use client";
import Education from "@/app/components/Client/Common/Education";
import Portfolio from "@/app/components/Client/Common/Portfolio";
import Reviews from "@/app/components/Client/Common/Reviews";
import WorkExperience from "@/app/components/Client/Common/WorkExperience";
import FreelancerProfileRightPanal from "@/app/components/Client/Freelancers/FreelancerProfileRightPanal";
import ProfileData from "@/app/components/Client/Freelancers/ProfileData";
import ClientLayout from "@/app/layout/ClientLayout";

export default function FreelancerProfile() {
  return (
    <>
      <ClientLayout>
        <div className="w-full max-w-[90%] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1240px] 2xl:max-w-[1400px] mx-auto my-10 lg:my-20">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
            <div className="flex flex-col w-full lg:w-[73%] gap-8 ml-0 lg:ml-5">
              <ProfileData />
              <div className="flex flex-col gap-6 md:gap-8 rounded-2xl px-3 pb-2 pt-8 md:p-8" style={{ boxShadow: "2px 2px 50px 0px #0000000D" }}>
                <h2 className="font-semibold text-2xl text-black">
                  Reviews
                </h2>
                <Reviews />
              </div>
              <div className="flex flex-col gap-6 md:gap-8 rounded-2xl px-3 pb-2 pt-8 md:p-8" style={{ boxShadow: "2px 2px 50px 0px #0000000D" }}>
                <h2 className="font-semibold text-2xl text-black">
                  Portfolio
                </h2>
                <Portfolio />
              </div>
              <div className="flex flex-col gap-3 rounded-2xl px-3 py-8 md:p-8" style={{ boxShadow: "2px 2px 50px 0px #0000000D" }}>
                <h2 className="font-semibold text-2xl mb-3 text-heading">Education</h2>
                <Education />
              </div>
              <div className="flex flex-col gap-3 rounded-2xl px-3 py-8 md:p-8" style={{ boxShadow: "2px 2px 50px 0px #0000000D" }}>
                <h2 className="font-semibold text-2xl mb-3 text-heading">Work & Experience</h2>
                <WorkExperience />
              </div>
            </div>
            <FreelancerProfileRightPanal />
          </div>
        </div>
      </ClientLayout>
    </>
  );
}
