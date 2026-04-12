"use client";

import SvgIcon from "@/app/components/Utility/SvgIcon";
import Button from "@/app/components/button/Button";
import SearchInput from "@/app/components/common/SearchInput";
import FreelancerLayout from "@/app/layout/FreelancerLayout";
import { Routes } from "@/app/routes";
import freelancerApiStore from "@/app/store/freelancerApiStore";
import { useRouter } from "next/navigation";
import React, { lazy, Suspense, useEffect, useState } from "react";

const AllJobs = lazy(
  () => import("../../components/Freelancer/HomeData/AllJobs")
);

export default function Home() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { freelanceDetails, getPersonalDetails, personalDetailLoading } =
    freelancerApiStore();

  useEffect(() => {
    if (!freelanceDetails || Object.keys(freelanceDetails).length === 0) {
      getPersonalDetails();
    }
  }, [freelanceDetails, getPersonalDetails]);

  useEffect(() => {
    if (!personalDetailLoading && freelanceDetails?.freelancerProfile === null) {
      router.replace(Routes.freelancer.home);
    }
  }, [personalDetailLoading, freelanceDetails, router]);

  return (
    <FreelancerLayout>
      <div className=" my-10 lg:my-20 w-full max-w-[90%] sm:max-w-[540px] md:max-w-[720px]  lg:max-w-[960px] xl:max-w-[1240px] 2xl:max-w-[1400px]   mx-auto">
        <div className="flex flex-col gap-10">

          {/* Hero */}
          <div className="rounded-lg p-5 md:px-8 md:py-10 flex flex-col gap-6 bg-[#F8F8FD]">
            <h2 className="text-2xl xl:text-3xl text-heading font-bold">
              Find Projects That Match Your Passion With Venejobs
            </h2>
            <p className="text-gray-500 font-medium">
              Explore hand-picked freelance jobs tailored to your skills.
            </p>

            <Button variant="secondaryFilled">
              Learn More
              <SvgIcon name="NextArrow" />
            </Button>

          </div>

          {/* 🔍 Dynamic Search */}
          <div className="max-w-5xl w-full">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects, skills, keywords..."
            />
          </div>

          {/* Jobs */}
          <Suspense fallback={null}>
            <AllJobs search={search} />
          </Suspense>

        </div>
      </div>
    </FreelancerLayout>
  );
}
