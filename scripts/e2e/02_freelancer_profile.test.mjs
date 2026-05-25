import { BACKEND, http, step, softStep, summarize, closeSql, expectStatus, createVerifiedUser, authHeader } from "./utils.mjs";

console.log("\n=== FREELANCER PROFILE E2E ===\n");

const fr = await step("setup: create verified freelancer", () => createVerifiedUser("freelancer"));
const H = { ...authHeader(fr.token), "Content-Type": "application/json" };

try {
  // Bug probe: payload missing `experiences` field (validator iterates it unconditionally)
  await softStep("POST /api/freelancer/profile without experiences (should not 500)", async () => {
    const res = await http("POST", `${BACKEND}/api/freelancer/profile`, {
      headers: H,
      body: {
        professional_title: "FE Engineer",
        skills: [{ name: "React" }],
        languages: [{ language: "English", proficiency: "native" }],
        portfolios: [{ title: "site", project_url: "https://example.com" }],
        // experiences / educations OMITTED on purpose
      },
    });
    if (res.status >= 500) {
      throw new Error(`server crashed with ${res.status} (validator likely iterates undefined arrays): ${JSON.stringify(res.body)}`);
    }
    if (res.status !== 200 && res.status !== 400) {
      throw new Error(`unexpected ${res.status}: ${JSON.stringify(res.body)}`);
    }
  });

  await step("POST /api/freelancer/profile (full payload)", async () => {
    const res = await http("POST", `${BACKEND}/api/freelancer/profile`, {
      headers: H,
      body: {
        professional_title: "Full-stack Developer",
        overview: "E2E test profile",
        hourly_rate: 75,
        country: "UK",
        city: "London",
        skills: [
          { name: "React", level: "expert" },
          { name: "Node.js", level: "intermediate" },
        ],
        experiences: [
          {
            job_title: "Senior Dev",
            company: "Acme",
            location: "Remote",
            city: "London",
            start_month: "1",
            start_year: 2022,
            is_current: true,
            description: "Did things",
          },
        ],
        educations: [
          {
            institution_name: "Uni",
            degree: "BSc",
            field_of_study: "CS",
            type_of_education: "bachelor",
            start_date: "2018-09-01",
            end_date: "2022-06-01",
            description: "Studied",
          },
        ],
        languages: [
          { language: "English", proficiency: "native" },
          { language: "Spanish", proficiency: "conversational" },
        ],
        portfolios: [
          { title: "Portfolio Site", project_url: "https://example.com", description: "My site" },
        ],
      },
    });
    expectStatus(res, 200);
    if (res.body?.success !== true) throw new Error(`success=false: ${JSON.stringify(res.body)}`);
  });

  await step("GET /api/freelancer/profile returns full nested data", async () => {
    const res = await http("GET", `${BACKEND}/api/freelancer/profile`, { headers: H });
    expectStatus(res, 200);
    const p = res.body?.data?.freelancerProfile;
    if (!p) throw new Error(`no freelancerProfile in response`);
    if (p.professional_title !== "Full-stack Developer") throw new Error(`title mismatch`);
    if (!Array.isArray(p.skills) || p.skills.length !== 2) throw new Error(`skills count !== 2: ${JSON.stringify(p.skills)}`);
    if (!Array.isArray(p.experiences) || p.experiences.length !== 1) throw new Error(`experiences count !== 1`);
    if (!Array.isArray(p.educations) || p.educations.length !== 1) throw new Error(`educations count !== 1`);
    if (!Array.isArray(p.languages) || p.languages.length !== 2) throw new Error(`languages count !== 2`);
    if (!Array.isArray(p.portfolios) || p.portfolios.length !== 1) throw new Error(`portfolios count !== 1`);
  });

  let skillId, expId, eduId, langId, portId;

  await step("POST /api/freelancer/skill (add)", async () => {
    const res = await http("POST", `${BACKEND}/api/freelancer/skill`, {
      headers: H,
      body: { skill_name: "TypeScript", level: "expert" },
    });
    expectStatus(res, 201);
    skillId = res.body?.data?.id;
    if (!skillId) throw new Error(`no skill id`);
  });

  await step("PUT /api/freelancer/skill/:id (update)", async () => {
    const res = await http("PUT", `${BACKEND}/api/freelancer/skill/${skillId}`, {
      headers: H,
      body: { skill_name: "TypeScript", level: "intermediate" },
    });
    expectStatus(res, 200);
    if (res.body?.data?.level !== "intermediate") throw new Error(`level not updated`);
  });

  await step("DELETE /api/freelancer/skill/:id", async () => {
    const res = await http("DELETE", `${BACKEND}/api/freelancer/skill/${skillId}`, { headers: H });
    expectStatus(res, 200);
  });

  await step("POST /api/freelancer/profile/experience", async () => {
    const res = await http("POST", `${BACKEND}/api/freelancer/profile/experience`, {
      headers: H,
      body: {
        job_title: "Lead Dev",
        company: "Beta Co",
        location: "Hybrid",
        city: "London",
        start_month: "6",
        start_year: 2023,
        is_current: false,
        end_month: "12",
        end_year: 2024,
        description: "Led things",
      },
    });
    expectStatus(res, 201);
    expId = res.body?.data?.id;
  });

  await step("DELETE /api/freelancer/profile/experience/:id", async () => {
    const res = await http("DELETE", `${BACKEND}/api/freelancer/profile/experience/${expId}`, { headers: H });
    expectStatus(res, 200);
  });

  await step("POST /api/freelancer/profile/education", async () => {
    const res = await http("POST", `${BACKEND}/api/freelancer/profile/education`, {
      headers: H,
      body: {
        institution_name: "MIT",
        degree: "MSc",
        field_of_study: "AI",
        type_of_education: "master",
        start_date: "2022-09-01",
        end_date: "2024-06-01",
        description: "Studied AI",
      },
    });
    expectStatus(res, 201);
    eduId = res.body?.data?.id;
  });

  await step("DELETE /api/freelancer/profile/education/:id", async () => {
    const res = await http("DELETE", `${BACKEND}/api/freelancer/profile/education/${eduId}`, { headers: H });
    expectStatus(res, 200);
  });

  await step("POST /api/freelancer/profile/language", async () => {
    const res = await http("POST", `${BACKEND}/api/freelancer/profile/language`, {
      headers: H,
      body: { language: "French", proficiency: "basic" },
    });
    expectStatus(res, 201);
    langId = res.body?.data?.id;
  });

  await step("DELETE /api/freelancer/profile/language/:id", async () => {
    const res = await http("DELETE", `${BACKEND}/api/freelancer/profile/language/${langId}`, { headers: H });
    expectStatus(res, 200);
  });

  await step("POST /api/freelancer/profile/portfolio", async () => {
    const res = await http("POST", `${BACKEND}/api/freelancer/profile/portfolio`, {
      headers: H,
      body: { title: "Another", project_url: `https://example.com/${Date.now()}`, description: "another project" },
    });
    expectStatus(res, 201);
    portId = res.body?.data?.id;
  });

  await step("DELETE /api/freelancer/profile/portfolio/:id", async () => {
    const res = await http("DELETE", `${BACKEND}/api/freelancer/profile/portfolio/${portId}`, { headers: H });
    expectStatus(res, 200);
  });

  await step("GET /api/freelancer/:userId/profile (public, after profile_completed=true)", async () => {
    const res = await http("GET", `${BACKEND}/api/freelancer/${fr.id}/profile`);
    expectStatus(res, 200);
    if (!res.body?.profile) throw new Error(`no profile in response`);
  });

  await step("GET /api/freelancer/browse returns freelancer list", async () => {
    const res = await http("GET", `${BACKEND}/api/freelancer/browse?page=1&limit=10`);
    expectStatus(res, 200);
    if (!Array.isArray(res.body?.freelancers)) throw new Error(`no freelancers array`);
  });

  await step("client role rejected from /api/freelancer/profile (PATCH basic)", async () => {
    const client = await createVerifiedUser("client");
    const res = await http("PATCH", `${BACKEND}/api/freelancer/profile/basic`, {
      headers: { ...authHeader(client.token), "Content-Type": "application/json" },
      body: { overview: "should fail" },
    });
    if (res.status !== 403 && res.status !== 401) {
      throw new Error(`adminOrFreelancer should reject client (got ${res.status})`);
    }
  });
} finally {
  summarize();
  await closeSql();
}
