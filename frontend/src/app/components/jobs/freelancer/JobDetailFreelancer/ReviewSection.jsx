import React from "react";

const ReviewSection = () => {
  return (
    <div className="mt-10 flex flex-col gap-8">
      <h2 className="hidden md:flex md:font-semibold text-[32px]">
        Client's recent history (3)
      </h2>
      <h2 className="flex md:hidden text-2xl font-semibold">Reviews</h2>

      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex gap-3 items-center">
              <div className="hidden lg:flex gap-2 ">
                <img src="/icons/stars2.png" alt="" />
                <p>4.9</p>
              </div>
            </div>

            <div className="flex">
              <h2 className="text-heading text-base md:text-lg font-semibold">
                UI/UX Designer Needed for Website and App Redesign
              </h2>
            </div>
          </div>

          <div className="flex flex-col gap-4 xl:flex-row items-center justify-between">
            <div className="flex flex-col">
              <p className="xl:w-[1000px] text-sm md:text-base">
                Alishan skills in UX design are exceptional, he follows up the
                ideas very easily. The design was good and was a very easy
                process overall, fast work and easy to communicate.
              </p>
            </div>

            <div className="flex flex-row xl:flex-col gap-1 justify-between w-full">
              <p className="text-paragraph text-sm lg:text-base">
                Oct 2024 - Oct 2024{" "}
              </p>
              <span className="text-sm lg:text-base">
                <b>Fixed-price</b> $302.50
              </span>
            </div>
          </div>

          <div className="flex gap-3 md:gap-4 items-center mt-2">
            <p>To freelancer:</p>
            <p className="text-secondary">Alishan Noor</p>
            <img src="/icons/stars2.png" alt="" />
            <p>4.9</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex gap-3 items-center">
              <div className="hidden lg:flex gap-2">
                <img src="/icons/stars2.png" alt="" />
                <p>4.9</p>
              </div>
            </div>

            <div className="flex">
              <h2 className="text-heading text-base md:text-lg font-semibold">
                UI/UX Designer Needed for Website and App Redesign
              </h2>
            </div>
          </div>

          <div className="flex flex-col gap-4 xl:flex-row items-center justify-between">
            <div className="flex flex-col">
              <p className="xl:w-[1000px] text-sm md:text-base">
                Alishan skills in UX design are exceptional, he follows up the
                ideas very easily. The design was good and was a very easy
                process overall, fast work and easy to communicate.
              </p>
            </div>

            <div className="flex flex-row xl:flex-col gap-1 justify-between w-full">
              <p className="text-paragraph text-sm lg:text-base">
                Oct 2024 - Oct 2024{" "}
              </p>
              <span className="text-sm lg:text-base">
                <b>Fixed-price</b> $302.50
              </span>
            </div>
          </div>

          <div className="flex gap-3 md:gap-4 items-center mt-2">
            <p>To freelancer:</p>
            <p className="text-secondary">Alishan Noor</p>
            <img src="/icons/stars2.png" alt="" />
            <p>4.9</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewSection;
