"use client";

// import { ROUTES } from "@/app/routes.js";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { signupapi } from "@/app/lib/auth/auth.api";
import Button from "@/app/components/button/Button";

export default function signup() {
  const [formData, setformData] = useState({
    name: "",
    lastname: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await signupapi(formData);
  };

  const handleChange = (e) => {
    setformData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <>
      {/* Main div */}
      <div
        className={`flex ml-120 gap-3  bg-white  p-3 h-[650] w-[1000] mt-40`}
      >
        {/* Right panel for image */}
        <div className=" w-[500] h-[570] mr-4 ">
          <Image
            src="/illustration.jpg"
            alt="side-image"
            width={470}
            height={550}
            style={{ objectFit: "cover", height: 600, width: 500 }}
          />
        </div>

        {/* Left panel for form */}
        <div className=" w-[500] h-[550]">
          {/* For logo and name */}
          {/* <div className="m-4">
                        <h2 className="font-sans font-semibold">Venejobs</h2>
                    </div> */}

          <div className="h-[580] w-[450] m-4 text-center">
            <h1 className="font-bold text-2xl mt-10">Sign Up for an account</h1>
            <p className="font-normal text-sm">send,spent and save smarter</p>

            <div className="flex justify-evenly mt-5 ">
              <Button className="border border-gray-300 w-44 p-1 text-gray-600 rounded cursor-pointer flex gap-1">
                <Image
                  src="/google.png"
                  alt="google image"
                  width={22}
                  height={22}
                />
                Sign in with Google
              </Button>
              <Button className="border border-gray-300 w-44 p-1 text-gray-600 rounded cursor-pointer flex gap-1">
                <Image
                  src="/apple.png"
                  alt="google image"
                  width={22}
                  height={22}
                />
                Sign in with Apple
              </Button>
            </div>

            <div className="flex flex-col  m-4 h-[220] ">
              <form className="flex flex-col mt-2 gap-3" method="post">
                <div className="flex justify-between mt-4"></div>

                <div className="flex justify-center-safe gap-1">
                  <input
                    type="text"
                    placeholder="First Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="bg-gray-50 border border-gray-300  text-black text-sm rounded-lg   block w-full p-2.5 focus:border-gray-300 focus:ring-1 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    name="lastname"
                    value={formData.lastname}
                    onChange={handleChange}
                    className="bg-gray-50 border border-gray-300  text-black text-sm rounded-lg   block w-full p-2.5 focus:border-gray-300 focus:ring-1 focus:outline-none"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300  text-black text-sm rounded-lg   block w-full p-2.5 focus:border-gray-300 focus:ring-1 focus:outline-none"
                />
                <input
                  type="password"
                  placeholder="Password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300  text-black text-sm rounded-lg   block w-full p-2.5 focus:border-gray-300 focus:ring-1 focus:outline-none"
                />
                <span className="text-sm ml-5 w-80">
                  By creaing an account, you agreeing to our{" "}
                  <b> Privacy Policy </b> , and{" "}
                  <b> Electronic Commnucation Policy</b>
                </span>
                <Button
                  className="text-white bg-blue-600 border-2 rounded-2xl w-80 m-auto h-10 cursor-pointer"
                  onClick={handleSubmit}
                >
                  Sign Up
                </Button>
              </form>

              {/* <p className="mt-5">Already have an account? <Link href={"../auth/signin"}><b> Sign in</b></Link></p> */}
              <p className="mt-5">
                Already have an account?{" "}
                <Link href={""}>
                  <b> Sign in</b>
                </Link>
              </p>
            </div>

            {/* Footer */}
            <div className="mt-40 flex justify-between">
              <p className="text-gray-500 text-sm">Privacy policy</p>
              <p className="text-gray-500 text-sm">Copyright 2022</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
