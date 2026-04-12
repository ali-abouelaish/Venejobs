"use client";
import Link from "next/link";
import { Routes } from "@/app/routes.js";
import { useState } from "react";
import { useRouter } from "next/navigation";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import Loader from "../../common/Loader";
import Button from "../../button/Button";

export default function HeaderSection({ name }) {
  const [loadingBtn, setLoadingBtn] = useState(null);
  const router = useRouter();

  const handleClick = (type) => {
    setLoadingBtn(type);
  };

  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
      {/* Left: Welcome Text */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl lg:text-3xl xl:text-[44px] text-heading font-bold leading-snug">
          Welcome, {name ? name.charAt(0).toUpperCase() + name.slice(1) : ""}
        </h1>

        <p className="text-gray-500 text-base xl:text-lg font-normal leading-7 lg:leading-8 tracking-wide">
          Here's what's happening with your projects today. Ready to find top
          talent?
        </p>
      </div>

      {/* Right: Buttons */}
      <div className="flex items-center justify-end gap-4 md:gap-6 lg:gap-8">
        <Button
          onClick={() => {
            handleClick("post");
            router.push(Routes.client.job_post.home);
          }}
          disabled={loadingBtn === "post"}
          variant="primaryOutlined"
        >
          {loadingBtn === "post" ? (
            <Loader size={18} border={3} color="white" />
          ) : (
            <>
              Post a Job
              <SvgIcon name="RightArrWhite" />
            </>
          )}
        </Button>


        {/* Find Talent */}
        <Button
          onClick={() => handleClick("talent")}
          disabled={loadingBtn === "talent"}
          variant="lightCard"
        >
          {loadingBtn === "talent" ? (
            <Loader size={18} border={3} color="black" />
          ) : (
            "Find Talent"
          )}
        </Button>


      </div>
    </div>
  );
}
