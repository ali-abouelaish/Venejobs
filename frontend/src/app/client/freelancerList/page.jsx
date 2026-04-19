"use client";
import { useState, useEffect, useCallback } from "react";
import ClientLayout from "@/app/layout/ClientLayout";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import FreelancerCard from "@/app/components/Client/Freelancers/FreelancerCard";
import FilterSidebar from "@/app/components/Client/Freelancers/FilterSidebar";
import Pagination from "@/app/components/Pagination/Pagination";
import { browseFreelancers } from "@/app/lib/freelancer";

const LIMIT = 10;

export default function FreelancerList() {
  const [freelancers, setFreelancers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchFreelancers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await browseFreelancers(page, LIMIT, skillFilter);
      setFreelancers(res.freelancers ?? []);
      setTotalPages(res.totalPages ?? 1);
    } catch {
      setFreelancers([]);
    } finally {
      setLoading(false);
    }
  }, [page, skillFilter]);

  useEffect(() => {
    fetchFreelancers();
  }, [fetchFreelancers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSkillFilter(searchInput.trim());
  };

  return (
    <ClientLayout>
      <div className="w-full lg:max-w-[960px] xl:max-w-[1240px] 2xl:max-w-[1400px] px-4 lg:px-0 md:mx-auto my-10 lg:my-20">
        <div className="flex flex-col md:gap-8">
          <h2 className="text-2xl md:text-4xl text-heading font-semibold leading-9 mb-6 md:mb-0 px-4 md:px-5">
            Browse freelancers
          </h2>
          <form
            onSubmit={handleSearch}
            className="flex flex-row md:gap-10 gap-5 items-center px-4 md:px-5"
          >
            <div className="w-[90%] md:w-1/2">
              <label htmlFor="search" className="sr-only">
                Search
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 px-4 flex items-center">
                  <SvgIcon name="Search_Icon" />
                </span>
                <input
                  type="search"
                  id="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="block w-full py-3 px-10 md:py-4 rounded-[26px] text-sm text-gray-900 bg-white font-medium border border-gray-100 focus:outline-none"
                  placeholder="Search by skill"
                  style={{ boxShadow: "2px 2px 50px 6px #0000000D" }}
                />
              </div>
            </div>
            <div className="w-[10%] md:w-1/2">
              <button
                type="button"
                className="hidden lg:flex border border-gray-100 bg-white p-2 md:px-11 md:py-4 rounded text-primary text-xs md:text-base items-center gap-4 float-right"
                style={{ boxShadow: "2px 2px 50px 6px #0000000D" }}
              >
                <SvgIcon name="Filter" color="#01237C" />
                Filter
              </button>
              <button
                type="button"
                className="flex float-right lg:hidden border border-[#FAFAFA] bg-white p-3 rounded-full text-primary text-xs items-center gap-2"
                onClick={() => setShowFilters(true)}
                style={{ boxShadow: "2px 2px 50px 6px #0000000D" }}
              >
                <SvgIcon name="Filter" color="#01237C" />
              </button>
            </div>
          </form>
          <div className="h-auto flex flex-col lg:flex-row w-full mt-5 lg:mt-6 gap-3">
            <FilterSidebar
              showFilters={showFilters}
              setShowFilters={setShowFilters}
            />
            <div className="flex flex-col w-full lg:w-[70%] gap-6 lg:gap-10 ml-0 lg:ml-5">
              {loading ? (
                <p className="text-paragraph text-sm px-4">Loading freelancers...</p>
              ) : freelancers.length === 0 ? (
                <p className="text-paragraph text-sm px-4">No freelancers found.</p>
              ) : (
                freelancers.map((f, i) => (
                  <FreelancerCard
                    key={f.id}
                    freelancer={f}
                    index={i}
                    total={freelancers.length}
                  />
                ))
              )}
            </div>
          </div>
          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </div>
      </div>
    </ClientLayout>
  );
}
