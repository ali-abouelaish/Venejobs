import React from 'react'

const PortfolioHeader = () => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <h2 className="text-2xl lg:text-3xl xl:text-4xl 3xl:text-5xl text-heading font-bold leading-snug">
        Let’s add your personal projects
      </h2>

      <p className="text-gray-500 text-base xl:text-lg font-normal leading-7 lg:leading-8 tracking-wide">
        Highlight the projects you’ve built and the problems you’ve solved. Personal projects show your skills, creativity, and real-world experience to potential clients and employers.
      </p>
    </div>
  )
}


export default PortfolioHeader;
