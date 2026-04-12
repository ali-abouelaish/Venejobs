import StepNavigation from "@/app/components/Freelancer/AddProfileDetails/StepNavigation";
import React from "react";
import { useFormContext } from "react-hook-form";

const HourlyRateInputSection = ({ nextStep, prevStep }) => {
  const {
    register,
    formState: { errors },
    trigger,
    watch,
  } = useFormContext();

  const handleNext = async () => {
    const valid = await trigger(["hourly_rate"]);
    if (valid) nextStep();
  };

  // ✅ string → number (important)
  const rate = Number(watch("hourly_rate")) || 0;
  const serviceFee = rate * 0.1;
  const youGet = rate - serviceFee;

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col gap-4 w-full">
        <div className="flex flex-col justify-between gap-4">
          <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-4 w-full">
              <h2 className="text-xl xl:text-2xl text-heading font-semibold leading-9">
                Set your hourly rate
              </h2>

              <NumericInput
                name="hourly_rate"
                placeholder="$0.00"
                register={register}
                rules={{
                  required: "Hourly Rate is required",
                }}
                error={errors.hourly_rate?.message}
              />
            </div>

            {/* <div className="flex flex-col gap-4 w-full">
              <h2 className="text-xl xl:text-2xl text-heading font-semibold leading-9">
                Service fee
              </h2>

              <input
                type="text"
                disabled
                value={`$${serviceFee.toFixed(2)} (10%)`}
                placeholder="$0.00"
                className="w-full py-3.5 px-3 text-sm lg:text-base
                border border-[#D0D5DD] rounded-md
                bg-gray-100 text-heading tracking-wide"
              />
            </div> */}
          </div>

          <p className="text-paragraph text-sm md:text-base">
            This service fee helps us run the platform, provide support, and
            ensure secure, protected payments. Set your hourly rate based on
            what you want to earn.
          </p>

          <hr className="text-gray-200" />

          {/* <div className="flex flex-col gap-4">
            <h2 className="text-xl xl:text-2xl text-heading font-semibold leading-9">
              You’ll get
            </h2>

            <input
              type="text"
              disabled
              value={`$${youGet.toFixed(2)}`}
              placeholder="$0.00"
              className="w-full py-3.5 px-3 text-sm lg:text-base
              border border-[#D0D5DD] rounded-md
              bg-gray-100 text-heading tracking-wide"
            />
          </div> */}
        </div>

        {/* Navigation buttons */}
        <StepNavigation
          onNext={handleNext}
          onBack={prevStep}
        />
      </div>
    </div>
  );
};

export default HourlyRateInputSection;



const NumericInput = ({
  name,
  register,
  rules,
  placeholder,
  error,
}) => {
  return (
    <>
      <input
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        {...register(name, rules)}
        onInput={(e) => {
          e.target.value = e.target.value.replace(/[^0-9]/g, "");
        }}
        className="w-full py-3.5 px-3 text-sm lg:text-base
        border border-[#D0D5DD] focus:border-secondary
        rounded-md focus:outline-none text-heading
        tracking-wide placeholder:text-sm"
      />

      {error && (
        <div className="min-h-5">
          <span className="text-red-500 text-sm">{error}</span>
        </div>
      )}
    </>
  );
};
