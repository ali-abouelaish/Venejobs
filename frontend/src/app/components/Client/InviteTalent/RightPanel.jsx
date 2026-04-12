import React from "react";

const RightPanel = () => {
  const skills = ["Landing Page", "Web Design", "Prototype", "UX/UI Design"];
  return (
    <div className="w-full flex flex-col gap-6 lg:mt-18">
      <div className="border border-gray-200 rounded">
        <div className="flex justify-between items-start p-3 gap-3 flex-wrap md:flex-nowrap">
          <img src="/freelancer.jpg" alt="" />
          <div className="flex flex-col gap-3">
            <h2 className="font-semibold text-lg lg:text-2xl text-heading">
              Thomas S.
            </h2>
            <p className="text-paragraph text-sm lg:text-base">
              UX/UI Designer | Expert in Website|App|Software|Figma
            </p>
            <div className="flex gap-4 items-center">
              <p className="text-sm lg:text-base font-semibold">100k Earned</p>
              <p className="text-paragraph">5.0 (1 Review)</p>
            </div>
          </div>
          <button className="border border-primary px-4 py-1 lg:py-2 lg:px-4 rounded font-semibold text-primary">
            Invite
          </button>
        </div>

        <div className="flex gap-3 px-2 flex-wrap mb-5">
          {skills.map((skill, index) => (
            <p
              className="text-sm lg:text-base cursor-pointer
                    relative overflow-hidden
                    bg-[#FAFAFA] px-4 py-2 font-medium text-paragraph rounded-full
                    transition-all duration-300
                    before:content-[''] before:absolute before:inset-0
                    before:bg-gray-200 before:-translate-x-full before:transition-transform before:duration-300
                    before:-z-10
                    hover:before:translate-x-0
                    z-10"
              key={index}
            >
              {skill}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RightPanel;
