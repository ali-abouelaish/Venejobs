import Image from "next/image";
import SvgIcon from "@/app/components/Utility/SvgIcon";

const FreelancerDetail = () => {
  return (
    <div className="w-full lg:w-[30%]">
      <div className="flex flex-col gap-8 pl-2 pr-1.5 py-4 md:py-6 md:px-4 rounded-lg" style={{ boxShadow: "2px 2px 50px 6px #0000000D" }}>
        {/* title and image */}
        <div className="flex flex-col gap-6 md:gap-4">
          <div className="flex items-center gap-3.5 w-full md:w-auto">
            <Image src="/freelancer.jpg" alt="Freelancer image"
              width={64}
              height={64}
              className="rounded-full w-15 h-15 cursor-pointer"
            />
            <div className="flex flex-col gap-3">
              <div className="flex flex-row items-center gap-2 md:gap-4 cursor-pointer">
                <h3 className="text-lg text-heading font-semibold">
                  Alishan Noor
                </h3>
              </div>
              <p className="text-paragraph text-sm font-normal">
                UX/UI Designer | Expert in Website|Software...
              </p>

              <div className="flex flex-row items-center gap-10">
                <p className="text-heading text-sm font-semibold">
                  100k Earned&nbsp;
                </p>
                <p className="flex gap-4 text-paragraph text-sm font-medium">
                  <SvgIcon name="Star" /> 5.0 (1 Review)
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 md:gap-6">
            <p className="text-paragraph text-base font-semibold">
              Has 13 relevant skills to your job
            </p>
            <p className="text-paragraph text-[15px] font-medium">
              – 8:10 am local time
            </p>
          </div>
        </div>

        {/* buttons [desktop] */}
        <div className="pb-2 md:pb-0">
          <button className="bg-white font-semibold rounded text-primary text-base cursor-pointer border border-primary px-4.5 py-1.75" style={{ boxShadow: "2px 2px 50px 5px #0000000D" }}>
            Message
          </button>
        </div>
      </div>
    </div>
  );
};

export default FreelancerDetail;
