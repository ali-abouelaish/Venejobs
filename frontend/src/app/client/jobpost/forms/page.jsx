"use client";
import { Suspense } from "react";
import Multistepform from "@/app/components/JobpostStepperForm/MultiStepForm";
import ClientLayout from "@/app/layout/ClientLayout";

export default function Page() {
  return (
    <ClientLayout>
      <Suspense fallback={<div className="text-center my-20">Loading…</div>}>
        <Multistepform />
      </Suspense>
    </ClientLayout>
  );
}
