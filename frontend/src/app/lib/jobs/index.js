import api from "@/app/lib/api.js";

export async function createJobPost(data) {
  return api.post("api/jobs/create", data);
}

export async function getCategories() {
  return api.get("api/lookup/categories");
}

export async function getSkillsByCategory(data) {
  return api.get(`api/lookup/skills?category=${data}`);
}

export async function getProjectSize() {
  return api.get("api/lookup/project-options/project-sizes");
}

export async function getProjectDuration() {
  return api.get("api/lookup/project-options/durations");
}

export async function getProjectExperienceLevel() {
  return api.get("api/lookup/project-options/experience-levels");
}

export async function getBudgetData() {
  return api.get("api/lookup/budget-types");
}

export async function getJobByClient(page, limit) {
  return api.get(`api/jobs/my-jobs?limit=${limit}&page=${page}`);
}

export async function getAllJobs(page, limit) {
  return api.get(`api/jobs?limit=${limit}&page=${page}`);
}

export async function getJobById(id) {
  return api.get(`api/jobs/${id}`);
}
