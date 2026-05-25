import { FRONTEND, step, summarize, closeSql, expectStatus, createVerifiedUser, sql } from "./utils.mjs";

console.log("\n=== CONTRACTS E2E ===\n");

function cookieHeader(token) {
  return { Cookie: `token=${token}` };
}

async function nextFetch(path, opts = {}) {
  const headers = { ...(opts.headers ?? {}) };
  let body = opts.body;
  if (body && typeof body === "object" && !(body instanceof Buffer)) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
    body = JSON.stringify(body);
  }
  const res = await fetch(`${FRONTEND}${path}`, { method: opts.method ?? "GET", headers, body });
  const ct = res.headers.get("content-type") ?? "";
  let parsed = null;
  if (ct.includes("application/json")) {
    try { parsed = await res.json(); } catch { parsed = null; }
  } else {
    parsed = await res.text();
  }
  return { status: res.status, ok: res.ok, body: parsed };
}

const client = await step("setup: create client", () => createVerifiedUser("client"));
const freelancer = await step("setup: create freelancer", () => createVerifiedUser("freelancer"));

let conversationId, contractId, contract2Id;

try {
  await step("create direct conversation between client and freelancer", async () => {
    if (!client || !freelancer) throw new Error("upstream missing");
    const res = await nextFetch("/api/conversations/direct", {
      method: "POST",
      headers: cookieHeader(client.token),
      body: { freelancerId: freelancer.id, forceDirect: true },
    });
    if (res.status !== 201 && res.status !== 200) throw new Error(`status ${res.status}`);
    conversationId = res.body?.conversationId;
    if (!conversationId) throw new Error("no convo");
  });

  await step("POST /api/contracts creates draft", async () => {
    if (!conversationId || !client) throw new Error("upstream missing");
    const deadline = new Date(Date.now() + 30 * 86400000).toISOString();
    const res = await nextFetch("/api/contracts", {
      method: "POST",
      headers: cookieHeader(client.token),
      body: {
        conversationId,
        title: "E2E Test Contract",
        scope: "Build a simple test deliverable.",
        deliverables: "One working prototype.",
        price: 100000,
        currency: "gbp",
        deadline,
        paymentTerms: "On completion",
        additionalTerms: "None",
      },
    });
    expectStatus(res, 201);
    contractId = res.body?.contract?.id;
    if (!contractId) throw new Error(`no contract id: ${JSON.stringify(res.body)}`);
    if (res.body.contract.status !== "draft") {
      throw new Error(`expected draft, got ${res.body.contract.status}`);
    }
  });

  await step("POST /api/contracts rejects past deadline", async () => {
    if (!conversationId || !client) throw new Error("upstream missing");
    const past = new Date(Date.now() - 86400000).toISOString();
    const res = await nextFetch("/api/contracts", {
      method: "POST",
      headers: cookieHeader(client.token),
      body: {
        conversationId,
        title: "Past Deadline",
        scope: "x",
        deliverables: "y",
        price: 100,
        currency: "gbp",
        deadline: past,
        paymentTerms: "on completion",
      },
    });
    if (res.status === 201) throw new Error("past deadline accepted");
  });

  await step("POST /api/contracts rejects missing fields", async () => {
    if (!conversationId || !client) throw new Error("upstream missing");
    const res = await nextFetch("/api/contracts", {
      method: "POST",
      headers: cookieHeader(client.token),
      body: { conversationId, title: "x" },
    });
    if (res.status !== 400) throw new Error(`want 400, got ${res.status}`);
  });

  await step("POST /api/contracts forbidden for non-participant", async () => {
    if (!conversationId) throw new Error("no convo");
    const intruder = await createVerifiedUser("client");
    const deadline = new Date(Date.now() + 7 * 86400000).toISOString();
    const res = await nextFetch("/api/contracts", {
      method: "POST",
      headers: cookieHeader(intruder.token),
      body: {
        conversationId, title: "intruder", scope: "x", deliverables: "y",
        price: 50, currency: "gbp", deadline, paymentTerms: "no",
      },
    });
    if (res.status !== 403) throw new Error(`want 403, got ${res.status}`);
  });

  await step("POST /api/contracts/:id/submit moves draft → pending_review", async () => {
    if (!contractId || !client) throw new Error("upstream missing");
    const res = await nextFetch(`/api/contracts/${contractId}/submit`, {
      method: "POST",
      headers: cookieHeader(client.token),
    });
    expectStatus(res, 200);
    if (res.body?.contract?.status !== "pending_review") {
      throw new Error(`expected pending_review, got ${res.body?.contract?.status}`);
    }
  });

  await step("POST /api/contracts/:id/submit on non-draft → 409", async () => {
    if (!contractId || !client) throw new Error("upstream missing");
    const res = await nextFetch(`/api/contracts/${contractId}/submit`, {
      method: "POST",
      headers: cookieHeader(client.token),
    });
    if (res.status !== 409) throw new Error(`want 409, got ${res.status}`);
  });

  await step("POST /api/contracts/:id/sign rejects wrong typed name", async () => {
    if (!contractId || !freelancer) throw new Error("upstream missing");
    const res = await nextFetch(`/api/contracts/${contractId}/sign`, {
      method: "POST",
      headers: cookieHeader(freelancer.token),
      body: { typedName: "not my name at all" },
    });
    if (res.status !== 400) throw new Error(`want 400, got ${res.status}`);
  });

  await step("POST /api/contracts/:id/request-revision moves to revision_requested", async () => {
    if (!contractId || !freelancer) throw new Error("upstream missing");
    const res = await nextFetch(`/api/contracts/${contractId}/request-revision`, {
      method: "POST",
      headers: cookieHeader(freelancer.token),
    });
    expectStatus(res, 200);
    if (res.body?.contract?.status !== "revision_requested") {
      throw new Error(`expected revision_requested, got ${res.body?.contract?.status}`);
    }
  });

  await step("decline from revision_requested → declined", async () => {
    if (!contractId || !client) throw new Error("upstream missing");
    const res = await nextFetch(`/api/contracts/${contractId}/decline`, {
      method: "POST",
      headers: cookieHeader(client.token),
    });
    expectStatus(res, 200);
    if (res.body?.contract?.status !== "declined") {
      throw new Error(`expected declined, got ${res.body?.contract?.status}`);
    }
  });

  // Second contract for cancel flow
  await step("create a second contract for cancel flow", async () => {
    if (!conversationId || !client) throw new Error("upstream missing");
    const deadline = new Date(Date.now() + 14 * 86400000).toISOString();
    const res = await nextFetch("/api/contracts", {
      method: "POST",
      headers: cookieHeader(client.token),
      body: {
        conversationId,
        title: "Cancellable Contract",
        scope: "Cancel me",
        deliverables: "n/a",
        price: 5000,
        currency: "gbp",
        deadline,
        paymentTerms: "On completion",
      },
    });
    expectStatus(res, 201);
    contract2Id = res.body?.contract?.id;
  });

  await step("non-creator cannot cancel", async () => {
    if (!contract2Id || !freelancer) throw new Error("upstream missing");
    const res = await nextFetch(`/api/contracts/${contract2Id}/cancel`, {
      method: "POST",
      headers: cookieHeader(freelancer.token),
    });
    if (res.status !== 403) throw new Error(`want 403, got ${res.status}`);
  });

  await step("creator cancels draft contract", async () => {
    if (!contract2Id || !client) throw new Error("upstream missing");
    const res = await nextFetch(`/api/contracts/${contract2Id}/cancel`, {
      method: "POST",
      headers: cookieHeader(client.token),
    });
    expectStatus(res, 200);
    if (res.body?.contract?.status !== "cancelled") {
      throw new Error(`expected cancelled, got ${res.body?.contract?.status}`);
    }
  });

  await step("GET /api/contracts/my returns both contracts", async () => {
    if (!client) throw new Error("no client");
    const res = await nextFetch("/api/contracts/my", { headers: cookieHeader(client.token) });
    expectStatus(res, 200);
    const ids = (res.body?.contracts ?? []).map((c) => c.id);
    if (!ids.includes(contractId)) throw new Error(`contract1 missing from my list`);
    if (!ids.includes(contract2Id)) throw new Error(`contract2 missing from my list`);
  });

  await step("GET /api/contracts/:id returns full contract for participant", async () => {
    if (!contractId || !freelancer) throw new Error("upstream missing");
    const res = await nextFetch(`/api/contracts/${contractId}`, { headers: cookieHeader(freelancer.token) });
    expectStatus(res, 200);
    if (!res.body?.contract?.id) throw new Error(`no contract in response: ${JSON.stringify(res.body)}`);
  });

  await step("GET /api/contracts/:id rejects non-participant", async () => {
    if (!contractId) throw new Error("no contract");
    const intruder = await createVerifiedUser("client");
    const res = await nextFetch(`/api/contracts/${contractId}`, { headers: cookieHeader(intruder.token) });
    if (res.status !== 403 && res.status !== 404) {
      throw new Error(`want 403/404, got ${res.status}`);
    }
  });

  // Full two-signature flow on a fresh contract
  await step("create + submit third contract for full accept flow", async () => {
    if (!conversationId || !client) throw new Error("upstream missing");
    const deadline = new Date(Date.now() + 21 * 86400000).toISOString();
    const create = await nextFetch("/api/contracts", {
      method: "POST",
      headers: cookieHeader(client.token),
      body: {
        conversationId,
        title: "Two-sig Contract",
        scope: "Sign both",
        deliverables: "Both signatures",
        price: 50000,
        currency: "gbp",
        deadline,
        paymentTerms: "On completion",
      },
    });
    expectStatus(create, 201);
    const cid = create.body.contract.id;
    const submit = await nextFetch(`/api/contracts/${cid}/submit`, { method: "POST", headers: cookieHeader(client.token) });
    expectStatus(submit, 200);
    globalThis.__c3 = cid;
  });

  await step("first signature keeps contract pending_review", async () => {
    const cid = globalThis.__c3;
    if (!cid || !client) throw new Error("upstream missing");
    const res = await nextFetch(`/api/contracts/${cid}/sign`, {
      method: "POST",
      headers: cookieHeader(client.token),
      body: { typedName: client.name },
    });
    expectStatus(res, 200);
    if (res.body?.contract?.status !== "pending_review") {
      throw new Error(`expected pending_review after 1 sig, got ${res.body?.contract?.status}`);
    }
  });

  await step("second signature transitions to accepted", async () => {
    const cid = globalThis.__c3;
    if (!cid || !freelancer) throw new Error("upstream missing");
    const res = await nextFetch(`/api/contracts/${cid}/sign`, {
      method: "POST",
      headers: cookieHeader(freelancer.token),
      body: { typedName: freelancer.name },
    });
    expectStatus(res, 200);
    if (res.body?.contract?.status !== "accepted") {
      throw new Error(`expected accepted after 2 sigs, got ${res.body?.contract?.status}`);
    }
  });

  await step("cancel after accepted is forbidden", async () => {
    const cid = globalThis.__c3;
    if (!cid || !client) throw new Error("upstream missing");
    const res = await nextFetch(`/api/contracts/${cid}/cancel`, { method: "POST", headers: cookieHeader(client.token) });
    if (res.status !== 400) throw new Error(`want 400, got ${res.status}`);
  });
} finally {
  summarize();
  await closeSql();
}
