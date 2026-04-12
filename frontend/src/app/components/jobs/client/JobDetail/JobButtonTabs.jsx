export default function JobButtonTabs({ tabs, tabGap = "6", showData, setshowData }) {
  return (
    <div className={`flex gap-2 md:gap-${tabGap} justify-start lg:px-6 py-5 flex-wrap md:flex-nowrap`} style={{ boxShadow: "2px 2px 50px 4px #00000005" }}>
      {tabs.map((tab) => {
        const isActive = showData === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setshowData(tab.id)}
            className={`cursor-pointer rounded w-auto md:w-full md:max-w-[320px] p-2 lg:py-4 border border-[#FAFAFA]
              ${isActive ? "bg-primary" : "bg-white"}`}
          >
            <p
              className={`font-semibold text-[10px] lg:text-base tracking-wide
                ${isActive ? "text-white" : "text-paragraph"}`}
            >
              {tab.label}
            </p>
          </button>
        );
      })}
    </div>
  );
}
