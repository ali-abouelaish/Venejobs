"use client";
import Button from "@/app/components/button/Button";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import { Routes } from "@/app/routes";
import userApiStore from "@/app/store/userStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toastStore from "@/app/store/toastStore";
import HomeFilledIcon from "@mui/icons-material/HomeFilled";
import { useState } from "react";

export default function MobileView() {
  const router = useRouter();
  const { user, logout, fetchProfile } = userApiStore();
  const showSuccess = toastStore.getState().showSuccess;
  const showError = toastStore.getState().showError;
  const user_logout = () => {
    try {
      logout();
      localStorage.removeItem("token");
      router.push(Routes.home);
      //currenly just removing from localstorage but still in cookie
      showSuccess("Logged Out Successfully!", "success");
    } catch (error) {
      showError(error, "error");
    }
  };

  const freelancerMenu = [
    {
      label: "Contact Info",
      icon: "Preview",
      href: Routes.freelancer.profile.info,
    },
    {
      label: "Billing & Payments",
      icon: "CreditCard",
      href: Routes.freelancer.profile.billing,
    },
    {
      label: "Notification",
      icon: "Notify",
      href: "/notifications",
    },
    {
      label: "Get Paid",
      icon: "Premium",
      href: "/get-paid",
    },
    {
      label: "Security Settings",
      icon: "Setting",
      href: "/security-settings",
    },
    {
      label: "Legal & Compliance",
      icon: "leagal_doc",
      href: "/legal",
    },
  ];

  const [activeTab, setActiveTab] = useState(freelancerMenu[0].label);

  return (
    <>
      <div className="flex flex-col lg:hidden w-full">
        <div className="rounded-2xl flex flex-col gap-44 p-1 w-full ">
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center px-4 py-4 border border-[#F2F2F2] rounded-lg shadow">
              <div className="flex items-center gap-2">
                <img
                  src={
                    user?.profile_picture ||
                    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  }
                  alt=""
                  height={50}
                  width={50}
                  className="size-8 rounded-full bg-gray-800 outline -outline-offset-1 outline-white/10"
                />
                <p>Hi, {user?.name} !</p>
              </div>

              <Link
                className="bg-secondary text-white p-1 rounded text-sm 
             active:scale-95 transition-transform duration-150 hover:scale-105 hover:shadow-md flex items-center gap-1"
                href={Routes.freelancer.get_started}
              >
                <HomeFilledIcon fontSize="small" />
                Home
              </Link>
            </div>
            {freelancerMenu.map((item) => {
              const isActive = activeTab === item.label;
              return (
                <div
                  key={item.label}
                  role="button"
                  className={`flex items-center w-full py-6 h-[45px] border border-gray-200 rounded ${isActive ? "bg-secondary text-white" : "text-paragraph"
                    }`}
                  onClick={() => setActiveTab(item.label)}
                >
                  <Link
                    href={item.href}
                    className="flex items-center lg:w-[260px] gap-4 text-lg px-6"
                  >
                    <SvgIcon name={item.icon} /> {item.label}
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-8">
            <Link
              href={""}
              className="flex items-center md:w-full justify-start px-10 py-2 gap-5 lg:w-64  text-lg text-center  text-paragraph border border-gray-200 rounded shadow active:scale-95 transition-transform duration-150 hover:scale-105 hover:shadow-md"
            >
              <SvgIcon name="Question" />
              Help & Support
            </Link>
            <button
              onClick={() => user_logout()}
              type="button"
              className="flex items-center md:w-full justify-start px-10 py-2 gap-5 lg:w-64  text-lg text-center  text-paragraph mb-4 border border-gray-200 rounded shadow active:scale-95 transition-transform duration-150 hover:scale-105 hover:shadow-md"
            >
              <SvgIcon name="Logout" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
