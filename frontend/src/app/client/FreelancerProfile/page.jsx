"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FreelancerProfileRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/client/freelancerList");
  }, [router]);
  return null;
}
