import React from "react";
import SvgIcon from "@/app/components/Utility/SvgIcon";

const Jobdetail = () => {
  const skills = [
    "Landing Page",
    "Web Design",
    "User Flow",
    "Prototype",
    "UX/UI Design",
  ];
  return (
    <div>
      <div className="border-b border-gray-200">
        <h2 className="font-semibold text-[32px] lg:text-[44px] mb-10 text-heading">
          Submit a proposal
        </h2>
      </div>

      <div className="flex flex-col ">
        <div>
          <h2 className="font-semibold text-2xl lg:text-[32px] mb-10 text-heading">
            Interactive Website Design in Figma
          </h2>
        </div>

        <div className="flex flex-col gap-4 border-b border-gray-200">
          <h2 className="font-semibold text-base lg:text-lg text-heading">
            Project Type:
          </h2>
          <p className="text-paragraph  lg:text-base">
            We are seeking a talented UI designer to join our team. As a UI
            designer, you will be responsible for creating visually appealing
            and user-friendly interfaces for our web and mobile applications.
            Your main tasks will include wireframing, prototyping, and designing
            interfaces that align with our brand guidelines and user
            expectations. You should have a strong understanding of
            user-centered design principles and be able to translate user
            requirements into intuitive and aesthetically pleasing designs.
          </p>
          <div className="text-paragraph text-base mt-10 flex flex-col gap-2 mb-10">
            <h3>Skills Needed :</h3>
            <div className="flex flex-col gap-2">
              <p>
                - Proficiency in UI design tools such as Sketch, Figma, or Adobe
                XD
              </p>
              <p>- Strong knowledge of UX principles and best practices</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-10 border-b border-gray-200 ">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-44 mb-10">
          <div className="flex gap-8 items-center">
            <SvgIcon name="PriceTag" />
            <div className="flex flex-col gap-2">
              <h2 className="lg:text-lg">$33.00</h2>
              <p className="text-paragraph text-sm lg:text-base">Fixed Price</p>
            </div>
          </div>

          <div className="flex gap-8 items-center ">
            <SvgIcon name="PersonWSetting" />
            <div className="flex flex-col gap-2">
              <h2 className="lg:text-lg">Entry level</h2>
              <p className="text-paragraph text-sm lg:text-base">
                I am looking for freelancers with the lowest rates
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-10 border-b border-gray-200 ">
        <div className="flex flex-col gap-6">
          <h2 className="font-semibold text-base lg:text-lg text-heading">
            Skills and Expertise
          </h2>
          <div className="flex items-center gap-3 flex-wrap mb-4 md:mb-10">
            {skills.map((item) => (
              <p
                className="relative overflow-hidden
                          bg-[#FAFAFA] p-3 font-medium text-paragraph rounded-2xl
                          transition-all duration-300
                          before:content-[''] before:absolute before:inset-0
                          before:bg-gray-200 before:-translate-x-full before:transition-transform before:duration-300
                          before:-z-10
                          hover:before:translate-x-0
                          z-10  text-base"
                key={item}
              >
                {item.split(" ,")}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Jobdetail;
