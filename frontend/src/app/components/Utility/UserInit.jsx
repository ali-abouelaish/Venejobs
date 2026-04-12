"use client";
import { useEffect } from "react";
import userApiStore from "@/stores/userApiStore";

export default function UserFetcher() {
  const fetchProfile = userApiStore((s) => s.fetchProfile);

  
  useEffect(() => {
    fetchProfile();
  }, []);

  return null;
}