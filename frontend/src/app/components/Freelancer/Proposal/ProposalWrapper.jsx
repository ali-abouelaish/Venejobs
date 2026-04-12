import React from 'react'

const ProposalWrapper = ({children}) => {
  return (
     <div className="flex flex-col gap-10">
        {children}
     </div>
  )
}

export default ProposalWrapper
