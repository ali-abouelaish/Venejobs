import React, { useEffect } from "react";
import Button from "../../button/Button";
import SvgIcon from "../../Utility/SvgIcon";
import { useForm } from "react-hook-form";
import freelancerApiStore from "@/app/store/freelancerApiStore";
import useToastStore from "@/app/store/toastStore";
import useEscapeKey from "@/hooks/useEscapeKey";
import InputField from "../../common/InputField";

const TitleEditModal = ({
  setshowTitleModal,
  freelanceBasicprofile,
  showTitleModal,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEscapeKey(showTitleModal, () => {
    setshowTitleModal(false);
  });

  const { updatePersonalDetails, basicProfileLoading } = freelancerApiStore();
  const { showSuccess, showError } = useToastStore.getState();

  useEffect(() => {
    if (freelanceBasicprofile) {
      reset({
        professional_title: freelanceBasicprofile.professional_title,
        overview: freelanceBasicprofile.overview,
        hourly_rate: freelanceBasicprofile.hourly_rate,
      });
    }
  }, [freelanceBasicprofile, reset]);

  const handleSave = async (data) => {
    try {
      const res = await updatePersonalDetails(data);
      if (res.success) {
        showSuccess(res.message, "success");
        setshowTitleModal(false);
      }
    } catch (error) {
      showError(
        error?.response?.data?.message || "Something went wrong",
        "error"
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div
        className="
          bg-white w-full h-full rounded-none overflow-y-auto
          md:h-auto md:max-h-[90vh] md:max-w-[900px] md:rounded-2xl relative
        "
      >
        <div className="px-4 py-6 md:px-6 md:py-8 flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-gray-200 pb-4">
            <h2 className="text-lg sm:text-xl lg:text-[22px] font-semibold text-heading">
              Edit Overview
            </h2>

            <button
              type="button"
              onClick={() => setshowTitleModal(false)}
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <SvgIcon name="CrossButton" size={18} />
            </button>
          </div>

          <form
            onSubmit={handleSubmit(handleSave)}
            className="flex flex-col h-full"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Professional Title"
                name="professional_title"
                placeholder="Enter your title"
                register={register}
                rules={{
                  required: "Professional title is required",
                }}
                error={errors.professional_title?.message}
              />

              <InputField
                label="Update your hourly rate"
                name="hourly_rate"
                type="number"
                placeholder="$0.00"
                register={register}
                rules={{
                  required: "Hourly rate is required",
                }}
                error={errors.hourly_rate?.message}
              />

              <div className="md:col-span-2">
                <InputField
                  label="Overview"
                  name="overview"
                  as="textarea"
                  rows={5}
                  placeholder="Explain yourself in brief"
                  register={register}
                  rules={{
                    required: "Overview is required",
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 mt-6 bg-white">
              <Button
                type="button"
                onClick={() => setshowTitleModal(false)}
                variant="lightCard"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={basicProfileLoading}
                variant="secondaryFilled"
              >
                {basicProfileLoading ? "Updating..." : "Update"}
              </Button>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TitleEditModal;
