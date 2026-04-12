import api from "@/app/lib/api";

export async function getAllSkills() {
  return api.get("api/skills");
}
export async function getFreelancerSkills() {
  return api.get("api/freelancer/skills");
}
export async function addfreelancerSkills(data) {
  return api.post("api/freelancer/skill", data);
}
export async function updatefreelancerSkills(id, data) {
  return api.put(`api/freelancer/skill/${id}`, data);
}
export async function deleteFreelanceSkill(id) {
  return api.delete(`api/freelancer/skill/${id}`);
}
