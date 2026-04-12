"use client";

import { useState } from "react";
import Link from "next/link";
import SvgIcon from "../Utility/SvgIcon";
import Footerdropdown from "./FooterDropdown";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

export default function Footer({ logoName, socialLinks, sections }) {
  const [open, setOpen] = useState(false);

  return (
    <footer className="bg-footerclient relative">
      <div className="w-full max-w-[90%] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1240px] 2xl:max-w-[1600px] mx-auto">
        {/* 🔹 Top Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
          <div className="flex items-center gap-2">
            <SvgIcon name={logoName} />
            <h2 className="text-white font-extrabold text-lg">Venejobs</h2>
          </div>

          <div className="flex items-center gap-4">
            <p className="text-white font-medium text-base">Follow Us</p>
            {socialLinks.length > 0 &&
              socialLinks.map((item) => (
                <Link key={item.name} href={item.url} target="_blank">
                  <SvgIcon name={item.name} />
                </Link>
              ))}
          </div>
        </div>

        <hr className="border-white/20" />

        {/* 🔹 Middle Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-10">
          {sections.map((section) => (
            <FooterColumn
              key={section.title}
              title={section.title}
              links={section.links}
            />
          ))}

          {/* Subscribe */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-white">Subscribe</h2>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg p-2">
              <input
                type="email"
                placeholder="Your Email Address"
                id="email"
                autoComplete="email"
                className="flex-1 bg-transparent outline-none text-sm text-black"
              />
              <button className="text-primary font-bold px-4 py-2">Send</button>
            </div>
          </div>
        </div>

        <hr className="border-white/20" />

        {/* 🔹 Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-6">
          <span className="text-sm text-white/70 tracking-wide text-center md:text-left">
            Copyright <b>Venejobs</b>. 2024 All Rights Reserved.
          </span>

          <div className="flex items-center gap-5 xl:gap-10">
            <a className="text-sm text-white/70 tracking-wide underline underline-offset-4 cursor-pointer">
              Terms of policy
            </a>
            <a className="text-sm text-white/70 tracking-wide underline underline-offset-4 cursor-pointer">
              Privacy Policy
            </a>

            {/* Language Dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpen(!open)}
                className="bg-white/5 text-white px-6 py-2 rounded-lg flex items-center gap-2 text-sm tracking-wide"
              >
                English
                <KeyboardArrowDownIcon
                  fontSize="small"
                  className={`transition-transform ${open ? "rotate-180" : ""}`}
                />
              </button>

              {open && (
                <div className="absolute right-0 bottom-full mb-2 rounded-lg shadow bg-neutral-900 z-50">
                  <Footerdropdown />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* 🔹 Column Component */
function FooterColumn({ title, links }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-white">{title}</h2>
      <ul className="space-y-4 text-white/70 text-[15px">
        {links.map((item) => (
          <li key={item.label}>
            <Link href={item.url} className="hover:underline">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
