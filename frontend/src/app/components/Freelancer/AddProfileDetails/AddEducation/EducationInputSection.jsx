import Image from "next/image";
import React, { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import EducationModal from "./EducationModal";
import ShowEducationPage from "./ShowEducationPage";
import useToastStore from "@/app/store/toastStore";
import StepNavigation from "@/app/components/Freelancer/AddProfileDetails/StepNavigation";

const EducationInputSection = ({ nextStep, prevStep }) => {
  const { showError } = useToastStore.getState();
  const { trigger, control, setValue } = useFormContext();
  const { fields, append, update, remove } = useFieldArray({
    control,
    name: "educations",
  });

  const [showForm, setshowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const handleNext = async () => {
    // const valid = await trigger("educations");

    // if (fields.length === 0) {
    //   showError(
    //     "Please add at least one education before proceeding.",
    //     "error"
    //   );
    //   return;
    // }

    // if (valid) {
    // }
    nextStep();
  };
  return (
    <div className="flex flex-col w-full gap-6">
      {/* Show Add Panel only if no education added yet */}
      {fields.length === 0 && (
        <>
          <h2 className="text-xl xl:text-2xl text-heading font-semibold leading-9">
            Add Education
          </h2>

          <div
            className="border border-dashed border-gray-500 flex flex-col items-center justify-center gap-4 cursor-pointer h-40 sm:h-48 md:h-56 lg:h-64"
            onClick={() => {
              setEditIndex(null);
              setshowForm(true);
            }}
          >
            <Image
              src="/icons/Add.png"
              alt="Add button"
              width={36}
              height={36}
            />
            <h2 className="font-semibold text-lg lg:text-xl text-center text-heading">
              Add Education
            </h2>
          </div>
        </>
      )}

      {/* Show list of education entries */}
      {fields.length > 0 && (
        <ShowEducationPage
          fields={fields}
          onEdit={(index) => {
            setEditIndex(index);
            setshowForm(true);
          }}
          onDelete={(index) => remove(index)}
          onAddMore={() => {
            setEditIndex(null);
            setshowForm(true);
          }}
        />
      )}

      {/* Navigation buttons */}
      <StepNavigation
        onNext={handleNext}
        onBack={prevStep}
      />

      {/* Education Modal */}
      {showForm && (
        <EducationModal
          setshowForm={setshowForm}
          close={() => setshowForm(false)}
          append={append}
          update={update}
          editIndex={editIndex}
          fields={fields}
          setValue={setValue}
        />
      )}
    </div>
  );
};

export default EducationInputSection;
