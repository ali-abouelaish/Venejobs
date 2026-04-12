import React from "react";

export const Edit = ({ size = 16, color = "currentColor", className = "" }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      className={`edit ${className}`}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d="M11.0495 3.00002L4.2078 10.2417C3.94947 10.5167 3.69947 11.0583 3.64947 11.4333L3.34114 14.1333C3.2328 15.1083 3.9328 15.775 4.89947 15.6083L7.5828 15.15C7.9578 15.0833 8.48284 14.8083 8.74117 14.525L15.5828 7.28335C16.7662 6.03335 17.2995 4.60835 15.4578 2.86668C13.6245 1.14168 12.2328 1.75002 11.0495 3.00002Z"
        stroke="#01237C"
        strokeWidth="2"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.90883 4.20801C10.2672 6.50801 12.1338 8.26634 14.4505 8.49967M2.5 18.3332H17.5"
        stroke="#01237C"
        strokeWidth="2"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
