import { useFormContext } from "react-hook-form";
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";
import { useState, useRef } from "react";
import Link from "next/link";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import { Routes } from "@/app/routes";

export default function ContractTerms({ onNext }) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const budgetData = [
    {
      id: "hourly_rate",
      label: "Hourly rate",
      icon: "Clock",
    },
    {
      id: "fixed_price",
      label: "Fixed price",
      icon: "PriceTag2",
    },
    {
      id: "monthly_bases",
      label: "Monthly bases",
      icon: "Calendar",
    },
  ];
  const [dob, setDob] = useState(null);
  const inputRef = useRef(null);
  return (
    <div className="flex flex-col gap-6 md:gap-10">
      <div className="flex flex-col gap-8 md:gap-10">
        <h5 className="text-heading font-semibold text-lg md:text-2xl">Define Contract Terms</h5>
        <div className="flex flex-col gap-6">
          <h5 className="text-heading font-semibold text-lg">Tell us about your budget.</h5>
          <div className="flex flex-row flex-wrap gap-2 md:gap-4 w-full">
            {budgetData.map((item) => (
              <label
                key={item.id}
                className="flex justify-between items-start gap-2 md:gap-4
        bg-neutral-primary-soft
        border border-[#D0D5DD]
        rounded-lg py-4 px-1.5 md:py-6 md:px-4
        cursor-pointer w-[30%] xl:w-[25%] 2xl:w-[20%] h-full
        hover:bg-[#5BBB7B0D]
        has-[input:checked]:bg-[#5BBB7B0D]" style={{ boxShadow: "0px 1px 2px 0px #1018280D" }}>
                {/* Left Content */}
                <div className="flex flex-col gap-3 w-full">
                  <SvgIcon name={item.icon} color="#333333" size={32} />
                  <p className="text-sm xl:text-base text-heading font-semibold">
                    {item.label}
                  </p>
                </div>

                {/* Radio */}
                <input
                  id={item.id}
                  type="radio"
                  value={item.id}
                  {...register("budget_type", {
                    required: "Please select at least one option",
                  })}
                  name="budget_type"
                  className="w-5 h-5 text-primary accent-primary cursor-pointer"
                />
              </label>
            ))}
          </div>

        </div>
        <div className="flex flex-col gap-4">
          <h5 className="text-heading font-semibold text-lg">Project amount</h5>
          <div className="flex flex-row gap-15 w-[75%] md:w-[45%] xl:w-[29%]">
            <input
              id="bordered-radio-2"
              {...register("budget_amount", {
                required: {
                  value: true,
                  message: "Please enter budget amount",
                },
                pattern: {
                  value: /^[0-9]+$/,
                  message: "Numbers only",
                },
                validate: (value) => {
                  if (priceType === "fixed_price" && Number(value) < 1) {
                    return "Amount cannot be less than 1 for fixed price";
                  }
                  if (priceType === "monthly_bases" && Number(value) < 300) {
                    return "Amount cannot be less than 300 for monthly price";
                  }
                  return true;
                },
              })}
              type="text"
              placeholder="$33.00"
              name="budget_amount"
              className="w-full py-3.5 px-3 rounded-lg text-sm lg:text-base border border-[#D0D5DD] focus:border-primary focus:outline-none text-heading placeholder:text-lg placeholder:text-paragraph" style={{ boxShadow: "0px 1px 2px 0px #1018280D" }}
            />

            {errors.budget_amount && (
              <span className="text-sm text-red-500 font-medium">
                {errors.budget_amount.message}
              </span>
            )}
            <button className="cursor-pointer">
              <SvgIcon name="PostEdit" size={24} />
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <h5 className="text-heading font-semibold text-lg md:text-2xl">Payment schedule</h5>
        <div className="flex flex-col gap-4">
          <h5 className="text-heading font-semibold text-base">Pay for the whole project</h5>
          <div className="w-full md:w-[50%] border border-[#4444441A] rounded-md py-5.5 px-4.5">
            <div className="flex gap-2  justify-between">
              <div className="flex gap-2 justify-between items-center">
                <input type="radio" name="" id="" className="w-4 h-4" />
                <p className="text-paragraph font-medium text-base">
                  Deposit full payment of $33.00
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 mt-0 md:mt-4">
          <div className="flex flex-col gap-4 w-full">
            <h3 className="text-lg text-heading font-semibold">Date of Birth :</h3>

            <div className="relative w-full">
              {/* Calendar Icon */}
              <img
                src="/icons/calendar2.png"
                alt="calendar icon"
                className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer z-10"
                onClick={() => inputRef.current.setOpen(true)}
              />

              <DatePicker
                selected={dob}
                onChange={(date) => setDob(date)}
                dateFormat="MM/DD/YY"
                placeholderText="MM/DD/YY"
                wrapperClassName="w-full"
                calendarClassName="custom-calendar"
                dayClassName={() => "custom-day"}
                className="w-full py-3.5 px-4 pl-12 text-sm lg:text-base
        border border-[#4444441A] rounded-lg
        focus:ring-2 focus:ring-primary/50
        outline-none font-medium text-paragraph
        placeholder:text-sm placeholder:text-paragraph" ref={inputRef}
              />
            </div>
          </div>
          <div className="flex flex-col gap-4 w-full">
            <h3 className="text-lg text-heading font-semibold">Deadline:</h3>

            <div className="relative w-full">
              {/* Calendar Icon */}
              <img
                src="/icons/calendar2.png"
                alt="calendar icon"
                className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer z-10"
                onClick={() => inputRef.current.setOpen(true)}
              />

              <DatePicker
                selected={dob}
                onChange={(date) => setDob(date)}
                dateFormat="MM/DD/YY"
                placeholderText="MM/DD/YY"
                wrapperClassName="w-full"
                calendarClassName="custom-calendar"
                dayClassName={() => "custom-day"}
                className="
        w-full py-3.5 px-4 pl-12 text-sm lg:text-base
        border border-[#4444441A] rounded-lg
        focus:ring-2 focus:ring-primary/50
        outline-none font-medium text-paragraph
        placeholder:text-sm placeholder:text-paragraph
      "
                ref={inputRef}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              {...register("terms", { required: "You must accept the terms" })}
              className="w-4.5 h-4.5 cursor-pointer appearance-none border border-[#74788D] rounded flex items-center justify-center checked:bg-primary checked:border-primary relative checked:before:content-['✔'] checked:before:text-white checked:before:text-xs checked:before:flex checked:before:items-center checked:before:justify-center checked:before:absolute checked:before:inset-0"
            />
            <p className="text-xs md:text-base text-paragraph">
              Yes, I understand and agree to the
              <span className="text-primary underline cursor-pointer"> Venejobs </span>
              Terms of Service.
            </p>
          </div>
          {errors.terms && (
            <p className="text-red-500 text-sm">{errors.terms.message}</p>
          )}
        </div>
      </div>
      <div className="flex items-center pt-2 md:pt-0 gap-4 w-full">
        <Link href={Routes.client.hirePayment}
          className="bg-primary text-center font-semibold p-3 w-[120px] xl:w-[180px] xl:py-4 rounded text-white text-xs md:text-base cursor-pointer">
          Send Offer
        </Link>
        <button className="bg-white font-semibold p-3 w-[120px] xl:w-[180px] xl:py-4 rounded text-paragraph text-xs md:text-base cursor-pointer border border-[#FAFAFA]" style={{ boxShadow: "2px 2px 50px 5px #0000000D" }}>Back</button>
      </div>
    </div>
  );
}
