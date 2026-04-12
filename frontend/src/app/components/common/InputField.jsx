import React from "react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

const InputField = ({
    label,
    name,
    register,
    rules,
    value,
    onChange,
    error,
    placeholder,
    type = "text",
    as = "input",
    rows = 4,
    disabled = false,
    options = [],
}) => {

    const commonClass = `
  w-full py-3.5 px-3 rounded-md
  tracking-wider
  border transition-all duration-200 focus:outline-none
  appearance-none cursor-pointer placeholder:text-sm placeholder:text-gray-400
  bg-white
  ${disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
            : "border-[#D0D5DD] focus:border-secondary"
        }
`;


    const fieldProps = register
        ? register(name, rules)
        : { name, value, onChange };

    return (
        <div className="flex flex-col gap-2">
            {label && (
                <label className="font-medium lg:text-base tracking-wide">
                    {label}
                </label>
            )}

            {/* TEXTAREA */}
            {as === "textarea" && (
                <textarea
                    {...fieldProps}
                    rows={rows}
                    disabled={disabled}
                    placeholder={placeholder}
                    className={`${commonClass} resize-none`}
                />
            )}

            {/* SELECT (YEAR LIST) */}
            {as === "select" && (
                <div className="relative">
                    <select
                        {...fieldProps}
                        disabled={disabled}
                        className={`
        ${commonClass}
        ${!register && (!value || value === "")
                                ? "text-gray-400 text-sm"
                                : "text-black text-base"}
      `}
                    >
                        <option value="" disabled hidden>
                            {placeholder}
                        </option>

                        {options.map((opt) => (
                            <option key={opt} value={opt} className="text-black">
                                {opt}
                            </option>
                        ))}
                    </select>

                    <ArrowDropDownIcon
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        fontSize="medium"
                    />
                </div>
            )}


            {/* DATE PICKER (optional) */}
            {as === "datepicker" && (
                <Flatpickr
                    value={value}
                    onChange={([date]) =>
                        onChange?.({
                            target: { name, value: date },
                        })
                    }
                    options={{ dateFormat: "Y" }}
                    disabled={disabled}
                    className={commonClass}
                    placeholder={placeholder}
                />
            )}

            {/* NORMAL INPUT */}
            {as === "input" && (
                <input
                    type={type}
                    {...fieldProps}
                    disabled={disabled}
                    placeholder={placeholder}
                    className={commonClass}
                />
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
    );
};

export default InputField;
