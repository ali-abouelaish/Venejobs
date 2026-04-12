import SvgIcon from "@/app/components/Utility/SvgIcon";
export default function SearchFilter() {
  return (
    <div className="flex flex-row md:gap-10 mb-2 gap-5 items-center">
      <div className="w-[90%] lg:w-[45%]">
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
            className="block w-full py-3 px-10 md:py-4 rounded-[26px] text-sm text-gray-900 bg-white font-medium border border-gray-100 focus:outline-none"
            placeholder="Search" required style={{ boxShadow: "2px 2px 50px 6px #0000000D" }} />
        </div>
      </div>
      <div className="w-[10%] lg:w-1/2">
        <button className="hidden lg:flex border border-gray-100 bg-white p-2 md:px-11 md:py-4 rounded text-primary text-xs md:text-base items-center gap-4 float-right" style={{ boxShadow: "2px 2px 50px 6px #0000000D" }} >
          <SvgIcon name="Filter" color="#01237C" />Filter
        </button>
        <button
          className="flex float-right lg:hidden border border-[#FAFAFA] bg-white p-3 rounded-full text-primary text-xs items-center gap-2"
          style={{ boxShadow: "2px 2px 50px 6px #0000000D" }}>
          <SvgIcon name="Filter" color="#01237C" />
        </button>
      </div>
    </div>
  );
}