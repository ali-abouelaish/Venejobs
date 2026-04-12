import { useRef } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";
import LogoHeader from "./LogoHeader";
import ForgetPasswordForm from "./ForgetPasswordForm";
import SvgIcon from "@/app/components/Utility/SvgIcon";

export default function ForgetPasswordWrapper({
  setActiveModal,
  setUserEmail,
}) {
  const forgetRef = useRef(null);

  useClickOutside(forgetRef, () => setActiveModal(""));

  return (
    <div className="overflow-y-auto bg-black/50 fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="relative w-full max-w-md mx-auto">
        <div className="relative bg-white w-full rounded-xl shadow-sm">
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
          <div className="p-4 pt-15 pb-40 md:pt-15" ref={forgetRef}>
            <LogoHeader />

            <ForgetPasswordForm
              setActiveModal={setActiveModal}
              setUserEmail={setUserEmail}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
