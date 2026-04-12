"use client";

import Button from "../button/Button";
import SvgIcon from "../Utility/SvgIcon";
import Loader from "../common/Loader";

const StepNavigation = ({
  onNext,
  onBack,
  onReviewBack,
  isFirstStep = false,
  isLastStep = false,
  showReviewBack = false,
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

        {/* Back to Review (edit mode) */}
        {showReviewBack && onReviewBack && !isLastStep && (
          <Button
            type="button"
            onClick={onReviewBack}
            variant="lightCard"
          >
            Review
          </Button>
        )}

      </div>

      {/* RIGHT SIDE */}
      {!isLastStep ? (
        <Button
          type="button"
          onClick={onNext}
          disabled={loading}
          variant="primaryOutlined"
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
          variant="primaryOutlined"
        >
          {loading ? (
            <Loader size={18} border={3} color="white" />
          ) : (
            submitLabel
          )}
          <SvgIcon name="NextArrow" />
        </Button>
      )}
    </div>
  );
};

export default StepNavigation;