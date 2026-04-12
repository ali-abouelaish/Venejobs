import api from "@/app/lib/api";

export async function getFreelancerLanguage() {
  return api.get("api/freelancer/profile/languages");
}
export async function addFreelanceLanguage(data) {
  return api.post("api/freelancer/profile/language", data);
}
export async function updateFreelanceLanguage(id, data) {
  return api.put(`api/freelancer/profile/language/${id}`, data);
}
export async function deleteFreelanceLanguage(id) {
  return api.delete(`api/freelancer/profile/language/${id}`);
}
