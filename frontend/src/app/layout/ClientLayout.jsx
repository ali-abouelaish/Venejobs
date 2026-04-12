"use client";
import Footer from "../components/Footer/Footer";
import HomeNavbar from "../components/Header/HomeNavbar";
import { useEffect } from "react";
import userApiStore from "../store/userStore";
import { footerClientConfig } from "../utils/footer/footerClientConfig";

export default function ClientLayout({ children }) {
  const { fetchProfile } = userApiStore();

  useEffect(() => {
    fetchProfile()
  }, []);
  return (
    <>
      <HomeNavbar />
      {children}
      <Footer {...footerClientConfig} />
    </>
  );
}
