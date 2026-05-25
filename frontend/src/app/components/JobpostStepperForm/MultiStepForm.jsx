"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const editId = searchParams?.get("id") || null;
  const isEdit = !!editId;

  const [showConfirmMessage, setshowConfirmMessage] = useState(false);
  const [hydrated, setHydrated] = useState(!isEdit);
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

  const { handleSubmit, reset } = methods;

  const [step, setStep] = useState(JobFormStep.title);
  const [fromReview, setFromReview] = useState(false);

  const nextStep = () => setStep(step + 1);

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, JobFormStep.title));
  };
  const { create_job, update_job, getJobById, job } = jobApiStore();

  // In edit mode, pull the job and pre-fill the form once.
  useEffect(() => {
    if (!isEdit) return;
    getJobById(editId);
  }, [isEdit, editId, getJobById]);

  useEffect(() => {
    if (!isEdit || hydrated) return;
    if (!job || Array.isArray(job)) return;

    const skillNames = Array.isArray(job.skills)
      ? job.skills.map((s) => s.skill_name ?? s.name).filter(Boolean)
      : [];

    reset({
      title: job.title ?? "",
      description: job.description ?? "",
      category: job.category ?? "",
      project_size: job.project_size ?? "",
      duration: job.duration ?? "",
      experience_level: job.experience_level ?? "",
      budget_type: job.budget_type ?? "",
      budget_amount: job.budget_amount ?? "",
      hire_count: String(job.hire_count ?? "1"),
      skills: skillNames,
    });
    setHydrated(true);
  }, [isEdit, hydrated, job, reset]);

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
          level: "Intermediate",
        }));
        formData.append("skills", JSON.stringify(skillsPayload));
      }

      if (data.attachment?.length) {
        formData.append("attachment", data.attachment[0]);
      }

      const res = isEdit
        ? await update_job(editId, formData)
        : await create_job(formData);

      if (res?.success) {
        showSuccess(isEdit ? "Job updated 🎉" : "Job posted successfully 🎉");
        setshowConfirmMessage(true);
      }
    } catch (error) {
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
            {isEdit && !hydrated ? (
              <div className="text-center my-20 text-lg font-medium text-paragraph">
                Loading job…
              </div>
            ) : (
              <>
                {isEdit && (
                  <p className="mb-4 inline-flex items-center gap-2 rounded bg-[#5BBB7B0D] text-primary text-sm font-semibold px-3 py-1">
                    Editing existing posting
                  </p>
                )}
                {renderStep()}
              </>
            )}
          </div>
        </form>
      </FormProvider>

      {showConfirmMessage && <SuccessJobCreate />}
    </>
  );
};

export default MultiStepForm;
