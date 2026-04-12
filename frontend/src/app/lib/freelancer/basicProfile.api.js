import api from "@/app/lib/api";

export async function getFreelanceBasicprofile() {
  return api.get("api/freelancer/profile/basic");
}
export async function updateFreelanceBasicprofile(data) {
  return api.patch("api/freelancer/profile/basic", data);
}
