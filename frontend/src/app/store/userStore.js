import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  forgetPassword,
  getUserProfile,
  login,
  resendVerificationCode,
  resetPassword,
  signupapi,
  UpdateProfile,
  UpdateProfilePhoto,
  verifyAccount,
  verifyResetCode,
} from "../lib/auth/auth.api";
import useToastStore from "./toastStore";
import { Routes } from "@/app/routes";

const userApiStore = create(
  persist(
    (set, get) => ({
      user: null,
      loading: false,
      error: null,
      fetched: false,
      login: async (credentials) => {
        set({ loading: true, error: null });

        try {
          const res = await login(credentials);

          const { user, token } = res.data;

          set({
            user,
            token,
            loading: false,
          });

          return res;
        } catch (err) {
          set({
            error:
              err?.response?.data?.message || err.message || "Login failed",
            loading: false,
          });
          throw err; // allow component to handle errors too
        }
      },
      signup: async (formData) => {
        set({ loading: true, error: null });
        try {
          const res = await signupapi(formData);
          const { user, token } = res.data;

          set({ user, loading: false, fetched: true });
          if (typeof window !== "undefined")
            localStorage.setItem("token", token);

          return res;
        } catch (err) {
          set({
            error:
              err?.response?.data?.message || err.message || "Signup failed",
            loading: false,
          });
          throw err;
        }
      },
      logout: () => {
        set({
          user: { id: null, name: "", email: "" },
          token: null,
          loading: false,
          error: null,
        });
        if (typeof window !== "undefined") localStorage.removeItem("token");
      },
      fetchProfile: async () => {
        set({ loading: true });

        try {
          const res = await getUserProfile();
          set({
            user: res.data.user,
            loading: false,
            fetched: true,
          });
          return res;
        } catch (err) {
          set({
            user: null,
            token: null,
            loading: false,
            fetched: true,
          });
          if (err.response?.status === 401) {
            set({ token: undefined, user: undefined });
            get().logout();
            const { showError } = useToastStore.getState();
            showError(
              "Session Expired",
              "Your session has timed out. Please log in again.",
            );
            setTimeout(() => {
              window.location.href = Routes.home;
            }, 500);
            return false;
          }
        }
      },
      verifyOtpAndSetToken: async (otpData) => {
        set({ loading: true, error: null });
        try {
          const res = await verifyAccount(otpData);
          const { token } = res.data;

          set({ token, loading: false, fetched: true });
          if (typeof window !== "undefined")
            localStorage.setItem("token", token);

          return res;
        } catch (err) {
          set({
            error:
              err?.response?.data?.message ||
              err.message ||
              "OTP verification failed",
            loading: false,
          });
          throw err;
        }
      },
      resendOtp: async (otpData) => {
        set({ loading: true, error: null });
        try {
          const res = await resendVerificationCode(otpData);
          set({ loading: false, fetched: true });

          return res;
        } catch (err) {
          set({
            error:
              err?.response?.data?.message ||
              err.message ||
              "Resned OTP failed",
            loading: false,
          });
          throw err;
        }
      },
      forgetPassword: async (data) => {
        set({ loading: true, error: null });
        try {
          const res = await forgetPassword(data);

          set({ loading: false, fetched: true });

          return res;
        } catch (err) {
          set({
            error:
              err?.response?.data?.message ||
              err.message ||
              "Forget password failed",
            loading: false,
          });
          throw err;
        }
      },
      resetPassword: async (data) => {
        set({ loading: true, error: null });
        try {
          const res = await resetPassword(data);

          set({ loading: false, fetched: true });

          return res;
        } catch (err) {
          set({
            error:
              err?.response?.data?.message ||
              err.message ||
              "Reset password failed",
            loading: false,
          });
          throw err;
        }
      },
      verify_resetCode: async (data) => {
        set({ loading: true, error: null });
        try {
          const res = await verifyResetCode(data);

          set({ loading: false, fetched: true });

          return res;
        } catch (err) {
          set({
            error:
              err?.response?.data?.message ||
              err.message ||
              "Verification of reset code failed",
            loading: false,
          });
          throw err;
        }
      },
      updateProfile: async (data) => {
        set({ loading: true, error: null });
        try {
          const res = await UpdateProfile(data);

          set({ loading: false, fetched: true });

          return res;
        } catch (err) {
          set({
            error:
              err?.response?.data?.message ||
              err.message ||
              "Update profile failed",
            loading: false,
          });
          throw err;
        }
      },
      UpdateProfilePhoto: async (data) => {
        set({ loading: true, error: null });
        try {
          const res = await UpdateProfilePhoto(data);
          set({ loading: false, fetched: true });

          return res;
        } catch (err) {
          set({
            error:
              err?.response?.data?.message ||
              err.message ||
              "Update profile photo failed",
            loading: false,
          });
          throw err;
        }
      },
    }),
    {
      name: "user-store",
    },
  ),
);

export default userApiStore;
