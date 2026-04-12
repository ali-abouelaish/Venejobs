import React from 'react'

const JobDetailWrapper = ({children}) => {
  return (
    <div className="flex flex-col lg:flex-row  gap-8 border-b border-gray-200">
        {children}
    </div>
  )
}

export default JobDetailWrapper
