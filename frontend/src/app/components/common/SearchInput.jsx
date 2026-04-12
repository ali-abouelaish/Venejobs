import React from "react";
import SvgIcon from "@/app/components/Utility/SvgIcon";

const SearchInput = ({
    value,
    onChange,
    placeholder = "Search",
    className = "",
}) => {
    return (
        <div className={`relative w-full ${className}`}>
            {/* Icon */}
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <SvgIcon name="Search_Icon" size={18} />
            </span>

            {/* Input */}
            <input
                type="search"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="
          w-full
          h-[52px]
          pl-12 pr-5
          rounded-full
          bg-white
          text-[15px]
          font-medium
          text-gray-700
          placeholder:text-gray-400
          border border-gray-200
          shadow-[0_8px_30px_rgba(0,0,0,0.06)]
          outline-none
          focus:border-secondary
          focus:shadow-[0_10px_40px_rgba(0,0,0,0.08)]
          transition-all duration-200
        "
            />
        </div>
    );
};

export default SearchInput;
