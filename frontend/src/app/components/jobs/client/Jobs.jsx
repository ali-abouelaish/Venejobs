"use client";

import { useEffect, useState } from "react";
import jobApiStore from "@/app/store/jobStore";
import JobsList from "./JobsList";
import Pagination from "@/app/components/Pagination/Pagination";

export default function Jobs() {
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const { jobs, totalpagenum, fetchJobsByUser, loading, hasFetched } =
    jobApiStore();
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    fetchJobsByUser(page, limit);
  }, [page]);


  return (
    <div className="rounded-[20px] border border-[rgba(68,68,68,0.08)] w-full mx-auto">
      <div className={`${loading ? "opacity-50 pointer-events-none" : ""}`}>
        <JobsList
          jobs={jobs}
          loading={loading}
          hasFetched={hasFetched}
        />
      </div>


      <div className="min-h-[72px]">
        {hasFetched && jobs?.length > 0 && (
          <Pagination
            page={page}
            totalPages={totalpagenum}
            onPageChange={setPage}
            jobs={jobs}
          />
        )}
      </div>

    </div>

  );
}
