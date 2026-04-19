"use client";
import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import ProjectOptions from "./ProjectOptions";
import BudgetOptions from "./BudgetOptions";
import DescriptionPage from "./DescriptionPage";
import ReviewJob from "./ReviewJob";
import SuccessJobCreate from "./SuccessJobCreate";
import toastStore from "@/app/store/toastStore";
import jobApiStore from "@/app/store/jobStore";
import TitlePage from "./TitlePage/TitlePage";
import Category_Skills_Page from "./CategorySkillsPage/Category_Skills_Page";
import { JobFormStep } from "./JobFormStep";

const MultiStepForm = () => {
  const [showConfirmMessage, setshowConfirmMessage] = useState(false);
  const showSuccess = toastStore.getState().showSuccess;
  const showError = toastStore.getState().showError;

  const methods = useForm({
    mode: "onSubmit",
    shouldUnregister: false,
    defaultValues: {
      skills: [],
      hire_count: "1",
    },
  });

  const {
    handleSubmit,
    formState: { errors },
  } = methods;

  const [step, setStep] = useState(JobFormStep.title);
  const [fromReview, setFromReview] = useState(false);

  const nextStep = () => setStep(step + 1);

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, JobFormStep.title));
  };
  const { create_job, loading } = jobApiStore();

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();

      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("category", data.category);
      formData.append("project_size", data.project_size);
      formData.append("duration", data.duration);
      formData.append("experience_level", data.experience_level);
      formData.append("budget_type", data.budget_type);
      formData.append("budget_amount", Number(data.budget_amount));
      formData.append("hire_count", Number(data.hire_count));

      if (data.skills?.length) {
        const skillsPayload = data.skills.map((skill) => ({
          name: skill,
          level: "Intermediate", // static level for skill
        }));

        formData.append("skills", JSON.stringify(skillsPayload));
      }

      if (data.attachment?.length) {
        formData.append("attachment", data.attachment[0]);
      }

      const res = await create_job(formData);

      if (res?.success) {
        showSuccess("Job posted successfully 🎉");
        setshowConfirmMessage(true);
      }
    } catch (error) {
      showError("JOB CREATE ERROR 👉", error);

      showError(
        error?.response?.data?.message ||
        error?.response?.data?.errors?.[0]?.msg ||
        "Something went wrong. Please try again."
      );
    }
  };

  const renderStep = () => {
    switch (step) {
      case JobFormStep.title:
        return (
          <TitlePage
            nextStep={nextStep}
            setStep={setStep}
            fromReview={fromReview}
          />
        );
      case JobFormStep.categorySkills:
        return (
          <Category_Skills_Page
            nextStep={nextStep}
            prevStep={prevStep}
            setStep={setStep}
            fromReview={fromReview}
          />
        );
      case JobFormStep.projectOptions:
        return (
          <ProjectOptions
            nextStep={nextStep}
            prevStep={prevStep}
            setStep={setStep}
            fromReview={fromReview}
          />
        );
      case JobFormStep.budgetOptions:
        return (
          <BudgetOptions
            nextStep={nextStep}
            prevStep={prevStep}
            setStep={setStep}
            fromReview={fromReview}
          />
        );
      case JobFormStep.description:
        return (
          <DescriptionPage
            nextStep={nextStep}
            prevStep={prevStep}
            setStep={setStep}
            fromReview={fromReview}
          />
        );
      case JobFormStep.review:
        return (
          <ReviewJob
            prevStep={prevStep}
            setStep={setStep}
            setFromReview={setFromReview}
          />
        );
      default:
        return <TitlePage
          nextStep={nextStep}
          prevStep={prevStep}
          fromReview={fromReview}
        />;
    }
  };

  return (
    <>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="w-full max-w-[90%] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1240px] 2xl:max-w-[1400px] mx-auto my-10 lg:my-20">
            {renderStep()}
          </div>
        </form>
      </FormProvider>

      {showConfirmMessage && <SuccessJobCreate />}
    </>
  );
};

export default MultiStepForm;
