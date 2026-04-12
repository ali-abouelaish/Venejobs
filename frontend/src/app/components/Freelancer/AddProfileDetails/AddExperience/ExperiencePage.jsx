import React from "react";
import ExperienceHeader from "./ExperienceHeader";
import StepperNumber from "../StepperNumber";
import ExperienceInputSection from "./ExperienceInputSection";

const ExperiencePage = ({ nextStep, currstep, prevStep }) => {

  return (
    <div className="flex flex-col gap-6 lg:gap-10">
      <StepperNumber currstep={currstep} />

      {/*   */}
      <div className="flex  gap-6  flex-col lg:flex-row lg:gap-15">
        <ExperienceHeader />
        <ExperienceInputSection nextStep={nextStep} prevStep={prevStep} currstep={currstep} />
      </div>
    </div>
  );
};

export default ExperiencePage;
