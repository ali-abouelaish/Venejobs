import React, { lazy, Suspense } from "react";
import ClientProfileLayout from "@/app/layout/ClientProfileLayout";
import PersonalInfoSkeleton from "@/app/components/Skeletons/PersonalInfoSkeleton";

const PersonalInfoForm = lazy(() =>
  import("@/app/components/profile/PersonalInfoForm")
);

export default function Info() {
  return (
    <ClientProfileLayout>
      <Suspense fallback={<PersonalInfoSkeleton />}>
        <PersonalInfoForm />
      </Suspense>
    </ClientProfileLayout>
  );
}
