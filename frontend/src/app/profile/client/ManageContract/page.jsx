"use client";
import { useState } from "react";
import ClientDetail from "@/app/components/profile/client/ManageContract/ClientDetail";
import ClientLayout from "@/app/layout/ClientLayout";
// import JobTabs from "@/app/components/homeUI/JobTabs";
import Overview from "@/app/components/profile/client/ManageContract/Overview";

export default function ManageContract() {
  const [showData, setshowData] = useState(0);
  const tabs = [
    { label: "Overview", component: <Overview /> },
    { label: "Contract Details", component: <p>Contract Details content</p> },
  ];
  return (
    <>
      <ClientLayout>
        <div className="flex flex-col gap-8 w-full max-w-[90%] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1240px] 2xl:max-w-[1400px] mx-auto my-10 lg:my-20">
          <ClientDetail />
          <div className="flex flex-col gap-8">
            <div>
              {/* <JobTabs tabs={tabs} showData={showData} setshowData={setshowData} /> */}
            </div>
            <div className="h-auto flex flex-col w-full gap-8 md:gap-10">
              {tabs[showData].component}
            </div>
          </div>
        </div>
      </ClientLayout>
    </>
  );
}
