"use client";
import { useState } from "react";
import Image from "next/image";
import Reviews from "@/app/components/Client/Common/Reviews";

const images = [
  "/service/Service-Detail.png",
  "/home/Group_Home.png",
  "/service/Service-Detail.png",
  "/service/Service-Detail.png",
];

const ServiceContent = () => {

  const [activeImage, setActiveImage] = useState(images[0]);
  return (
    <div className="w-full lg:w-[65%] flex flex-col gap-6 lg:gap-10">
      <div className="flex flex-col gap-10 lg:gap-20">
        <div className="flex flex-col gap-3">
          {/* Image */}
          <div className="w-full">
            <Image src={activeImage} alt="Service detail" width={972} height={483} className="w-full h-auto rounded-md"
              priority />
          </div>

          {/* Thumbnail Image */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {images.map((img, index) => (
              <button key={index} onClick={() => setActiveImage(img)}
                className={`relative rounded overflow-hidden
      ${activeImage === img ? "ring-2 ring-black" : "opacity-80 hover:opacity-100"}`}
              >
                <Image src={img} alt={`Thumbnail ${index + 1}`} width={234} height={167} className="w-[234px] h-[150px] object-cover" />
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <h4 className="font-semibold text-2xl md:text-[32px] text-heading">
            About This Service
          </h4>
          <div className="flex flex-col gap-5">
            <p className="text-paragraph text-xs md:text-base leading-7">A structured, user-centered design service focused on creating clean, modern, and highly functional interfaces. Get a complete design solution tailored to your brand, with clear deliverables and predictable timelines. This service provides a complete UX/UI design solution for your digital product. Each step is crafted to ensure clarity, usability, and a consistent visual system aligned with industry best practices.</p>
          </div>
        </div>
      </div>
      {/* Reviews */}
      <div className="flex flex-col gap-6 md:gap-8 rounded-2xl px-3 pb-2 pt-8 md:p-8" style={{ boxShadow: "2px 2px 50px 0px #0000000D" }}>
        <h2 className="font-semibold text-2xl text-black">
          Reviews
        </h2>
        <Reviews />
      </div>
    </div>
  );
};

export default ServiceContent;
