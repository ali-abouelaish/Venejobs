"use client";
import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Routes } from "@/app/routes";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import Button from "@/app/components/button/Button";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "";

function avatarSrc(pic) {
  if (!pic) return null;
  if (pic.startsWith("http")) return pic;
  return `${BASE_URL}${pic.replace(/^\//, "")}`;
}

const ShowDetailsHeader = ({ name, country, profilePicture, userId }) => {
  const router = useRouter();
  const avatar = avatarSrc(profilePicture);

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-center justify-between border-b border-gray-200 pb-6 lg:pb-10">
      {/* Left */}
      <div className="flex items-center gap-8">
        <div className="rounded-full w-[60px] h-[60px] lg:w-[100px] lg:h-[100px] overflow-hidden bg-gray-200 flex items-center justify-center shrink-0">
          {avatar ? (
            <Image
              src={avatar}
              alt={name ?? "Freelancer"}
              width={100}
              height={100}
              className="rounded-full w-[60px] h-[60px] lg:w-[100px] lg:h-[100px] object-cover"
              unoptimized
            />
          ) : (
            <span className="text-2xl font-semibold text-gray-500">
              {(name ?? "?").charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-3 lg:gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-heading text-lg lg:text-2xl font-semibold">
              {name}
            </h2>
            <SvgIcon name="ShareGreen" className="flex lg:hidden" />
          </div>

          <div className="flex gap-1">
            <p className="text-paragraph text-sm font-medium">{country}</p>
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

          <Button
            variant="lightCard"
            className="shadow-[2px_2px_50px_5px_rgba(0,0,0,0.05)]"
            onClick={() => {
              if (userId) {
                router.push(`/client/FreelancerProfile/${userId}`);
              }
            }}
          >
            Preview Public Profile
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
