import React from 'react'

const LanguageHeader = () => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <h2 className="text-2xl lg:text-3xl xl:text-4xl 3xl:text-5xl text-heading font-bold leading-snug">
        Let’s tell us what languages you speak
      </h2>

      <p className="text-gray-500 text-base xl:text-lg font-normal leading-7 lg:leading-8 tracking-wide">
        Let clients know which languages you’re comfortable working in. This helps you connect with the right opportunities on Venejobs.
      </p>
    </div>
  )
}


export default LanguageHeader;
