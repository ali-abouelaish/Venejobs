"use client";
import { useState } from "react";
import ProjectSummary from "@/app/components/profile/client/Feedback/ProjectSummary";
import ClientLayout from "@/app/layout/ClientLayout";
import Overview from "@/app/components/profile/client/ManageContract/Overview";

export default function Feedback() {
  const [showData, setshowData] = useState(0);
  const tabs = [
    { label: "Overview", component: <Overview /> },
    { label: "Contract Details", component: <p>Contract Details content</p> },
  ];
  return (
    <>
      <ClientLayout>
        <div className="flex flex-col gap-10 w-full max-w-[90%] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1240px] 2xl:max-w-[1400px] mx-auto my-10 lg:my-20">
          <ProjectSummary />
          <div className="flex flex-col gap-10 mt-5">
            <h3 className="text-2xl lg:text-[32px] text-heading font-semibold">Would you recommend this freelancer to others?</h3>
            <div className="flex flex-row gap-4 md:gap-8 flex-wrap">
              {[...Array(10)].map((_, i) => {
                const value = i + 1
                return (
                  <label key={value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="rating"
                      value={value}
                      defaultChecked={value === 6}
                      className="sr-only peer" />
                    <span
                      className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full border font-semibold
            text-sm lg:text-[13px] bg-white text-paragraph transition peer-checked:bg-primary peer-checked:text-white peer-checked:border-primary"
                    >
                      {value}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
          <div className="flex flex-col gap-10">
            <h3 className="text-2xl lg:text-[32px] text-black font-semibold">Rating</h3>
            <div className="flex flex-col gap-8">
              {[
                { label: "Overall Rating:", defaultValue: 4, score: "5.00" },
                { label: "Quality of Work:", defaultValue: 5, score: "5.00" },
                { label: "Communication:", defaultValue: 3, score: "4.50" },
                { label: "Adherence to Deadlines:", defaultValue: 3, score: "4.50" },
                { label: "Value for Money:", defaultValue: 2, score: "4.50" },
              ].map(({ label, defaultValue, score }) => (
                <div key={label} className="flex flex-row gap-8 items-center">
                  <p className="md:w-55 text-heading text-lg font-semibold">{label}</p>
                  <div className="flex flex-row gap-7.5 items-center">
                    <div className="flex gap-1 md:gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <label key={value} className="cursor-pointer">
                          <input
                            type="radio"
                            name={`${label}-rating`}
                            value={value}
                            defaultChecked={value === defaultValue}
                            className="sr-only peer"
                          />
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            className="
                  w-6 h-6
                  fill-gray-300
                  transition-colors
                  peer-checked:fill-[#FFC107]
                  peer-checked:[&~svg]:fill-[#FFC107]
                  hover:fill-[#FFC107]
                "
                          >
                            <path d="M12 17.3l-6.18 3.64 1.64-7.03L2 9.24l7.19-.61L12 2l2.81 6.63 7.19.61-5.46 4.67 1.64 7.03z" />
                          </svg>
                        </label>
                      ))}
                    </div>
                    {score && (
                      <p className="text-paragraph text-xs md:text-sm font-medium">
                        {score}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h3 className="text-2xl text-heading font-semibold">Feedback:</h3>
            <textarea
              placeholder="Alex did an excellent job creating and executing our social media marketing campaign. The quality of the work was top-notch, and the deliverables exceeded our expectations. Communication could be improved slightly in terms of response time, but overall, I am very satisfied."
              className="w-full h-35 p-4 border border-[#F5F5F5] rounded-lg text-paragraph text-base lg:text-lg font-normal lg:placeholder:text-lg placeholder:text-paragraph focus:border-primary outline-none resize-none"
            ></textarea>
          </div>
          <div className="">
            <button className="bg-primary font-semibold w-[150px] lg:w-[180px] py-4.5 rounded text-white text-xs md:text-base cursor-pointer">Submit Feedback</button>
          </div>
        </div>
      </ClientLayout>
    </>
  );
}
