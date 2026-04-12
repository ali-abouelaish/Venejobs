import Link from "next/link";
import React, { useState } from "react";
import SvgIcon from "../Utility/SvgIcon";
import Image from "next/image";

const BillingPage = () => {
  const [showCard, setshowCard] = useState(true);
  return (
    <div className="w-full  mt-2.5 flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <h2 className="font-semibold text-lg md:text-[32px] text-heading">
          Manage billing methods
        </h2>
        <p className="text-xs md:text-sm font-normal text-paragraph">
          Add, update, or remove your billing methods.
        </p>
      </div>

      <div className="flex justify-between">
        <div className="flex flex-col">
          <h2 className="font-semibold text-lg md:text-2xl text-heading">
            Primary
          </h2>
          <p className="text-xs md:text-sm font-normal text-paragraph">
            Your primary billing method is used for all recurring payments.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 items-baseline px-5">
          <Link
            href={""}
            className="text-primary text-sm md:text-lg font-semibold flex items-center gap-2"
          >
            <SvgIcon name="Write" /> Edit
          </Link>
          <button
            onClick={() => setshowCard(false)}
            className="text-red-400 text-sm md:text-lg font-semibold flex items-center gap-2"
          >
            <SvgIcon name="DeleteRed" color="#DF3A49" size={18} />
            Remove
          </button>
        </div>
      </div>

      {showCard && (
        <div className="border border-gray-200 rounded py-2 px-1 md:py-4 md:px-8">
          <div className="flex gap-2  justify-between">
            <div className="flex gap-3 justify-between items-center">
              <input type="radio" name="" id="" className="" />
              <p className="font-semibold text-sm md:text-lg ">
                MasterCard ending in 0550
              </p>
            </div>
            <Image
              className="w-8 h-8 md:w-10 md:h-10"
              src="/icons/card.png"
              width={40}
              height={24}
              alt="Card image"
            />
          </div>
        </div>
      )}

      <div className="flex gap-6">
        <Image src="/icons/plus.png" width={24} height={24} alt="Card image" />
        <h2 className="font-semibold text-primary text-sm md:text-lg">
          Add new billing method{" "}
        </h2>
      </div>
    </div>
  );
};

export default BillingPage;
