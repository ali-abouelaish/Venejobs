"use client";
import MultiStepForm from "@/app/components/Freelancer/AddProfileDetails/MultiStepForm";
import FreelancerLayout from "@/app/layout/FreelancerLayout";

import { useRouter } from "next/navigation";


export default function page() {
  const router = useRouter();

  return (
    <>
      <FreelancerLayout>
        <MultiStepForm />
      </FreelancerLayout>
    </>
  );
}
