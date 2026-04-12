import Image from "next/image";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import ReadMoreBtn from "../../button/ReadMoreBtn";

export default function FreelancerCard({ index, total }) {

  const skills = [
    "Landing Page",
    "Web Design",
    "Prototype",
    "UX/UI Design",
    "JavaScript",
  ];

  return (
    <div
      className="flex flex-col gap-4"
    >
      {/* title and image */}
      <div className="flex items-center gap-6 w-full lg:w-auto justify-between">
        <div className="flex items-center gap-3 md:gap-6 w-full md:w-auto">
          <Image
            src="/freelancer.jpg"
            alt="Freelancer image"
            width={60}
            height={60}
            className="rounded-full w-15 h-15 md:w-16 md:h-16"
          />
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-row items-center gap-2 lg:gap-4">
              <h3 className="text-lg lg:text-2xl text-heading font-semibold">
                Alishan Noor
              </h3>
            </div>
            <p className="text-paragraph text-sm lg:text-base font-normal">
              UX/UI Designer | Expert in Website | App | Software | Figma
            </p>

            <div className="flex flex-row items-center gap-10">
              <p className="text-heading text-sm lg:text-base font-semibold">
                100k Earned&nbsp;
              </p>
              <p className="flex gap-4 text-sm text-paragraph lg:text-[15px] font-medium">
                <SvgIcon name="Star" /> 5.0 (1 Review)
              </p>
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6 w-full md:w-auto">
          <button
            className="border border-[#FAFAFA] bg-white p-1 md:p-2 rounded-full text-primary text-xs md:text-base flex items-center gap-4 float-right"
            style={{ boxShadow: "2px 2px 50px 6px #0000000D" }}
          >
            <SvgIcon name="Heart" />
          </button>
          <button className="bg-primary p-2 md:px-8 md:py-2 rounded text-white text-xs md:text-base font-semibold cursor-pointer">
            Invite
          </button>
        </div>
      </div>

      {/* job desc */}
      <div className="flex flex-col gap-3 lg:mt-2">
        <ReadMoreBtn
          text="We are seeking a talented and experienced UI/UX Designer to join our team and help us create a visually stunning and user-friendly mobile app. The ideal candidate will have a strong portfolio showcasing their ability to design intuitive, modern, and engaging interfaces for mobile applications. This project involves designing the entire user experience and interface for a mobile.This project involves designing the entire user experience and interface for a mobile.This project involves designing the entire user experience and interface for a mobile."
          font="text-primary text-normal"
        />
      </div>

      {/*category and skills */}
      <div className="flex items-center gap-3 flex-wrap mt-2">
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
      <div className="pt-4 flex md:hidden items-center gap-6 w-full">
        <button className="bg-primary px-8 py-2 rounded text-white text-sm md:text-base font-semibold cursor-pointer">
          Invite
        </button>
        <button
          className="border border-[#FAFAFA] bg-white p-1 md:p-2 rounded-full text-primary text-xs md:text-base flex items-center gap-4 float-right"
          style={{ boxShadow: "2px 2px 50px 6px #0000000D" }}
        >
          <SvgIcon name="Heart" />
        </button>
      </div>
      {index !== total - 1 && (
        <hr className="border-[#44444414] mt-4 lg:mt-6" />
      )}
    </div>
  );
}
