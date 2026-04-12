import React from "react";

export const BusinessSector = ({
  size = 16,
  color = "currentColor",
  className = "",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M7.62207 6.8916L11.8086 4.65039V7.30176L16.2715 4.55859L16.2705 14.7275H17.0996V16.2002H1.7998V14.7275H2.67578L3.4834 2.7002H7.34082L7.62207 6.8916ZM4.20996 14.7275H6.61426L5.90527 4.17188H4.91797L4.20996 14.7275ZM7.73145 8.51758L8.14844 14.7275H14.7402V7.24512L10.2783 9.98926V7.1543L7.73145 8.51758Z"
        fill={color}
      />
    </svg>
  );
};

export default BusinessSector;
