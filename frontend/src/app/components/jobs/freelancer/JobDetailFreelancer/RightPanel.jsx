import React from "react";
import SvgIcon from "@/app/components/Utility/SvgIcon";

const RightPanel = () => {
  return (
    <div className="lg:mx-auto flex flex-col gap-14 lg:border-l  border-gray-200 lg:pl-6">
      <div className="flex lg:flex-col gap-6">
        <button className="bg-secondary w-full text-white px-4 py-2 md:px-28 md:py-4 rounded font-semibold text-base">
          Apply Now
        </button>
        <button className="text-paragraph w-full px-3 py-2 md:px-28 md:py-4 rounded font-semibold text-base  border-default shadow-[0_0_10px_rgba(0,0,0,0.05)] flex items-center gap-1 md:gap-4">
          <SvgIcon name="Heart" /> Saved job
        </button>
      </div>
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <h3 className="font-semibold text-lg text-heading">8 job posted</h3>
          <p className="text-paragraph text-base">1 open job</p>
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="font-semibold text-lg text-heading">
            $3.1K total spent
          </h3>
          <p className="text-paragraph text-base">3 hires, 0 active</p>
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="font-semibold text-lg text-heading">
            $60.00 /hr avg hourly rate paid
          </h3>
          <p className="text-paragraph text-base">42 hours</p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-lg text-heading">
              <img src="/icons/stars.png" alt="" />
            </h3>
            <p>00</p>
          </div>
          <p className="text-paragraph text-base">0.00 of 0 reviews</p>
        </div>

        <div className="flex flex-col gap-4 mb-10">
          <h2 className="font-semibold text-lg text-heading">Job Link</h2>
          <input
            type="text"
            name=""
            id=""
            className="border border-gray-200 px-2 py-2 rounded"
            placeholder="https://www.upwork.com/jobs/~021866835538461740469"
          />
          <p className="text-blue-600 font-semibold text-base">Copy link</p>
        </div>
      </div>
    </div>
  );
};

export default RightPanel;
