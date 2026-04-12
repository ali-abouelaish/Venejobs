"use client";

import Link from "next/link";
import { Routes } from "../routes";
import userApiStore from "@/app/store/userStore";
import { useEffect, useState } from "react";
import SvgIcon from "../components/Utility/SvgIcon";
import FreelancerLayout from "../layout/FreelancerLayout";
import Loader from "../components/common/Loader";
import { useRouter } from "next/navigation";
import Button from "../components/button/Button";
import freelancerApiStore from "../store/freelancerApiStore";

export default function Page() {
  const { user } = userApiStore();
  const { freelanceDetails, personalDetailLoading, getPersonalDetails } =
    freelancerApiStore();

  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPersonalDetails();
  }, []);

  const handleStart = () => {
    if (personalDetailLoading) return;

    setLoading(true);

    const completed =
      freelanceDetails?.freelancerProfile?.profile_completed;

    if (completed) {
      router.push(Routes.freelancer.page);
    } else {
      router.push(Routes.freelancer.get_started);
    }
  };

  const userName =
    user?.name?.charAt(0).toUpperCase() + user?.name?.slice(1) || "";

  return (
    <FreelancerLayout>
      <div className="w-full max-w-[90%] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1240px] 2xl:max-w-[1400px] mx-auto my-10 lg:my-20">
        <div className="flex flex-col gap-5 lg:gap-6">
          <h1 className="font-bold text-3xl lg:text-4xl xl:text-5xl leading-10 lg:leading-snug tracking-normal max-w-4xl">
            Welcome, {userName}! <br />
            Find the best freelance jobs on Venezuelan and boost your career.
          </h1>

          <p className="text-gray-500 text-base 2xl:text-lg font-medium leading-7 lg:leading-8 tracking-wide w-full lg:max-w-5xl">
            Explore high-quality projects from top clients on Venezuelan.
          </p>

          <Button
            variant="secondaryFilled"
            isLoading={loading || personalDetailLoading}
            icon={!loading && !personalDetailLoading && (
              <SvgIcon name="RightArrWhite" />
            )}
            onClick={handleStart}
          >
            Get Started
          </Button>
        </div>
      </div>
    </FreelancerLayout>
  );
}