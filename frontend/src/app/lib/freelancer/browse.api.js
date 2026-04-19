import api from "@/app/lib/api";

export async function browseFreelancers(page = 1, limit = 10, skill = "") {
  const params = new URLSearchParams({ page, limit });
  if (skill) params.set("skill", skill);
  return api.get(`api/freelancer/browse?${params}`);
}

export async function getPublicFreelancerProfile(userId) {
  return api.get(`api/freelancer/${userId}/profile`);
}
