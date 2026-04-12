"use client";
import ChatPanel from "@/app/components/Chat/ChatPanel";
import ClientChatWrapper from "@/app/components/Chat/ClientChatWrapper";
import UserInfoPanel from "@/app/components/Chat/UserInfoPanel";
import FreelancerLayout from "@/app/layout/FreelancerLayout";

export default function Chat() {
  const chatData = [
    {
      id: 1,
      active: true,
      name: "Giacomo kfsdlkf",
      time: "02:40 pm",
      message: "Thanks buddy, you too...",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
    {
      id: 2,
      name: "Giacomo Chaparro",
      time: "02:40 pm",
      message: "Thanks buddy, you too...",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
    {
      id: 3,
      name: "Giacomo Chaparro",
      time: "02:40 pm",
      message: "Thanks buddy, you too...",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
    {
      id: 4,
      name: "Giacomo Chaparro",
      time: "02:40 pm",
      message: "Thanks buddy, you too...",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
    {
      id: 5,
      name: "Giacomo Chaparro",
      time: "02:40 pm",
      message: "Thanks buddy, you too...",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
    {
      id: 6,
      name: "Giacomo Chaparro",
      time: "02:40 pm",
      message: "Thanks buddy, you too...",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
    {
      id: 7,
      name: "Giacomo Chaparro",
      time: "02:40 pm",
      message: "Thanks buddy, you too...",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
  ];

  return (
    <FreelancerLayout>
      <ClientChatWrapper chatData={chatData}>
        {/* chat panel */}
        <ChatPanel chatData={chatData} />
        {/* user info panel */}
        <UserInfoPanel />
      </ClientChatWrapper>
    </FreelancerLayout>
  );
}
