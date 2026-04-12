import React, { useState } from "react";
import StepperNumber from "../StepperNumber";
import LanguageHeader from "./LanguageHeader";
import LanguageInputSection from "./LanguageInputSection";
import { useFieldArray, useFormContext } from "react-hook-form";

const LanguagePage = ({ nextStep, currstep, prevStep }) => {

  const { control } = useFormContext();

  const { fields, append, update, remove } = useFieldArray({
    control,
    name: "languages",
  });
  const [editIndex, setEditIndex] = useState(null);
  return (
    <div className="flex flex-col gap-6 lg:gap-10">
      <StepperNumber currstep={currstep} />

      <div className="flex gap-6 lg:gap-15 flex-col lg:flex-row">
        <LanguageHeader />
        <LanguageInputSection
          nextStep={nextStep}
          prevStep={prevStep}
          currstep={currstep}
          close={() => setshowForm(false)}
          append={append}
          update={update}
          remove={remove}
          editIndex={editIndex}
          fields={fields}
          setEditIndex={setEditIndex}
        />
      </div>
    </div>
  );
};

export default LanguagePage;
