import React from "react";
import { useFormContext } from "react-hook-form";
import AddIcon from "@mui/icons-material/Add";
import SkillsSkeleton from "../../Skeletons/SkillsSkeleton";
import jobApiStore from "@/app/store/jobStore";

const SkillsSelector = () => {
  const { register, watch, formState: { errors } } = useFormContext();
  const selectedCategory = watch("category");
  const selectedSkills = watch("skills") || [];

  const { skills_data, skillsLoading, category_data, } =
    jobApiStore();

  const categoryName =
    category_data?.find((cat) => cat.code === selectedCategory)?.name || "";

  const skillsRegister = register("skills", {
    validate: (value) =>
      value.length > 0 || "Please select at least one option"
  })

  return (
    <div className="flex flex-col gap-4">
      {/* title */}
      <h2 className="text-xl xl:text-2xl text-heading font-semibold leading-9">
        Search skills or add your own
      </h2>

      <div className="flex flex-col gap-2">
        <div
          className={`
      w-full py-3.5 px-3 text-sm lg:text-base
      border border-[#D0D5DD] rounded-md
      tracking-wide
      ${selectedSkills.length === 0 ? 'text-gray-400' : 'text-heading'}
    `}
          role="textbox"
          aria-readonly="true"
        >
          {selectedSkills.length > 0
            ? selectedSkills.join(', ')
            : 'For the best results, add 3–5 skills'}
        </div>

        {errors.skills && (
          <span className="text-sm text-red-500 font-medium">
            {errors.skills.message}
          </span>
        )}
      </div>

      <h2 className="text-base xl:text-lg text-heading font-medium">
        {categoryName && `Popular skills for ${categoryName}`}
      </h2>

      <div
        className="flex items-center flex-wrap gap-3 lg:gap-5 w-full
                   transition-all duration-500 ease-out"
      >
        {skillsLoading ? (
          <SkillsSkeleton />
        ) : (
          skills_data?.map((item) => {
            const checkboxId = `skill-${item.id}`;
            return (
              <div key={item.id}>
                <input
                  type="checkbox"
                  id={checkboxId}
                  value={item.name}
                  checked={selectedSkills.includes(item.name)}
                  {...skillsRegister}
                  className="sr-only peer"
                />
                <label
                  htmlFor={checkboxId}
                  className="flex py-3 px-4 items-center justify-center
                             rounded-lg cursor-pointer
                             border border-[#D0D5DD]
                             transition-all
                             font-medium text-heading
                             peer-checked:bg-primary
                             peer-checked:text-white"
                >
                  <span className="flex items-center gap-2 text-sm lg:text-base">
                    {item.name}
                    <AddIcon
                      fontSize="small"
                      sx={{
                        color: selectedSkills.includes(item.name)
                          ? "#fff"
                          : "#666",
                      }}
                    />
                  </span>
                </label>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SkillsSelector;
