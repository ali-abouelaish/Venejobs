"use client";
import Loader from "@/app/components/common/Loader";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import FreelancerLayout from "@/app/layout/FreelancerLayout";
import { Routes } from "@/app/routes.js";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const AddService = () => {

  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
  };

  return (
    <FreelancerLayout>
      <div className="w-full max-w-[90%] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1240px] 2xl:max-w-[1400px] mx-auto my-10 lg:my-20">
        <div className="flex gap-15 lg:gap-20 flex-col-reverse lg:flex-row">
          <div className="flex flex-col gap-6 w-full">
            <h2 className="text-2xl lg:text-3xl xl:text-[44px] text-heading font-semibold leading-tight">
              Showcase Your Expertise and Grow Your Service Reach
            </h2>
            <p className="text-paragraph text-base xl:text-lg font-normal leading-7 lg:leading-8 tracking-wide">
              Empower your business by presenting clear, high-value services that attract the right clients and increase conversions across your niche.
            </p>

            <Link
              href={Routes.freelancer.service.form}
              onClick={handleClick}
              className={`bg-secondary text-white text-center w-auto md:w-76
              font-semibold tracking-wide text-sm xl:text-base flex items-center justify-center rounded py-4.5 mt-4
              transition-all duration-300 gap-3
              ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {loading ? (
                <Loader size={18} border={3} color="white" />
              ) : (
                <>
                  Post Your First New Service<SvgIcon name="NextArrow" />
                </>
              )}
            </Link>
          </div>
          <div className="flex flex-col w-full items-center">
            <Image src="/service/PostService.png" alt="Freelancer image"
              width={530}
              height={300}
              className="w-75 h-75 md:w-100 md:h-100 lg:w-134 lg:h-125"
            />
          </div>
        </div>
      </div>
    </FreelancerLayout>
  );
};

export default AddService;
