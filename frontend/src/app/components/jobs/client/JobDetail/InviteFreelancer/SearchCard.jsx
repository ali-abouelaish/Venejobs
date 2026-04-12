import Image from "next/image";
import SvgIcon from "@/app/components/Utility/SvgIcon";

export default function SearchCard() {
  const freelancers = [1, 2];
  const skills = ["Landing Page", "Web Design", "Prototype", "UX/UI Design", "JavaScript"];

  return (
    <>
      {freelancers.map((_, i) => (
        <div key={i} className="flex flex-col lg:flex-row gap-8 pl-3 md:pl-6 p-4 md:p-8 border rounded-lg justify-between border-[#E9E9E9]" style={{ boxShadow: "0px 1px 2px 0px #1018280D" }}>
          {/* title and image */}
          <div className="flex flex-col gap-6 md:gap-8 lg:w-[70%] w-auto">
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
            {/*category and skills */}
            <div className="flex items-center gap-3 flex-wrap">
              {skills.map((skill, index) => (
                <p className="text-sm lg:text-base cursor-pointer
                    relative overflow-hidden
                    bg-[#FAFAFA] px-4 py-2 font-medium text-paragraph rounded-full
                    transition-all duration-300
                    before:content-[''] before:absolute before:inset-0
                    before:bg-gray-200 before:-translate-x-full before:transition-transform before:duration-300
                    before:-z-10
                    hover:before:translate-x-0
                    z-10" key={index}>
                  {skill}
                </p>
              ))}
            </div>
          </div>
          {/*buttons */}
          <div className="flex items-start gap-4 w-full md:w-auto">
            <button className="order-3 md:order-1 border border-[#FAFAFA] bg-white p-1 md:p-2 rounded-full text-primary text-xs md:text-base flex items-center gap-4 float-right" style={{ boxShadow: "2px 2px 50px 6px #0000000D" }}>
              <SvgIcon name="Heart" />
            </button>
            <button className="order-1 md:order-2 bg-primary px-8 py-1.75 rounded border text-white text-base font-semibold cursor-pointer">Invite</button>
            <button className="order-2 md:order-3 px-8 py-1.75 rounded text-primary border border-primary text-base font-semibold cursor-pointer">Hire</button>
          </div>
        </div>
      ))
      }
    </>
  );
}
