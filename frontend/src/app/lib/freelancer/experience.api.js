import api from "@/app/lib/api";

export async function getFreelancerExperience() {
  return api.get("api/freelancer/profile/experiences");
}
export async function addFreelancerExperience(data) {
  return api.post("api/freelancer/profile/experience", data);
}
export async function updateFreelancerExperience(id, data) {
  return api.put(`api/freelancer/profile/experiences/${id}`, data);
}
export async function deleteFreelancerExperience(id) {
  return api.delete(`api/freelancer/profile/experience/${id}`);
}
