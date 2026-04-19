export default function WorkExperience({ items = [] }) {
  if (items.length === 0) return null;

  function formatPeriod(exp) {
    const start = exp.start_month
      ? `${exp.start_month} ${exp.start_year}`
      : `${exp.start_year}`;
    const end = exp.is_current
      ? "Present"
      : exp.end_month
        ? `${exp.end_month} ${exp.end_year}`
        : `${exp.end_year ?? ""}`;
    return `${start} - ${end}`;
  }

  return (
    <div className="flex flex-row gap-6">
      {/* mobile timeline dots */}
      <div className="md:hidden flex flex-col items-center gap-2">
        {items.map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-[30px] h-[30px] rounded-full bg-[#5BBB7B4D]" />
            {i < items.length - 1 && (
              <div className="border-l-2 border-dashed border-l-[#5BBB7BCC] h-[38%]" />
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-6">
        {items.map((exp) => (
          <div key={exp.id}>
            <p className="inline-block cursor-pointer overflow-hidden bg-[#FAFAFA] px-6 py-1 font-medium text-paragraph rounded-full text-base transition-all duration-300 relative z-10 before:content-[''] before:absolute before:inset-0 before:bg-gray-200 before:-translate-x-full before:transition-transform before:duration-300 before:-z-10 hover:before:translate-x-0">
              {formatPeriod(exp)}
            </p>
            <h6 className="text-heading text-base md:text-lg font-semibold my-3">
              {exp.job_title}
              {exp.company ? ` | ${exp.company}` : ""}
            </h6>
            {exp.description && (
              <p className="text-paragraph text-xs md:text-base font-normal leading-7.5">
                {exp.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
