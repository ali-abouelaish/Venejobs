import { useState } from "react";
import SvgIcon from "@/app/components/Utility/SvgIcon";
export default function FilterSidebar({ showFilters, setShowFilters }) {
  return (
    <>
      {showFilters && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setShowFilters(false)}
        />
      )}

      {/* ---------------- MOBILE SIDEBAR ---------------- */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-85 bg-white p-4 pt-7 shadow-xl
  transform transition-transform duration-300 lg:hidden
  overflow-y-auto overscroll-contain
  ${showFilters ? "translate-x-0" : "-translate-x-full"}`}
      >
        <button
          className="mb-4 text-sm text-gray-600 float-right"
          onClick={() => setShowFilters(false)}
        >
          <SvgIcon name="Delete" />
        </button>
        <Filters />
      </div>

      {/* ---------------- DESKTOP SIDEBAR ---------------- */}
      <div className="hidden lg:block lg:w-[30%] p-5">
        <Filters />
      </div>
    </>
  );
}
/* ----------------  SIDEBAR FILTER CONTENT ---------------- */
function Filters() {
  const filterSections = [
    {
      title: "Level of experience will it need?",
      stateKey: "experience",
      options: [
        { label: "Entry", value: "entry" },
        { label: "Intermediate", value: "intermediate" },
        { label: "Expert", value: "expert" },
      ],
    },
    {
      title: "Select Category",
      stateKey: "category",
      options: [
        { label: "All categories", value: "all" },
        { label: "IT & Programming", value: "it" },
        { label: "Design & Multimedia", value: "design" },
        { label: "Marketing & Sales", value: "marketing" },
      ],
    },
    {
      title: "Skills",
      stateKey: "skills",
      options: [
        { label: "Web Design", value: "webdesign" },
        { label: "Figmag", value: "figma" },
        { label: "User Interface Design", value: "uidesign" },
        { label: "Mobile UI Design", value: "mobileui" },
        { label: "UI/UX Prototyping", value: "uiux" },
      ],
    },
  ];

  const [openDropdowns, setOpenDropdowns] = useState({
    experience: true,
    category: true,
    skills: true,
  });

  const [selectedValues, setSelectedValues] = useState({
    experience: [],
    category: [],
    skills: [],
  });
  return (
    <div className="flex flex-col gap-7">
      {filterSections.map((section) => (
        <div key={section.stateKey} className="w-full pr-2">
          {/* Title */}
          <button
            className="flex justify-start md:justify-between items-center w-full text-left gap-4"
            onClick={() =>
              setOpenDropdowns((prev) => ({
                ...prev,
                [section.stateKey]: !prev[section.stateKey],
              }))
            }
            type="button"
          >
            <span className="text-sm md:text-base font-semibold text-heading">
              {section.title}
            </span>

            <svg
              className={`w-4 h-4 transition-transform ${
                openDropdowns[section.stateKey] ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {/* Options */}
          {openDropdowns[section.stateKey] && (
            <div className="mt-6 flex flex-col gap-4">
              {section.options.map((item) => (
                <label
                  key={item.value}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="h-5 w-5 relative cursor-pointer appearance-none border border-gray-300 rounded flex items-center justify-center 
                            checked:bg-primary checked:border-primary 
                            checked:before:content-['✔'] 
                            checked:before:text-white 
                            checked:before:text-sm 
                            checked:before:flex 
                            checked:before:items-center 
                            checked:before:justify-center 
                            checked:before:absolute 
                            checked:before:inset-0"
                    checked={selectedValues[section.stateKey].includes(
                      item.value
                    )}
                    onChange={() => {
                      setSelectedValues((prev) => {
                        const isSelected = prev[section.stateKey].includes(
                          item.value
                        );

                        return {
                          ...prev,
                          [section.stateKey]: isSelected
                            ? prev[section.stateKey].filter(
                                (v) => v !== item.value
                              )
                            : [...prev[section.stateKey], item.value],
                        };
                      });
                    }}
                  />
                  <span className="text-sm md:text-base font-medium text-gray-600">
                    {item.label} {item.count ? `(${item.count})` : ""}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
