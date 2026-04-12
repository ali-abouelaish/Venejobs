import { useEffect, useState, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import jobApiStore from "@/app/store/jobStore";
import CategorySelector from "./CategorySelector";
import SkillsSelector from "./SkillsSelector";
import StepperNumber from "../StepperNumber";
import StepNavigation from "@/app/components/Freelancer/AddProfileDetails/StepNavigation";

const CategorySkillsPage = ({ nextStep, prevStep, currstep }) => {
  const {
    watch,
    trigger,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useFormContext();

  const [buttonLoading, setButtonLoading] = useState(false);

  const {
    category_data,
    skills_data,
    getCategories,
    getSkillsByCategory,
    categoryLoading,
    skillsLoading,
  } = jobApiStore();

  useEffect(() => {
    getCategories();
  }, []);

  const handleCategoryChange = useCallback(
    async (categoryCode) => {
      setValue("skills", []);

      if (!categoryCode) return;

      await getSkillsByCategory(categoryCode);
    },
    [getSkillsByCategory, setValue]
  );

  const selectedCategory = watch("category");
  const categoryName =
    category_data?.find((cat) => cat.code === selectedCategory)?.name || "";

  const handleNext = async () => {
    setButtonLoading(true);

    try {
      const valid = await trigger(["category", "skills"]);
      if (valid) nextStep();
    } finally {
      setButtonLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-10">
      <StepperNumber currstep={currstep} />

      <div className="flex gap-6 lg:gap-15 flex-col lg:flex-row w-full">
        <div className="w-full flex flex-col gap-4">
          <h2 className="text-2xl lg:text-3xl xl:text-4xl 3xl:text-5xl font-bold leading-snug">
            Let’s choose your category and showcase your skills
          </h2>
          <p className="text-gray-500 text-base xl:text-lg font-normal leading-7 lg:leading-8 tracking-wide">
            Select the work you love to do and highlight your top skills.
          </p>
        </div>

        <div className="w-full flex flex-col gap-6">
          <CategorySelector
            category_data={category_data}
            getskillsbycategory={handleCategoryChange}
            loading={categoryLoading}
          />

          {selectedCategory && (
            <SkillsSelector
              categoryName={categoryName}
              skills_data={skills_data}
              errors={errors}
              loading={skillsLoading}
            />
          )}

          <StepNavigation
            onNext={handleNext}
            onBack={prevStep}
            loading={buttonLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default CategorySkillsPage;
