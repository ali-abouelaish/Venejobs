import { BACKEND, FRONTEND, http, step, summarize, closeSql, expectStatus, createVerifiedUser, authHeader } from "./utils.mjs";

console.log("\n=== AUTH E2E ===\n");

let client, freelancer;

try {
  client = await step("create + verify + login (client)", async () => {
    return await createVerifiedUser("client");
  });

  freelancer = await step("create + verify + login (freelancer)", async () => {
    return await createVerifiedUser("freelancer");
  });

  await step("GET /api/auth/profile with token", async () => {
    const res = await http("GET", `${BACKEND}/api/auth/profile`, { headers: authHeader(client.token) });
    expectStatus(res, 200);
    if (!res.body?.data?.user?.email) throw new Error(`no user in profile: ${JSON.stringify(res.body)}`);
    if (res.body.data.user.email !== client.email) throw new Error(`profile email mismatch`);
  });

  await step("GET /api/auth/profile rejects missing token", async () => {
    const res = await http("GET", `${BACKEND}/api/auth/profile`);
    if (res.status !== 401 && res.status !== 403) throw new Error(`want 401/403, got ${res.status}`);
  });

  await step("GET /api/auth/profile rejects bad token", async () => {
    const res = await http("GET", `${BACKEND}/api/auth/profile`, { headers: { Authorization: "Bearer not.a.real.jwt" } });
    if (res.status !== 401 && res.status !== 403) throw new Error(`want 401/403, got ${res.status}`);
  });

  await step("login rejects unverified user", async () => {
    const ts = Date.now();
    const email = `e2e+unverified+${ts}@venejobs.test`;
    const password = "Pa55word!E2e";
    const sig = await http("POST", `${BACKEND}/api/auth/signup`, {
      body: { name: "unverified", email, password, role: "client" },
    });
    expectStatus(sig, 201);
    const res = await http("POST", `${BACKEND}/api/auth/login`, { body: { email, password } });
    if (res.status !== 401) throw new Error(`want 401, got ${res.status}: ${JSON.stringify(res.body)}`);
  });

  await step("login rejects bad password", async () => {
    const res = await http("POST", `${BACKEND}/api/auth/login`, { body: { email: client.email, password: "wrong-Pa55word!" } });
    if (res.status !== 401) throw new Error(`want 401, got ${res.status}`);
  });

  await step("signup rejects weak password", async () => {
    const res = await http("POST", `${BACKEND}/api/auth/signup`, {
      body: { name: "x", email: `weak+${Date.now()}@venejobs.test`, password: "weak", role: "client" },
    });
    if (res.status === 201) throw new Error(`weak password accepted`);
  });

  await step("signup rejects duplicate email", async () => {
    const res = await http("POST", `${BACKEND}/api/auth/signup`, {
      body: { name: client.name, email: client.email, password: client.password, role: client.role },
    });
    if (res.status === 201) throw new Error(`duplicate accepted`);
  });

  // Cross-service: token issued by backend should be accepted by Next.js auth()
  await step("Next.js /api/services/mine accepts backend-issued token", async () => {
    const res = await fetch(`${FRONTEND}/api/services/mine`, {
      headers: { Cookie: `token=${freelancer.token}` },
    });
    // either 200 (empty list) or 200 with items; 401 would mean auth() rejected the token
    if (res.status === 401) throw new Error(`auth() rejected backend token (401)`);
    if (res.status >= 500) throw new Error(`server error ${res.status}`);
  });
} finally {
  summarize();
  await closeSql();
}
