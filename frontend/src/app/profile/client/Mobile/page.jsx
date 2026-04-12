"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HomeFilledIcon from "@mui/icons-material/HomeFilled";

import Button from "@/app/components/button/Button";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import { Routes } from "@/app/routes";
import userApiStore from "@/app/store/userStore";
import toastStore from "@/app/store/toastStore";

export default function Page() {
  const router = useRouter();
  const { user, logout } = userApiStore();
  const { showSuccess, showError } = toastStore.getState();

  const menuItems = [
    { label: "My Info", icon: "Preview", href: Routes.client.profile.info },
    {
      label: "Billing & Payments",
      icon: "CreditCard",
      href: Routes.client.profile.bill,
    },
    { label: "Notification", icon: "Notify", href: "/notifications" },
    { label: "Subscription Setting", icon: "Premium", href: "/subscription" },
    { label: "Security Settings", icon: "Setting", href: "/security-settings" },
    { label: "Legal & Compliance", icon: "leagal_doc", href: "/legal" },
  ];

  const [activeTab, setActiveTab] = useState(menuItems[0].href);

  const user_logout = () => {
    try {
      logout();
      localStorage.removeItem("token");
      router.push(Routes.home);
      showSuccess("Logged Out Successfully!", "success");
    } catch (error) {
      showError(error, "error");
    }
  };

  return (
    <div className="flex flex-col lg:hidden w-full">
      <div className="rounded-2xl flex flex-col w-full">
        <div className="flex flex-col gap-5">
          {/* ---------- Profile Header ---------- */}
          <div className="flex justify-between items-center px-4 py-4 border border-[#F2F2F2] rounded-lg shadow">
            <div className="flex items-center gap-2">
              <img
                src={
                  user?.profile_picture ||
                  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                }
                height={50}
                width={50}
                alt="Profile"
                className="size-8 rounded-full bg-gray-800 outline -outline-offset-1 outline-white/10"
              />
              <p>Hi, {user?.name || "User"}!</p>
            </div>

            <Link
              href={Routes.client.home}
              className="bg-primary text-white p-1 rounded text-sm flex items-center gap-1 
              active:scale-95 transition-transform duration-150 hover:scale-105 hover:shadow-md"
            >
              <HomeFilledIcon fontSize="small" /> Home
            </Link>
          </div>

          {/* ---------- Menu Items ---------- */}
          {menuItems.map((item) => {
            const isActive = activeTab === item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setActiveTab(item.href)}
                className={`flex items-center justify-start w-full p-4 border border-[#F2F2F2] rounded-lg transition 
                  ${isActive
                    ? "bg-primary text-white"
                    : "hover:bg-blue-gray-50 text-paragraph"
                  }
                `}
              >
                <SvgIcon name={item.icon} size={19} />
                <span className="ml-4 text-base font-medium tracking-wide">
                  {item.label}
                </span>
              </Link>
            );
          })}

          <Link
            href="/support"
            className="flex items-center justify-start w-full p-4 border border-[#F2F2F2] rounded-lg transition"
          >
            <SvgIcon name="Question" size={19} />
            <span className="ml-4 text-base font-medium tracking-wide text-paragraph">
              Help & Support
            </span>
          </Link>

          <Button
            onClick={user_logout}
            type="button"
            className="flex items-center justify-start w-full p-4 border border-[#F2F2F2] rounded-lg transition text-paragraph"
          >
            <SvgIcon name="Logout" />
            <span className="ml-4 text-base font-medium tracking-wide text-paragraph">
              Sign Out
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
