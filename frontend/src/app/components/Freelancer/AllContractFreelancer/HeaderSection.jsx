import React from "react";
import SvgIcon from "@/app/components/Utility/SvgIcon";

const HeaderSection = () => {
  return (
    <div className="flex flex-col gap-8 border-b border-gray-200">
      <h1 className="font-semibold text-heading text-2xl lg:text-[44px]">
        All Contracts
      </h1>
      <div className="flex gap-6 md:px-10 flex-wrap ">
        <button className="bg-secondary text-white font-semibold px-5 py-3 md:px-24 md:py-3 rounded">
          Descending
        </button>
        <button className="text-paragraph shadow font-semibold px-5 py-3 md:px-24 md:py-3 rounded">
          Ascending
        </button>
      </div>
      <div className="relative mb-10">
        <span className="absolute inset-y-0 px-4  flex items-center ">
          <SvgIcon name="Search_Icon" />
        </span>
        <input
          type="search"
          id="search"
          className="
                block w-full pl-10 pr-4 py-2 
                rounded-4xl text-sm text-gray-900 font-medium 
                border border-lightborder focus:border-primary outline-none
                placeholder:text-gray-400"
          placeholder="Search"
          required
        />
      </div>
    </div>
  );
};

export default HeaderSection;
