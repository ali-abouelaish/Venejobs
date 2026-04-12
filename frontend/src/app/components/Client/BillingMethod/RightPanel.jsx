import React from "react";
import Button from "../../button/Button";

const RightPanel = () => {
  return (
    <div className="w-full flex flex-col gap-6 lg:mt-18">
      <div className="">
        <label
          htmlFor="paidfor"
          className="flex gap-3 items-center p-4 border  border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition"
        >
          <input
            type="radio"
            id="paidfor"
            name="paymentType"
            className="
                     h-5 w-5 accent-blue-900"
          />
          <div className="flex justify-between">
            <p className="font-semibold text-gray-900">Stripe</p>
          </div>
        </label>
      </div>
      <div className="border border-gray-200">
        <div className="border-b border-gray-200">
          <label
            htmlFor="paidfor"
            className="flex gap-3  p-4 rounded-lg cursor-pointer hover:bg-gray-50 transition"
          >
            <input
              type="radio"
              id="paidfor"
              name="paymentType"
              className="h-5 w-5 accent-blue-900"
            />
            <div className="flex flex-col gap-1">
              <div className="flex">
                <p className="font-semibold text-gray-900">Credit Card</p>
                {/* <img src="" alt=""  /> */}
              </div>
              <p className="text-sm text-paragraph">
                Pay Securely using your Debit card, Master Card, Visa Card or
                Google pay 
              </p>
            </div>
          </label>
        </div>
        <div className="flex flex-col gap-5 px-4">
          <div className="flex flex-col gap-4 ">
            <h3 className="mt-3 font-semibold text-heading">Card Number</h3>
            <input
              type="text"
              className="border border-gray-100 py-2 px-2 text-xs lg:text-sm"
              name=""
              id=""
              placeholder="1234 1234 1234 1234"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="flex flex-col gap-4">
              <h2 className="font-semibold text-sm">Name on Card</h2>
              <input
                type="text"
                name=""
                id=""
                placeholder="Alishan Noor"
                className="py-2 px-2 border border-gray-100 text-xs lg:text-sm"
              />
            </div>
            <div className="flex flex-col gap-4">
              <h2 className="font-semibold text-sm">Expire Date</h2>
              <input
                type="text"
                name=""
                id=""
                placeholder="MM / YY"
                className="py-2 px-2 border border-gray-100 text-xs lg:text-sm"
              />
            </div>
            <div className="flex flex-col gap-4">
              <h2 className="font-semibold text-sm">CVV</h2>
              <input
                type="text"
                name=""
                id=""
                placeholder="CVV"
                className="py-2 px-2 border border-gray-100 text-xs lg:text-sm"
              />
            </div>
          </div>
          <Button className="bg-primary text-white mb-5">Save Details</Button>
        </div>
      </div>

      <div className="">
        <label
          htmlFor="paidfor"
          className="flex gap-3 items-center p-4 border  border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition"
        >
          <input
            type="radio"
            id="paidfor"
            name="paymentType"
            className="
                     h-5 w-5 accent-blue-900"
          />
          <div className="flex justify-between">
            <p className="font-semibold text-gray-900">Google Pay</p>
          </div>
        </label>
      </div>

      <div className="">
        <label
          htmlFor="paidfor"
          className="flex gap-3 items-center p-4 border  border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition"
        >
          <input
            type="radio"
            id="paidfor"
            name="paymentType"
            className="
                     h-5 w-5 accent-blue-900"
          />
          <div className="flex justify-between">
            <p className="font-semibold text-gray-900">Apple Pay</p>
          </div>
        </label>
      </div>
    </div>
  );
};

export default RightPanel;
