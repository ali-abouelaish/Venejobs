import api from "@/app/lib/api";

const PER_SECTION = 3;
const FETCH_PAGE_SIZE = 50;

const lower = (v) => (v == null ? "" : String(v).toLowerCase());

function jobMatches(job, q) {
  if (job.title && lower(job.title).includes(q)) return true;
  if (job.description && lower(job.description).includes(q)) return true;
  if (job.category && lower(job.category).includes(q)) return true;
  if (Array.isArray(job.skills) && job.skills.some((s) => lower(s).includes(q))) return true;
  return false;
}

function freelancerMatches(f, q) {
  const name = f?.User?.name;
  if (name && lower(name).includes(q)) return true;
  if (f.professional_title && lower(f.professional_title).includes(q)) return true;
  if (f.overview && lower(f.overview).includes(q)) return true;
  const skills = Array.isArray(f.skills) ? f.skills : [];
  if (skills.some((s) => lower(s?.skill_name).includes(q))) return true;
  return false;
}

function clientHrefForJob(jobId, role) {
  return role === 2
    ? `/client/JobDetail/${jobId}`
    : `/freelancer/JobDetail/?id=${jobId}`;
}

async function searchJobs(query, role) {
  try {
    const res = await api.get(`api/jobs?limit=${FETCH_PAGE_SIZE}&page=1`);
    const jobs = Array.isArray(res?.jobs) ? res.jobs : [];
    const q = lower(query);
    return jobs
      .filter((j) => jobMatches(j, q))
      .slice(0, PER_SECTION)
      .map((j) => ({
        id: j.id,
        title: j.title,
        subtitle: [j.category, j.budget_amount && `${j.budget_type ?? ""} ${j.budget_amount}`]
          .filter(Boolean)
          .join(" · "),
        href: clientHrefForJob(j.id, role),
      }));
  } catch {
    return [];
  }
}

async function searchFreelancers(query) {
  try {
    const res = await api.get(`api/freelancer/browse?limit=${FETCH_PAGE_SIZE}&page=1`);
    const freelancers = Array.isArray(res?.freelancers) ? res.freelancers : [];
    const q = lower(query);
    return freelancers
      .filter((f) => freelancerMatches(f, q))
      .slice(0, PER_SECTION)
      .map((f) => ({
        id: f.user_id,
        title: f?.User?.name ?? "Freelancer",
        subtitle: [
          f.professional_title,
          f.hourly_rate != null ? `$${f.hourly_rate}/hr` : null,
        ]
          .filter(Boolean)
          .join(" · "),
        href: `/client/FreelancerProfile/${f.user_id}`,
        imageUrl: f?.User?.profile_picture ?? null,
      }));
  } catch {
    return [];
  }
}

async function searchServices(query, signal) {
  try {
    const params = new URLSearchParams({
      q: query,
      limit: String(PER_SECTION),
      offset: "0",
    });
    const res = await fetch(`/api/services?${params.toString()}`, {
      signal,
      credentials: "include",
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items = Array.isArray(data?.items) ? data.items : [];
    return items.map((s) => ({
      id: s.id,
      title: s.title,
      subtitle: [
        s.category,
        s.basePrice != null ? `from $${s.basePrice}` : null,
        s.freelancerName,
      ]
        .filter(Boolean)
        .join(" · "),
      href: `/services/${s.id}`,
      imageUrl: s.coverImageUrl ?? null,
    }));
  } catch {
    return [];
  }
}

/**
 * Run all three searches in parallel. A failure in one section returns
 * an empty list for that section, never poisons the others.
 */
export async function searchAll(query, { role, signal } = {}) {
  const q = (query ?? "").trim();
  if (q.length < 2) return { jobs: [], freelancers: [], services: [] };

  const [jobs, freelancers, services] = await Promise.all([
    searchJobs(q, role),
    searchFreelancers(q),
    searchServices(q, signal),
  ]);
  return { jobs, freelancers, services };
}
