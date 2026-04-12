import React from "react";

export const RightOne = ({
  size = 16,
  color = "currentColor",
  className = "",
}) => {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.4604 10.0101L14.5421 3.40527L8.14648 3.4844"
        stroke="#01237C"
        strokeWidth="2"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.2484 3.80273L3.45703 14.5937"
        stroke="#01237C"
        strokeWidth="2"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
