"use client";
import DesktopLinks from "@/app/components/profile/FreelancerProfile/DesktopLinks";
import PersonalInfoForm from "@/app/components/profile/PersonalInfoForm";
import FreelancerLayout from "@/app/layout/FreelancerLayout";
import MobileView from "./Mobile/page";

export default function Profile() {

  return (
    <>
      <FreelancerLayout>
        <div className="w-full max-w-[90%] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1240px] 2xl:max-w-[1400px] mx-auto my-10 lg:my-20">
          <div className="flex gap-10 px-3 md:px-0 ">
            <MobileView />
            <DesktopLinks />
            <div className="hidden lg:flex border border-[#F2F2F2] p-5 rounded-2xl mx-auto flex-col w-full gap-6">
              <PersonalInfoForm />
            </div>
          </div>
        </div>
      </FreelancerLayout>
    </>
  );
}
