import Pagination from "@/app/components/Pagination/Pagination";
import Image from "next/image";
import React from "react";
import { useState } from "react";

export default function Portfolio() {
  const portfolio = [1, 2, 3];
  const [page, setPage] = useState(1);
  const totalPage = 3;
  const selectPage = (p) => {
    if (p >= 1 && p <= totalPage) setPage(p);
  }
  return (
    <>
      <div className="flex flex-wrap lg:flex-nowrap items-center gap-8 md:gap-4">
        {portfolio.map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-6 w-full md:w-auto"
          >
            <div className="flex justify-center bg-heading border rounded-2xl pb-2 pt-5.5 px-3.5 w-full">
              <Image
                src="/FreelanceProjectImage/projectImg.jpg"
                alt=""
                width={222}
                height={190}
                className="w-[340px] md:w-[222px]"
              />
            </div>
            <h3 className="font-sm text-heading font-semibold ">
              SaaS Application Website Designs
            </h3>
          </div>

        ))}
      </div>
      <Pagination
        page={page}
        totalPage={totalPage}
        onChange={selectPage}
        jobs={portfolio}
      />
    </>
  );
}
