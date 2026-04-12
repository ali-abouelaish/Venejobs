import SvgIcon from "@/app/components/Utility/SvgIcon";
import React from "react";

const ShowLanguagePage = ({
  fields,
  languagesData,
  proficiencyData,
  handleEdit,
  handleDelete,
}) => {
  console.log("sadjkfhsadkjfh")
  return (
    <div className="mt-6 space-y-4">
      {fields.map((field, index) => {
        const language = languagesData.find(
          (l) => l.name === field.language
        )?.name;

        const proficiency = proficiencyData.find(
          (p) => p.name === field.proficiency
        )?.name;

        return (
          <div
            key={field.id}
            className="
              group relative
              flex gap-4
              sm:flex-row sm:items-center justify-between
              rounded-lg border border-gray-300 bg-white
              p-4 sm:p-5
              transition-all duration-300
              hover:-translate-y-px
            "
          >
            {/* Content */}
            <div className="pl-4">
              <p className="text-base font-semibold text-heading">
                {language}
              </p>

              <span
                className="
                  mt-1 inline-flex items-center
                  rounded-lg bg-secondary/10
                 border border-gray-300
                  px-3 py-0.5
                  text-sm font-medium text-secondary
                "
              >
                {proficiency}
              </span>
            </div>

            {/* Actions */}
            <div
              className="
                flex items-center justify-end gap-3
                opacity-80 transition
                group-hover:opacity-100
              "
            >
              <button
                type="button"
                onClick={() => handleEdit(index)}
                className="
                  flex h-10 w-10 items-center justify-center
                  rounded-lg border border-secondary/30
                  bg-secondary/10
                  text-secondary
                  transition-all
                  hover:bg-secondary hover:text-white
                  focus:outline-none
                  cursor-pointer
                "
              >
                <SvgIcon name="Editing" size={18} />
              </button>

              <button
                type="button"
                onClick={() => handleDelete(index)}
                className="
                  flex h-10 w-10 items-center justify-center
                  rounded-lg border border-red-200
                  bg-red-50
                  text-red-500
                  transition-all
                  hover:bg-red-500 hover:text-white
                  focus:outline-none
                  cursor-pointer
                "
              >
                <SvgIcon name="Delete1" size={18} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ShowLanguagePage;
