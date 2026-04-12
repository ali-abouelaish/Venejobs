import Image from "next/image";
import Button from "../button/Button";
import SvgIcon from "../Utility/SvgIcon";

export default function SuccessPassScreen({ setActiveModal }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
      <div
        className="
          relative bg-white w-full max-w-[460px] rounded-xl shadow-sm
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
        <div className="pt-20 px-6 md:px-5 md:py-10">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <Image src="/logo.png" alt="logo" width={40} height={40} />
            <h1 className="text-xl font-semibold text-gray-500">Venejobs</h1>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-extrabold leading-tight text-center text-heading mb-3">
            Password Reset
          </h2>

          <p className="text-center text-gray-500 text-sm lg:text-sm leading-6 tracking-wide">
            Your password has been successfully reset. Click below to log in
            magically.
          </p>

          {/* Actions */}
          <div className="flex justify-center mt-12">
            <Button
              onClick={() => setActiveModal("signin")}
              variant="primaryOutlined"
            >
              Back to Login
              <SvgIcon name="RightArrWhite" />
            </Button>

          </div>
        </div>
      </div>
    </div>
  );
}
