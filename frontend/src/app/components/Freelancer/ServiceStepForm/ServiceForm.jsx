"use client";
import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import ServicePricing from "@/app/components/Freelancer/ServiceStepForm/ServicePricing";
import ServiceOverview from "@/app/components/Freelancer/ServiceStepForm/ServiceOverview";
import ServiceDescription from "@/app/components/Freelancer/ServiceStepForm/ServiceDescription";
import ServiceGallery from "@/app/components/Freelancer/ServiceStepForm/ServiceGallery";
import useToastStore from "@/app/store/toastStore";

const ServiceForm = () => {
  const showError = useToastStore.getState().showError;
  const methods = useForm({
    mode: "onBlur",
    defaultValues: {
      service_title: "",
      tags: "",
      service_category: "",
      gallery_images: [],
      gallery_cover: null,
      pricing: {
        basic: {},
        standard: {},
        premium: {},
      },
      service_description: "",
    },
  });

  const {
    handleSubmit,
    formState: { errors },
  } = methods;

  const [step, setStep] = useState(1);

  const nextStep = () => setStep(step + 1);

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();

      formData.append("service_title", data.service_title);
      formData.append("tags", data.tags);
      formData.append("service_category", data.service_category);

      formData.append("pricing", JSON.stringify(data.pricing));

      // 🔥 gallery images
      data.gallery_images.forEach((file, index) => {
        formData.append("gallery_images[]", file);

        // mark cover image
        if (index === data.gallery_cover) {
          formData.append("gallery_cover", file.name);
        }
      });
      formData.append("service_description", data.service_description);
    } catch (error) {
      showError(error);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <ServiceOverview nextStep={nextStep} currstep={step} />;
      case 2:
        return (
          <ServicePricing
            nextStep={nextStep}
            prevStep={prevStep}
            currstep={step}
          />
        );
      case 3:
        return (
          <ServiceGallery
            nextStep={nextStep}
            prevStep={prevStep}
            currstep={step}
          />
        );
      case 4:
        return (
          <ServiceDescription
            nextStep={nextStep}
            prevStep={prevStep}
            currstep={step}
          />
        );
      default:
        return <ServiceOverview nextStep={nextStep} prevStep={prevStep} />;
    }
  };

  return (
    <>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="w-full max-w-[90%] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1240px] 2xl:max-w-[1400px] mx-auto my-10 lg:my-20">
            {renderStep()}
          </div>
        </form>
      </FormProvider>
    </>
  );
};

export default ServiceForm;
