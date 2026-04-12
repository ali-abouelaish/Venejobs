import SvgIcon from "@/app/components/Utility/SvgIcon";

const steps = [
  "Overview",
  "Pricing",
  "Gallery",
  "Description",
  "Review",
];

export default function ServiceSteps({ currstep }) {
  return (
    <div className="w-full flex items-center justify-between">
      {steps.map((label, i) => {
        const stepNumber = i + 1;
        const isCompleted = stepNumber < currstep;
        const isActive = stepNumber === currstep;
        const isLast = i === steps.length - 1;

        return (
          <div key={label} className={`flex flex-col items-center ${!isLast ? "flex-1" : ""}`}>
            <div className="flex items-center w-full">
              {/* Circle */}
              <div className={`rounded-full ${isActive ? "bg-[#F4EBFF] p-1" : "bg-white"}`}>
                <div className={`flex items-center justify-center rounded-full w-6 h-6 md:w-6 md:h-6 shrink-0 border-2 ${isCompleted
                  ? "border-secondary text-white"
                  : isActive
                    ? "border-secondary bg-white"
                    : "border-[#EAECF0] bg-white"
                  }`}
                >
                  {isCompleted ? (
                    <SvgIcon name="GreenTick" />
                  ) : (
                    <span
                      className={`w-2 h-2 rounded-full ${isActive ? "bg-secondary" : "bg-[#EAECF0]"
                        }`}
                    />
                  )}
                </div>
              </div>

              {/* Line */}
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5
                    ${stepNumber < currstep ? "bg-secondary" : "bg-[#EAECF0]"}`}
                />
              )}
            </div>

            {/* Label */}
            <span
              className={`mt-2 text-xs md:text-sm self-start font-semibold
                ${isActive || isCompleted
                  ? "text-secondary"
                  : "text-heading"
                }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
