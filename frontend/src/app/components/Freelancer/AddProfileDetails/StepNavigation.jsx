"use client";

import Button from "@/app/components/button/Button";
import Loader from "@/app/components/common/Loader";
import SvgIcon from "@/app/components/Utility/SvgIcon";

const StepNavigation = ({
  onNext,
  onBack,
  isFirstStep = false,
  isLastStep = false,
  loading = false,
  nextLabel = "Next",
  submitLabel = "Submit",
}) => {
  return (
    <div className="flex justify-between items-center w-full mt-6 gap-4">
      {/* LEFT SIDE */}
      <div className="flex gap-3">
        {/* Back */}
        {!isFirstStep && onBack && (
          <Button
            type="button"
            onClick={onBack}
            variant="lightCard"
          >
            <SvgIcon name="PrevButton" />
            Back
          </Button>
        )}
      </div>

      {/* RIGHT SIDE */}
      {!isLastStep ? (
        <Button
          type="button"
          onClick={onNext}
          disabled={loading}
          variant="secondaryFilled"
        >
          {loading ? (
            <Loader size={18} border={3} color="white" />
          ) : (
            <>
              {nextLabel}
              <SvgIcon name="NextArrow" />
            </>
          )}
        </Button>
      ) : (
        <Button
          type="submit"
          disabled={loading}
          variant="secondaryFilled"
        >
          {loading ? (
            <Loader size={18} border={3} color="white" />
          ) : (
            submitLabel
          )}
        </Button>
      )}

    </div>
  );
};

export default StepNavigation;