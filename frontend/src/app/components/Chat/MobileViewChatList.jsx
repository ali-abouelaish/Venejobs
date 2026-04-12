import React from "react";
import SvgIcon from "../Utility/SvgIcon";
import { useState } from "react";
import MobileChat from "./MobileChat";

const MobileViewChatList = ({ chatData = [] }) => {
  const [showChat, setshowChat] = useState(false);
  const [showChatList, setshowChatList] = useState(true);

  const showhideModal = () => {
    setshowChat(true);
    setshowChatList(false);
  };

  return (
    <>
      {showChatList && (
        <div className="flex flex-col gap-44 justify-between items-center border rounded-2xl border-gray-200 w-full px-3  md:hidden">
          <div className="rounded-2xl flex flex-col gap-4 p-1 w-full ">
            <div className="flex justify-between  items-center ">
              <h2 className="font-semibold text-lg text-heading">Chats</h2>
              <SvgIcon name="More" />
            </div>

            <div className="flex items-center justify-between gap-3 ">
              <div className="relative w-full">
                <span className="absolute inset-y-0 px-4  flex items-center ">
                  <SvgIcon name="Search_Icon" />
                </span>
                <input
                  type="search"
                  id="search"
                  className="block w-full px-10 py-2 rounded-4xl text-sm text-gray-900 font-medium shadow-sm"
                  placeholder="Search"
                  required
                />
              </div>
              <SvgIcon name="SettingSlider" />
            </div>
            <div className="flex flex-col gap-4">
              {chatData.length > 0 &&
                chatData.map((chat) => (
                  <div
                    onClick={() => showhideModal()}
                    key={chat.id}
                    className={`flex gap-1.5   py-1 px-1 rounded-xl items-center border border-gray-200   ${
                      chat.active ? "bg-primary text-white" : ""
                    }`}
                  >
                    <img
                      src={chat.avatar}
                      alt={chat.name}
                      className="size-12 rounded-full bg-gray-800 outline -outline-offset-1 outline-white/10"
                    />

                    <div className="flex flex-col ">
                      <div className="flex items-center gap-3 ">
                        <h2 className="font-semibold text-base">{chat.name}</h2>
                        <p className="font-medium text-xs">{chat.time}</p>
                      </div>

                      <p className="text-xs">{chat.message}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {showChat && (
        <MobileChat
          setshowChat={setshowChat}
          setshowChatList={setshowChatList}
        />
      )}
    </>
  );
};

export default MobileViewChatList;
