import api from "@/app/lib/api";

export async function getFreelancerPortfolio() {
  return api.get("api/freelancer/profile/portfolios");
}
export async function addFreelancerPortfolio(data) {
  return api.post("api/freelancer/profile/portfolio", data);
}
export async function updateFreelancerPortfolio(id, data) {
  return api.put(`api/freelancer/profile/portfolio/${id}`, data);
}
export async function deleteFreelancerPortfolio(id) {
  return api.delete(`api/freelancer/profile/portfolio/${id}`);
}
