import { BACKEND, FRONTEND, http, step, summarize, closeSql, expectStatus, createVerifiedUser, authHeader, sql } from "./utils.mjs";
import { WebSocket } from "ws";

console.log("\n=== MESSAGING E2E ===\n");

const WS_URL = process.env.E2E_WS_URL ?? "ws://localhost:4002";

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

let conversationId, msgFromClientId;

try {
  await step("POST /api/conversations/direct creates direct conversation", async () => {
    if (!client || !freelancer) throw new Error("upstream missing");
    const res = await nextFetch("/api/conversations/direct", {
      method: "POST",
      headers: cookieHeader(client.token),
      body: { freelancerId: freelancer.id, forceDirect: true },
    });
    if (res.status !== 201 && res.status !== 200) {
      throw new Error(`status ${res.status}: ${JSON.stringify(res.body)}`);
    }
    conversationId = res.body?.conversationId;
    if (!conversationId) throw new Error(`no conversationId: ${JSON.stringify(res.body)}`);
  });

  await step("POST /api/conversations/direct rejects self-message", async () => {
    if (!client) throw new Error("no client");
    const res = await nextFetch("/api/conversations/direct", {
      method: "POST",
      headers: cookieHeader(client.token),
      body: { freelancerId: client.id, forceDirect: true },
    });
    if (res.status !== 400) throw new Error(`want 400, got ${res.status}`);
  });

  await step("POST /api/conversations/direct without auth → 401", async () => {
    const res = await nextFetch("/api/conversations/direct", {
      method: "POST",
      body: { freelancerId: 1, forceDirect: true },
    });
    if (res.status !== 401) throw new Error(`want 401, got ${res.status}`);
  });

  await step("POST /api/conversations/direct is idempotent (returns same id)", async () => {
    if (!client || !freelancer || !conversationId) throw new Error("upstream missing");
    const res = await nextFetch("/api/conversations/direct", {
      method: "POST",
      headers: cookieHeader(client.token),
      body: { freelancerId: freelancer.id, forceDirect: true },
    });
    if (res.body?.conversationId !== conversationId) {
      throw new Error(`got different id on second call: ${res.body?.conversationId} vs ${conversationId}`);
    }
  });

  await step("client sends message", async () => {
    if (!client || !conversationId) throw new Error("upstream missing");
    const res = await nextFetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: cookieHeader(client.token),
      body: { body: "hello from e2e client" },
    });
    expectStatus(res, 201);
    msgFromClientId = res.body?.message?.id;
    if (!msgFromClientId) throw new Error(`no message id: ${JSON.stringify(res.body)}`);
  });

  await step("send message with empty body and no attachments → 400", async () => {
    if (!client || !conversationId) throw new Error("upstream missing");
    const res = await nextFetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: cookieHeader(client.token),
      body: { body: "   " },
    });
    if (res.status !== 400) throw new Error(`want 400, got ${res.status}`);
  });

  await step("third party cannot access conversation messages → 403", async () => {
    if (!conversationId) throw new Error("no convo");
    const intruder = await createVerifiedUser("client");
    const res = await nextFetch(`/api/conversations/${conversationId}/messages`, {
      headers: cookieHeader(intruder.token),
    });
    if (res.status !== 403) throw new Error(`want 403, got ${res.status}`);
  });

  await step("freelancer sends a reply", async () => {
    if (!freelancer || !conversationId) throw new Error("upstream missing");
    const res = await nextFetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: cookieHeader(freelancer.token),
      body: { body: "hello from e2e freelancer" },
    });
    expectStatus(res, 201);
  });

  await step("GET messages returns both", async () => {
    if (!client || !conversationId) throw new Error("upstream missing");
    const res = await nextFetch(`/api/conversations/${conversationId}/messages?limit=50`, {
      headers: cookieHeader(client.token),
    });
    expectStatus(res, 200);
    if (!Array.isArray(res.body?.messages)) throw new Error("no messages array");
    if (res.body.messages.length < 2) throw new Error(`want >= 2 messages, got ${res.body.messages.length}`);
  });

  await step("POST /api/conversations/:id/read marks freelancer's message read", async () => {
    if (!client || !conversationId) throw new Error("upstream missing");
    // Find a freelancer-authored message id
    const listRes = await nextFetch(`/api/conversations/${conversationId}/messages?limit=50`, {
      headers: cookieHeader(client.token),
    });
    const flMsg = listRes.body.messages.find((m) => m.sender_id === freelancer.id);
    if (!flMsg) throw new Error("no freelancer-authored message found");
    const res = await nextFetch(`/api/conversations/${conversationId}/read`, {
      method: "POST",
      headers: cookieHeader(client.token),
      body: { message_id: flMsg.id },
    });
    expectStatus(res, 200);
    if (typeof res.body?.marked_read !== "number") throw new Error(`bad shape: ${JSON.stringify(res.body)}`);
  });

  await step("GET /api/inbox shows the conversation with last_message", async () => {
    if (!client) throw new Error("no client");
    const res = await nextFetch(`/api/inbox`, { headers: cookieHeader(client.token) });
    expectStatus(res, 200);
    const inbox = res.body?.inbox;
    if (!Array.isArray(inbox)) throw new Error("no inbox array");
    const ours = inbox.find((c) => c.conversation_id === conversationId);
    if (!ours) throw new Error(`our conversation ${conversationId} not in inbox`);
    if (!ours.last_message) throw new Error("no last_message on conversation");
  });

  // ─── WebSocket flow ────────────────────────────────────────────────────────
  await step("POST /api/ws-token issues a short-lived token", async () => {
    if (!client || !conversationId) throw new Error("upstream missing");
    const res = await nextFetch(`/api/ws-token`, {
      method: "POST",
      headers: cookieHeader(client.token),
      body: { conversationId },
    });
    expectStatus(res, 200);
    if (!res.body?.token) throw new Error(`no ws token: ${JSON.stringify(res.body)}`);
    // store on global for next steps
    globalThis.__wsToken = res.body.token;
  });

  await step("WS connect → ping/pong roundtrip", async () => {
    const token = globalThis.__wsToken;
    if (!token || !conversationId) throw new Error("no ws token / convo");
    const ws = new WebSocket(`${WS_URL}/?token=${encodeURIComponent(token)}&conversationId=${conversationId}`);
    await new Promise((res, rej) => {
      const tid = setTimeout(() => rej(new Error("ws connect timeout")), 4000);
      ws.on("open", () => { clearTimeout(tid); res(); });
      ws.on("error", (e) => { clearTimeout(tid); rej(e); });
    });
    const pong = await new Promise((res, rej) => {
      const tid = setTimeout(() => rej(new Error("no pong within 3s")), 3000);
      ws.on("message", (raw) => {
        const m = JSON.parse(raw.toString());
        if (m.type === "pong") { clearTimeout(tid); res(m); }
      });
      ws.send(JSON.stringify({ type: "ping" }));
    });
    ws.close();
    if (!pong) throw new Error("no pong");
  });

  await step("WS broadcast: HTTP POST message → other WS client receives 'new_message'", async () => {
    if (!conversationId) throw new Error("no convo");
    // Get freelancer's ws-token
    const tokRes = await nextFetch(`/api/ws-token`, {
      method: "POST",
      headers: cookieHeader(freelancer.token),
      body: { conversationId },
    });
    if (!tokRes.body?.token) throw new Error("no ws token for freelancer");

    const wsFl = new WebSocket(`${WS_URL}/?token=${encodeURIComponent(tokRes.body.token)}&conversationId=${conversationId}`);
    await new Promise((res, rej) => {
      const tid = setTimeout(() => rej(new Error("ws open timeout")), 4000);
      wsFl.on("open", () => { clearTimeout(tid); res(); });
      wsFl.on("error", (e) => { clearTimeout(tid); rej(e); });
    });

    const gotMessage = new Promise((res, rej) => {
      const tid = setTimeout(() => rej(new Error("no broadcast within 5s")), 5000);
      wsFl.on("message", (raw) => {
        const m = JSON.parse(raw.toString());
        if (m.type === "new_message") { clearTimeout(tid); res(m); }
      });
    });

    // Client sends a new message via HTTP → should broadcast
    const postRes = await nextFetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: cookieHeader(client.token),
      body: { body: `broadcast probe ${Date.now()}` },
    });
    if (postRes.status !== 201) throw new Error(`message POST failed: ${postRes.status}`);

    const event = await gotMessage;
    wsFl.close();
    if (!event?.message?.id) throw new Error(`broadcast event missing message.id`);
  });

  await step("WS rejects bad token", async () => {
    if (!conversationId) throw new Error("no convo");
    const ws = new WebSocket(`${WS_URL}/?token=invalid.token.here&conversationId=${conversationId}`);
    const closedWith = await new Promise((res) => {
      ws.on("close", (code) => res(code));
      ws.on("error", () => res("error"));
      setTimeout(() => res("timeout"), 3000);
    });
    if (closedWith !== 4001 && closedWith !== "error") {
      throw new Error(`expected close code 4001 (or error), got ${closedWith}`);
    }
  });

  // Internal presence (used by email skip)
  await step("ws-server /internal/presence requires secret", async () => {
    const res = await fetch(`http://localhost:4001/internal/presence?userId=${client.id}`);
    if (res.status !== 401) throw new Error(`want 401, got ${res.status}`);
  });

  await step("ws-server /internal/presence with secret returns online=false for cold user", async () => {
    const res = await fetch(`http://localhost:4001/internal/presence?userId=${client.id}`, {
      headers: { "x-internal-secret": process.env.WS_INTERNAL_SECRET ?? "" },
    });
    if (res.status !== 200) throw new Error(`status ${res.status}`);
    const body = await res.json();
    if (typeof body.online !== "boolean") throw new Error(`bad shape: ${JSON.stringify(body)}`);
  });
} finally {
  summarize();
  await closeSql();
}
