"use client";

import { useEffect } from "react";
import HomeNavbarFreelance from "../components/Header/HomeNavbarFreelance";
import userApiStore from "../store/userStore";
import Footer from "../components/Footer/Footer";
import { footerFreelanceConfig } from "../utils/footer/footerFreelanceConfig";

export default function FreelancerLayout({ children }) {
  const { fetchProfile } = userApiStore();

  useEffect(() => {
    fetchProfile()
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <HomeNavbarFreelance />

      {/* MAIN CONTENT */}
      <main className="flex-1">
        {children}
      </main>

      <Footer {...footerFreelanceConfig} />
    </div>
  );
}
