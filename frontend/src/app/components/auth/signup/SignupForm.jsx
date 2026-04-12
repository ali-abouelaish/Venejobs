"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import userApiStore from "@/app/store/userStore";
import toastStore from "@/app/store/toastStore";

import SignupModalWrapper from "./SignupModalWrapper";
import SignupHeader from "./SignupHeader";
import SignupFormFields from "./SignupFormFields";
import SignupActions from "./SignupActions";

export default function SignupForm({ setActiveModal, setUserEmail, setverifyCode }) {
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible((v) => !v);

  const signup = userApiStore((s) => s.signup);
  const showSuccess = toastStore.getState().showSuccess;
  const showError = toastStore.getState().showError;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      const res = await signup(data);

      if (res.success) {
        showSuccess(res.message, "success");

        setUserEmail(data.email);
        setActiveModal("otp_verify");
        setverifyCode("signup-code");
      } else {
        showError(res.message, "error");
      }
    } catch (error) {
      showError(error.response?.data?.message || "Signup failed", "error");
    }
  };

  return (
    <SignupModalWrapper setActiveModal={setActiveModal}>
      <SignupHeader setActiveModal={setActiveModal} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-10 px-2 md:px-4">
        <SignupFormFields
          register={register}
          errors={errors}
          isVisible={isVisible}
          toggleVisibility={toggleVisibility}
        />

        <SignupActions
          isSubmitting={isSubmitting}
          setActiveModal={setActiveModal}
          register={register}
          errors={errors}
        />
      </form>
    </SignupModalWrapper>
  );
}
