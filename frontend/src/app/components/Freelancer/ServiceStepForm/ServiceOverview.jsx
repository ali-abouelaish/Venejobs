import Button from "@/app/components/button/Button";
import ServiceSteps from "@/app/components/Freelancer/ServiceStepForm/ServiceSteps";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import { useFormContext } from "react-hook-form";
import { useState } from "react";

const MAX_TAGS = 5;

const ServiceOverview = ({ nextStep, currstep }) => {

  const {
    trigger,
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext();

  const handleNext = async () => {
    // validate title, category, and tags
    const valid = await trigger(["service_title", "service_category", "tags"]);

    if (valid) nextStep();
  };


  const tags = watch("tags") || [];
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      const value = inputValue.trim();
      if (!value) return;
      if (tags.includes(value)) return;
      if (tags.length >= MAX_TAGS) return;

      const updatedTags = [...tags, value];

      setValue("tags", updatedTags, { shouldValidate: true });
      setInputValue("");
    }
  };

  const removeTag = (tagToRemove) => {
    const updatedTags = tags.filter((tag) => tag !== tagToRemove);
    setValue("tags", updatedTags, { shouldValidate: true });
  };

  const serviceCategory = [
    { id: "design-web-mobile-design-graphic-ui", label: "Design > Web & Mobile Design > Graphic UI" },
    { id: "design-logo-design", label: "Design > Logo Design" },
    { id: "website-builders-cms-full-website-creation", label: "Website Builders & CMS > Full Website Creation" },
    { id: "design-web-mobile-design-wireframe-ux", label: "Design > Web & Mobile Design > Wireframe UX" },
    { id: "wordpress-full-wordpress-website-creation", label: "WordPress > Full WordPress Website Creation" }
  ]

  return (
    <div className="flex flex-col gap-15">
      <ServiceSteps currstep={currstep} />
      <div className="flex gap-6 lg:gap-15 flex-col">
        <h3 className="text-2xl lg:text-3xl xl:text-[44px] text-heading font-semibold leading-tight">Project Overview</h3>
        <div className="flex flex-col gap-10 md:gap-15 w-full xl:w-[70%]">
          <div className="flex flex-col gap-4 lg:gap-6">
            <h5 className="text-xl xl:text-2xl text-heading font-semibold leading-9">Service Title</h5>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                {...register("service_title", {
                  required: "Title required",
                  minLength: {
                    value: 5,
                    message: "Title should be atleast 5 characters long",
                  },
                })}
                className="w-full py-3.5 px-3 text-sm lg:text-lg border border-[#D0D5DD] focus:border-secondary rounded-lg focus:outline-none text-heading tracking-wide md:placeholder:text-lg placeholder:text-paragraph"
                placeholder="I will design a modern website UI/UX in Figma" style={{ boxShadow: "0px 1px 2px 0px #1018280D" }}
              />
              {/* Help text */}
              <span className="text-base text-paragraph font-normal">
                Write a clear and specific title that explains what you deliver.
              </span>

              {errors.service_title && (
                <span className="text-sm text-red-500 font-medium">
                  {errors.service_title.message}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-xl xl:text-2xl text-heading font-bold">
              Category
            </h2>
            <p className="text-base text-paragraph font-normal">
              Choose the main category that fits your service.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              {serviceCategory?.map((item) => (
                <div
                  className="flex items-center rounded-lg cursor-pointer gap-4.5 transition-colors peer-checked:border-secondary" key={item.id}>
                  <input
                    id={item.id}
                    type="radio"
                    value={item.id}
                    name="service_category"
                    {...register("service_category", {
                      required: "Please select at least one option",
                    })}
                    className="peer w-6 h-6 accent-green-600"
                  />

                  <label
                    htmlFor={item.id}
                    className="w-full text-gray-500 text-sm xl:text-[15px] font-medium tracking-wide cursor-pointer"
                  >
                    {item.label}
                  </label>
                </div>

              ))}
              {errors.service_category && (
                <span className="text-sm text-red-500 font-medium">
                  {errors.service_category.message}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-4 lg:gap-6">
            <h5 className="text-xl xl:text-2xl text-heading font-semibold leading-9">
              Search tags (optional)
            </h5>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="flex items-center gap-2 px-4 py-1 rounded-full
                         bg-secondary/10 text-secondary text-base font-medium"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-secondary hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full py-3.5 px-3 text-sm lg:text-lg border border-[#D0D5DD]
    focus:border-secondary rounded-lg focus:outline-none
    text-heading tracking-wide
    md:placeholder:text-lg placeholder:text-paragraph"
                placeholder="Start typing to view & select options. If entering your own tags, press Enter to save."
                style={{ boxShadow: "0px 1px 2px 0px #1018280D" }}
              />
              <input type="hidden" {...register("tags")} />

              <span className="text-base text-paragraph font-normal text-end">
                (max. 5 tags)
              </span>
              {tags.length >= MAX_TAGS && (
                <span className="text-sm text-red-500 font-medium">
                  You can add up to {MAX_TAGS} tags only
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end">
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

export default ServiceOverview;
