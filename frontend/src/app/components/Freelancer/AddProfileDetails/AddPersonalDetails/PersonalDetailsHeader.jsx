import React from 'react'

const PersonalDetailsHeader = () => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <h2 className="text-2xl lg:text-3xl xl:text-4xl 3xl:text-5xl text-heading font-bold leading-snug">
        You're almost there! Let’s finalize your profile.
      </h2>

      <p className="text-gray-500 text-base xl:text-lg font-normal leading-7 lg:leading-8 tracking-wide">
        Just a few final details to complete your profile. This helps us keep the platform secure and ensures clients can trust and pay you smoothly.
      </p>
    </div>
  )
}


export default PersonalDetailsHeader;
