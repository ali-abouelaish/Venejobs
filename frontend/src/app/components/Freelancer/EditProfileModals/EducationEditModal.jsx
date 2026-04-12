import React, { useEffect } from "react";
import Button from "../../button/Button";
import SvgIcon from "../../Utility/SvgIcon";
import { useForm } from "react-hook-form";
import freelancerApiStore from "@/app/store/freelancerApiStore";
import useToastStore from "@/app/store/toastStore";
import useEscapeKey from "@/hooks/useEscapeKey";
import InputField from "../../common/InputField";

const EducationEditModal = ({ setShowEducationModal, showEducationModal, education
}) => {
  const isEdit = Boolean(education);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      id: "",
      institution_name: "",
      degree: "",
      field_of_study: "",
      type_of_education: "",
      start_date: "",
      end_date: "",
      description: "",
    },
  });

  useEscapeKey(showEducationModal, () => {
    setShowEducationModal(false);
  });

  const { updateEducation, addEducation, freelancerEducationLoading, error } = freelancerApiStore();
  const { showSuccess, showError } = useToastStore.getState();
  const startYear = watch("start_date");

  useEffect(() => {
    if (isEdit) {
      reset({
        id: education.id,
        institution_name: education.institution_name,
        degree: education.degree,
        field_of_study: education.field_of_study,
        type_of_education: education.type_of_education,
        start_date: education.start_date
          ? new Date(education.start_date).getUTCFullYear()
          : "",
        end_date: education.end_date
          ? new Date(education.end_date).getUTCFullYear()
          : "",
        description: education.description,
      });
    } else {
      reset({
        id: "",
        institution_name: "",
        degree: "",
        field_of_study: "",
        type_of_education: "",
        start_date: "",
        end_date: "",
        description: "",
      });
    }
  }, [education, isEdit, reset]);

  const handleSave = async (data) => {
    try {
      const res = isEdit
        ? await updateEducation(data.id, data)
        : await addEducation(data);

      if (res.success) {
        showSuccess(
          isEdit
            ? "Education updated successfully"
            : "Education added successfully",
          "success"
        );
        setShowEducationModal(false);
      }
    } catch (error) {
      showError(
        error?.response?.data?.message || "Something went wrong",
        "error"
      );
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 60 }, (_, i) => currentYear - i);

  const endYearOptions = startYear
    ? years.filter((year) => year >= startYear)
    : years;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div
        className="
          bg-white
          w-full h-full
          rounded-none
          overflow-y-auto
          md:h-auto
          md:max-h-[90vh]
          md:max-w-[1000px]
          md:rounded-2xl
        "
      >
        <div className="px-4 py-6 md:px-6 md:py-8 flex flex-col gap-6">
          <div className="relative flex justify-between items-center top-0 bg-white z-10 pb-2">
            <h2 className="text-lg sm:text-xl lg:text-[22px] font-semibold text-heading">
              {isEdit ? "Edit Education" : "Add Education"}
            </h2>
            <button
              onClick={() => setShowEducationModal(false)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <SvgIcon name="CrossButton" size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit(handleSave)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <InputField
                label="Institution Name"
                name="institution_name"
                register={register}
                rules={{ required: "Institution name is required" }}
                error={errors?.institution_name?.message}
                placeholder="E.g., University of XYZ"
              />

              <InputField
                label="Degree"
                name="degree"
                register={register}
                rules={{ required: "Degree is required" }}
                error={errors?.degree?.message}
                placeholder="E.g., Bachelor of Computer Science"
              />

              <InputField
                label="Field of Study"
                name="field_of_study"
                register={register}
                rules={{ required: "Field of study is required" }}
                error={errors?.field_of_study?.message}
                placeholder="E.g., Computer Science"
              />

              <InputField
                label="Type of Education"
                name="type_of_education"
                register={register}
                rules={{ required: "Type of education is required" }}
                error={errors?.type_of_education?.message}
                placeholder="Bachelor’s Degree"
              />

              <InputField
                label="From"
                name="start_date"
                as="select"
                register={register}
                value={watch("start_date")}
                rules={{ required: "Start year is required" }}
                options={years}
                error={errors?.start_date?.message}
                placeholder="From Year"
              />

              <InputField
                label="To"
                name="end_date"
                as="select"
                register={register}
                value={watch("end_date")}
                rules={{
                  required: "End year is required",
                  validate: (value) => {
                    if (startYear && Number(value) < Number(startYear)) {
                      return "End year cannot be less than start year";
                    }
                    return true;
                  },
                }}
                options={endYearOptions}
                error={errors?.end_date?.message}
                placeholder="To Year"
              />

            </div>

            {/* ✅ Description */}
            <div className="mt-4">
              <InputField
                label="Description"
                name="description"
                as="textarea"
                rows={4}
                register={register}
                rules={{ required: "Description is required" }}
                error={errors?.description?.message}
                placeholder="Describe your education, achievements, coursework..."
              />
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-6 mt-6">
              <Button
                type="button"
                onClick={() => setShowEducationModal(false)}
                className="bg-white text-gray-800"
                style={{
                  boxShadow: "2px 2px 50px 5px rgba(0,0,0,0.05)",
                  border: "1px solid rgba(0,0,0,0.08)",
                }}
              >
                Cancel
              </Button>

              <Button type="submit" className="bg-secondary text-white">
                {isEdit ? "Update" : "Add"}
              </Button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};


export default EducationEditModal;
