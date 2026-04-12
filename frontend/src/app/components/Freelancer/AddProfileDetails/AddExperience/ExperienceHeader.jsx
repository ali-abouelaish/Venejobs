import React from 'react'

const ExperienceHeader = () => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <h2 className="text-2xl lg:text-3xl xl:text-4xl 3xl:text-5xl text-heading font-bold leading-snug">
        Let’s share your professional experience
      </h2>

      <p className="text-gray-500 text-base xl:text-lg font-normal leading-7 lg:leading-8 tracking-wide">
        Let clients know where you've been and what you've done. Highlight your past roles, achievements, and the value you brought to previous projects.
      </p>
    </div>
  )
}


export default ExperienceHeader;
