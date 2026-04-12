import Link from "next/link";
import { Routes } from "@/app/routes";
import React, { lazy, Suspense } from "react";
import JobCardSkeleton from "../../Skeletons/JobCardSkeleton";

const JobCard = lazy(() => import("./JobCard"));

export default function JobsList({ jobs, loading, hasFetched }) {

  if (!hasFetched) {
    return (
      <div className="space-y-6 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    );
  }


  if (hasFetched && (!jobs || jobs.length === 0)) {
    return (
      <div className="flex justify-center mt-12">
        <div className="px-6 py-8 text-center max-w-xl w-full">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
            No Jobs Posted Yet
          </h2>
          <p className="text-gray-500 mt-2">
            You haven't created any job posts yet.
          </p>
          <Link
            href={Routes.client.job_post.home}
            className=" mt-5 bg-primary text-white w-40 sm:min-w-[190px] md:min-w-50 mx-auto
    h-[50px] sm:h-[52px] md:h-14  font-semibold tracking-wide text-sm xl:text-base flex items-center justify-center rounded 
              transition-all duration-300 gap-2"
          >
            Post a Job
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <div className="space-y-6 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        {jobs.map((item) => (
          <JobCard key={item.id} item={item} />
        ))}
      </Suspense>
    </div>
  );

}
