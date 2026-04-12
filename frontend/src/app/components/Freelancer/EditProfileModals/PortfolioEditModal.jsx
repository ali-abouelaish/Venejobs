import React, { useEffect } from "react";
import Button from "../../button/Button";
import SvgIcon from "../../Utility/SvgIcon";
import { useForm } from "react-hook-form";
import freelancerApiStore from "@/app/store/freelancerApiStore";
import useToastStore from "@/app/store/toastStore";
import useEscapeKey from "@/hooks/useEscapeKey";
import InputField from "../../common/InputField";

const PortfolioEditModal = ({
  showPortfolioModal,
  setShowPortfolioModal,
  portfolio,
}) => {
  const isEdit = Boolean(portfolio);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      project_url: "",
    },
  });

  useEscapeKey(showPortfolioModal, () => {
    setShowPortfolioModal(false);
  });

  const { showSuccess, showError } = useToastStore.getState();
  const { updatePortfolio, addPortfolio, freelancerPortfolioLoading } = freelancerApiStore();

  useEffect(() => {
    if (isEdit) {
      reset({
        id: portfolio.id,
        title: portfolio.title,
        project_url: portfolio.project_url,
      });
    } else {
      reset({
        title: "",
        project_url: "",
      });
    }
  }, [portfolio, isEdit, reset]);

  const handleSave = async (data) => {
    try {
      const res = isEdit
        ? await updatePortfolio(data.id, data)
        : await addPortfolio(data);

      if (res?.success) {
        showSuccess(
          isEdit
            ? "Portfolio updated successfully"
            : "Portfolio added successfully",
          "success"
        );
        setShowPortfolioModal(false);
      }
    } catch (error) {
      showError(
        error?.response?.data?.message || "Something went wrong",
        "error"
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-2 pt-2">
      <div
        className="
          bg-white w-full h-full rounded-none overflow-y-auto
          md:h-auto md:max-h-[90vh] md:max-w-[900px] md:rounded-2xl relative
        "
      >
        <div className="px-4 py-6 md:px-6 md:py-8 flex flex-col gap-6">

          {/* ===== HEADER (WITH BORDER-B) ===== */}
          <div className="flex justify-between items-center border-b border-gray-200 pb-4">
            <h2 className="text-lg sm:text-xl lg:text-[22px] font-semibold text-heading">
              {isEdit ? "Edit Portfolio" : "Add Portfolio"}
            </h2>

            <button
              type="button"
              onClick={() => setShowPortfolioModal(false)}
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <SvgIcon name="CrossButton" size={18} />
            </button>
          </div>

          {/* ===== FORM ===== */}
          <form onSubmit={handleSubmit(handleSave)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Title */}
              <InputField
                label="Title"
                name="title"
                placeholder="Enter your title"
                register={register}
                rules={{
                  required: "Title is required",
                }}
                error={errors.title?.message}
              />

              {/* Portfolio URL */}
              <InputField
                label="Portfolio URL"
                name="project_url"
                placeholder="Enter Portfolio URL"
                register={register}
                rules={{
                  required: "Project URL is required",
                  validate: (value) => {
                    try {
                      new URL(value);
                      return true;
                    } catch {
                      return "Please enter a valid URL";
                    }
                  },
                }}
                error={errors.project_url?.message}
              />
            </div>

            {/* ===== BUTTONS ===== */}
            <div className="flex flex-col sm:flex-row justify-end gap-4 mt-6">
              <Button
                type="button"
                onClick={() => setShowPortfolioModal(false)}
                variant="lightCard"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={freelancerPortfolioLoading}
                variant="secondaryFilled"
              >
                {freelancerPortfolioLoading
                  ? "Saving..."
                  : isEdit
                    ? "Update"
                    : "Add"}
              </Button>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PortfolioEditModal;
