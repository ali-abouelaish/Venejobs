import SvgIcon from "@/app/components/Utility/SvgIcon";

import React from "react";

export default function RoleSelection({ register, errors }) {
  return (
    <>
      <div className="grid md:grid-cols-2 gap-2 md:gap-x-4 mb-4">
        {/* Freelancer */}
        <div className="group">
          <input
            type="radio"
            id="freelancer"
            value="freelancer"
            className="hidden peer"
            {...register("role", { required: "Selecting role is required" })}
          />

          <label
            htmlFor="freelancer"
            className="flex items-center justify-center gap-3 rounded-lg py-4 cursor-pointer text-gray-500 transition-all peer-checked:bg-primary peer-checked:text-white peer-checked:border-primary border border-[#D0D5DD]"
          >
            <SvgIcon
              name="Teleworking"
              className="w-5 h-5 text-gray-500 group-has-checked:text-white transition-colors"
            />
            <span className="text-[15px] font-medium">I'm a freelancer</span>
          </label>
        </div>

        {/* Client */}
        <div className="group">
          <input
            type="radio"
            id="client"
            value="client"
            className="hidden peer"
            {...register("role", { required: "Selecting role is required" })}
          />

          <label
            htmlFor="client"
            className="
                flex items-center justify-center gap-3
                rounded-lg py-4 cursor-pointer
                text-gray-500 transition-all

                peer-checked:bg-primary
                peer-checked:text-white
                peer-checked:border-primary
                border border-[#D0D5DD]
            "
          >
            <SvgIcon
              name="Businessman"
              className="w-5 h-5 text-gray-500 group-has-checked:text-white transition-colors"
            />
            <span className="text-[15px] font-medium">I'm a Client</span>
          </label>
        </div>

        {errors.role && (
          <p className="text-red-500 text-sm m-0">{errors.role.message}</p>
        )}
      </div>
    </>
  );
}
