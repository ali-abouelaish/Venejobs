"use client";
import JobSearch from "@/app/components/jobs/freelancer/JobSearch";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import FreelancerLayout from "@/app/layout/FreelancerLayout";

export default function jobSearch() {
  return (
    <>
      <FreelancerLayout>
        <div className="px-4 md:p-5 w-full max-w-[1420px] mb-20 mt-30 sm:mx-auto">
          <div className="flex flex-row md:gap-10 gap-5 items-center">
            <div className="w-full">
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
                <input
                  type="search"
                  id="search"
                  className="block w-full py-3 px-10 md:py-4 rounded-[26px] text-sm text-gray-900 bg-white font-medium border border-gray-100"
                  placeholder="Search"
                  required
                  style={{ boxShadow: "2px 2px 50px 6px #0000000D" }}
                />
              </div>
            </div>
            <div>
              <button className="bg-secondary p-2 md:px-10 md:py-3 rounded text-white text-xs md:text-sm flex items-center gap-1">
                Search
              </button>
            </div>
          </div>

          <div className="h-auto flex flex-col md:flex-row w-full mt-5 md:mt-14 gap-3">
            <JobSearch />
          </div>
        </div>
      </FreelancerLayout>
    </>
  );
}
