import React from "react";

export const Preview = ({ size = 16, color = "currentColor", className = "" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >

      {/* Document Outline */}
      <path
        d="M3 2.5H12.5L17 7V21.5C17 22.6 16.1 23.5 15 23.5H3C1.9 23.5 1 22.6 1 21.5V4.5C1 3.4 1.9 2.5 3 2.5Z"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />

      {/* Fold Corner */}
      <path
        d="M12.5 2.5V7H17"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />

      {/* Search Icon (Magnifying Glass) */}
      <circle
        cx="16"
        cy="14"
        r="3"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />
      <line
        x1="18.2"
        y1="16.2"
        x2="20.5"
        y2="18.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Lines inside Document */}
      <rect x="4" y="9" width="7" height="1.5" fill={color} />
      <rect x="4" y="12" width="6" height="1.5" fill={color} />
      <rect x="4" y="15" width="6" height="1.5" fill={color} />

    </svg>
  );
};

export default Preview;
