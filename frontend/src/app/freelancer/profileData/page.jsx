"use client";

import React, { useEffect, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import FreelancerLayout from "@/app/layout/FreelancerLayout";
import ShowDetailsWrapper from "@/app/components/Freelancer/ShowProfileDetails/ShowDetailsWrapper";
import freelancerApiStore from "@/app/store/freelancerApiStore";
import { Routes } from "@/app/routes";
import PageLoader from "@/app/components/common/PageLoader";

/* Lazy imports */
const ShowDetailsHeader = lazy(
  () =>
    import("@/app/components/Freelancer/ShowProfileDetails/ShowDetailsHeader"),
);
const LeftPanel = lazy(
  () => import("@/app/components/Freelancer/ShowProfileDetails/LeftPanel"),
);
const RightPanel = lazy(
  () => import("@/app/components/Freelancer/ShowProfileDetails/RightPanel"),
);
const BottomPanel = lazy(
  () => import("@/app/components/Freelancer/ShowProfileDetails/BottomPanel"),
);

export default function Page() {
  const router = useRouter();

  const { freelanceDetails, getPersonalDetails, personalDetailLoading } =
    freelancerApiStore();

  const { name, country } = freelanceDetails || {};
  const { freelancerProfile } = freelanceDetails || {};

  // fetch only once
  useEffect(() => {
    if (!freelanceDetails || Object.keys(freelanceDetails).length === 0) {
      getPersonalDetails();
    }
  }, [freelanceDetails, getPersonalDetails]);

  // redirect guard
  useEffect(() => {
    if (
      !personalDetailLoading &&
      freelanceDetails?.freelancerProfile === null
    ) {
      router.replace(Routes.freelancer.page);
    }
  }, [personalDetailLoading, freelanceDetails, router]);

  // single loader
  // if (personalDetailLoading || !freelanceDetails) {
  //   return (
  //     <FreelancerLayout>
  //       <ShowDetailsWrapper>
  //         <PageLoader />
  //       </ShowDetailsWrapper>
  //     </FreelancerLayout>
  //   );
  // }

  return (
    <FreelancerLayout>
      <ShowDetailsWrapper>
        <Suspense fallback={null}>
          <ShowDetailsHeader name={name} country={country} />
          <div className="flex flex-col lg:flex-row border-b border-gray-200">
            {/* LEFT */}
            <div className="w-full lg:w-[30%] lg:border-r border-gray-200">
              <LeftPanel />
            </div>

            {/* RIGHT */}
            <div className="w-full lg:w-[70%] lg:pl-6">
              <RightPanel />
            </div>
          </div>

          {/* BOTTOM */}
          <BottomPanel />
        </Suspense>
      </ShowDetailsWrapper>
    </FreelancerLayout>
  );
}
