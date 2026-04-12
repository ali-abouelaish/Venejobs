import InputField from "@/app/components/common/InputField";
import StepNavigation from "@/app/components/Freelancer/AddProfileDetails/StepNavigation";
import { useFormContext } from "react-hook-form";

const TitleInputSection = ({ isFirstStep, handleNext }) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col gap-4 w-full">
        <h2 className="text-xl xl:text-2xl text-heading font-bold leading-9">
          Tell us what you do best
        </h2>

        <InputField
          label="Professional Title"
          name="professional_title"
          placeholder="Enter Your Title"
          register={register}
          rules={{
            required: "Title required",
            minLength: {
              value: 5,
              message: "Title should be atleast 5 characters long",
            },
          }}
          error={errors?.professional_title?.message}
        />


        <div className="flex flex-col gap-4">
          <h3 className="text-base lg:text-lg text-heading font-bold">
            Example titles
          </h3>

          <ul className="flex flex-col text-gray-500 text-base font-medium gap-4 list-disc pl-6 tracking-wide">
            <li>
              Google Certified UX/UI Designer | Expert in
              Website|App|Software|Figma
            </li>
            <li>UX/UI Designer | Web & Mobile App Specialist</li>
            <li>UX/UI Designer, Mobile App Developer, Marketing Expert</li>
          </ul>

          {/* <h3 className="text-base lg:text-lg text-heading font-bold">
            Overview
          </h3>

          <div className="flex flex-col gap-2">
            <input
              type="text"
              {...register("overview", {
                required: "Overview required",
                minLength: {
                  value: 5,
                  message: "Overview should be atleast 5 characters long",
                },
              })}
              className="w-full py-3.5 px-3 text-sm lg:text-base border border-[#D0D5DD] focus:border-secondary rounded-md focus:outline-none text-black tracking-wide placeholder:text-sm"
              placeholder="Enter Your Overview"
            />

            {errors.overview && (
              <span className="text-sm text-red-500 font-medium">
                {errors.overview.message}
              </span>
            )}
          </div> */}

          <StepNavigation
            isFirstStep={isFirstStep}
            onNext={handleNext}
          />
        </div>
      </div>
    </div>
  );
};

export default TitleInputSection;
