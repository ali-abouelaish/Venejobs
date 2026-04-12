import React, { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.min.css";

import InputField from "@/app/components/common/InputField";
import freelancerApiStore from "@/app/store/freelancerApiStore";
import NumericInputField from "@/app/components/common/NumericInputField";
import StepNavigation from "@/app/components/Freelancer/AddProfileDetails/StepNavigation";

const PersonalDetailsInputSection = ({ nextStep, prevStep }) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  const { personalDetailLoading } = freelancerApiStore();
  return (
    <div className="w-full">
      <div className="flex flex-col gap-5">

        {/* Date of Birth */}
        <div className="flex flex-col gap-2">
          <label className="font-medium lg:text-base tracking-wide">
            Date of Birth
          </label>

          <Controller
            name="date_of_birth"
            control={control}
            rules={{ required: "Date of Birth is required" }}
            render={({ field }) => (
              <Flatpickr
                {...field}
                value={field.value || ""}
                options={{
                  dateFormat: "d-m-Y",
                  maxDate: "today",
                  disableMobile: true,
                }}
                placeholder="Select your DOB"
                className="w-full py-3.5 px-3 text-sm lg:text-base border border-[#D0D5DD] rounded-md focus:outline-none focus:border-secondary font-medium"
              />
            )}
          />

          {errors?.date_of_birth && (
            <p className="text-sm text-red-500">
              {errors.date_of_birth.message}
            </p>
          )}
        </div>

        {/* Country */}
        <InputField
          label="Country"
          name="country"
          placeholder="London"
          register={register}
          rules={{ required: "Country is required" }}
          error={errors?.country?.message}
        />

        {/* Street + Apt */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <InputField
            label="Street Address"
            name="street_address"
            placeholder="123 Main Street"
            register={register}
            rules={{ required: "Street Address is required" }}
            error={errors?.street_address?.message}
          />


          <InputField
            label="Apt / Suite (Optional)"
            name="personalDetails.Apt"
            register={register}
            placeholder="Apartment or Suite"
          />
        </div>

        {/* City / State / Zip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <InputField
            label="City"
            name="city"
            placeholder="London"
            register={register}
            rules={{ required: "City is required" }}
            error={errors?.city?.message}
          />

          <InputField
            label="State / Province"
            name="personalDetails.State"
            placeholder="Greater London"
            register={register}
            rules={{ required: "State/Province is required" }}
            error={errors?.personalDetails?.State?.message}
          />

          <InputField
            label="ZIP / Postal Code"
            name="zip_code"
            maxLength={10}
            placeholder="SW1A 1AA"
            register={register}
            rules={{
              required: "Postal Code is required",
              pattern: {
                value: /^(GIR ?0AA|[A-Z]{1,2}\d{1,2}[A-Z]? ?\d[A-Z]{2})$/i,
                message: "Enter a valid UK postal code",
              },
            }}
            error={errors?.zip_code?.message}
          />

        </div>

        {/* Phone */}
        <NumericInputField
          label="Phone Number"
          name="personalDetails.PhoneNumber"
          placeholder="Enter phone number"
          maxLength={15}
          register={register}
          rules={{
            required: "Phone Number is required",
            minLength: {
              value: 10,
              message: "Minimum 10 digits required",
            },
            maxLength: {
              value: 15,
              message: "Maximum 15 digits allowed",
            },
          }}
          error={errors?.personalDetails?.PhoneNumber?.message}
        />

        {/* Buttons */}
        <StepNavigation
          isLastStep
          onBack={prevStep}
          loading={personalDetailLoading}
          submitLabel="Let’s Finalize"
        />

      </div>
    </div>
  );
};

export default PersonalDetailsInputSection;
