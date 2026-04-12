import { useFormContext } from "react-hook-form";

import TitleHeader from "./TitleHeader";
import TitleInputSection from "./TitleInputSection";
import StepperNumber from "../StepperNumber";

const TitlePage = ({ nextStep, currstep }) => {
    const { trigger } = useFormContext();

    const handleNext = async () => {
        const valid = await trigger(["professional_title", "overview"]);
        if (valid) nextStep();
    };

    return (
        <div className="flex flex-col gap-6 lg:gap-10">
            <StepperNumber currstep={currstep} />

            <div className="flex gap-6 lg:gap-15 flex-col lg:flex-row">
                <TitleHeader />
                <TitleInputSection
                    isFirstStep
                    handleNext={handleNext}
                />
            </div>
        </div>
    );
};

export default TitlePage;
