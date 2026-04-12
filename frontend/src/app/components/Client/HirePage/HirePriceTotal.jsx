"use client";
import Image from "next/image";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import { useState } from "react";
import SuccessOfferCreate from "./SuccessOfferCreate";

const HirePriceTotal = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full lg:w-[30%]">
      <div className="flex flex-col gap-8 px-3 py-6 md:py-6 md:px-4 rounded-lg" style={{ boxShadow: "2px 2px 50px 6px #0000000D" }}>
        {/* title and image */}
        <div className="flex flex-col gap-6 md:gap-10">
          <div className="flex items-center gap-3.5 w-full md:w-auto">
            <Image src="/freelancer.jpg" alt="Freelancer image"
              width={64}
              height={64}
              className="rounded-full w-15 h-15 cursor-pointer"
            />
            <div className="flex flex-col gap-3">
              <div className="flex flex-row items-center gap-2 md:gap-4 cursor-pointer">
                <h3 className="text-lg text-heading font-semibold">
                  Alishan Noor
                </h3>
              </div>
              <p className="text-paragraph text-sm font-normal">
                UX/UI Designer | Expert in Website|Software...
              </p>

              <div className="flex flex-row items-center gap-10">
                <p className="text-heading text-sm font-semibold">
                  100k Earned&nbsp;
                </p>
                <p className="flex gap-4 text-paragraph text-sm font-medium">
                  <SvgIcon name="Star" /> 5.0 (1 Review)
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <p className="text-paragraph text-[15px] font-medium">
              – 8:10 am local time
            </p>
            <p className="text-heading text-lg font-semibold">Escrow deposit</p>
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-4 md:gap-6">
                <div className="flex flex-row justify-between">
                  <p className="text-heading text-base font-medium">Subtotal</p>
                  <p className="text-paragraph text-base font-normal">$33.00</p>
                </div>
                <div className="flex flex-row justify-between">
                  <p className="text-heading text-base font-medium">Business Plus fee</p>
                  <p className="text-paragraph text-base font-normal">$3.00</p>
                </div>
                <div className="flex flex-row justify-between">
                  <p className="text-heading text-base font-medium">Estimated taxes</p>
                  <p className="text-paragraph text-base font-normal">$0.00</p>
                </div>
              </div>
              <div className="flex flex-col gap-6 border-t border-[#DEDEDE]">
                <div className="flex flex-row justify-between mt-8">
                  <p className="text-heading text-lg font-bold">Estimated total</p>
                  <p className="text-paragraph text-base font-normal">$35.00</p>
                </div>
              </div>
            </div>
          </div>
          {/* buttons [desktop] */}
          <div className="pt-2 md:pt-0">
            <button onClick={() => setOpen(true)} className="w-full bg-primary font-medium rounded-lg text-white text-lg cursor-pointer border border-primary p-3.75">
              Hire Now
            </button>
          </div>
        </div>
      </div>
      {open && <SuccessOfferCreate onClose={() => setOpen(false)} />}
    </div>
  );
};

export default HirePriceTotal;
