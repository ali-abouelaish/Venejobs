import Image from "next/image";
import Link from "next/link";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import { useState } from "react";
import Loader from "../../common/Loader";
import { Routes } from "@/app/routes";

export default function SuccessOfferCreate({ onClose }) {

  const [loading, setLoading] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      window.location.href = Routes.client.home;
    }, 800);
  };
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

        <div className="bg-white rounded-xl shadow-md
      w-full max-w-md sm:max-w-lg lg:max-w-6xl
      max-h-[90vh] overflow-y-auto
      flex flex-col items-center px-5 pt-6 pb-0 md:p-10">
          <div className="w-full flex justify-end items-center">
            <button className="cursor-pointer" onClick={onClose}>
              <SvgIcon size={32} name="Delete" color="#666666" />
            </button>
          </div>
          <div className="flex flex-col items-center py-20">
            {/* Image */}
            <div className="mb-10">
              <Image
                src="/job_post/party-popper.png"
                alt="party popper"
                height={120}
                width={120}
                className="w-15 h-15 md:h-[150px] md:w-[150px]"
              />
            </div>

            {/* Heading */}
            <h2 className="text-center text-heading font-semibold text-base md:text-2xl mb-4.5">
              Congrats! Your Offer send to Alishan Noor!
            </h2>

            {/* Description */}
            <p className="text-paragraph leading-6 text-center text-sm sm:text-base lg:text-lg max-w-md mb-8 md:mb-10">
              Your offer has been successfully sent to Alishan Noor. Stay tuned for a response soon!
            </p>

            {/* CTA Button */}
            <div className="flex flex-row gap-2 md:gap-10">
              <button className="flex items-center justify-center gap-3 bg-white font-semibold p-2 w-[120px] xl:w-[180px] xl:py-4 rounded text-paragraph text-xs md:text-base cursor-pointer border border-[#FAFAFA]" style={{ boxShadow: "2px 2px 50px 5px #0000000D" }} onClick={onClose}><SvgIcon size={18} name="LeftArrow" color="#666666" />Back</button>
              <Link href={Routes.client.home}
                onClick={handleClick}
                className={`bg-primary text-white px-6 py-3 rounded flex items-center justify-center gap-3 w-[120px] xl:w-[180px] text-sm sm:text-base transition ${loading ? "opacity-70 pointer-events-none" : "hover:opacity-90"}`}
              >
                {loading ? (
                  <>
                    <Loader size={18} border={3} color="white" />
                  </>
                ) : (
                  <>
                    Continue <SvgIcon name="NextArrow" />
                  </>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}
