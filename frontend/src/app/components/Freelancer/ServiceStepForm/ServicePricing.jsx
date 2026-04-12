import Button from "@/app/components/button/Button";
import ServiceSteps from "@/app/components/Freelancer/ServiceStepForm/ServiceSteps";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import { useFormContext } from "react-hook-form";

const ServicePricing = ({ nextStep, prevStep, currstep }) => {
  const { register, trigger, formState: { errors } } = useFormContext();

  const handleNext = async () => {
    const fieldsToValidate = PACKAGES.flatMap((pkg) => [
      `pricing.${pkg}.title`,
      `pricing.${pkg}.description`,
      `pricing.${pkg}.deliveryDays`,
      `pricing.${pkg}.revisions`,
      `pricing.${pkg}.price`,
    ]);

    const valid = await trigger(fieldsToValidate);
    if (valid) nextStep();
  };


  const PACKAGES = ["basic", "standard", "premium"];

  return (
    <div className="flex flex-col gap-10 lg:gap-15">
      <ServiceSteps currstep={currstep} />
      <div className="flex px-3 py-4 md:px-4 md:py-6  lg:gap-25 flex-col lg:flex-row">
        <h3 className="text-2xl lg:text-3xl xl:text-[44px] text-heading font-semibold leading-tight">Price & scope</h3>
      </div>
      <div className="w-full overflow-x-auto">
        <div className="w-full xl:w-[70%] border border-[#F2F2F2] rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-4 bg-white">
            <div className="p-6"></div>
            <div className="px-3 py-4 md:px-4 md:py-6  font-semibold text-heading text-base md:text-2xl border-l border-b border-[#F2F2F2]">Basic</div>
            <div className="px-3 py-4 md:px-4 md:py-6  font-semibold text-heading text-base md:text-2xl border-l border-b border-[#F2F2F2]">Standard</div>
            <div className="px-3 py-4 md:px-4 md:py-6  font-semibold text-heading text-base md:text-2xl border-l border-b border-[#F2F2F2]">Premium</div>
          </div>

          {/* Package name */}
          <div className="grid grid-cols-4 border-b border-[#F2F2F2]">
            <div className="p-6"></div>

            {["basic", "standard", "premium"].map((pkg) => (
              <div
                key={pkg}
                className="border-l border-[#F2F2F2]"
              >
                {/* Package title */}
                <div className="px-3 py-4 md:px-4 md:py-6  border-b border-[#F2F2F2]">
                  <input
                    {...register(`pricing.${pkg}.title`, { required: true })}
                    type="text"
                    placeholder="Name your package"
                    className="w-full text-paragraph text-sm md:text-base placeholder:text-paragraph rounded-md
                     focus:outline-none focus:ring-0 focus:border-secondary"
                  />
                </div>

                {/* Package description */}
                <div className="px-4 pt-4 pb-8 ">
                  <textarea
                    {...register(`pricing.${pkg}.description`, { required: true })}
                    rows={3}
                    placeholder="Describe the details of your offering"
                    className="w-full text-paragraph text-sm md:text-base placeholder:text-paragraph rounded-md resize-none
                     focus:outline-none focus:ring-0 focus:border-secondary"
                  />
                </div>
              </div>
            ))}
          </div>
          {/* Delivery Days */}
          <div className="grid grid-cols-4 ">
            <div className="px-3 py-4 md:px-4 md:py-6  font-medium text-heading text-base lg:text-lg">
              Delivery Days
            </div>
            {["basic", "standard", "premium"].map((pkg) => (
              <div key={pkg} className="px-3 py-4 md:px-4 md:py-6  border-l border-[#F2F2F2]">
                <input
                  type="number"
                  min="1"
                  {...register(`pricing.${pkg}.deliveryDays`, {
                    valueAsNumber: true,
                    required: true,
                  })}
                  className="w-full rounded-md
                       focus:border-secondary text-paragraph text-sm md:text-base placeholder:text-paragraph focus:outline-none"
                  placeholder="0"
                />
              </div>
            ))}
          </div>

          {/* Revisions */}
          <div className="grid grid-cols-4 border-y border-[#F2F2F2]">
            <div className="px-3 py-4 md:px-4 md:py-6  font-medium text-heading text-base lg:text-lg">
              Number of Revisions
            </div>
            {["basic", "standard", "premium"].map((pkg) => (
              <div key={pkg} className="px-3 py-4 md:px-4 md:py-6  border-l border-[#F2F2F2]">
                <input type="number" min="0" {...register(`pricing.${pkg}.revisions`, { valueAsNumber: true, required: true, })}
                  className="w-full rounded-md text-paragraph text-sm md:text-base placeholder:text-paragraph
                       focus:border-secondary focus:outline-none" placeholder="0" />
              </div>
            ))}
          </div>

          {/* Price */}
          <div className="grid grid-cols-4">
            <div className="px-3 py-4 md:px-4 md:py-6  font-medium text-heading text-base lg:text-lg">
              Project Price
            </div>
            {["basic", "standard", "premium"].map((pkg) => (
              <div key={pkg} className="px-3 py-4 md:px-4 md:py-6  border-l border-[#F2F2F2]">
                <div className="relative">
                  <span className="text-paragraph absolute top-1/2 -translate-y-1/2">
                    $
                  </span>
                  <input type="number" min="5" step="0.01" {...register(`pricing.${pkg}.price`, {
                    valueAsNumber: true, required: true,
                  })} className="w-full rounded-md pl-5 text-paragraph text-sm md:text-base placeholder:text-paragraph
                         focus:border-secondary focus:outline-none" placeholder="0.00" />
                </div>
              </div>
            ))}
          </div>
        </div>
        {Object.keys(errors.pricing || {}).length > 0 && (
          <p className="text-red-500 text-sm mt-6">
            Please fill in all pricing details correctly.
          </p>
        )}
      </div> {/* end of pricing table */}
      <div className="flex justify-between">
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
  );
};

export default ServicePricing;
