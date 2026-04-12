import SvgIcon from "@/app/components/Utility/SvgIcon";
import HireForm from "./HireForm";

const ProjectOverview = () => {
  const projectInfo = [
    {
      label: "Category",
      value: "Designing",
    },
    {
      label: "Project size",
      value: "Large",
    },
    {
      label: "Deadline",
      value: "Less then a month",
    },
    {
      label: "What level of experience will it need?",
      value: "Entry",
    },
  ]

  return (
    <div className="lg:w-[70%] flex flex-col gap-6 lg:gap-10">
      <div className="flex flex-col gap-8 rounded-2xl py-6 px-3 md:py-10 md:px-4" style={{ boxShadow: "2px 2px 50px 0px #0000000D" }}>
        <h5 className="text-heading font-semibold text-lg md:text-2xl">Project Overview</h5>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <h6 className="font-semibold text-base md:text-lg text-heading">
                Title
              </h6>
              <p className="text-paragraph text-sm md:text-base">
                Interactive Website Design in Figma
              </p>
            </div>
            <div className="text-paragraph text-sm md:text-base leading-7 flex flex-col gap-4">
              <h6 className="font-semibold text-base md:text-lg text-heading">
                Description
              </h6>
              <div className="flex flex-col gap-2 lg:pr-6">
                <p>We are seeking a talented UI designer to join our team. As a UI designer, you will be responsible for creating visually appealing and user-friendly interfaces for our web and mobile applications. Your main tasks will include wireframing, prototyping, and designing interfaces that align with our brand guidelines and user expectations. You should have a strong understanding of user-centered design principles and be able to translate user requirements into intuitive and aesthetically pleasing designs.</p>
                <p className="pl-4 md:pl-5">Skills Needed :</p>
                <p className="pl-4 md:pl-5">
                  - Proficiency in UI design tools such as Sketch, Figma, or Adobe
                  XD
                </p>
                <p className="pl-4 md:pl-5">- Strong knowledge of UX principles and best practices</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 border-b border-[#DEDEDE]">
            <h6 className="font-semibold text-base md:text-lg text-heading">Attachments</h6>
            <div className="flex gap-2 mb-6">
              <div className="flex items-center gap-2 border border-[#44444414] rounded-md px-3 py-2">
                <div className="bg-gray-200 p-2 md:p-3 rounded-full">
                  <SvgIcon name="File" size={32} />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-heading text-xs md:text-sm">project-details.pdf</h3>
                  <p className="text-paragraph text-[10px] md:text-xs">2.3mb</p>
                </div>
              </div>
              <div className="flex items-center gap-2 border border-[#44444414] rounded-md px-3 py-2">
                <div className="bg-gray-200 p-2 md:p-3 rounded-full">
                  <SvgIcon name="File" size={32} />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-heading text-xs md:text-sm">project-details.pdf</h3>
                  <p className="text-paragraph text-[10px] md:text-xs">2.3mb</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 md:justify-between lg:gap-7 xl:gap-15">
            {projectInfo.map((item, index) => (
              <div key={index} className="flex flex-col gap-3 md:gap-4">
                <h6 className="font-semibold text-base lg:text-lg text-heading">{item.label}</h6>
                <p className="text-paragraph text-sm lg:text-base">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-8 rounded-2xl py-6 pl-2 pr-1.5 md:py-10 md:px-4" style={{ boxShadow: "2px 2px 50px 0px #0000000D" }}>
        <HireForm />
      </div>
    </div>
  );
};

export default ProjectOverview;
