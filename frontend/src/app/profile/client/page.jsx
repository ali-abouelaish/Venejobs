"use client";
import { useEffect, useState } from "react";
import userApiStore from "@/app/store/userStore";
import DesktopLinks from "@/app/components/profile/ClientProfile/DesktopLinks";
import PersonalInfoForm from "@/app/components/profile/PersonalInfoForm";
import ClientLayout from "@/app/layout/ClientLayout";
import Page from "./Mobile/page";

export default function Profile() {
  const { user, logout, fetchProfile } = userApiStore();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <>
      <ClientLayout>
        <div className="w-full max-w-[90%] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1240px] 2xl:max-w-[1400px] mx-auto my-10 lg:my-20">
          <div className="flex md:gap-7">
            <Page />
            <DesktopLinks />

            <div className="hidden lg:flex border border-[#F2F2F2] p-7 rounded-2xl mx-auto flex-col w-full  gap-6 ">
              <PersonalInfoForm />
            </div>
          </div>
        </div>
      </ClientLayout>
    </>
  );
}
