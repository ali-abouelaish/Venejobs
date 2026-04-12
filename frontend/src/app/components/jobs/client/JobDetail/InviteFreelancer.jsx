"use client";
import { useState } from "react";
import SearchCard from "./InviteFreelancer/SearchCard";
import InvitedFreelancerCard from "./InviteFreelancer/InvitedFreelancerCard";
import SearchFilter from "./SearchFilter";
import JobTabs from "@/app/components/Client/homeUI/JobTabs";

export default function InviteFreelancer() {
  const [showData, setshowData] = useState(0);
  const tabs = [
    { label: "Search", component: <SearchCard /> },
    { label: "Invited Freelancers", component: <InvitedFreelancerCard /> },
    { label: "My Hires", component: <p>My Hires content</p> },
    { label: "Saved (1)", component: <p>Saved content</p> },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <JobTabs tabs={tabs} showData={showData} setshowData={setshowData} />
      </div>
      <SearchFilter />
      <div className="h-auto flex flex-col w-full gap-8 md:gap-10">
        {tabs[showData].component}
      </div>
    </div>
  );
}
