import Image from "next/image";
import Button from "../button/Button";
import SvgIcon from "../Utility/SvgIcon";

export default function MostPopular() {
  const cards = [1, 2, 3, 4];

  return (
    <div className="w-full flex flex-col gap-8">
      {/* HEADER */}
      <div
        className="
                flex flex-col gap-3 
                md:flex-row md:justify-between md:items-center 
                text-center md:text-left
            "
      >
        <div className="flex flex-col gap-4 w-full md:w-auto">
          <h2 className="text-2xl lg:text-3xl xl:text-4xl text-heading font-bold leading-snug">
            Most Popular
          </h2>
          <p className="text-gray-500 text-sm md:text-base tracking-wide font-medium">
            See how you can up your career status
          </p>
        </div>

        {/* Center on mobile */}
        <div className="flex justify-center md:justify-end w-full md:w-auto">
          <button className="flex items-center justify-center gap-2 text-primary font-bold text-base rounded-md px-2">
            All category
            <SvgIcon name="RightOne" />
          </button>
        </div>
      </div>

      {/* CARDS */}
      <div
        className="
                w-full 
                flex flex-wrap 
                justify-center md:justify-start lg:justify-between 
                gap-6
            "
      >
        {cards.map((c, i) => (
          <div
            key={i}
            className="
                            bg-white 
                            rounded-lg 
                            w-full sm:w-[90%] md:w-[328px] 
                            shadow-[0_6px_15px_rgba(64,79,104,0.05)] 
                            overflow-hidden 
                            border border-[#E5E7EB]
                        "
          >
            <Image
              src="/pop1.png"
              alt="popular"
              width={328}
              height={249}
              className="w-full h-[249px] object-cover"
            />

            <div className="px-4 py-6 flex flex-col gap-4">
              <p className="text-gray-500 font-medium text-sm">
                November 7, 2022
              </p>

              <h1 className="font-semibold text-lg leading-7 text-heading">
                Exploring Some of the Cities and Home Services
              </h1>

              <p className="text-gray-500 font-medium text-sm leading-snug">
                Bringing the culture of sharing to everyone
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
