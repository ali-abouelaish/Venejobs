import React from "react";
import Mobileview from "./MobileViewChatList";

const ClientChatWrapper = ({ chatData = [], children }) => {
  return (
    <div>
      <div className="w-full max-w-[90%] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1240px] 2xl:max-w-[1400px] mx-auto my-10 lg:my-20">
        <div className="flex md:hidden">
          <Mobileview chatData={chatData} />
        </div>

        <div className="hidden md:flex flex-col gap-5 lg:gap-6">
          <h1 className="text-3xl lg:text-5xl text-heading font-bold leading-snug w-full lg:max-w-5xl">
            Messages <br />
          </h1>

          <div className="h-auto w-full">
            <div className="flex gap-4 md:flex-col xl:flex-row">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientChatWrapper;
