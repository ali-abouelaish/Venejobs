"use client";
import { useState } from "react";
import Image from "next/image";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import Pagination from "../../Pagination/Pagination";

const ServiceCard = () => {
  const services = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const [page, setPage] = useState(1);
  const totalPage = 3;
  const selectPage = (p) => {
    if (p >= 1 && p <= totalPage) setPage(p);
  };
  return (
    <div className="flex flex-col items-center gap-15">
      <div className="w-full flex flex-wrap gap-4 gap-y-8 justify-center lg:justify-between">
        {services.map((_, i) => (
          <div key={i} index={i} total={services.length} className="flex flex-col gap-4 rounded-2xl w-full md:w-[48%] lg:w-[32%] xl:w-[24%]" style={{ boxShadow: "2px 2px 50px 6px #0000000D" }}>
            <img src="/service/service-img.png" alt="Service image" className="rounded-t-2xl w-full lg:w-85" />
            <div className="flex flex-col gap-4 mb-6 px-4">
              {/* title and image */}
              <div className="flex items-center gap-4 w-full md:w-auto">
                <Image src="/freelancer.jpg" alt="Freelancer image"
                  width={60}
                  height={60}
                  className="rounded-full w-15 h-15 cursor-pointer"
                />
                <h3 className="text-lg text-heading font-semibold">
                  Sarah Mitchell
                </h3>
              </div>
              <p className="text-heading text-lg font-semibold mb-2">
                I will design a modern Landing Page in Figma
              </p>
              <div className="flex flex-col pt-6 gap-6 border-t border-[#DEDEDE]">
                <div className="flex flex-row justify-between">
                  <p className="flex gap-4 items-center text-paragraph text-sm font-medium"><SvgIcon name="WallClock" />1 day delivery</p>
                  <p className="text-paragraph text-sm font-medium">Start at <span className="text-heading text-base font-semibold ml-3">$100</span></p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Pagination
        page={page}
        totalPage={totalPage}
        onChange={selectPage}
        jobs={services}
      />
    </div>
  );
};

export default ServiceCard;
