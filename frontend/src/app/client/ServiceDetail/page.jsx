"use client";
import ClientLayout from "@/app/layout/ClientLayout";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import Image from "next/image";
import ServiceContent from "@/app/components/Client/Service/ServiceContent";
import ServiceRightPanal from "@/app/components/Client/Service/ServiceRightPanal";

export default function ServiceDetail() {
  return (
    <>
      <ClientLayout>
        <div className="w-full max-w-[90%] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1240px] 2xl:max-w-[1400px] mx-auto my-10 lg:my-20">
          <div className="lg:w-[68%] flex flex-col gap-8 md:gap-10 mb-8">
            <h2 className="text-2xl md:text-[32px] text-heading font-semibold">
              You will get UI/UX design | UI/UX Designer | Figma Landing Page | Responsive Design
            </h2>
            <div className="flex items-center justify-between md:justify-start md:gap-20 w-full md:w-auto">
              <div className="flex flex-row items-center gap-2 md:gap-4">
                <Image src="/freelancer.jpg" alt="Freelancer image"
                  width={64}
                  height={64}
                  className="rounded-full w-15 h-15 cursor-pointer"
                />
                <h3 className="text-lg text-heading font-semibold">
                  Alishan Noor
                </h3>
              </div>
              <div className="flex flex-row items-center gap-10">
                <p className="flex items-center gap-3 text-paragraph text-sm font-medium">
                  <SvgIcon name="Star" /> 4.9 (1,064 reviews)
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col-reverse lg:flex-row gap-8 lg:gap-10">
            <ServiceContent />
            <ServiceRightPanal />
          </div>
        </div>
      </ClientLayout>
    </>
  );
}
