import Image from "next/image";
import React, { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import ShowPorfolioPage from "./ShowPortfolioPage";
import PortfolioModal from "./PortfolioModal";
import useToastStore from "@/app/store/toastStore";
import StepNavigation from "@/app/components/Freelancer/AddProfileDetails/StepNavigation";

const PorfolioInputSection = ({ nextStep, prevStep, currstep }) => {
  const { showError } = useToastStore.getState();
  const { trigger, control, getValues } = useFormContext();
  const { fields, append, update, remove } = useFieldArray({
    control,
    name: "portfolios",
  });

  const [showForm, setshowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const handleNext = async () => {
    const valid = await trigger("portfolios");

    if (fields.length === 0) {
      showError("Please add at least one portfolio before proceeding.", "error")
      return;
    }

    if (valid) {
      nextStep();
    }
  };

  return (
    <div className="flex flex-col w-full gap-6">
      <h2 className="text-xl xl:text-2xl text-heading font-semibold leading-9">
        Add Portfolio
      </h2>

      {/* Show Add Panel only if no education added yet */}
      {fields.length === 0 && (
        <div
          className="border border-dashed border-gray-500 flex flex-col items-center justify-center gap-4 cursor-pointer h-40 sm:h-48 md:h-56 lg:h-64"
          onClick={() => {
            setEditIndex(null);
            setshowForm(true);
          }}
        >
          <Image src="/icons/Add.png" alt="Add button" width={40} height={40} />
          <h2 className="font-semibold text-lg lg:text-xl text-center text-heading">
            Add Portfolio
          </h2>
        </div>
      )}

      {/* Show list of education entries */}
      {fields.length > 0 && (
        <ShowPorfolioPage
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
        <PortfolioModal
          setshowForm={setshowForm}
          close={() => setshowForm(false)}
          append={append}
          update={update}
          editIndex={editIndex}
          fields={fields}
        />
      )}
    </div>
  );
};

export default PorfolioInputSection;