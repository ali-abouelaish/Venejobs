"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import Button from "@/app/components/button/Button";
import { Routes } from "@/app/routes";
import useToastStore from "@/app/store/toastStore";
import userApiStore from "@/app/store/userStore";

export default function signin() {
  const [formData, setformData] = useState({ email: "", password: "" });
  const showError = useToastStore.getState().showError;
  const storeLogin = userApiStore((s) => s.login);

  const handleClick = async (e) => {
    e.preventDefault();
    try {
      const res = await storeLogin(formData);
      const token = res?.data?.token;
      if (token) {
        localStorage.setItem("token", token);
        document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
      }
      const role = res?.data?.user?.role_name;
      if (role === "client") {
        window.location.href = Routes.client.home;
      } else if (role === "freelancer") {
        window.location.href = Routes.freelancer.home;
      } else {
        window.location.href = Routes.home;
      }
    } catch (error) {
      showError(error?.response?.data?.message || error?.message || "Login failed");
    }
  };

  const handleChange = (e) => {
    setformData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <>
      {/* Main div */}
      <div className={`flex ml-120 gap-3 bg-white p-3 h-[650] w-[1000] mt-40`}>
        {/* Left panel for form */}
        <div className=" w-[500] h-[570] ">
          {/* For logo and name */}
          <div className="m-4 flex gap-2 items-center">
            <Image
              src="/logo.png"
              height={50}
              style={{ height: 40, width: 40 }}
              width={50}
              alt="logo image"
            />
            <h2 className="font-sans font-semibold text-gray-400">Venejobs</h2>
          </div>

          <div className="h-[560] w-[430]  m-10 text-center">
            <h1 className="font-bold text-gray-800  text-2xl mt-10">
              Sign in to overpay
            </h1>
            <p className="font-normal text-sm m-1">
              send,spent and save smarter
            </p>

            <div className="flex justify-evenly items-center mt-5">
              <Button className="border-1 border-gray-300 w-44 p-1 text-gray-600 rounded cursor-pointer flex gap-1">
                <Image
                  src="/google.png"
                  alt="google image"
                  width={22}
                  height={22}
                />
                Sign in with Google
              </Button>
              <Button className="border-1 border-gray-300 w-44 p-1 text-gray-600 rounded cursor-pointer flex gap-1">
                <Image
                  src="/apple.png"
                  alt="google image"
                  width={22}
                  height={22}
                />
                Sign in with Apple
              </Button>
            </div>

            <div className="flex flex-col  m-4  h-[200] ">
              <form className="flex flex-col mt-4 gap-3">
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300  text-black text-sm rounded-lg   block w-full p-2.5 focus:border-gray-300 focus:ring-1 focus:outline-none"
                  placeholder="Email"
                  required
                />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="bg-gray-50 border border-gray-300  text-black text-sm rounded-lg   block w-full p-2.5 focus:border-gray-300 focus:ring-1 focus:outline-none"
                />
                <Button
                  className="bg-blue-700 text-white h-8 rounded"
                  type="submit"
                  onClick={handleClick}
                >
                  Sign In
                </Button>
              </form>

              <p className="mt-5">
                Dont have an account?{" "}
                <Link href={Routes.auth.signup}>
                  <b>Sign up</b>
                </Link>
              </p>
              <div className="flex justify-around mt-4">
                <div className="flex justify-around gap-2">
                  <input type="checkbox" value="Remember me" />
                  <label>Remember me</label>
                </div>
                <Link href="" className="text-blue-600">
                  Forget Password?
                </Link>
              </div>
            </div>
            {/* Footer */}
            <div className="mt-35 flex justify-between">
              <p className="text-gray-500">Privacy policy</p>
              <p className="text-gray-500">Copyright 2022</p>
            </div>
          </div>
        </div>

        {/* Right panel for image */}
        <div className=" w-[500] h-[570] ml-4">
          <Image
            src="/illustration.jpg"
            alt="side-image"
            width={470}
            height={500}
            style={{ objectFit: "contain", height: 600, width: 490 }}
          />
        </div>
      </div>
    </>
  );
}
