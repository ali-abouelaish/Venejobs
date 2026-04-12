import ClientLayout from "@/app/layout/ClientLayout";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import BillingMethod from "@/app/components/Client/HirePage/BillingMethod";
import HirePriceTotal from "@/app/components/Client/HirePage/HirePriceTotal";

export default function HirePayment() {
  return (
    <>
      <ClientLayout>
        <div className="w-full max-w-[90%] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1240px] 2xl:max-w-[1400px] mx-auto my-10 lg:my-20">
          <div className="flex flex-col gap-6 lg:gap-8">
            <div className="flex flex-col lg:flex-row gap-4 md:gap-6 lg:justify-between">
              <h2 className="text-2xl md:text-[44px] text-heading font-bold md:font-semibold">
                Hire Alishan Noor
              </h2>
              <div className="flex gap-6 items-center">
                <p className="font-medium text-base lg:text-lg text-paragraph">
                  Posted 4 days ago
                </p>
                <p className="font-medium text-base lg:text-lg text-paragraph">
                  Worldwide
                </p>
                <SvgIcon name="Location" />
              </div>
            </div>
            <div className="bg-[#5BBB7B0D] py-4 px-2 md:py-5 md:px-6 border border-[#FAFAFA] rounded mt-2">
              <p className="text-primary font-medium text-xs md:text-base">Hire Alishan Noor for: UXUI Design</p>
            </div>
            <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
              <BillingMethod />
              <HirePriceTotal />
            </div>
          </div>
        </div>
      </ClientLayout>
    </>
  );
}
