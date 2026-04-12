import SvgIcon from "../Utility/SvgIcon";

export default function HowItWorks() {
  return (
    <div className="w-full mx-auto flex flex-col lg:flex-row items-center text-center lg:text-left gap-10">
      <div className="flex flex-col gap-8 lg:gap-12">
        {/* Heading */}
        <div className="text-center flex flex-col gap-4">
          <p className="text-primary text-sm md:text-lg font-bold">
            For Clients
          </p>

          <h2 className="text-2xl lg:text-3xl xl:text-4xl text-heading font-bold leading-snug">
            How it Works
          </h2>

          <p className="text-sm lg:text-base text-gray-500 mx-auto tracking-wide font-medium leading-7">
            Find the perfect talent to bring your projects to life with a
            streamlined process designed for your success.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12">
          {[
            {
              icon: "Brifcase",
              title: "Post a Job",
              desc: "Share your requirements, set your budget, and define the timeline.",
            },
            {
              icon: "Cv",
              title: "Review Applications",
              desc: "Browse proposals, compare budgets, and evaluate freelancers.",
            },
            {
              icon: "Honesty",
              title: "Start Collaborating",
              desc: "Work with skilled freelancers and track project progress.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center gap-2 md:gap-5"
            >
              {/* Icon Wrapper */}

              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-[2px_2px_50px_6px_rgba(0,0,0,0.05)]">
                <SvgIcon name={item.icon} size={28} />
              </div>
              {/* Text */}
              <div className="flex flex-col gap-3">
                <h3 className="text-xl text-heading font-semibold">
                  {item.title}
                </h3>
                <p className="text-sm lg:text-base text-gray-500 mx-auto leading-7 tracking-wide font-medium">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
