import Image from "next/image";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import ReadMoreBtn from "../../../../button/ReadMoreBtn";

export default function ShortlistCard() {
  const freelancers = [1, 2];
  const skills = ["Landing Page", "Web Design", "Prototype", "UX/UI Design", "JavaScript"];

  return (
    <>
      {freelancers.map((_, i) => (
        <div className="flex flex-col gap-8 md:gap-10" key={i} >
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-15">
            <div className="flex w-full lg:w-[50%] flex-col gap-6">
              {/* title and image */}
              <div className="flex items-center gap-3.5 md:gap-6 w-full md:w-auto">
                <Image
                  src="/freelancer.jpg"
                  alt="Freelancer image"
                  width={64}
                  height={64}
                  className="rounded-full w-15 h-15 md:w-16 md:h-16"
                />
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex flex-row items-center gap-2 lg:gap-4 justify-between">
                    <h3 className="text-lg lg:text-2xl text-heading font-semibold">
                      Alishan Noor
                    </h3>
                    <div className="flex gap-4 items-center">
                      <SvgIcon name="Location" size={18} />
                      <p className="font-medium text-[15px] text-paragraph">
                        United State
                      </p>
                    </div>
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

              {/* buttons [desktop] */}
              <div className="hidden lg:flex items-center mt-2 gap-8 w-full">
                <button className="bg-primary font-semibold p-2 w-[120px] xl:w-[180px] xl:py-4 rounded text-white text-xs md:text-base cursor-pointer">Hire</button>
                <button className="bg-white font-semibold p-2 w-[120px] xl:w-[180px] xl:py-4 rounded text-paragraph text-xs md:text-base cursor-pointer border border-[#FAFAFA]" style={{ boxShadow: "2px 2px 50px 5px #0000000D" }}>
                  Message
                </button>
                <button className="text-primary text-xs md:text-sm flex flex-col items-center gap-2">
                  <SvgIcon name="Like" size={24} />Shortlisted
                </button>
                <button className="text-paragraph text-xs md:text-sm flex flex-col items-center gap-2">
                  <SvgIcon name="Archive" size={24} />Archive
                </button>
              </div>
            </div>
            <div className="w-full lg:w-[50%]">
              {/* job desc */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-row items-center justify-between">
                  <p className="text-heading text-base md:text-lg font-semibold">
                    Cover letter
                  </p>
                  <p className="text-sm md:text-base font-semibold text-heading">
                    Proposed bid: <span className="text-xs md:text-sm font-medium text-paragraph ml-2">$20.00</span>
                  </p>
                </div>
                <ReadMoreBtn text="We are seeking a talented and experienced UI/UX Designer to join our team and help us create a visually stunning and user-friendly mobile app. The ideal candidate will have a strong portfolio showcasing their ability to design intuitive, modern, and engaging interfaces for mobile applications. This project involves designing the entire user experience and interface for a mobile.This project involves designing the entire user experience and interface for a mobile.This project involves designing the entire user experience and interface for a mobile." paragraphFont="font-normal leading-8" font="text-primary text-normal" clampClass="line-clamp-6 lg:line-clamp-4" />
                <div className="flex flex-col md:flex-row mt-2 gap-3 md:gap-7 xl:gap-15">
                  <p className="flex gap-3 text-paragraph text-sm md:text-base font-medium"><SvgIcon name="Premium" size={18} />100% job success</p>
                  <p className="flex gap-3 text-paragraph text-sm md:text-base font-medium"><SvgIcon name="Brifcase" size={18} />3 projects completed</p>
                  <p className="flex gap-3 text-paragraph text-sm md:text-base font-medium"><SvgIcon name="Dollar" size={18} />100k Earned</p>
                </div>
                {/* buttons [mobile] */}
                <div className="lg:hidden flex items-center mt-2 gap-8 w-full">
                  <button className="bg-primary font-semibold p-2 w-[120px] xl:w-[180px] xl:py-4 rounded text-white text-xs md:text-base cursor-pointer">Hire</button>
                  <button className="bg-white font-semibold p-2 w-[120px] xl:w-[180px] xl:py-4 rounded text-paragraph text-xs md:text-base cursor-pointer border border-[#FAFAFA]" style={{ boxShadow: "2px 2px 50px 5px #0000000D" }}>
                    Message
                  </button>
                  <button className="text-primary text-xs md:text-sm flex flex-col items-center gap-2">
                    <SvgIcon name="Like" size={24} />Shortlisted
                  </button>
                  <button className="text-paragraph text-xs md:text-sm flex flex-col items-center gap-2">
                    <SvgIcon name="Archive" size={24} />Archive
                  </button>
                </div>
              </div>
            </div>
          </div>
          {i !== freelancers.length - 1 && <hr className="border-[#44444414]" />}
        </div>
      ))
      }
    </>
  );
}
