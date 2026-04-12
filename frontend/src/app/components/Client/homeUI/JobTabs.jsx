import { useRef, useLayoutEffect, useState } from "react";

export default function JobTabs({ tabs, showData, setshowData }) {
  const tabRefs = useRef([]);
  const [indicatorStyle, setIndicatorStyle] = useState({
    width: 0,
    left: 0,
  });

  useLayoutEffect(() => {
    const currentTab = tabRefs.current[showData];

    if (currentTab) {
      setIndicatorStyle({
        width: currentTab.offsetWidth + 5,
        left: currentTab.offsetLeft,
      });
    }
  }, [showData, tabs]);

  return (
    <>
      {/* Tabs */}
      <div className="relative">
        <div className="flex gap-5 md:gap-15 justify-start">
          {tabs.map((tab, index) => (
            <button
              key={index}
              ref={(el) => (tabRefs.current[index] = el)}
              onClick={() => setshowData(index)}
            >
              <p
                className={`cursor-pointer text-sm md:text-base tracking-wide pb-2
                                ${showData === index ? "text-blue-900 font-bold" : "text-paragraph font-medium "}`}
              >
                {tab.label}
              </p>
            </button>
          ))}
        </div>

        {/* HR */}
        <hr className="border-[#44444414] mt-1" />

        {/* Underline */}
        <div
          className="absolute bottom-0 h-0.5 bg-blue-900 transition-all duration-300"
          style={indicatorStyle}
        />
      </div>
    </>
  );
}
