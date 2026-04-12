import Pagination from "@/app/components/Pagination/Pagination";
import Image from "next/image";
import React from "react";
import { useState } from "react";

export default function Reviews() {
  const reviews = [1, 2, 3];
  const [page, setPage] = useState(1);
  const totalPage = 3;
  const selectPage = (p) => {
    if (p >= 1 && p <= totalPage) setPage(p);
  }
  return (
    <>
      {reviews.map((_, i) => (
        <div key={i} className="flex flex-col gap-4 md:gap-10">
          <div className="flex items-center gap-3.5 md:gap-6 w-full md:w-auto">
            <Image
              src="/freelancer.jpg"
              alt="Freelancer image"
              width={64}
              height={64}
              className="rounded-full w-[50px] h-[50px]"
            />
            <div className="flex flex-row gap-10 md:justify-between w-full">
              <div className="flex flex-col">
                <h3 className="text-sm text-heading font-semibold">
                  Yevhen K.
                </h3>
                <div className="flex gap-3 items-center mt-1.5">
                  <img src="/icons/stars2.png" alt="" />
                  <p className="text-xs md:text-sm">5.00</p>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <p className="font-medium text-xs md:text-[15px] text-paragraph">
                  Dec 3, 2024
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start gap-4 w-full md:w-auto">
            <p className="text-heading text-sm md:text-lg font-semibold">
              UX/UI Designer | Expert in Website | App | Software | Figma
            </p>
            {/* job desc */}
            <p className="text-paragraph text-xs md:text-base font-normal leading-8">Alishan skills in UX design are exceptional, he follows up the ideas very easily. The design was good and was a very easy process overall, fast work and easy to communicate. Very helpful for my MVP</p>
          </div>
        </div>
      ))}
      <Pagination
        page={page}
        totalPage={totalPage}
        onChange={selectPage}
        jobs={reviews}
      />
    </>
  );
}
