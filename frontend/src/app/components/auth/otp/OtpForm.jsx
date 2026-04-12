"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import OtpModal from "./OtpModal";
import OtpInputs from "./OtpInputs";

import toastStore from "@/app/store/toastStore";
import userApiStore from "@/app/store/userStore";
import Button from "../../button/Button";
import Loader from "../../common/Loader";
import { Routes } from "@/app/routes";

export default function OtpForm({
  email,
  setverifyCode,
  setActiveModal,
  setUserEmail,
}) {
  const verifyOtpAndSetToken = userApiStore((s) => s.verifyOtpAndSetToken);
  const verify_resetCode = userApiStore((s) => s.verify_resetCode);
  const resendOtp = userApiStore((s) => s.resendOtp);

  const router = useRouter();

  const [otp, setOtp] = useState(Array(6).fill(""));
  const [finalOtp, setFinalOtp] = useState("");

  const [seconds, setSeconds] = useState(10 * 60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);

  const inputRefs = useRef([]);

  const showSuccess = toastStore.getState().showSuccess;
  const showError = toastStore.getState().showError;

  // timer
  useEffect(() => {
    if (seconds <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => setSeconds((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  // auto focus
  useEffect(() => {
    if (inputRefs.current[0]) inputRefs.current[0].focus();
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  // Verify OTP
  const VerifyAccount = async () => {
    try {
      setLoading(true);

      if (setverifyCode === "signup-code") {
        const res = await verifyOtpAndSetToken({ email, code: finalOtp });
        const token = res.data.token;

        if (res.success) {
          showSuccess(res.message);
          await axios.post("/api/set-token", { token });
          localStorage.setItem("token", token);

          const role = res.data.user.role_name;
          router.push(
            role === "freelancer"
              ? Routes.freelancer.home
              : role === "client"
                ? Routes.client.home
                : "/admin"
          );
        } else {
          showError(res.message);
        }
      } else {
        const res = await verify_resetCode({ email, code: finalOtp });
        if (res.success) {
          setActiveModal("new_password");
          setUserEmail(email);
          showSuccess(res.message);
        }
      }
    } catch (error) {
      showError(error?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const res = await resendOtp({ email });
      if (res.success) showSuccess(res.message);

      setSeconds(10 * 60);
      setCanResend(false);
    } catch (error) {
      showError(error?.response?.data?.message || "Failed to resend OTP");
    }
  };

  return (
    <OtpModal email={email} setActiveModal={setActiveModal}>
      <OtpInputs
        otp={otp}
        setOtp={setOtp}
        setFinalOtp={setFinalOtp}
        inputRefs={inputRefs}
      />

      {/* Verify Button */}
      <div className="flex justify-center mt-5">
        <Button
          onClick={VerifyAccount}
          disabled={loading}
          variant="primaryOutlined"
          className="mt-4 sm:mt-5"
        >
          {loading ? (
            <Loader size={18} border={3} color="white" />
          ) : (
            "Verify Account"
          )}
        </Button>

      </div>

      {/* Timer */}
      <div className="flex flex-col items-center mt-3">
        {canResend ? (
          <Button
            className="text-primary cursor-pointer"
            onClick={handleResend}
          >
            Resend Code
          </Button>
        ) : (
          <>
            <span className="text-gray-500 mt-1 sm:mt-2 text-sm">
              Resend code in
            </span>
            <strong className="mt-1 text-base">{formatTime(seconds)}</strong>
          </>
        )}
      </div>
    </OtpModal>
  );
}
