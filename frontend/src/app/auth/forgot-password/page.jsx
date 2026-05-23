"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { Routes } from "@/app/routes";
import useToastStore from "@/app/store/toastStore";
import userApiStore from "@/app/store/userStore";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState("email"); // email | code | password | success
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const showError = useToastStore.getState().showError;
  const showSuccess = useToastStore.getState().showSuccess;

  const forgetPassword = userApiStore((s) => s.forgetPassword);
  const verify_resetCode = userApiStore((s) => s.verify_resetCode);
  const resetPassword = userApiStore((s) => s.resetPassword);

  async function submitEmail(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await forgetPassword({ email: email.trim().toLowerCase() });
      if (res?.success) {
        showSuccess("Reset code sent", res.message || "Check your inbox for a 6-digit code.");
        setStep("code");
      } else {
        showError(res?.message || "Could not send reset email.");
      }
    } catch (err) {
      showError(err?.response?.data?.message || err?.message || "Could not send reset email.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitCode(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await verify_resetCode({ email: email.trim().toLowerCase(), code: code.trim() });
      if (res?.success) {
        setStep("password");
      } else {
        showError(res?.message || "Invalid or expired code.");
      }
    } catch (err) {
      showError(err?.response?.data?.message || err?.message || "Invalid or expired code.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitPassword(e) {
    e.preventDefault();
    if (password !== confirm) {
      showError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await resetPassword({
        email: email.trim().toLowerCase(),
        newPassword: password,
      });
      if (res?.success) {
        setStep("success");
      } else {
        showError(res?.message || "Could not reset password.");
      }
    } catch (err) {
      showError(err?.response?.data?.message || err?.message || "Could not reset password.");
    } finally {
      setSubmitting(false);
    }
  }

  async function resendCode() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await forgetPassword({ email: email.trim().toLowerCase() });
      if (res?.success) {
        showSuccess("Code resent", res.message || "Check your inbox.");
      } else {
        showError(res?.message || "Could not resend code.");
      }
    } catch (err) {
      showError(err?.response?.data?.message || err?.message || "Could not resend code.");
    } finally {
      setSubmitting(false);
    }
  }

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
              Reset your password in a few quick steps.
            </h2>
            <p className="text-white/80 text-base xl:text-lg">
              We&apos;ll email you a 6-digit code to verify it&apos;s really you.
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
          <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
            <Image src="/logo.png" alt="Venejobs" width={36} height={36} />
            <span className="font-semibold text-primary text-lg">Venejobs</span>
          </div>

          <StepIndicator step={step} />

          {step === "email" && (
            <>
              <div className="mb-8">
                <h1 className="text-heading font-bold text-3xl tracking-tight">
                  Forgot password?
                </h1>
                <p className="text-paragraph text-sm mt-2">
                  Enter the email tied to your account and we&apos;ll send you a 6-digit code.
                </p>
              </div>
              <form className="flex flex-col gap-4" onSubmit={submitEmail}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
                <SubmitButton submitting={submitting}>Send reset code</SubmitButton>
              </form>
            </>
          )}

          {step === "code" && (
            <>
              <div className="mb-8">
                <h1 className="text-heading font-bold text-3xl tracking-tight">
                  Check your email
                </h1>
                <p className="text-paragraph text-sm mt-2">
                  Enter the 6-digit code we sent to <strong className="text-heading">{email}</strong>.
                </p>
              </div>
              <form className="flex flex-col gap-4" onSubmit={submitCode}>
                <FieldLabel htmlFor="code">Verification code</FieldLabel>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  required
                  autoFocus
                  className="tracking-[0.4em] text-center text-lg"
                />
                <SubmitButton submitting={submitting} disabled={code.length !== 6}>
                  Verify code
                </SubmitButton>
                <div className="flex justify-between items-center text-sm mt-1">
                  <button
                    type="button"
                    onClick={() => setStep("email")}
                    className="text-paragraph hover:text-primary transition-colors"
                  >
                    &larr; Use a different email
                  </button>
                  <button
                    type="button"
                    onClick={resendCode}
                    disabled={submitting}
                    className="text-primary font-medium hover:underline disabled:opacity-60"
                  >
                    Resend code
                  </button>
                </div>
              </form>
            </>
          )}

          {step === "password" && (
            <>
              <div className="mb-8">
                <h1 className="text-heading font-bold text-3xl tracking-tight">
                  Set a new password
                </h1>
                <p className="text-paragraph text-sm mt-2">
                  At least 8 characters, with 1 uppercase, 1 lowercase, 1 number and 1 special character.
                </p>
              </div>
              <form className="flex flex-col gap-4" onSubmit={submitPassword}>
                <FieldLabel htmlFor="password">New password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={8}
                  autoFocus
                />
                <FieldLabel htmlFor="confirm">Confirm new password</FieldLabel>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  minLength={8}
                />
                <SubmitButton submitting={submitting}>Reset password</SubmitButton>
              </form>
            </>
          )}

          {step === "success" && (
            <>
              <div className="mb-8">
                <div className="w-14 h-14 rounded-full bg-secondary/15 flex items-center justify-center mb-5">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5bbb7b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h1 className="text-heading font-bold text-3xl tracking-tight">
                  Password reset
                </h1>
                <p className="text-paragraph text-sm mt-2">
                  You can now sign in with your new password.
                </p>
              </div>
              <Link
                href={Routes.auth.signin}
                className="block w-full bg-primary hover:bg-primary/90 text-white h-11 rounded-lg font-semibold tracking-wide text-center leading-11 transition-all"
              >
                Back to sign in
              </Link>
            </>
          )}

          {step !== "success" && (
            <p className="text-center text-sm text-paragraph mt-6">
              Remembered it?{" "}
              <Link href={Routes.auth.signin} className="text-primary font-semibold hover:underline">
                Back to sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ step }) {
  if (step === "success") return null;
  const order = ["email", "code", "password"];
  const current = order.indexOf(step);
  return (
    <div className="flex items-center gap-2 mb-6">
      {order.map((s, i) => (
        <div key={s} className="flex-1 flex items-center gap-2">
          <div
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= current ? "bg-primary" : "bg-lightborder"
            }`}
          />
        </div>
      ))}
    </div>
  );
}

function FieldLabel({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-heading -mb-2">
      {children}
    </label>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={`bg-white border border-lightborder text-heading text-sm rounded-lg w-full p-3 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all ${className}`}
      {...props}
    />
  );
}

function SubmitButton({ submitting, disabled, children }) {
  return (
    <button
      type="submit"
      disabled={submitting || disabled}
      className="bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white h-11 rounded-lg font-semibold tracking-wide transition-all cursor-pointer mt-2"
    >
      {submitting ? "Please wait…" : children}
    </button>
  );
}
