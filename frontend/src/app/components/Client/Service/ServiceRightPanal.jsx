"use client";
import Image from "next/image";
import SvgIcon from "@/app/components/Utility/SvgIcon";

const ServiceRightPanal = () => {
  return (
    <div className="w-full lg:w-[30%]">
      <div className="flex flex-col gap-8 px-3 py-6 md:py-8 md:px-4 rounded-lg" style={{ boxShadow: "2px 2px 50px 6px #0000000D" }}>
        {/* title and image */}
        <div className="flex flex-col gap-6 md:gap-10">
          <div className="flex items-center gap-3.5 w-full md:w-auto">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2 md:gap-3">
                <h6 className="text-[32px] text-heading font-semibold">$20</h6>
                <p className="text-paragraph text-base font-normal">
                  Save up to 15% with <span className="text-heading">Subscribe to Save</span>
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-heading text-2xl font-semibold">Starter Design Package</p>
                <p className="text-paragraph text-base font-normal">
                  Perfect for individuals or startups needing a clean, professional landing page or simple UI design.
                </p>
              </div>
              <div className="flex flex-col gap-3 mt-2">
                <div className="flex flex-row justify-between">
                  <p className="text-heading text-base font-medium">Delivery Time</p>
                  <p className="text-paragraph text-base font-normal">3 Days</p>
                </div>
                <p className="text-paragraph text-base font-normal">
                  Revisions may occur after this date.
                </p>
              </div>
            </div>
          </div>
          {/* buttons [desktop] */}
          <div className="flex flex-col gap-4 pt-10 border-t border-[#DEDEDE]">
            <button onClick={() => setOpen(true)} className="w-full bg-primary font-medium rounded-lg text-white text-lg cursor-pointer p-3.75">
              Request Order
            </button>
            <button onClick={() => setOpen(true)} className="w-full bg-white font-medium rounded-lg text-paragraph text-lg cursor-pointer p-3.75" style={{ boxShadow: "2px 2px 50px 6px #0000000D" }}>
              Contact Me
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceRightPanal;
