import React from "react";

const NumericInputField = ({
    label,
    name,
    register,
    rules,
    error,
    placeholder,
    maxLength = 10,
    disabled = false,
    prefix,
    focusBorder = "secondary",
}) => {
    return (
        <div className="flex flex-col gap-2">
            <label className="font-medium tracking-wide lg:text-base">
                {label}
            </label>

            <div className="relative">
                {prefix && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        {prefix}
                    </span>
                )}

                <input
                    type="text"
                    inputMode="numeric"
                    maxLength={maxLength}
                    disabled={disabled}
                    placeholder={placeholder}
                    {...register(name, rules)}
                    onInput={(e) => {
                        e.target.value = e.target.value
                            .replace(/[^0-9]/g, "")
                            .slice(0, maxLength);
                    }}
                    className={`
            w-full py-3.5 rounded-md text-sm lg:text-base
            tracking-wide placeholder:text-sm border transition-all
            focus:outline-none
            ${prefix ? "pl-8" : "px-3"}
            ${disabled
                            ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                            : `border-[#D0D5DD] bg-white text-black focus:border-${focusBorder}`
                        }
          `}
                />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
};

export default NumericInputField
