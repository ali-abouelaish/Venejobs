import { useFormContext } from "react-hook-form";
import StepperNumber from "./StepperNumber";
import { useState } from "react";
import StepNavigation from "@/app/components/JobpostStepperForm/StepNavigation";
import { JobFormStep } from "@/app/components/JobpostStepperForm/JobFormStep";
import SvgIcon from "@/app/components/Utility/SvgIcon";

const DescriptionPage = ({ nextStep, prevStep, setStep, fromReview }) => {
  const {
    register,
    formState: { errors },
    trigger,
    setValue,
    watch,
  } = useFormContext();
  const [loadingNext, setLoadingNext] = useState(false);

  const attachment = watch("attachment");

  const validateFields = async (callback) => {
    setLoadingNext(true);

    const valid = await trigger(["description"]);
    if (valid) {
      callback();
    }

    setLoadingNext(false);
  };

  const validateDescription = (value) => {
    const words = value.trim().split(/\s+/);
    const wordCount = words.filter(Boolean).length;

    if (wordCount < 20) return "Description must be at least 20 words";
    if (wordCount > 200) return "Description must not exceed 200 words";

    return true;
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-10">
      <StepperNumber currstep={JobFormStep.description} />
      <div className="flex gap-6 lg:gap-25 flex-col lg:flex-row w-full">
        <div className="w-full flex flex-col gap-4">
          <h2 className="text-2xl lg:text-3xl xl:text-4xl 3xl:text-5xl font-semibold leading-tight text-heading">
            Share the Details of Your Project
          </h2>
          <p className="text-gray-500 text-base xl:text-lg font-normal leading-7 lg:leading-8 tracking-wide">
            Provide a clear overview of your project, including your goals,
            requirements, and expectations, to attract the right talent.
          </p>
        </div>

        <div className="w-full flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <h2 className="font-semibold text-heading text-lg lg:text-2xl ">
              Describe the job or project
            </h2>

            <div className="flex flex-col gap-2">
              <textarea
                name="description"
                {...register("description", {
                  required: {
                    value: true,
                    message: "Please fill job description",
                  },
                  validate: validateDescription,
                })}
                placeholder="Example: I need a virtual assistant to reply to emails, organize files, and follow up on team tasks."
                className="w-full py-3.5 px-3 text-sm lg:text-base font-medium border border-[#D0D5DD] focus:border-primary rounded-md focus:outline-none text-heading tracking-wide placeholder:text-sm"
                cols={40}
                rows={14}
              ></textarea>
              {errors.description && (
                <span className="text-sm text-red-500 font-medium">
                  {errors.description.message}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-heading text-lg font-semibold lg:text-2xl">
              Upload Your File{" "}
            </h2>

            <input
              type="file"
              {...register("attachment", {
                validate: {
                  isPdf: (files) => {
                    if (!files || files.length === 0) return true; // optional
                    return (
                      files[0].type === "application/pdf" ||
                      "Only PDF files are allowed."
                    );
                  },
                  maxSize: (files) => {
                    if (!files || files.length === 0) return true; // optional
                    return (
                      files[0].size <= 104857600 ||
                      "File size must be less than 100MB."
                    );
                  },
                },
              })}
              className="w-full max-w-sm p-4 border-2 border-dashed border-blue-400 rounded-lg text-blue-900 bg-blue-50 hover:bg-blue-100 cursor-pointer transition duration-300 flex flex-col items-center justify-center"
            />
            {attachment && attachment.length > 0 && (
              <div className="flex items-center justify-between gap-3 border border-[#44444414] rounded-md px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="bg-gray-200 p-2 md:p-3 rounded-full">
                    <SvgIcon name="File" size={32} />
                  </div>

                  <div className="flex flex-col">
                    <h3 className="text-heading text-xs md:text-sm">
                      {attachment[0].name}
                    </h3>
                    <p className="text-paragraph text-[10px] md:text-xs">
                      {(attachment[0].size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setValue("attachment", null)}
                  className="text-xs md:text-sm text-red-600 hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}

            <p className="text-paragraph text-base">Max file size: 100MB</p>
            {errors.attachment && (
              <span className="text-sm text-red-500 font-medium">
                {errors.attachment.message}
              </span>
            )}
          </div>

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
          loading={loadingNext}
        />
      </div>
    </div>
  );
};

export default DescriptionPage;
