import React from "react";

export default function Button({
  type,
  children,
  isLoading = false,
  disabled = false,
  className = "",
  icon,
  variant = "",
  ...props
}) {
  const variantClasses = {
    primary: `
      text-white bg-black
    `,
    secondary: `
      bg-white text-[#0057ff] 
      hover:bg-[#0057ff] hover:text-white
    `,
    secondaryFilled: `
      bg-secondary text-white
      hover:bg-secondary/90
    `,
    lightCard: `
      bg-white text-paragraph
      border border-[rgba(0,0,0,0.08)]
      shadow-[2px_2px_50px_5px_rgba(0,0,0,0.05)]
    `,
    primaryOutlined: `
      bg-primary text-white
      border border-[#FAFAFA]
      gap-2
    `,
    text: `
      text-heading font-semibold hover:underline
    `,
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`
        ${variantClasses[variant]}
        ${className}

        /* size */
        w-32 sm:w-36 md:w-40 lg:w-46
        h-10 sm:h-11 md:h-12 lg:h-13

        rounded
        font-semibold tracking-wide

        /* ✅ RESPONSIVE FONT SIZE */
        text-xs
        sm:text-sm
        md:text-base

        inline-flex items-center justify-center gap-2
        cursor-pointer

        /* animation */
        transition-all duration-200 ease-out
        hover:-translate-y-px
        hover:shadow-lg
        active:translate-y-0
        active:scale-[0.97]

        /* disabled */
        disabled:opacity-60
        disabled:cursor-not-allowed
        disabled:hover:shadow-none
        disabled:hover:translate-y-0
        disabled:active:scale-100
      `}
      {...props}
    >
      {isLoading ? "" : children}
      {!isLoading && icon && icon}
    </button>
  );
}
