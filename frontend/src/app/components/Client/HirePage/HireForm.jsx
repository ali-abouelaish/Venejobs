"use client";

import { useForm, FormProvider } from "react-hook-form";
import ContractTerms from "./ContractTerms";
import { useRouter } from "next/navigation";
import { Routes } from "@/app/routes";

export default function HireForm() {
  const methods = useForm({
    defaultValues: {
      message: "",
    },
  });

  const router = useRouter();

  const nextStep = async () => {
    router.push(Routes.client.hirePayment);
  };

  return (
    <FormProvider {...methods}>
      <form>
        <ContractTerms onNext={nextStep} />
      </form>
    </FormProvider>
  );
}
