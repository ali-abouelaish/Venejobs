import React from "react";
import SvgIcon from "@/app/components/Utility/SvgIcon";

const JobDetail = () => {
  const skills = [
    "Landing Page",
    "Web Design",
    "User Flow",
    "Prototype",
    "UX/UI Design",
  ];
  return (
    <div className=" lg:w-[1000px] flex flex-col gap-10">
      <div className="flex flex-col gap-10 border-b border-gray-200">
        <h2 className="text-3xl lg:text-[44px] text-heading font-semibold">
          Interactive Website Design in Figma
        </h2>
        <div className="flex gap-6 mb-10">
          <p className="font-medium text-lg text-paragraph">
            Posted 4 days ago
          </p>
          <p className="font-medium text-lg text-paragraph">Worldwide</p>
        </div>
      </div>

      <div className="flex flex-col gap-10 border-b border-gray-200">
        <div className="flex flex-col gap-4">
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
          <div className="text-paragraph text-base mt-10 flex flex-col gap-2">
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

        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-lg text-heading">Attachments</h2>
          <div className="flex gap-2 mb-10">
            <div className="flex items-center gap-2 border border-gray-200 rounded px-3 py-2">
              <div className="bg-gray-200 p-3 rounded-full">
                <SvgIcon name="File" size={32} />
              </div>
              <div className="flex flex-col">
                <h3 className="text-heading text-sm">project-details.pdf</h3>
                <p className="text-paragraph text-xs">2.3mb</p>
              </div>
            </div>
            <div className="flex items-center gap-2 border border-gray-200 rounded px-3 py-2">
              <div className="bg-gray-200 p-3 rounded-full">
                <SvgIcon name="File" size={32} />
              </div>
              <div className="flex flex-col">
                <h3 className="text-heading text-sm">project-details.pdf</h3>
                <p className="text-paragraph text-xs">2.3mb</p>
              </div>
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

      <div className="hidden lg:flex flex-col gap-10">
        <div className="flex flex-col gap-6 mb-10">
          <h2 className=" font-semibold text-lg text-heading">
            Activity on this job
          </h2>
          <ul className="list-style-type: none flex flex-col gap-4">
            <li className="text-paragraph">Proposals : Less than 5</li>
            <li className="text-paragraph">
              Last viewed by client : 4 days ago
            </li>
            <li className="text-paragraph">Interviewing: 0</li>
            <li className="text-paragraph">Invites sent: 0</li>
            <li className="text-paragraph">Unanswered invites: 0</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
