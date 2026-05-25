import React from "react";
import Mobileview from "./MobileViewChatList";

const ClientChatWrapper = ({ chatData = [], children }) => {
  return (
    <div>
      <div className="w-full max-w-[90%] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1240px] 2xl:max-w-[1400px] mx-auto my-4 lg:my-6">
        <div className="flex md:hidden">
          <Mobileview chatData={chatData} />
        </div>

        <div className="hidden md:flex flex-col gap-3 lg:gap-4">
          <h1 className="text-2xl lg:text-3xl text-heading font-bold leading-tight w-full lg:max-w-5xl">
            Messages
          </h1>

          <div className="w-full h-[calc(100vh-220px)] min-h-[480px] max-h-[680px] overflow-hidden">
            <div className="flex gap-4 md:flex-col xl:flex-row h-full">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientChatWrapper;
