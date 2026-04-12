"use client";
import { useRef } from "react";
import SvgIcon from "@/app/components/Utility/SvgIcon";

export default function LoginModalWrapper({ children, setActiveModal }) {
  const loginRef = useRef(null);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6 sm:p-8 md:p-10">
      <div
        ref={loginRef}
        className="
          relative bg-white w-full max-w-[460px] rounded-xl shadow-sm
          min-h-[640px] sm:min-h-[580px] md:min-h-[720px]
        "
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setActiveModal("")}
          className="
            absolute top-4 right-4 w-9 h-9
            flex items-center justify-center
            rounded-full hover:bg-gray-100 transition cursor-pointer
          "
        >
          <SvgIcon name="CrossButton" size={18} />
        </button>

        {/* Content */}
        <div className="pt-20 px-4 py-6 md:px-5 md:py-10 lg:px-6">
          {children}
        </div>
      </div>
    </div>
  );
}
