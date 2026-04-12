import React from "react";

export const Control_prev = ({
  size = 16,
  color = "currentColor",
  className = "",
}) => {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="0.5" y="0.5" width="31" height="31" rx="15.5" fill="white" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="15.5" stroke="#F1F1F1" />
      <path
        d="M18.06 20L19 19.06L15.9467 16L19 12.94L18.06 12L14.06 16L18.06 20Z"
        fill="#333333"
      />
    </svg>
  );
};

export default Control_prev;
