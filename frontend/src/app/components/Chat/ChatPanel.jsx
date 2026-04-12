"use client";

import React, { useState } from "react";
import SvgIcon from "../Utility/SvgIcon";

const ChatPanel = ({ chatData = [] }) => {
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
      <div className="flex  gap-2 border border-gray-200 rounded-2xl shadow-2xs w-full">
        <div className="flex border-r border-gray-200 flex-col gap-3  mt-6 px-4">
          <div className="flex justify-between  items-center ">
            <h2 className="font-semibold text-lg text-heading">Chats</h2>
            <SvgIcon name="More" />
          </div>

          <div className="flex items-center justify-between gap-3 ">
            <div className="relative ">
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

          <div className="flex flex-col  gap-8 mt-8 mb-4">
            {chatData.length > 0 &&
              chatData.map((chat) => (
                <div
                  key={chat.id}
                  className={`flex gap-1.5 py-2 px-1 rounded items-center  ${
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

        <div className="flex flex-col justify-between py-2  w-[610px] ">
          <div className="flex  items-center gap-3 h-20 border-b border-gray-200">
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
                  className="size-10 rounded-full bg-gray-300"
                />

                <div>
                  <p
                    className={`${
                      msg.sentByMe ? "bg-primary text-white" : "bg-white"
                    } p-2 text-sm rounded-lg inline-block shadow-2xs`}
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
    </div>
  );
};

export default ChatPanel;
