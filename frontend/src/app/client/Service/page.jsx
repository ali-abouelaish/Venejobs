import ClientLayout from "@/app/layout/ClientLayout";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import ServiceCard from "@/app/components/Client/Service/ServiceCard";

export default function Service() {
  return (
    <>
      <ClientLayout>
        <div className="w-full max-w-[90%] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1240px] 2xl:max-w-[1400px] mx-auto my-10 lg:my-20">
          <div className="flex flex-col gap-8 mb-15">
            <div className="w-full md:w-[70%] lg:w-[45%]">
              <label
                htmlFor="search"
                className="block mb-2.5 text-sm font-medium text-heading sr-only "
              >
                Search
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 px-4   flex items-center  ">
                  <SvgIcon name="Search_Icon" />
                </span>
                <input type="search" id="search"
                  className="block w-full py-3 px-10 md:py-4 rounded-[26px] text-xs text-paragraph bg-white placeholder:text-paragraph font-medium border border-gray-100 focus:outline-none"
                  placeholder="Landing page Design" required style={{ boxShadow: "2px 2px 50px 6px #0000000D" }} />
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
              <span className="text-lg text-secondary font-semibold">Related:</span><p className="font-medium text-base text-paragraph">Website Design, App Design, Dashboard Design, UXUI Design,</p>
            </div>
            <h1 className="text-heading text-[32px] font-semibold my-2">Results for "Landing page Design"</h1>
            <div className="w-full flex flex-row flex-wrap gap-6">
              <div className="relative">
                <select className="w-full appearance-none border border-[#DFDFDF] bg-white px-4 py-2 pr-15 md:pr-15 md:px-8 md:py-3 rounded-full text-sm md:text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-black">
                  <option>Category</option>
                </select>
                <svg className="w-4 h-4 absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-gray-800"
                  fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"> <path d="M6 9l6 6 6-6" /> </svg>
              </div>
              <div className="relative">
                <select className="w-full appearance-none border border-[#DFDFDF] bg-white px-4 py-2 pr-15 md:pr-15 md:px-8 md:py-3 rounded-full text-sm md:text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-black">
                  <option>Budget</option>
                </select>
                <svg className="w-4 h-4 absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-gray-800"
                  fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"> <path d="M6 9l6 6 6-6" /> </svg>
              </div>
              <div className="relative">
                <select className="w-full appearance-none border border-[#DFDFDF] bg-white px-4 py-2 pr-15 md:pr-15 md:px-8 md:py-3 rounded-full text-sm md:text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-black">
                  <option>Delivery Time</option>
                </select>
                <svg className="w-4 h-4 absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-gray-800"
                  fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"> <path d="M6 9l6 6 6-6" /> </svg>
              </div>
              <div className="relative">
                <select className="w-full appearance-none border border-[#DFDFDF] bg-white px-4 py-2 pr-15 md:pr-15 md:px-8 md:py-3 rounded-full text-sm md:text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-black">
                  <option>Freelancer Rating</option>
                </select>
                <svg className="w-4 h-4 absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-gray-800"
                  fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"> <path d="M6 9l6 6 6-6" /> </svg>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xl font-semibold text-paragraph mb-10">Showing <span className="text-heading">1,247</span> services</p>
            <ServiceCard />
          </div>
        </div>
      </ClientLayout>
    </>
  );
}
