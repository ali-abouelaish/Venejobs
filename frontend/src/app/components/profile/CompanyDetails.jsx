"use client";

import Image from "next/image";
import DOBPicker from "../Utility/DatePicker";
import SvgIcon from "../Utility/SvgIcon";
import SelectInput from "../Utility/SelectInput"; // <---- IMPORT NEW COMPONENT
import { useState } from "react";

export default function CompanyDetails() {
  const [industry, setIndustry] = useState("Real Estate");
  const [companySize, setCompanySize] = useState("It's just me");

  return (
    <div className="">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <p className="text-lg xl:text-xl text-heading font-bold leading-9">
          Company details
        </p>

        <button className="flex items-center gap-2 text-primary font-bold cursor-pointer">
          <SvgIcon name="Edit" size={16} />
          Edit
        </button>
      </div>

      {/* Logo */}
      <div className="w-20 h-20 bg-lightborder rounded-full flex items-center justify-center mb-8">
        <Image
          src="/logo.png"
          width={45}
          height={45}
          alt="Company Logo"
          className="object-contain"
        />
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
        {/* Company Name */}
        <div className="flex flex-col gap-2">
          <h3 className="text-base text-heading font-bold">Company Name</h3>
          <input
            type="text"
            placeholder="Giacomo Chaparro"
            className="w-full py-3.5 px-3 border border-lightborder rounded-md 
            text-paragraph font-medium placeholder:text-sm focus:border-primary outline-none"
          />
        </div>

        {/* Website */}
        <div className="flex flex-col gap-2">
          <h3 className="text-base text-heading font-bold">Website</h3>
          <input
            type="text"
            placeholder="Website Link"
            className="w-full py-3.5 px-3 border border-lightborder rounded-md 
            text-paragraph font-medium placeholder:text-sm focus:border-primary outline-none"
          />
        </div>

        {/* Address */}
        <div className="flex flex-col gap-2">
          <h3 className="text-base text-heading font-bold">Address</h3>
          <input
            type="text"
            placeholder="Street, City, State, Zip Code."
            className="w-full py-3.5 px-3 border border-lightborder rounded-md 
            text-paragraph font-medium placeholder:text-sm focus:border-primary outline-none"
          />
        </div>

        {/* Industry (CUSTOM DROPDOWN) */}
        <SelectInput
          label="Add your industry"
          options={["Real Estate", "Construction", "Technology", "Finance"]}
          value={industry}
          onChange={setIndustry}
        />

        {/* Company Size (CUSTOM DROPDOWN) */}
        <SelectInput
          label="How many people are in your company?"
          options={["It's just me", "2–5", "5–10", "10–50", "50+"]}
          value={companySize}
          onChange={setCompanySize}
        />

        {/* Tagline */}
        <div className="flex flex-col gap-2">
          <h3 className="text-base text-heading font-bold">Tagline</h3>
          <input
            type="text"
            placeholder="Tagline"
            className="w-full py-3.5 px-3 border border-lightborder rounded-md 
            text-paragraph font-medium placeholder:text-sm focus:border-primary outline-none"
          />
        </div>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2 mt-7">
        <h3 className="text-base text-heading font-bold">Description</h3>
        <textarea
          placeholder="It's just me"
          className="w-full h-28 py-3.5 px-3 border border-lightborder rounded-md 
          text-paragraph font-medium placeholder:text-sm focus:border-primary outline-none resize-none"
        ></textarea>
      </div>
    </div>
  );
}
