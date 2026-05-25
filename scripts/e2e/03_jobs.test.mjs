import { BACKEND, http, step, summarize, closeSql, expectStatus, createVerifiedUser, authHeader } from "./utils.mjs";

console.log("\n=== JOBS E2E ===\n");

const client = await step("setup: create client", () => createVerifiedUser("client"));
const H = client ? { ...authHeader(client.token), "Content-Type": "application/json" } : null;

let jobId;

try {
  await step("POST /api/jobs/create (valid payload)", async () => {
    if (!H) throw new Error("no client token (upstream failed)");
    const res = await http("POST", `${BACKEND}/api/jobs/create`, {
      headers: H,
      body: {
        title: `E2E Test Job ${Date.now()}`,
        category: "Web Development",
        skills: [{ name: "React", level: "Expert" }, { name: "Node.js", level: "Intermediate" }],
        project_size: "medium",
        duration: "1_4_weeks",
        experience_level: "intermediate",
        budget_type: "fixed",
        budget_amount: 1000,
        description: "This is a detailed description of an E2E test job that satisfies the 20-char minimum.",
      },
    });
    expectStatus(res, 201);
    jobId = res.body?.job?.id;
    if (!jobId) throw new Error(`no job id: ${JSON.stringify(res.body)}`);
  });

  await step("POST /api/jobs/create rejects weak budget (hourly < 5)", async () => {
    if (!H) throw new Error("no client token");
    const res = await http("POST", `${BACKEND}/api/jobs/create`, {
      headers: H,
      body: {
        title: `Bad Budget ${Date.now()}`,
        category: "Web",
        skills: [{ name: "X", level: "Expert" }],
        project_size: "small",
        duration: "1_4_weeks",
        experience_level: "entry",
        budget_type: "hourly",
        budget_amount: 2,
        description: "this description is long enough to pass minimum length",
      },
    });
    if (res.status === 201) throw new Error(`hourly $2 accepted (should reject)`);
  });

  await step("POST /api/jobs/create rejects invalid duration", async () => {
    if (!H) throw new Error("no client token");
    const res = await http("POST", `${BACKEND}/api/jobs/create`, {
      headers: H,
      body: {
        title: `Bad Duration ${Date.now()}`,
        category: "Web",
        skills: [{ name: "X", level: "Expert" }],
        project_size: "small",
        duration: "forever",
        experience_level: "entry",
        budget_type: "fixed",
        budget_amount: 100,
        description: "this description is long enough to pass minimum length",
      },
    });
    if (res.status === 201) throw new Error(`bad duration accepted`);
  });

  await step("GET /api/jobs/:id (auth)", async () => {
    if (!jobId) throw new Error("no jobId");
    const res = await http("GET", `${BACKEND}/api/jobs/${jobId}`, { headers: H });
    expectStatus(res, 200);
    if (!res.body?.job?.id) throw new Error(`no job in detail response`);
  });

  await step("GET /api/jobs (public list)", async () => {
    const res = await http("GET", `${BACKEND}/api/jobs?page=1&limit=5`);
    expectStatus(res, 200);
    if (!Array.isArray(res.body?.jobs)) throw new Error(`no jobs array`);
  });

  await step("GET /api/jobs?skills=React filter returns 200", async () => {
    const res = await http("GET", `${BACKEND}/api/jobs?skills=React`);
    expectStatus(res, 200);
    if (!Array.isArray(res.body?.jobs)) throw new Error(`no jobs array: ${JSON.stringify(res.body).slice(0, 200)}`);
  });

  await step("GET /api/jobs/my-jobs returns the created job", async () => {
    if (!H) throw new Error("no client token");
    const res = await http("GET", `${BACKEND}/api/jobs/my-jobs`, { headers: H });
    expectStatus(res, 200);
    if (!Array.isArray(res.body?.jobs)) throw new Error(`no jobs array`);
    if (jobId && !res.body.jobs.find((j) => j.id === jobId)) {
      throw new Error(`created job ${jobId} not in my-jobs result`);
    }
  });

  await step("PATCH /api/jobs/:id/status to paused", async () => {
    if (!jobId || !H) throw new Error("no jobId/token");
    const res = await http("PATCH", `${BACKEND}/api/jobs/${jobId}/status`, {
      headers: H,
      body: { status: "paused" },
    });
    expectStatus(res, 200);
    if (res.body?.job?.status !== "paused") throw new Error(`status not paused: ${JSON.stringify(res.body?.job)}`);
  });

  await step("PATCH /api/jobs/:id/status rejects invalid status", async () => {
    if (!jobId || !H) throw new Error("no jobId/token");
    const res = await http("PATCH", `${BACKEND}/api/jobs/${jobId}/status`, {
      headers: H,
      body: { status: "totally-fake" },
    });
    if (res.status === 200) throw new Error(`invalid status accepted`);
  });

  await step("PATCH /api/jobs/:id/active toggles is_active=false", async () => {
    if (!jobId || !H) throw new Error("no jobId/token");
    const res = await http("PATCH", `${BACKEND}/api/jobs/${jobId}/active`, {
      headers: H,
      body: { is_active: false },
    });
    expectStatus(res, 200);
    if (res.body?.job?.is_active !== false) throw new Error(`is_active not false`);
  });

  await step("PATCH /api/jobs/:id/active rejects non-boolean", async () => {
    if (!jobId || !H) throw new Error("no jobId/token");
    const res = await http("PATCH", `${BACKEND}/api/jobs/${jobId}/active`, {
      headers: H,
      body: { is_active: "no" },
    });
    if (res.status === 200) throw new Error(`non-boolean accepted`);
  });

  await step("PATCH /api/jobs/:id/status from non-owner is rejected", async () => {
    if (!jobId) throw new Error("no jobId");
    const other = await createVerifiedUser("client");
    const res = await http("PATCH", `${BACKEND}/api/jobs/${jobId}/status`, {
      headers: { ...authHeader(other.token), "Content-Type": "application/json" },
      body: { status: "closed" },
    });
    if (res.status === 200) throw new Error(`non-owner accepted to change status`);
  });
} finally {
  summarize();
  await closeSql();
}
