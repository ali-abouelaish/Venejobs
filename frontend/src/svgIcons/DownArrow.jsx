import React from "react";

export const DownArrow  = ({
  size = 16,
  color = "currentColor",
  className = "",
}) => {
  return (
    <svg
      className="w-4 h-4 ms-1.5 -me-0.5"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="m19 9-7 7-7-7"
      />
    </svg>
  );
};

export default DownArrow;
