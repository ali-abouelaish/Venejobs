"use client";
import Link from "next/link";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import userApiStore from "@/app/store/userStore";
import toastStore from "@/app/store/toastStore";
import { Routes } from "@/app/routes";
import { useRouter, usePathname } from "next/navigation";

export default function DesktopLinks() {
  const router = useRouter();
  const { user, logout, fetchProfile } = userApiStore();
  const showSuccess = toastStore.getState().showSuccess;
  const showError = toastStore.getState().showError;
  const pathname = usePathname();

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

  const Links = [
    {
      label: "Contact Info",
      href: Routes.freelancer.profile.info,
      icon: "Preview",
      active: true,
    },
    {
      label: "Billing & Payments",
      href: Routes.freelancer.profile.billing,
      icon: "CreditCard",
    },
    {
      label: "Notification",
      href: "",
      icon: "Notify",
    },
    {
      label: "Get Paid",
      href: "",
      icon: "Premium",
    },
    {
      label: "Security Settings",
      href: "",
      icon: "Setting",
    },
    {
      label: "Legal & Compliance",
      href: "",
      icon: "leagal_doc",
    },
  ];

  return (
    <div className="hidden lg:flex flex-col w-[350px]">
      <nav className="flex flex-col border border-[#F2F2F2] rounded-2xl py-7 px-5 h-full">
        {/* Sidebar Links */}
        <div className="flex flex-col w-full gap-4">
          {Links.map((item, idx) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={idx}
                href={item.href}
                className={`
                  flex items-center gap-4 w-full px-3 py-3 rounded-lg font-medium 
                  text-base leading-none transition-all tracking-wide
                  ${isActive
                    ? "bg-secondary text-white"
                    : "text-paragraph hover:bg-[#F2F4F7]"
                  }
                `}
              >
                <SvgIcon name={item.icon} size={20} className="text-inherit" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col gap-2 mt-auto pt-5">
          <Link
            href=""
            className="flex items-center gap-4 text-base font-medium text-paragraph py-3 px-3 hover:bg-[#F2F4F7] rounded-lg tracking-wide"
          >
            <SvgIcon name="Question" size={20} className="text-inherit" />
            Help & Support
          </Link>

          <div
            onClick={user_logout}
            className="flex items-center gap-4 text-base font-medium text-paragraph py-3 px-3 hover:bg-[#F2F4F7] rounded-lg cursor-pointer tracking-wide"
          >
            <SvgIcon name="Logout" size={17} className="text-inherit" />
            Sign Out
          </div>
        </div>
      </nav>
    </div>
  );
}
