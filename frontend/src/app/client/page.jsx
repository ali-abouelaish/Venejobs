"use client";

import { useState } from "react";
import userApiStore from "../store/userStore";
import ClientLayout from "../layout/ClientLayout";
import HeaderSection from "@/app/components/Client/homeUI/HeaderSection";
import JobTabs from "@/app/components/Client/homeUI/JobTabs";
import JobContent from "@/app/components/Client/homeUI/JobContent";

export default function Home() {
  const [showData, setshowData] = useState(0);
  const tabs = [{ label: "All job posts" }, { label: "Your Active Contracts" }];
  const name = userApiStore((s) => s.user?.name || "");

  return (
    <ClientLayout>
      <div className="w-full max-w-[90%] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1240px] 2xl:max-w-[1400px] mx-auto my-10 lg:my-20">
        <div className="flex flex-col gap-6 lg:gap-10">

          <HeaderSection name={name} />

          <div className="flex flex-col gap-6 lg:gap-10">
            <h2 className="text-xl md:text-2xl text-heading font-semibold leading-9">
              Your Job Posts & Active Contracts
            </h2>

            <div className="">
              <JobTabs tabs={tabs} showData={showData} setshowData={setshowData} />

              <JobContent showData={showData} />
            </div>

          </div>

        </div>
      </div>
    </ClientLayout>
  );
}
