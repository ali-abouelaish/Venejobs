"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import userApiStore from "../../store/userStore";
import toastStore from "../../store/toastStore";
import { Routes } from "../../routes";
import SvgIcon from "../Utility/SvgIcon";
import { useClickOutside } from "@/hooks/useClickOutside";
import Link from "next/link";
import Image from "next/image";
import SearchInput from "../common/SearchInput";

export default function ProfileDropdown() {
  const router = useRouter();
  const [showDropdown, setshowDropdown] = useState(false);
  const { user, loading, error, fetchProfile } = userApiStore();
  const user_logout = userApiStore((s) => s.logout);
  const showSuccess = toastStore.getState().showSuccess;
  const showError = toastStore.getState().showError;
  const [search, setSearch] = useState("");

  const logout = () => {
    try {
      user_logout();
      localStorage.removeItem("token");

      router.push(Routes.home);
      showSuccess("Logged Out Successfully!", "success");
    } catch (error) {
      showError(error, "error");
    }
  };

  const dropdownRef = useRef(null);

  useClickOutside(dropdownRef, () => {
    setshowDropdown(false);
  });

  if (loading) {
    return (
      <div className="hidden sm:hidden lg:block">
        <div className="flex items-center gap-6 md:gap-4">
          <div className="h-10 w-56 bg-gray-200 rounded-4xl animate-pulse" />

          <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse" />

          <div className="h-10 w-10 bg-gray-300 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }


  return (
    <div className="hidden sm:hidden lg:block ">
      <div className="flex items-center gap-6 md:gap-4">
        <div className="relative ">
          <span className="absolute inset-y-0 px-4  flex items-center ">
            <SvgIcon name="Search_Icon" />
          </span>
          <div className="w-56">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className=""
            />
          </div>
        </div>
        <SvgIcon name="Question" />

        <button
          type="button"
          className="relative rounded-full p-1 text-paragraph focus:outline-2 focus:outline-offset-2 focus:outline-indigo-500"
        >
          <span className="absolute -inset-1.5"></span>
          <span className="sr-only">View notifications</span>
          <SvgIcon name="Notification" size={25} />
        </button>

        <div className="relative inline-block" ref={dropdownRef}>
          <button
            className="relative flex rounded-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            onClick={() => setshowDropdown((prev) => !prev)}
          >
            <span className="absolute -inset-1.5"></span>
            <span className="sr-only">Open user menu</span>
            <Image
              src={
                "/home/Group_Home.png"
                // user?.profile_picture ||
              }
              alt=""
              height={"100"}
              width={"100"}
              className="size-10 rounded-full bg-gray-800 outline -outline-offset-1 outline-white/10"
            />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-3 w-48 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-black/5 overflow-hidden">
              {/* User name */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {user?.name}
                </p>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <Link
                  href={
                    user?.role_id === 2
                      ? Routes.client.profile.info
                      : Routes.freelancer.profileData
                  }
                  className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Profile
                </Link>

                <Link
                  href="#"
                  className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Settings
                </Link>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* Logout */}
              <button
                onClick={() => logout()}
                className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition cursor-pointer"
              >
                Sign out
              </button>
            </div>

          )}
        </div>
      </div>
    </div>
  );
}
