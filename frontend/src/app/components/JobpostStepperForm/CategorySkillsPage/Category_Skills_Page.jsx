import { useState } from "react";
import { useFormContext } from "react-hook-form";

import CategorySelector from "./CategorySelector";
import SkillsSelector from "./SkillsSelector";
import StepperNumber from "../StepperNumber";
import StepNavigation from "@/app/components/JobpostStepperForm/StepNavigation";
import { JobFormStep } from "@/app/components/JobpostStepperForm/JobFormStep";

const Category_Skills_Page = ({ nextStep, prevStep, setStep, fromReview }) => {
  const {
    trigger,
    formState: { },
    watch,
  } = useFormContext();

  const [buttonLoading, setButtonLoading] = useState(false);
  const selectedCategory = watch("category");

  const validateFields = async (callback) => {
    setButtonLoading(true);

    try {
      const valid = await trigger(["category", "skills"]);
      if (valid) callback();
    } finally {
      setButtonLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-10">
      <StepperNumber currstep={JobFormStep.categorySkills} />

      <div className="flex gap-6 lg:gap-25 flex-col lg:flex-row w-full">
        <div className="w-full flex flex-col gap-4">
          <h2 className="text-2xl lg:text-3xl xl:text-4xl 3xl:text-5xl font-semibold leading-tight text-heading">
            Let’s find the perfect freelancer for your project
          </h2>
          <p className="text-gray-500 text-base xl:text-lg font-normal leading-7 lg:leading-8 tracking-wide">
            This helps your job post stand out to the right candidates.
          </p>
        </div>

        <div className="w-full flex flex-col gap-6">
          <CategorySelector />

          {selectedCategory && (
            <SkillsSelector />
          )}
        </div>

      </div>
      <div>
        <StepNavigation
          onNext={() => validateFields(nextStep)}
          onBack={prevStep}
          showReviewBack={fromReview}
          onReviewBack={() =>
            validateFields(() => setStep(JobFormStep.review))
          }
          loading={buttonLoading}
        />
      </div>
    </div>
  );
};

export default Category_Skills_Page;
