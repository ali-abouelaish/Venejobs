import React, { useEffect, useState } from "react";
import Button from "../../button/Button";
import SvgIcon from "../../Utility/SvgIcon";
import { useForm } from "react-hook-form";
import freelancerApiStore from "@/app/store/freelancerApiStore";
import useToastStore from "@/app/store/toastStore";
import useEscapeKey from "@/hooks/useEscapeKey";

const LanguageEditModal = ({
  setShowLanguageModal,
  showLanguageModal,
  language,
  freelancerLanguage
}) => {
  const isEdit = Boolean(language);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      id: "",
      language: "",
      proficiency: "",
    },
  });

  useEscapeKey(showLanguageModal, () => {
    setShowLanguageModal(false);
  });

  const { updateLanguage, addLanguage, freelancerLanguageLoading, error } = freelancerApiStore();
  const { showSuccess, showError } = useToastStore.getState();

  useEffect(() => {
    if (isEdit) {
      reset({
        id: language.id,
        language: language.language,
        proficiency: language.proficiency,
      });
    } else {
      reset({
        id: "",
        language: "",
        proficiency: "",
      });
    }
  }, [language, isEdit, reset]);

  const handleSave = async (data) => {
    // prevent duplicates
    const isDuplicate = freelancerLanguage?.some(
      (item) =>
        item.language === data.language &&
        (!isEdit || item.id !== data.id)
    );
    if (isDuplicate) {
      showError("This language already exists", "error");
      return;
    }

    try {
      const res = isEdit
        ? await updateLanguage(data.id, data)
        : await addLanguage(data);

      if (res.success) {
        showSuccess(
          isEdit
            ? "Language updated successfully"
            : "Language added successfully",
          "success"
        );
        setShowLanguageModal(false);
      }
    } catch (error) {
      showError(
        error?.response?.data?.message || "Something went wrong",
        "error"
      );
    }
  };

  const languagesData = [
    { id: 1, language: "English" },
    { id: 2, language: "Hindi" },
    { id: 3, language: "Spanish" },
    { id: 4, language: "French" },
    { id: 5, language: "German" },
    { id: 6, language: "Japanese" },
    { id: 7, language: "Chinese" },
  ];
  const proficiencyData = [
    { id: 1, proficiency: "Basic" },
    { id: 2, proficiency: "Conversational" },
    { id: 3, proficiency: "Fluent" },
    { id: 4, proficiency: "Native" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-2 sm:px-4 py-2">
      <div className="relative bg-white w-full max-w-[1120px] rounded-xl shadow-sm flex flex-col max-h-[95dvh] overflow-hidden">
        <div className="px-4 py-6 md:px-6 md:py-8 flex flex-col gap-6">
          <div className="relative flex justify-between items-center top-0 bg-white z-10 pb-2">
            <h2 className="text-lg sm:text-xl lg:text-[22px] font-semibold text-heading">
              {isEdit ? "Edit Language" : "Add Language"}
            </h2>
            <button
              onClick={() => setShowLanguageModal(false)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <SvgIcon name="CrossButton" size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit(handleSave)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Language */}
              <div className="flex flex-col gap-2">
                <h3 className="font-medium lg:text-base tracking-wide">Language</h3>
                <select
                  {...register("language", {
                    required: "Language is required",
                  })}
                  className="w-full py-3 pl-3 pr-10
              text-sm sm:text-base
              border border-[#D0D5DD]
              rounded-md
              focus:border-secondary focus:outline-none
              text-black tracking-wide
              appearance-none bg-white"
                >
                  <option value="">Select language</option>
                  {languagesData.map((item) => (
                    <option key={item.id} value={item.language}>
                      {item.language}
                    </option>
                  ))}
                </select>
                {errors.language && (
                  <p className="text-red-500 text-sm">
                    {errors.language.message}
                  </p>
                )}
              </div>
              {/* Proficiency */}
              <div className="flex flex-col gap-2">
                <h3 className="font-medium lg:text-base tracking-wide">Proficiency</h3>
                <select
                  {...register("proficiency", {
                    required: "Proficiency is required",
                  })}
                  className="w-full py-3 pl-3 pr-10
              text-sm sm:text-base
              border border-[#D0D5DD]
              rounded-md
              focus:border-secondary focus:outline-none
              text-black tracking-wide
              appearance-none bg-white"
                >
                  <option value="">Select proficiency</option>
                  {proficiencyData.map((item) => (
                    <option key={item.id} value={item.proficiency}>
                      {item.proficiency}
                    </option>
                  ))}
                </select>
                {errors.proficiency && (
                  <p className="text-red-500 text-sm">
                    {errors.proficiency.message}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-4 sm:gap-6 mt-4 sm:mt-6 pb-2">
              <Button
                onClick={() => setShowLanguageModal(false)}
                style={{
                  boxShadow: "2px 2px 50px 5px rgba(0,0,0,0.05)",
                  border: "1px solid rgba(0,0,0,0.08)",
                }}
              >
                Cancel
              </Button>
              <Button className="bg-secondary text-white w-full sm:w-auto">
                {isEdit ? "Update" : "Add"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LanguageEditModal;
