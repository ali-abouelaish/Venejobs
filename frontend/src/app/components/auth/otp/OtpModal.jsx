import Image from "next/image";
import SvgIcon from "@/app/components/Utility/SvgIcon";

export default function OtpModal({ children, setActiveModal, email }) {
  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center p-2 sm:p-3 bg-black/30 ">
      <div className="w-full max-w-lg sm:max-w-3xl bg-white rounded-xl shadow-sm ">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#D0D5DD] py-3 sm:py-4 px-4 sm:px-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <Image src="/logo.png" width={35} height={35} alt="logo" />
            <h1 className="text-lg sm:text-xl font-semibold text-gray-500">
              Venejobs
            </h1>
          </div>
          <button
            onClick={() => setActiveModal("")}
            className="rounded-full hover:bg-gray-100 transition cursor-pointer"
          >
            <SvgIcon name="CrossButton" />
          </button>
        </div>

        {/* Title */}
        <div className="text-center px-4 sm:px-5 py-4 sm:py-6">
          <h2 className="mt-6 sm:mt-10 mb-2 sm:mb-3 text-2xl md:text-3xl font-extrabold leading-tight text-heading">
            Verify your email
          </h2>

          <p className="text-xs sm:text-sm text-gray-500 tracking-wide">
            We have sent code to
          </p>

          <p className="font-medium mt-1 sm:mt-2 text-heading text-sm sm:text-base">
            {email}
          </p>
        </div>

        {children}

        {/* Footer */}
        <div className="flex justify-between py-3 sm:py-4 px-4 sm:px-8 text-xs sm:text-sm text-gray-500">
          <p>Privacy Policy</p>
          <p>Copyright</p>
        </div>
      </div>
    </div>
  );
}
