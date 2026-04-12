"use client";
import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Routes } from "@/app/routes";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import Button from "@/app/components/button/Button";

const ShowDetailsHeader = ({ name, country }) => {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-center justify-between border-b border-gray-200 pb-6 lg:pb-10">
      {/* Left */}
      <div className="flex items-center gap-8">
        <Image
          src="/freelancer.jpg"
          alt="Freelancer image"
          width={100}
          height={100}
          className="rounded-full w-[60px] h-[60px] lg:w-[100px] lg:h-[100px]"
        />
        <div className="flex flex-col gap-3 lg:gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-heading text-lg lg:text-2xl font-semibold">
              {name}
            </h2>
            <SvgIcon name="ShareGreen" className="flex lg:hidden" />
          </div>

          <div className="flex gap-1">
            <p className="text-paragraph text-sm font-medium">{country}</p>
            <p className="text-paragraph text-sm font-medium">
              – 8:10 am local time
            </p>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-6">
          <Button
            variant="secondaryFilled"
            onClick={() => router.push(Routes.freelancer.profile.home)}
          >
            Profile Settings
          </Button>

          {/* Find Jobs */}
          <Button
            variant="lightCard"
            className="shadow-[2px_2px_50px_5px_rgba(0,0,0,0.05)]"
            onClick={() => router.push(Routes.freelancer.page)}
          >
            Find Jobs
          </Button>
        </div>

        <div className="hidden lg:flex justify-end items-center gap-4">
          <SvgIcon name="ShareGreen" />
          <p className="text-secondary font-medium">Share</p>
        </div>
      </div>
    </div>
  );
};

export default ShowDetailsHeader;
