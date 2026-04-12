import React from "react";
import StepperNumber from "../StepperNumber";
import EducationInputSection from "./EducationInputSection";
import EducationHeader from "./EducationHeader";

const EducationPage = ({ nextStep, currstep, prevStep }) => {
  return (
    <div className="flex flex-col gap-6 lg:gap-10">
      <StepperNumber currstep={currstep} />

      <div className="flex gap-6 flex-col lg:flex-row lg:gap-15">
        <EducationHeader />
        <EducationInputSection nextStep={nextStep} prevStep={prevStep} currstep={currstep} />
      </div>
    </div>
  );
};

export default EducationPage;
