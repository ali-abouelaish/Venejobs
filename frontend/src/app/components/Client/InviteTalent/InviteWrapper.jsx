import React from "react";

const InviteWrapper = ({children}) => {
  return (
    <div className="w-full max-w-[90%] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1240px] 2xl:max-w-[1400px] mx-auto my-10 lg:my-20">
      <div className="flex flex-col lg:flex-row justify-between gap-10 lg:gap-24">
        {children}
      </div>
    </div>
  );
};

export default InviteWrapper;
