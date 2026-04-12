"use client";
import { useFormContext } from "react-hook-form";
import SvgIcon from "../Utility/SvgIcon";
import jobApiStore from "@/app/store/jobStore";
import StepNavigation from "./StepNavigation";
import { JobFormStep } from "@/app/components/JobpostStepperForm/JobFormStep";
import Button from "@/app/components/button/Button";

const Row = ({ title, children, onEdit }) => (
  <div className="flex justify-between border-b border-[#DEDEDE] pb-4 px-4 lg:px-10">
    <div className="flex flex-col gap-4">
      <h2 className="font-semibold text-[clamp(1.25rem,2.5vw,1.3rem)] text-heading">
        {title}
      </h2>
      {children}
    </div>

    {onEdit && (
      <div
        onClick={onEdit}
        className="cursor-pointer inline-flex items-center justify-center
             transition-transform duration-200 ease-out
             hover:scale-105 active:scale-90"
      >
        <SvgIcon
          name="PostEditBold"
          className=" text-blue-900 transition-colors duration-200"
          size={24}
        />
      </div>

    )}
  </div>
);

const ReviewJob = ({ prevStep, setStep, setFromReview }) => {
  const loading = jobApiStore((state) => state.loading);
  const { watch } = useFormContext();
  const data = watch();

  // edit handler
  const handleEdit = (step) => {
    setFromReview(true);
    setStep(step);
  };

  // Format deadline
  const parts = data.duration?.split("_") ?? [];
  const final_deadline =
    parts[0] === "ongoing"
      ? "Ongoing"
      : `${parts[0]} to ${parts[1]} ${parts[2]}`;

  function formatCategory(value) {
    if (!value) return "";

    return value
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-10">
      <div className="flex flex-col gap-8">
        <div className="flex flex-row justify-between">
          <div className="flex flex-col gap-2.5">
            <h2 className="text-xl lg:text-2xl text-heading font-semibold leading-9">
              Review your Job details
            </h2>

            <p className="text-paragraph text-base xl:text-[17px] font-normal leading-7 tracking-wide">
              Take a moment to double-check your job details to ensure everything is clear and ready for the right talent to apply.
            </p>
          </div>
          <Button
            type="submit"
            variant="primaryOutlined"
          >
            Post job post
            <SvgIcon name="NextArrow" />
          </Button>

        </div>

        <div className="h-auto py-10 flex flex-col gap-10 hover:bg-neutral-secondary-medium mt-8 border-default rounded shadow-[2px_2px_50px_4px_rgba(0,0,0,0.05)]">
          {/* title */}
          <Row title="Title" onEdit={() => handleEdit(JobFormStep.title)}>
            <p className="text-paragraph text-base">{data.title}</p>
          </Row>

          {/* description */}
          <Row title="Description" onEdit={() => handleEdit(JobFormStep.description)}>
            <p className="text-paragraph text-base max-w-[900px] break-all">
              {data.description}
            </p>

            <h2 className="font-semibold text-[clamp(1.25rem,2.5vw,1.3rem)] text-heading">
              Attachments
            </h2>
            {data?.attachment?.length > 0 ? (
              <div className="flex items-center gap-2 border border-[#44444414] rounded-md px-3 py-2">
                <div className="bg-gray-200 p-2 md:p-3 rounded-full">
                  <SvgIcon name="File" size={32} />
                </div>

                <div className="flex flex-col">
                  <h3 className="text-heading text-xs md:text-sm">
                    {data.attachment[0].name}
                  </h3>
                  <p className="text-paragraph text-[10px] md:text-xs">
                    {(data.attachment[0].size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-paragraph text-sm">
                No file attached
              </p>
            )}
          </Row>

          {/* CATEGORY + SKILLS */}
          <Row title="Category" onEdit={() => handleEdit(JobFormStep.categorySkills)}>
            <p className="text-paragraph text-base"> {formatCategory(data.category)}</p>

            <h2 className="font-semibold text-[clamp(1.25rem,2.5vw,1.3rem)] text-heading">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              <p className="text-paragraph text-base">
                {data.skills?.map(skill => `${skill} (Intermediate)`).join(", ")}
              </p>
            </div>
          </Row>

          {/* PROJECT DETAILS */}
          <Row title="Project size" onEdit={() => handleEdit(JobFormStep.projectOptions)}>
            <p className="text-paragraph text-base md:text-lg">{data.project_size}</p>

            <h2 className="font-semibold text-[clamp(1.25rem,2.5vw,1.3rem)] text-heading">
              Deadline
            </h2>
            <p className="text-paragraph text-base">{final_deadline}</p>

            <h2 className="font-semibold text-[clamp(1.25rem,2.5vw,1.3rem)] text-heading">
              Experience Level
            </h2>
            <p className="text-paragraph text-base">{data.experience_level}</p>
          </Row>

          {/* BUDGET */}
          <Row title="Budget Type" onEdit={() => handleEdit(JobFormStep.budgetOptions)}>
            <p className="text-paragraph text-base">{data.budget_type}</p>

            <h2 className="font-semibold text-[clamp(1.25rem,2.5vw,1.3rem)] text-heading">
              Budget Amount
            </h2>
            <p className="text-paragraph text-base">{data.budget_amount}</p>
          </Row>
          <div className="px-4 lg:px-10">
            {/* BUTTONS */}
            <StepNavigation
              isLastStep
              onBack={prevStep}
              loading={loading}
              submitLabel="Post This Job"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewJob;
