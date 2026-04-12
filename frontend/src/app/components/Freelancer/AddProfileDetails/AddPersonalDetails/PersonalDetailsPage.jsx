import React from "react";
import StepperNumber from "../StepperNumber";
import PersonalDetailsHeader from "./PersonalDetailsHeader";
import PersonalDetailsInputSection from "./PersonalDetailsInputSection";


const PersonalDetailsPage = ({ nextStep, currstep, prevStep }) => {
  return (
    <div className="flex flex-col gap-6 lg:gap-10">
      <StepperNumber currstep={currstep} />

      <div className="flex gap-6 lg:gap-15 flex-col lg:flex-row">
        <PersonalDetailsHeader />
        <PersonalDetailsInputSection nextStep={nextStep} prevStep={prevStep} currstep={currstep} />
      </div>
    </div>
  );
};

export default PersonalDetailsPage;
