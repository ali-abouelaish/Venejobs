"use client";

import { useState, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function DOBPicker({isEditable}) {
  const [dob, setDob] = useState(null);
  const inputRef = useRef(null);

  return (
    <div className="flex flex-col gap-2 w-full">
      <h3 className="text-base text-heading font-bold">Date of Birth :</h3>

      <div className="relative w-full">
        <DatePicker
          disabled={!isEditable}
          selected={dob}
          onChange={(date) => setDob(date)}
          dateFormat="dd-MM-yyyy"
          placeholderText="dd-mm-yyyy"
          wrapperClassName="w-full"
          calendarClassName="custom-calendar"
          dayClassName={() => "custom-day"}
          className="
      w-full py-3.5 px-4 pr-12 text-sm lg:text-base 
      border border-lightborder rounded-lg 
      focus:ring-2 focus:ring-primary/50 
      outline-none font-medium text-paragraph
      placeholder:text-sm placeholder:text-[#9CA3AF]
  "
          ref={inputRef}
        />

        {/* Calendar Icon */}
        <img
          src="/icons/calendar.png" // <---- USE YOUR IMAGE HERE
          alt="calendar icon"
          className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer opacity-70 hover:opacity-100"
          onClick={() => inputRef.current.setOpen(true)} // open on click
        />
      </div>
    </div>
  );
}
