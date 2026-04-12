import { useState } from "react";
import Image from "next/image";
import Button from "../button/Button";
import SvgIcon from "../Utility/SvgIcon";
import Loader from "../common/Loader";

export default function CheckMailScreen({ setActiveModal }) {
  const [loading, setLoading] = useState(false);

  const handleVerify = () => {
    setLoading(true);

    setTimeout(() => {
      setActiveModal("otp_verify");
      setLoading(false);
    }, 700);
  };

  return (
    <>
      <div className="flex overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full ">
        <div className="relative p-4 w-full max-w-md max-h-full mx-auto ">
          <div className="relative bg-white w-full rounded-lg shadow-sm border">
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
            <div className="p-4 pt-15 pb-40 md:pt-15">
              <div className="flex items-center justify-center gap-3 mb-5">
                <Image src="/logo.png" width={40} height={40} alt="logo" />
                <h1 className="text-xl font-semibold text-gray-500">
                  Venejobs
                </h1>
              </div>

              <div>
                <h2 className="mt-10 mb-3 text-2xl font-extrabold leading-tight text-center text-heading">
                  Check your email
                </h2>

                <p className="text-sm text-center text-gray-500 tracking-wide">
                  Didn’t receive the email?{" "}
                  <b className="text-heading hover:text-primary cursor-pointer">
                    Click to resend
                  </b>
                </p>
              </div>

              <div className="flex justify-center mt-10">
                <Button
                  onClick={handleVerify}
                  disabled={loading}
                  variant="primaryOutlined"
                >
                  {loading ? (
                    <Loader size={18} border={3} color="white" />
                  ) : (
                    "Verify Your OTP"
                  )}
                </Button>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
