import React, { useEffect } from "react";
import Button from "../../button/Button";
import SvgIcon from "../../Utility/SvgIcon";
import { useForm } from "react-hook-form";
import freelancerApiStore from "@/app/store/freelancerApiStore";
import useToastStore from "@/app/store/toastStore";
import useEscapeKey from "@/hooks/useEscapeKey";

const SkillsEditModal = ({
  showSkillModal,
  setShowSkillModal,
  Selectedskill,
  freelancerSkills,
}) => {
  const isEdit = Boolean(Selectedskill);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      skill: "",
    },
  });

  const { skills, allSkills, updateSkills, addSkill, freelancerSkillLoading, error } =
    freelancerApiStore();

  const { showSuccess, showError } = useToastStore.getState();

  useEscapeKey(showSkillModal, () => setShowSkillModal(false));

  // Load skills when modal opens
  useEffect(() => {
    if (showSkillModal) {
      allSkills();
    }
  }, [showSkillModal, allSkills]);

  // Set value on edit
  useEffect(() => {
    if (isEdit && Selectedskill?.skill_name) {
      setValue("skill", Selectedskill.skill_name);
    }
  }, [isEdit, Selectedskill, setValue]);

  // Filter available skills
  const usedSkillNames = new Set(
    freelancerSkills?.map((fs) => fs.skill_name)
  );
  const selectedSkillName = Selectedskill?.skill_name;

  const availableSkills = skills?.filter((s) => {
    if (isEdit && s.name === selectedSkillName) return true;
    return !usedSkillNames.has(s.name);
  });

  // Save handler
  const handleSave = async (data) => {
    if (!data.skill) {
      showError("Please select a skill");
      return;
    }

    try {
      let res;
      if (isEdit) {
        res = await updateSkills(Selectedskill.id, {
          skill_name: data.skill,
        });
      } else {
        res = await addSkill({
          skill_name: data.skill,
        });
      }

      if (res?.success) {
        showSuccess(res.message || "Skill saved successfully", "success");
        setShowSkillModal(false);
      }
    } catch (error) {
      showError(
        error?.response?.data?.message || "Something went wrong"
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-2">
      <div className="bg-white
          w-full h-full
          rounded-none
          overflow-y-auto
          flex flex-col
          md:h-auto
          md:max-h-[90vh]
          md:max-w-[1000px]
          md:rounded-2xl">
        <div className="px-4 py-6 md:px-6 md:py-8 flex flex-col gap-6 flex-1">
          <div className="flex justify-between items-center border-b border-gray-200 pb-4">
            <h2 className="text-lg sm:text-xl lg:text-[22px] font-semibold text-heading">
              {isEdit ? "Edit Skills" : "Add Skills"}
            </h2>
            <button
              onClick={() => setShowSkillModal(false)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
            >
              <SvgIcon name="CrossButton" size={18} />
            </button>
          </div>
          {/* BODY */}

          {/* SCROLLABLE CONTENT */}
          <div className="flex-1 overflow-y-auto">
            {/* <h3 className="font-medium text-base mb-4">Skills</h3> */}
            <div className="flex flex-col justify-between h-120">
              {/* No skills available */}
              {!freelancerSkillLoading && !error && availableSkills?.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-lg font-medium text-gray-700">
                    No more skills available
                  </p>
                </div>
              )}
              {availableSkills?.length > 0 && (
                <form onSubmit={handleSubmit(handleSave)}>
                  <div className="flex flex-col gap-2">
                    <h3 className="font-medium lg:text-base tracking-wide">Skills</h3>
                    <div
                      className={`
                    flex items-center flex-wrap gap-3 lg:gap-5 w-full
                    transition-all duration-500 ease-out
                    ${skills?.length
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-3"
                        }
                    `}
                    >
                      {freelancerSkillLoading && (
                        <p className="text-sm text-gray-500">freelancerSkillLoading skills...</p>
                      )}

                      {!freelancerSkillLoading && error && (
                        <p className="text-sm text-red-500">
                          Failed to load skills
                        </p>
                      )}

                      {!freelancerSkillLoading && skills?.length > 0 && (
                        <div className="flex items-center flex-wrap gap-3 lg:gap-5 w-full">
                          {availableSkills.map((item) => {
                            const selectedSkill = watch("skill") === item.name;
                            return (
                              <div key={item.id}>
                                <input
                                  type="radio"
                                  id={`skill-${item.id}`}
                                  value={item.name}
                                  {...register("skill", {
                                    required: "Please select a skill",
                                  })}
                                  className="sr-only peer"
                                />

                                <label
                                  htmlFor={`skill-${item.id}`}
                                  className={`flex items-center justify-center py-3 px-4 rounded-lg cursor-pointer border transition-all
                                   ${selectedSkill ? "bg-secondary text-white border-secondary" : "border-[#D0D5DD]"}`}>
                                  <span className="text-sm lg:text-base">
                                    {item.name}
                                  </span>
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-4 mt-6">
                    <Button
                      type="button"
                      onClick={() => setShowSkillModal(false)}
                      variant="lightCard"
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      variant="secondaryFilled"
                    >
                      {isEdit ? "Update" : "Add"}
                    </Button>
                  </div>

                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SkillsEditModal;
