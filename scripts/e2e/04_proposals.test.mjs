import { BACKEND, http, step, summarize, closeSql, expectStatus, createVerifiedUser, authHeader } from "./utils.mjs";

console.log("\n=== PROPOSALS E2E ===\n");

const client = await step("setup: create client", () => createVerifiedUser("client"));
const freelancer = await step("setup: create freelancer", () => createVerifiedUser("freelancer"));
const freelancer2 = await step("setup: create second freelancer", () => createVerifiedUser("freelancer"));

const Hc = client ? { ...authHeader(client.token), "Content-Type": "application/json" } : null;
const Hf = freelancer ? { ...authHeader(freelancer.token), "Content-Type": "application/json" } : null;
const Hf2 = freelancer2 ? { ...authHeader(freelancer2.token), "Content-Type": "application/json" } : null;

let jobId, proposalId1, proposalId2;

try {
  await step("client creates a job", async () => {
    if (!Hc) throw new Error("no client");
    const res = await http("POST", `${BACKEND}/api/jobs/create`, {
      headers: Hc,
      body: {
        title: `E2E Proposal Job ${Date.now()}`,
        category: "Web",
        skills: [{ name: "React", level: "Expert" }],
        project_size: "small",
        duration: "1_4_weeks",
        experience_level: "intermediate",
        budget_type: "fixed",
        budget_amount: 500,
        description: "E2E job description that is long enough to pass minimums.",
      },
    });
    expectStatus(res, 201);
    jobId = res.body?.job?.id;
    if (!jobId) throw new Error("no job id");
  });

  await step("freelancer submits proposal", async () => {
    if (!Hf || !jobId) throw new Error("upstream missing");
    const res = await http("POST", `${BACKEND}/api/proposals`, {
      headers: Hf,
      body: {
        job_id: jobId,
        cover_letter: "I am perfect for this job because reasons.",
        proposed_amount: 450,
        estimated_duration: "1_4_weeks",
      },
    });
    expectStatus(res, 201);
    proposalId1 = res.body?.proposal?.id;
    if (!proposalId1) throw new Error("no proposal id");
  });

  await step("duplicate proposal from same freelancer is rejected", async () => {
    if (!Hf || !jobId) throw new Error("upstream missing");
    const res = await http("POST", `${BACKEND}/api/proposals`, {
      headers: Hf,
      body: { job_id: jobId, cover_letter: "again", proposed_amount: 400, estimated_duration: "1_4_weeks" },
    });
    if (res.status === 201) throw new Error("duplicate accepted");
  });

  await step("second freelancer submits proposal", async () => {
    if (!Hf2 || !jobId) throw new Error("upstream missing");
    const res = await http("POST", `${BACKEND}/api/proposals`, {
      headers: Hf2,
      body: { job_id: jobId, cover_letter: "I am also a candidate.", proposed_amount: 420, estimated_duration: "1_4_weeks" },
    });
    expectStatus(res, 201);
    proposalId2 = res.body?.proposal?.id;
  });

  await step("client (non-freelancer) is rejected from POST /api/proposals", async () => {
    if (!Hc) throw new Error("no client");
    const res = await http("POST", `${BACKEND}/api/proposals`, {
      headers: Hc,
      body: { job_id: jobId, cover_letter: "trying as client", proposed_amount: 100, estimated_duration: "1_4_weeks" },
    });
    if (res.status === 201) throw new Error("client allowed to submit proposal");
  });

  await step("GET /api/proposals/my (freelancer) returns own proposal", async () => {
    if (!Hf) throw new Error("no freelancer");
    const res = await http("GET", `${BACKEND}/api/proposals/my`, { headers: Hf });
    expectStatus(res, 200);
    if (!Array.isArray(res.body?.proposals)) throw new Error("no proposals array");
    if (!res.body.proposals.find((p) => p.id === proposalId1)) throw new Error("own proposal missing");
  });

  await step("GET /api/proposals/my rejects client role", async () => {
    if (!Hc) throw new Error("no client");
    const res = await http("GET", `${BACKEND}/api/proposals/my`, { headers: Hc });
    if (res.status === 200) throw new Error("client allowed to GET /my");
  });

  await step("GET /api/proposals/job/:jobId (client) lists both proposals", async () => {
    if (!Hc || !jobId) throw new Error("upstream missing");
    const res = await http("GET", `${BACKEND}/api/proposals/job/${jobId}`, { headers: Hc });
    expectStatus(res, 200);
    if (!Array.isArray(res.body?.proposals)) throw new Error("no proposals array");
    if (res.body.proposals.length < 2) throw new Error(`expected 2+ proposals, got ${res.body.proposals.length}`);
  });

  await step("non-owner client cannot list proposals for the job", async () => {
    if (!jobId) throw new Error("no jobId");
    const other = await createVerifiedUser("client");
    const res = await http("GET", `${BACKEND}/api/proposals/job/${jobId}`, {
      headers: { ...authHeader(other.token), "Content-Type": "application/json" },
    });
    if (res.status === 200) throw new Error("non-owner allowed to view proposals");
  });

  await step("client accepts proposal → creates order, other proposal auto-rejected", async () => {
    if (!Hc || !proposalId1) throw new Error("upstream missing");
    const res = await http("PATCH", `${BACKEND}/api/proposals/${proposalId1}/accept`, { headers: Hc });
    expectStatus(res, 200);
    if (!res.body?.order?.id) throw new Error("no order returned");
    // Check second proposal is now rejected
    const listRes = await http("GET", `${BACKEND}/api/proposals/job/${jobId}`, { headers: Hc });
    const p2 = listRes.body?.proposals?.find((p) => p.id === proposalId2);
    if (!p2 || p2.status !== "rejected") throw new Error(`other proposal not auto-rejected: ${JSON.stringify(p2)}`);
  });

  await step("accepting already-accepted proposal fails", async () => {
    if (!Hc || !proposalId1) throw new Error("upstream missing");
    const res = await http("PATCH", `${BACKEND}/api/proposals/${proposalId1}/accept`, { headers: Hc });
    if (res.status === 200) throw new Error("re-acceptance allowed");
  });

  await step("submit proposal with weak cover letter fails", async () => {
    if (!Hf) throw new Error("no freelancer");
    const fr = await createVerifiedUser("freelancer");
    const res = await http("POST", `${BACKEND}/api/proposals`, {
      headers: { ...authHeader(fr.token), "Content-Type": "application/json" },
      body: { job_id: jobId, cover_letter: "  ", proposed_amount: 100, estimated_duration: "1_4_weeks" },
    });
    if (res.status === 201) throw new Error("empty cover letter accepted");
  });
} finally {
  summarize();
  await closeSql();
}
