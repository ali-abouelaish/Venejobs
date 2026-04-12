import Image from "next/image";
import React, { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import ExperienceModal from "./ExperienceModal";
import ShowExperiencePage from "./ShowExperiencePage";
import useToastStore from "@/app/store/toastStore";
import StepNavigation from "@/app/components/Freelancer/AddProfileDetails/StepNavigation";

const ExperienceInputSection = ({ nextStep, prevStep, currstep }) => {
  const { showError } = useToastStore.getState();
  const { control, trigger } = useFormContext();

  const { fields, append, update, remove } = useFieldArray({
    control,
    name: "experiences",
  });

  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const handleNext = async () => {
    const valid = await trigger("experiences");

    // if (fields.length === 0) {
    //   showError("Please add at least one experience before proceeding.", "error")
    //   return;
    // }
    nextStep()
  };

  return (
    <div className="flex flex-col w-full">
      {fields.length === 0 ? (
        <div className="flex flex-col gap-4 w-full">
          <h2 className="text-xl xl:text-2xl text-heading font-semibold leading-9">
            Add Experience
          </h2>

          <div
            className="border border-dashed border-gray-500 flex flex-col items-center justify-center gap-4 cursor-pointer h-40 sm:h-48 md:h-56 lg:h-64"
            onClick={() => {
              setEditIndex(null);
              setShowForm(true);
            }}
          >
            <Image
              src="/icons/Add.png"
              alt="Add button"
              width={36}
              height={36}
            />
            <h2 className="font-semibold text-lg lg:text-xl text-center text-heading">
              Add experience
            </h2>
          </div>

          <StepNavigation
            onNext={handleNext}
            onBack={prevStep}
          />
        </div>
      ) : (
        <ShowExperiencePage
          nextStep={nextStep}
          prevStep={prevStep}
          fields={fields}
          onEdit={(index) => {
            setEditIndex(index);
            setShowForm(true);
          }}
          onDelete={(index) => remove(index)}
          onAddMore={() => {
            setEditIndex(null);
            setShowForm(true);
          }}
        />
      )}

      {showForm && (
        <ExperienceModal
          close={() => setShowForm(false)}
          append={append}
          update={update}
          editIndex={editIndex}
          fields={fields}
        />
      )}
    </div>
  );
};

export default ExperienceInputSection;
