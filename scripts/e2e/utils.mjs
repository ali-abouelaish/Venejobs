import postgres from "postgres";

export const BACKEND = process.env.E2E_BACKEND ?? "http://localhost:4000";
export const FRONTEND = process.env.E2E_FRONTEND ?? "http://localhost:5173";
export const WS_INTERNAL = process.env.E2E_WS_INTERNAL ?? "http://localhost:4001";
export const WS_INTERNAL_SECRET = process.env.WS_INTERNAL_SECRET ?? "";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL required (run with `node --env-file=frontend/.env.local ...`)");
}

let _sql = null;
export function sql() {
  if (!_sql) _sql = postgres(process.env.DATABASE_URL, { ssl: "require" });
  return _sql;
}
export async function closeSql() {
  if (_sql) {
    await _sql.end();
    _sql = null;
  }
}

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";

const results = [];
export function getResults() {
  return results;
}

// step never throws — failures are recorded and the script continues.
// Tests that need an upstream value should check for null/undefined and
// throw a clear "skipped: upstream X missing" message, which itself becomes
// a recorded failure.
export async function step(name, fn) {
  process.stdout.write(`${CYAN}▸${RESET} ${name} ... `);
  const t0 = Date.now();
  try {
    const out = await fn();
    const dt = Date.now() - t0;
    console.log(`${GREEN}OK${RESET} ${DIM}(${dt}ms)${RESET}`);
    results.push({ name, status: "pass", ms: dt });
    return out;
  } catch (e) {
    const dt = Date.now() - t0;
    console.log(`${RED}FAIL${RESET} ${DIM}(${dt}ms)${RESET}`);
    const msg = String(e?.message ?? e).split("\n")[0].slice(0, 400);
    console.log(`   ${RED}${msg}${RESET}`);
    results.push({ name, status: "fail", ms: dt, error: msg });
    return null;
  }
}

// Kept for backwards compat — same behavior as step now.
export const softStep = step;

export function summarize() {
  const pass = results.filter((r) => r.status === "pass").length;
  const fail = results.filter((r) => r.status === "fail").length;
  console.log("\n" + "=".repeat(60));
  console.log(`${pass} passed, ${fail} failed (of ${results.length})`);
  if (fail) {
    console.log(`${YELLOW}Failures:${RESET}`);
    for (const r of results.filter((r) => r.status === "fail")) {
      console.log(`  - ${r.name}: ${r.error}`);
    }
  }
  return { pass, fail, total: results.length };
}

export async function http(method, url, opts = {}) {
  const headers = { ...(opts.headers ?? {}) };
  let body = opts.body;
  if (body && typeof body === "object" && !(body instanceof FormData) && !(body instanceof Buffer)) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
    body = JSON.stringify(body);
  }
  const res = await fetch(url, { method, headers, body });
  let parsed = null;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    try { parsed = await res.json(); } catch { parsed = null; }
  } else {
    parsed = await res.text();
  }
  return { status: res.status, ok: res.ok, body: parsed, headers: res.headers };
}

export function expect(value, msg = "expected truthy") {
  if (!value) throw new Error(msg);
  return value;
}
export function expectStatus(res, want, msg) {
  if (res.status !== want) {
    const dump = typeof res.body === "string" ? res.body.slice(0, 200) : JSON.stringify(res.body);
    throw new Error(`${msg ?? "status mismatch"}: want ${want}, got ${res.status} — ${dump}`);
  }
  return res;
}

export async function createVerifiedUser(role) {
  const ts = Date.now() + Math.floor(Math.random() * 1000);
  const email = `e2e+${role}+${ts}@venejobs.test`;
  const password = "Pa55word!E2e";
  const name = `E2E ${role} ${ts}`;
  const signup = await http("POST", `${BACKEND}/api/auth/signup`, {
    body: { name, email, password, role },
  });
  if (signup.status !== 201) {
    throw new Error(`signup ${role} failed: ${signup.status} ${JSON.stringify(signup.body)}`);
  }
  // Verify via DB to bypass email step
  const [row] = await sql()`
    SELECT id, email_verification_code FROM users WHERE email = ${email}
  `;
  if (!row?.email_verification_code) {
    throw new Error(`no verification code stored for ${email}`);
  }
  const verify = await http("POST", `${BACKEND}/api/auth/verify-email`, {
    body: { email, code: row.email_verification_code },
  });
  if (verify.status !== 200) {
    throw new Error(`verify-email failed: ${verify.status} ${JSON.stringify(verify.body)}`);
  }
  const login = await http("POST", `${BACKEND}/api/auth/login`, {
    body: { email, password },
  });
  if (login.status !== 200) {
    throw new Error(`login failed: ${login.status} ${JSON.stringify(login.body)}`);
  }
  const token = login.body?.data?.token;
  const user = login.body?.data?.user;
  if (!token || !user) throw new Error(`login missing token/user: ${JSON.stringify(login.body)}`);
  return { id: row.id, email, password, name, role, token, user };
}

export function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}
