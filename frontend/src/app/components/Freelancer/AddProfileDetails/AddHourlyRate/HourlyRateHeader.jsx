import React from 'react'

const HourlyRateHeader = () => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <h2 className="text-2xl lg:text-3xl xl:text-4xl 3xl:text-5xl text-heading font-bold leading-snug">
        Decide how much you want to earn for your skills and time
      </h2>

      <p className="text-gray-500 text-base xl:text-lg font-normal leading-7 lg:leading-8 tracking-wide">
        Set an hourly rate that reflects your experience and the value you bring. This helps clients understand your expectations and ensures fair, transparent work on Venejobs.
      </p>
    </div>
  )
}


export default HourlyRateHeader;
