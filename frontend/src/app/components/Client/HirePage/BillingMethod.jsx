"use client";
import { useState } from "react";
import Image from "next/image";

const BillingMethod = () => {
  const [showCard, setshowCard] = useState(true);
  return (
    <div className="lg:w-[70%]">
      <div className="flex flex-col gap-8 rounded-2xl py-6 px-3 md:py-10 md:pl-4 md:pr-8" style={{ boxShadow: "2px 2px 50px 0px #0000000D" }}>
        <div className="flex justify-between mt-2">
          <div className="flex flex-col gap-4">
            <h2 className="font-semibold text-lg md:text-2xl text-heading">
              Select a billing method
            </h2>
            <p className="text-sm md:text-base font-normal text-paragraph">
              This will be your default billing method for all contracts, transactions, and subscriptions.
            </p>
          </div>
        </div>
        {showCard && (
          <div className="border border-[#4444441A] rounded-md py-4 px-3 md:py-4 md:px-8">
            <div className="flex gap-2  justify-between">
              <div className="flex gap-3 justify-between items-center">
                <input type="radio" name="" id="" className="cursor-pointer w-4.5 h-4.5" />
                <p className="text-heading font-semibold text-base md:text-lg ">
                  MasterCard ending in 0550
                </p>
              </div>
              <Image
                className="w-8 h-4 md:w-10 md:h-6"
                src="/icons/card.png"
                width={40}
                height={24}
                alt="Card image"
              />
            </div>
          </div>
        )}

        <div className="flex gap-4 md:gap-6">
          <Image className="w-4.5 h-4.5 md:w-6 md:h-6" src="/icons/plus.png" width={24} height={24} alt="Card image" />
          <h2 className="font-semibold text-primary text-sm md:text-lg">
            Add new billing method{" "}
          </h2>
        </div>
      </div>
    </div >
  );
};

export default BillingMethod;
