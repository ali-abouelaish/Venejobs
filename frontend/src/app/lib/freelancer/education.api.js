import api from "@/app/lib/api";

export async function getFreelancerEducation() {
  return api.get("api/freelancer/profile/educations");
}
export async function addFreelancerEducation(data) {
  return api.post("api/freelancer/profile/education", data);
}
export async function updateFreelancerEducation(id, data) {
  return api.put(`api/freelancer/profile/education/${id}`, data);
}
export async function deleteFreelancerEducation(id) {
  return api.delete(`api/freelancer/profile/education/${id}`);
}
