import React from "react";
import Button from "../../button/Button";
import SvgIcon from "@/app/components/Utility/SvgIcon";

const LeftPanel = () => {
  return (
    <div className="w-full flex flex-col gap-10">
      <div>
        <p>2 / 3</p>
      </div>
      <div className="flex flex-col gap-6">
        <h2 className="text-heading font-semibold text-2xl lg:text-[44px]">
          Invite talent to interview
        </h2>
        <p className="lg:text-lg text-paragraph">
          Talent will send proposals to your job, but you can also invite anyone
          who looks like a good fit to discuss the work you need.
        </p>
      </div>
      <div className="flex justify-end gap-10">
        <button className="text-paragraph font-medium">Skip</button>
        <Button className="bg-primary text-white gap-3">
          Continue <SvgIcon name="NextArrow" />
        </Button>
      </div>
    </div>
  );
};

export default LeftPanel;
