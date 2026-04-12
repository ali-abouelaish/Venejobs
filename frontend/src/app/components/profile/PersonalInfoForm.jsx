"use client";

import { useForm } from "react-hook-form";
import userApiStore from "@/app/store/userStore";
import Image from "next/image";
import SvgIcon from "../Utility/SvgIcon";
import CompanyDetails from "./CompanyDetails";
import { useEffect, useState } from "react";
import useToastStore from "@/app/store/toastStore";
import Loader from "../common/Loader";
import Button from "../button/Button";

export default function PersonalInfoForm() {
  const { user,
    updateProfile, UpdateProfilePhoto } =
    userApiStore();
  const { showSuccess, showError } = useToastStore();
  const [isEditable, setIsEditable] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEditClick = () => {
    setIsEditable((prev) => !prev);
  };

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        age: user.age,
        lastname: user.lastname,
      });
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const res = await updateProfile(data);

      // Call profile photo API only if file exists
      if (data.profile_picture && data.profile_picture.length > 0) {
        const formData = new FormData();
        formData.append("profile_picture", data.profile_picture[0]);
        await UpdateProfilePhoto(formData);
      }

      if (res.success) {
        showSuccess(res.message, "success");
        setIsEditable(false);
        reset({ profile_picture: null });
      } else {
        showError(res.message, "error");
      }
    } catch (error) {
      showError(error?.response?.message || "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl lg:text-2xl xl:text-2xl text-heading font-bold leading-tight">
            My Info
          </h2>
          <p className="text-gray-500 text-sm font-medium leading-7 lg:leading-8 tracking-wide">
            Update your account information
          </p>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg xl:text-xl text-heading font-bold leading-9">
            Personal Information
          </h2>
          <button
            className="text-primary font-bold text-base flex items-center gap-2 cursor-pointer"
            onClick={handleEditClick}
          >
            <SvgIcon name="Edit" />
            Edit
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Image
            className="rounded-full"
            src={"/home/manwithphone.jpg"}
            width={80}
            height={80}
            alt="Profile Image"
            priority
          />
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-7 lg:gap-7 mt-8">
          <div className="flex flex-col gap-2 ">
            <h3 className="text-base text-heading font-bold">First Name : </h3>
            <input
              type="text"
              placeholder="First Name"
              disabled={!isEditable}
              {...register("name", {
                required: "First Name is required",
                minLength: {
                  value: 3,
                  message: "Minimum 3 characters required",
                },
              })}
              className="w-full py-3.5 px-3 text-sm lg:text-base border border-lightborder focus:border-primary font-medium rounded-md focus:outline-none text-paragraph tracking-wide placeholder:text-sm"
            />
            <div className="min-h-5">
              {errors.name?.message && (
                <span className="text-sm text-red-500 block">
                  {errors.name.message}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 ">
            <h3 className="text-base text-heading font-bold">Last Name : </h3>
            <input
              type="text"
              placeholder="Last Name"
              disabled={!isEditable}
              {...register("lastname", {
                required: "Last Name is required",
                minLength: {
                  value: 3,
                  message: "Minimum 3 characters required",
                },
              })}
              className="w-full py-3.5 px-3 text-sm lg:text-base border border-lightborder focus:border-primary font-medium rounded-md focus:outline-none text-paragraph tracking-wide placeholder:text-sm"
            />
            <div className="min-h-5">
              {errors.lastname?.message && (
                <span className="text-sm text-red-500 block">
                  {errors.lastname.message}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 ">
            <h3 className="text-base text-heading font-bold">Username : </h3>
            <input
              type="text"
              placeholder="Username"
              disabled={!isEditable}
              {...register("username", {

              })}
              className="w-full py-3.5 px-3 text-sm lg:text-base border border-lightborder focus:border-primary font-medium rounded-md focus:outline-none text-paragraph tracking-wide placeholder:text-sm"
            />
            <div className="min-h-5">
              {errors.username?.message && (
                <span className="text-sm text-red-500 block">
                  {errors.username.message}
                </span>
              )}
            </div>
          </div>

          {/* <DOBPicker isEditable={isEditable} /> */}

          <div className="flex flex-col gap-2 ">
            <h3 className="text-base text-heading font-bold">Age : </h3>
            <input
              type="text"
              placeholder="Age"
              disabled={!isEditable}
              {...register("age", {
                required: "Age is required",
                min: {
                  value: 1,
                  message: "Enter valid age",
                },
              })}
              className="w-full py-3.5 px-3 text-sm lg:text-base border border-lightborder focus:border-primary font-medium rounded-md focus:outline-none text-paragraph tracking-wide placeholder:text-sm"
            />
            <div className="min-h-5">
              {errors.age?.message && (
                <span className="text-sm text-red-500 block">
                  {errors.age.message}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-base text-heading font-bold">
              Mobile Number :{" "}
            </h3>
            <input
              type="text"
              disabled={!isEditable}
              {...register("phone", {
                required: "Phone Number is required",

                pattern: {
                  value: /^\+?[0-9]+$/,
                  message: "Phone number can contain digits and optional +",
                },

                validate: {
                  length: (value) => {
                    const digitsOnly = value.replace(/\D/g, "");
                    return (
                      digitsOnly.length >= 10 &&
                      digitsOnly.length <= 15 ||
                      "Phone Number must be between 10 and 15 digits"
                    );
                  },
                },
              })}
              placeholder="Mobile Number"
              className="w-full py-3.5 px-3 text-sm lg:text-base border border-lightborder focus:border-primary font-medium rounded-md focus:outline-none text-paragraph tracking-wide placeholder:text-sm"
            />

            <div className="min-h-5">
              {errors.phone?.message && (
                <span className="text-sm text-red-500 block">
                  {errors.phone.message}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 ">
            <h3 className="text-base text-heading font-bold">Email : </h3>
            <input
              type="text"
              placeholder="Email"
              disabled={!isEditable}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email address",
                },
              })}
              className="w-full py-3.5 px-3 text-sm lg:text-base border border-lightborder focus:border-primary font-medium rounded-md focus:outline-none text-paragraph tracking-wide placeholder:text-sm"
            />
            <div className="min-h-5">
              {errors.email?.message && (
                <span className="text-sm text-red-500 block">
                  {errors.email.message}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label
              className="text-base text-heading font-bold"
              htmlFor="fileinput"
            >
              Profile Picture :
            </label>
            <input
              id="fileinput"
              type="file"
              disabled={!isEditable}
              {...register("profile_picture", {
                validate: {
                  isImage: (files) => {
                    if (files && files.length > 0) {
                      const type = files[0].type;
                      return (
                        ["image/jpeg", "image/jpg", "image/png"].includes(
                          type
                        ) || "Only JPG or PNG files are allowed."
                      );
                    }
                    return true;
                  },
                },
                maxSize: (files) => {
                  if (!files || files.length === 0) return true;
                  return (
                    files[0].size <= 104857600 ||
                    "File size must be less than 100MB."
                  );
                },
              })}
              className="w-full max-w-sm  p-4 border-2 border-dashed border-blue-400 rounded-lg text-blue-900 bg-blue-50 hover:bg-blue-100 cursor-pointer transition duration-300 flex flex-col items-center justify-center"
            />
            <div className="min-h-5">
              {errors.profile_picture?.message && (
                <span className="text-sm text-red-500 block">
                  {errors.profile_picture.message}
                </span>
              )}
            </div>
          </div>
        </div>

        {isEditable && (
          <Button
            type="submit"
            variant="primaryOutlined"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader size={18} border={3} color="white" />
            ) : (
              "Submit"
            )}
          </Button>
        )}
      </form>
      {/* <CompanyDetails /> */}
    </>
  );
}
