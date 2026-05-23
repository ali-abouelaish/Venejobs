"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Routes } from "@/app/routes";
import useToastStore from "@/app/store/toastStore";
import userApiStore from "@/app/store/userStore";

function isSafeNext(value) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//");
}

function SignInForm() {
  const [formData, setformData] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const showError = useToastStore.getState().showError;
  const storeLogin = userApiStore((s) => s.login);
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const reason = searchParams.get("reason");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await storeLogin(formData);
      const token = res?.data?.token;
      if (token) {
        localStorage.setItem("token", token);
        document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
      }
      const role = res?.data?.user?.role_name;
      if (isSafeNext(next)) {
        window.location.href = next;
        return;
      }
      if (role === "client") {
        window.location.href = Routes.client.home;
      } else if (role === "freelancer") {
        window.location.href = Routes.freelancer.home;
      } else if (role === "admin") {
        window.location.href = Routes.admin.home;
      } else {
        window.location.href = Routes.home;
      }
    } catch (error) {
      showError(error?.response?.data?.message || error?.message || "Login failed");
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setformData({ ...formData, [e.target.name]: e.target.value });
  };

  const signupHref = isSafeNext(next)
    ? `${Routes.auth.signup}?next=${encodeURIComponent(next)}`
    : Routes.auth.signup;

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white">
      {/* Left brand panel */}
      <div className="relative hidden lg:flex lg:w-1/2 bg-primary overflow-hidden">
        <Image
          src="/bg-image.png"
          alt=""
          fill
          priority
          className="object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-primary/60" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full text-white">
          <Link href={Routes.home} className="flex items-center gap-2 w-fit">
            <Image src="/logo.png" alt="Venejobs" width={40} height={40} />
            <span className="font-semibold text-lg tracking-wide">Venejobs</span>
          </Link>
          <div className="flex flex-col gap-6 max-w-md">
            <h2 className="text-3xl xl:text-4xl font-bold leading-tight tracking-normal">
              Effortless hiring, inspired work with Venejobs.
            </h2>
            <p className="text-white/80 text-base xl:text-lg">
              Sign back in to manage your projects, talk to clients, and get paid.
            </p>
          </div>
          <p className="text-white/60 text-sm">
            &copy; {new Date().getFullYear()} Venejobs. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
            <Image src="/logo.png" alt="Venejobs" width={36} height={36} />
            <span className="font-semibold text-primary text-lg">Venejobs</span>
          </div>

          {reason === "auth" && (
            <div
              role="alert"
              className="mb-6 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary"
            >
              Please sign in to continue. New here?{" "}
              <Link href={signupHref} className="font-semibold underline">
                Create an account
              </Link>
              .
            </div>
          )}

          <div className="mb-8">
            <h1 className="text-heading font-bold text-3xl tracking-tight">
              Welcome back
            </h1>
            <p className="text-paragraph text-sm mt-2">
              Sign in to your Venejobs account to continue.
            </p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-heading">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="bg-white border border-lightborder text-heading text-sm rounded-lg w-full p-3 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-sm font-medium text-heading">
                  Password
                </label>
                <Link href="/auth/forgot-password" className="text-xs text-primary font-medium hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="bg-white border border-lightborder text-heading text-sm rounded-lg w-full p-3 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                required
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-paragraph cursor-pointer">
              <input type="checkbox" className="rounded border-lightborder text-primary focus:ring-primary" />
              Remember me
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white h-11 rounded-lg font-semibold tracking-wide transition-all cursor-pointer mt-2"
            >
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-paragraph mt-6">
            Don't have an account?{" "}
            <Link href={signupHref} className="text-primary font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function signin() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
