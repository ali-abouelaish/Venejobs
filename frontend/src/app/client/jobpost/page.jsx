"use client";
import { useRouter } from "next/navigation";
import { Routes } from "@/app/routes.js";
import userApiStore from "@/app/store/userStore";
import ClientLayout from "@/app/layout/ClientLayout";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import { useState } from "react";
import Loader from "@/app/components/common/Loader";
import Button from "@/app/components/button/Button";

export default function Jobpost() {
  const { user } = userApiStore();
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
  };

  return (
    <>
      <ClientLayout>
        <div className="w-full max-w-[90%] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1240px] 2xl:max-w-[1400px] mx-auto my-10 lg:my-20">
          <div className="flex flex-col gap-5 lg:gap-6">
            <h1 className="text-heading font-bold text-3xl lg:text-4xl xl:text-5xl leading-10 lg:leading-snug tracking-normal max-w-4xl">
              Welcome {user?.name}! <br />
              Let’s post your job and find the best Venezuelan talent.
            </h1>

            <p className="text-gray-500 text-base xl:text-lg 2xl:text-lg font-normal leading-7 lg:leading-8 tracking-wide w-full lg:max-w-5xl">
              Post your job and connect with exceptional Venezuelan talent. From
              creative minds to skilled professionals, find the perfect match to
              achieve outstanding results.
            </p>

            <Button
              onClick={() => {
                handleClick();
                router.push(Routes.client.job_post.form);
              }}
              disabled={loading}
              variant="primaryOutlined"
            >
              {loading ? (
                <Loader size={18} border={3} color="white" />
              ) : (
                <>
                  Post a Job
                  <SvgIcon name="RightArrWhite" />
                </>
              )}
            </Button>

          </div>
        </div>
      </ClientLayout>
    </>
  );
}
