"use client";

import { useState, useRef, useEffect } from "react";

export default function SelectInput({ label, options = [], value, onChange }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handle(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && <h3 className="text-base text-heading font-bold">{label}</h3>}

      {/* Wrapper needed to position dropdown correctly */}
      <div className="relative w-full" ref={dropdownRef}>
        {/* Select Header */}
        <div
          onClick={() => setOpen(!open)}
          className="
            w-full py-3.5 px-3 pr-10 border border-lightborder 
            rounded-md text-paragraph font-medium text-sm lg:text-base
            cursor-pointer select-none focus:border-primary outline-none
          "
        >
          {value || "Select"}

          {/* Arrow */}
          <svg
            className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] 
            transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              d="M6 9l6 6 6-6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Dropdown */}
        {open && (
          <div
            className="
              absolute top-full left-0 mt-1 
              w-full bg-white shadow-lg rounded-md 
              border border-lightborder z-20 
              max-h-60 overflow-auto
            "
          >
            {options.map((opt, index) => (
              <div
                key={index}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className="
                  px-3 py-2 text-sm cursor-pointer 
                  hover:bg-primary hover:text-white
                "
              >
                {opt}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
