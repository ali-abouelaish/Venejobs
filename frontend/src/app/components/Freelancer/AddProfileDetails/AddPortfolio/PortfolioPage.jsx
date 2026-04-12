import React from "react";
import StepperNumber from "../StepperNumber";
import PortfolioHeader from "./PortfolioHeader";
import PortfolioInputSection from "./PortfolioInputSection";

const PortfolioPage = ({ nextStep, currstep, prevStep }) => {
  return (
    <div className="flex flex-col gap-6 lg:gap-10">
      <StepperNumber currstep={currstep} />

      <div className="flex gap-6 flex-col lg:flex-row lg:gap-15">
        <PortfolioHeader />
        <PortfolioInputSection nextStep={nextStep} prevStep={prevStep} currstep={currstep} />
      </div>
    </div>
  );
};

export default PortfolioPage;
