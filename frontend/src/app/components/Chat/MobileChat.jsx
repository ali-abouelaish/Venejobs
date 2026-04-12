"use client";

import React, { useState } from "react";
import SvgIcon from "../Utility/SvgIcon";

const MobileChat = ({ setshowChat, setshowChatList }) => {
  const goBackToList = () => {
    setshowChat(false);
    setshowChatList(true);
  };

  const staticMessages = [
    {
      id: 1,
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&w=256&h=256&q=80",
      text: "Hey there! How can I help you today?",
      time: "10:15 AM",
      sentByMe: false,
    },
    {
      id: 2,
      avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=me",
      text: "I need help designing a landing page.",
      time: "10:16 AM",
      sentByMe: true,
    },
    {
      id: 3,
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&w=256&h=256&q=80",
      text: "Sure! Send me the requirements.",
      time: "10:17 AM",
      sentByMe: false,
    },
  ];

  const [messages, setMessages] = useState(staticMessages);

  return (
    <div>
      <div className="flex flex-col justify-between py-2  ">
        <div className="flex  items-center gap-3 h-20 border-b border-gray-200">
          <button onClick={goBackToList}>
            <SvgIcon name="PrevButton" size={24} />
          </button>
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            className="size-12 rounded-full bg-gray-800 outline -outline-offset-1 outline-white/10 mb-4"
          />
          <div className="flex flex-col gap-1.5 mb-4 ">
            <h2 className="font-semibold text-base text-heading">
              Giacomo Chaparro
            </h2>

            <div className="flex gap-4">
              <p className="text-paragraph text-xs">10:18 AM GMT+2</p>
              <p className="text-paragraph text-xs flex items-center gap-3">
                <SvgIcon name="Brifcase" size={16} /> Landing page figma
                designer
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.sentByMe ? "flex-row-reverse text-right" : ""
              }`}
            >
              <img
                src={msg.avatar}
                className="size-6 rounded-full bg-gray-300"
              />

              <div>
                <p
                  className={`${
                    msg.sentByMe ? "bg-primary text-white" : "bg-white"
                  } p-2 text-xs rounded-lg inline-block shadow-2xs`}
                >
                  {msg.text}
                </p>
                <p className="text-xs text-gray-400 mt-1">{msg.time}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t-2 border-gray-200 py-2">
          <div className="flex items-center  gap-2">
            {/* Input + icons wrapper */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Type a message here......."
                className="text-[#74788D] border border-gray-200 rounded pl-3 pr-24 py-3 w-full"
              />

              {/* Emoji icon */}
              <span className="absolute right-10 top-1/2 -translate-y-1/2 cursor-pointer text-xl">
                <SvgIcon name="Smile" />
              </span>

              {/* Attachment icon */}
              <span className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-xl">
                <SvgIcon name="Link" />
              </span>
            </div>

            {/* Send button (outside input box) */}
            <button className=" text-white px-4 py-3 rounded">
              <SvgIcon name="Send" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileChat;
