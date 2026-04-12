"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import userApiStore from "@/app/store/userStore";
import Button from "../../button/Button";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import NewPasswordInput from "./NewPasswordInput";
import Loader from "../../common/Loader";
import useToastStore from "@/app/store/toastStore";

export default function NewPasswordForm({ email, setActiveModal }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const { showSuccess, showError } = useToastStore.getState();

  const resetPassword = userApiStore((s) => s.resetPassword);

  const [visible, setVisible] = useState({
    password: false,
    confirmPassword: false,
  });

  const toggle = (field) => setVisible((v) => ({ ...v, [field]: !v[field] }));

  const password = watch("password");

  const onSubmit = async (data) => {
    try {
      const res = await resetPassword({
        email: email,
        newPassword: data.password,
      });

      if (res.success) {
        showSuccess("Success", "Your password has been reset successfully.");
        setActiveModal("success_pass_reset");
      } else {
        showError("Error", res.message || "Failed to reset password.");
      }
    } catch (err) {
      showError(err?.response?.data?.message, "Something went wrong.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 py-10 px-2 md:px-4"
    >
      <NewPasswordInput
        register={register("password", {
          required: "Password is required",
          minLength: { value: 6, message: "Min 6 chars" },
          pattern: {
            value: /^(?=.*[A-Z])(?=.*\d).+$/,
            message: "1 uppercase & 1 number required",
          },
        })}
        error={errors.password}
        placeholder="New Password"
        isVisible={visible.password}
        toggleVisibility={() => toggle("password")}
      />

      <NewPasswordInput
        register={register("confirmPassword", {
          required: "Confirm password is required",
          validate: (value) => value === password || "Passwords do not match",
        })}
        error={errors.confirmPassword}
        placeholder="Confirm Password"
        isVisible={visible.confirmPassword}
        toggleVisibility={() => toggle("confirmPassword")}
      />

      <div className="flex justify-end pt-5">
        <Button
          type="submit"
          disabled={isSubmitting}
          variant="primaryOutlined"
        >
          {isSubmitting ? (
            <Loader size={18} border={3} color="white" />
          ) : (
            <>
              Reset Password
              <SvgIcon name="RightArrWhite" />
            </>
          )}
        </Button>

      </div>
    </form>
  );
}
