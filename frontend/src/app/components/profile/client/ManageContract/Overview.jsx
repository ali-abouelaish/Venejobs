import SvgIcon from "@/app/components/Utility/SvgIcon"
import Image from "next/image"

export default function Overview() {
  return (
    <>
      <div className="flex flex-col gap-10 border-b border-[#44444414] pb-8">
        <h2 className="font-semibold text-lg md:text-[32px] text-blck">Manage Milestone</h2>
        <div className="flex flex-row gap-6">
          <div className="flex flex-col items-center">
            <div className="w-[50px] h-[50px] rounded-full bg-[#F1F2F4] flex items-center justify-center"><SvgIcon name="Check" /></div>
            <div className="border-l border-dashed border-l-[#E9EAEA] h-[30%] md:h-[34%]"></div>
            <div className="w-[50px] h-[50px] rounded-full bg-[#F1F2F4] flex items-center justify-center"><SvgIcon name="Check" /></div>
            <div className="border-l border-dashed border-l-[#E9EAEA] h-[30%] md:h-[34%]"></div>
          </div>
          <div className="flex flex-col gap-15 md:gap-20">
            <div className="flex flex-col gap-4">
              <h6 className="text-heading text-xl md:text-2xl font-semibold">Homepage</h6>
              <div className="flex gap-10">
                <p className="inline-block cursor-pointer overflow-hidden bg-paragraph px-6 py-1.5 font-semibold text-white rounded-full text-xs transition-all duration-300 relative z-10 before:content-[''] before:absolute before:inset-0 before:bg-gray-200 before:-translate-x-full before:transition-transform before:duration-300 before:-z-10 hover:before:translate-x-0">
                  Paid
                </p>
                <p className="text-paragraph text-xs md:text-base font-normal leading-7.5">$500.00</p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <h6 className="text-heading text-xl md:text-2xl font-semibold">Design 3 pages</h6>
              <div className="flex gap-10">
                <p className="inline-block cursor-pointer overflow-hidden bg-secondary px-2.25 py-1.5 font-semibold text-white rounded-full text-xs transition-all duration-300 relative z-10 before:content-[''] before:absolute before:inset-0 before:bg-gray-200 before:-translate-x-full before:transition-transform before:duration-300 before:-z-10 hover:before:translate-x-0">
                  Active & Funded
                </p>
                <p className="text-paragraph text-xs md:text-base font-normal leading-7.5">$500.00</p>
              </div>
              <button className="bg-primary font-semibold w-[150px] lg:w-[180px] py-3.5 rounded text-white text-xs md:text-base mt-4 cursor-pointer">Release amount</button>
            </div>
          </div>
        </div>
        <div className="flex gap-6 items-center">
          <div className="w-[50px] h-[50px] rounded-full bg-[#F1F2F4] flex items-center justify-center"><Image src="/icons/plus.png" width={17.25} height={17.25} alt="Card image" /></div>

          <h2 className="font-medium text-primary text-lg md:text-2xl">
            Add New Milestone
          </h2>
        </div>
      </div >
    </>
  )
}