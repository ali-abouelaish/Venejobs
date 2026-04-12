"use client";
import { useRef } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";
import SvgIcon from "@/app/components/Utility/SvgIcon";

export default function NewPasswordModalWrapper({ children, setActiveModal }) {
  const modalRef = useRef(null);
  useClickOutside(modalRef, () => setActiveModal(""));

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
      <div
        ref={modalRef}
        className="relative bg-white w-full max-w-[460px] rounded-xl shadow-sm
        min-h-[640px] sm:min-h-[580px] md:min-h-[720px]"
      >
        <button
          type="button"
          onClick={() => setActiveModal("")}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center
          rounded-full hover:bg-gray-100 transition cursor-pointer"
        >
          <SvgIcon name="CrossButton" size={18} />
        </button>

        <div className="pt-20 px-6">{children}</div>
      </div>
    </div>
  );
}
