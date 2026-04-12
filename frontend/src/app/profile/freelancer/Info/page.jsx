"use client";

import PersonalInfoForm from "@/app/components/profile/PersonalInfoForm";
import FreelanceProfileLayout from "@/app/layout/FreelanceProfileLayout";

export default function Page() {
  return (
    <>
      <FreelanceProfileLayout>
        <PersonalInfoForm/>
      </FreelanceProfileLayout>
    </>
  );
}
