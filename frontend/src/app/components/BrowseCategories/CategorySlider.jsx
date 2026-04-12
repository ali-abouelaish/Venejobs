"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";

import { Navigation } from "swiper/modules";
import CategoryCard from "./CategoryCard";
import SvgIcon from "../Utility/SvgIcon";

export default function CategorySlider({ items }) {
  return (
    <div className="relative w-full">
      <Swiper
        modules={[Navigation]}
        navigation={{
          prevEl: ".prev-btn",
          nextEl: ".next-btn",
        }}
        spaceBetween={40}
        breakpoints={{
          0: { slidesPerView: 1 },
          480: { slidesPerView: 1.3 },
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
          1280: { slidesPerView: 4 },
        }}
      >
        {items.map((item, idx) => (
          <SwiperSlide key={idx} className="!w-auto">
            <CategoryCard src={item.src} label={item.label} />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* PREV BUTTON */}
      <button
        className="
                prev-btn hidden lg:flex items-center justify-center
                absolute top-1/2 -translate-y-1/2 left-[-18px]
                w-11 h-11 rounded-full bg-white
                shadow-[0_4px_20px_rgba(0,0,0,0.10)]
                border border-transparent
                hover:shadow-[0_6px_22px_rgba(0,0,0,0.18)]
                transition-all duration-200
                z-50 cursor-pointer
            "
        aria-label="Previous button"
      >
        <SvgIcon name="Control_prev" className="w-4 h-4 text-[#111]" />
      </button>

      {/* NEXT BUTTON */}
      <button
        className="
                next-btn hidden lg:flex items-center justify-center
                absolute top-1/2 -translate-y-1/2 right-[-18px]
                w-11 h-11 rounded-full bg-white
                shadow-[0_4px_20px_rgba(0,0,0,0.10)]
                border border-transparent
                hover:shadow-[0_6px_22px_rgba(0,0,0,0.18)]
                transition-all duration-200
                z-50 cursor-pointer
            "
        aria-label="Previous button"
      >
        <SvgIcon name="Control_next" className="w-4 h-4 text-[#111]" />
      </button>
    </div>
  );
}
