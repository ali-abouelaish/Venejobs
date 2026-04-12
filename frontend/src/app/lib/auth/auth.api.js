import api from "../api";

export async function signupapi(data) {
  return api.post("api/auth/signup", data);
}

export async function login(data) {
  return api.post("api/auth/login", data);
}

export async function verifyAccount(data) {
  return api.post("api/auth/verify-email", data);
}

export async function resendVerificationCode(data) {
  return api.post("api/auth/resend-verification", data);
}

export async function forgetPassword(data) {
  return api.post("api/auth/forgot-password", data);
}

export async function verifyResetCode(data) {
  return api.post("api/auth/verify-reset-code", data);
}

export async function resetPassword(data) {
  return api.post("api/auth/reset-password", data);
}

export async function getUserProfile() {
  return api.get("api/auth/profile");
}

export async function UpdateProfile(data) {
  return api.put("api/auth/profile",data);
}

export async function UpdateProfilePhoto(data) {
  return api.post("api/auth/profile-picture",data);
}