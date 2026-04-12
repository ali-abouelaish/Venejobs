import Button from "@/app/components/button/Button";
import ServiceSteps from "@/app/components/Freelancer/ServiceStepForm/ServiceSteps";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import { useFormContext } from "react-hook-form";

const ServiceDescription = ({ nextStep, prevStep, currstep }) => {
  const { trigger } = useFormContext();

  const handleNext = async () => {
    const valid = await trigger(["service_description"]);
    if (valid) nextStep();
  };

  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="flex flex-col gap-10 lg:gap-15">
      <ServiceSteps currstep={currstep} />
      <div className="flex gap-6 lg:gap-15 flex-col">
        <h3 className="text-2xl lg:text-3xl xl:text-[44px] text-heading font-semibold leading-tight">Project description</h3>
        <div className="flex flex-col gap-4 w-full xl:w-[70%]">
          <div className="flex flex-col gap-4 lg:gap-6">
            <h5 className="text-xl xl:text-2xl text-heading font-semibold leading-9">Project summary</h5>
            <p className="text-base text-paragraph font-normal">Briefly explain what sets you and your project apart.</p>
            <div className="flex flex-col gap-2">
              <textarea
                type="text"
                {...register("service_description", {
                  required: "Description required",
                  minLength: {
                    value: 5,
                    message: "Description should be atleast 5 characters long",
                  },
                })}
                className="w-full py-3.5 px-3 text-sm lg:text-lg border border-[#D0D5DD] focus:border-secondary rounded-lg focus:outline-none text-heading tracking-wide placeholder:text-base placeholder:text-paragraph"
                placeholder="Example: I provide professional and creative design solutions tailored to your project needs. Whether you require a modern logo, social media graphics, or a complete brand identity, I ensure clean aesthetics, attention to detail, and timely delivery. My goal is to bring your vision to life through thoughtful and effective design." style={{ boxShadow: "0px 1px 2px 0px #1018280D" }}
                rows={7}
              />

              {errors.service_description && (
                <span className="text-sm text-red-500 font-medium">
                  {errors.service_description.message}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-between mt-10">
          <Button
            type="button"
            onClick={prevStep}
            className="bg-white text-paragraph rounded flex items-center gap-2 justify-center" style={{ boxShadow: "2px 2px 50px 5px #0000000D" }}
          >
            <SvgIcon name="LeftArrow" size={18} /> Back
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            className="bg-secondary text-white border flex items-center gap-2 justify-center"
          >
            Next <SvgIcon name="NextArrow" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServiceDescription;
