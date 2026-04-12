import api from "@/app/lib/api";

export async function SaveFreelanceDetails(data) {
  return api.post("api/freelancer/profile", data);
}
export async function getFreelanceDetails() {
  return api.get("api/freelancer/profile");
}
