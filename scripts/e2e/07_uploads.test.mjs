import { FRONTEND, step, summarize, closeSql, expectStatus, createVerifiedUser } from "./utils.mjs";

console.log("\n=== UPLOADS E2E ===\n");

function cookieHeader(token) {
  return { Cookie: `token=${token}` };
}

async function nextFetch(path, opts = {}) {
  const headers = { ...(opts.headers ?? {}) };
  let body = opts.body;
  if (body && typeof body === "object" && !(body instanceof Buffer) && !(body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
    body = JSON.stringify(body);
  }
  const res = await fetch(`${FRONTEND}${path}`, { method: opts.method ?? "GET", headers, body });
  const ct = res.headers.get("content-type") ?? "";
  let parsed = null;
  if (ct.includes("application/json")) {
    try { parsed = await res.json(); } catch { parsed = null; }
  } else if (ct.startsWith("text/") || ct.includes("html")) {
    parsed = await res.text();
  } else {
    // binary or unknown — keep length
    const buf = await res.arrayBuffer();
    parsed = { __binary: true, byteLength: buf.byteLength, contentType: ct };
  }
  return { status: res.status, ok: res.ok, body: parsed, headers: res.headers };
}

// Minimal valid 1x1 PNG (67 bytes)
const TINY_PNG = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c63000100000005000100" +
  "0d0a2db40000000049454e44ae426082",
  "hex",
);

const user = await step("setup: create user", () => createVerifiedUser("client"));

try {
  // ── /api/upload/presign ─────────────────────────────────────────────────
  await step("POST /api/upload/presign without auth → 401", async () => {
    const res = await nextFetch("/api/upload/presign", {
      method: "POST",
      body: { fileName: "x.png", mimeType: "image/png", sizeBytes: 100 },
    });
    if (res.status !== 401) throw new Error(`want 401, got ${res.status}`);
  });

  await step("POST /api/upload/presign rejects disallowed mime", async () => {
    if (!user) throw new Error("no user");
    const res = await nextFetch("/api/upload/presign", {
      method: "POST",
      headers: cookieHeader(user.token),
      body: { fileName: "evil.exe", mimeType: "application/x-msdownload", sizeBytes: 100 },
    });
    if (res.status !== 400) throw new Error(`want 400, got ${res.status}`);
  });

  await step("POST /api/upload/presign rejects oversized", async () => {
    if (!user) throw new Error("no user");
    const res = await nextFetch("/api/upload/presign", {
      method: "POST",
      headers: cookieHeader(user.token),
      body: { fileName: "big.png", mimeType: "image/png", sizeBytes: 25 * 1024 * 1024 },
    });
    if (res.status !== 400) throw new Error(`want 400, got ${res.status}`);
  });

  await step("POST /api/upload/presign rejects missing fields", async () => {
    if (!user) throw new Error("no user");
    const res = await nextFetch("/api/upload/presign", {
      method: "POST",
      headers: cookieHeader(user.token),
      body: { fileName: "ok.png" },
    });
    if (res.status !== 400) throw new Error(`want 400, got ${res.status}`);
  });

  let presigned;
  await step("POST /api/upload/presign returns presigned URL + key", async () => {
    if (!user) throw new Error("no user");
    const res = await nextFetch("/api/upload/presign", {
      method: "POST",
      headers: cookieHeader(user.token),
      body: { fileName: "e2e-test.png", mimeType: "image/png", sizeBytes: TINY_PNG.length },
    });
    expectStatus(res, 200);
    if (!res.body?.presignedUrl?.startsWith("https://")) throw new Error(`bad presignedUrl: ${res.body?.presignedUrl}`);
    if (!res.body?.publicUrl) throw new Error("no publicUrl");
    if (!res.body?.key) throw new Error("no key");
    presigned = res.body;
  });

  await step("PUT to presigned URL succeeds against R2", async () => {
    if (!presigned) throw new Error("no presigned");
    const res = await fetch(presigned.presignedUrl, {
      method: "PUT",
      headers: { "Content-Type": "image/png" },
      body: TINY_PNG,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`R2 PUT failed: ${res.status} ${txt.slice(0, 200)}`);
    }
  });

  await step("GET publicUrl returns the uploaded bytes", async () => {
    if (!presigned) throw new Error("no presigned");
    const res = await fetch(presigned.publicUrl);
    if (!res.ok) throw new Error(`public URL fetch failed: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length !== TINY_PNG.length) throw new Error(`size mismatch ${buf.length} vs ${TINY_PNG.length}`);
  });

  // ── /api/users/me/avatar ────────────────────────────────────────────────
  await step("POST /api/users/me/avatar without auth → 401", async () => {
    const fd = new FormData();
    fd.set("profile_picture", new Blob([TINY_PNG], { type: "image/png" }), "a.png");
    const res = await nextFetch("/api/users/me/avatar", { method: "POST", body: fd });
    if (res.status !== 401) throw new Error(`want 401, got ${res.status}`);
  });

  await step("POST /api/users/me/avatar rejects wrong mime", async () => {
    if (!user) throw new Error("no user");
    const fd = new FormData();
    fd.set("profile_picture", new Blob([TINY_PNG], { type: "text/plain" }), "a.txt");
    const res = await nextFetch("/api/users/me/avatar", { method: "POST", headers: cookieHeader(user.token), body: fd });
    if (res.status !== 400) throw new Error(`want 400, got ${res.status}: ${JSON.stringify(res.body)}`);
  });

  await step("POST /api/users/me/avatar rejects oversized", async () => {
    if (!user) throw new Error("no user");
    const big = Buffer.alloc(2 * 1024 * 1024 + 100, 0x00); // >2 MB
    const fd = new FormData();
    fd.set("profile_picture", new Blob([big], { type: "image/png" }), "big.png");
    const res = await nextFetch("/api/users/me/avatar", { method: "POST", headers: cookieHeader(user.token), body: fd });
    if (res.status !== 400) throw new Error(`want 400, got ${res.status}: ${JSON.stringify(res.body)}`);
  });

  let avatarUrl;
  await step("POST /api/users/me/avatar uploads to R2 and updates DB", async () => {
    if (!user) throw new Error("no user");
    const fd = new FormData();
    fd.set("profile_picture", new Blob([TINY_PNG], { type: "image/png" }), "avatar.png");
    const res = await nextFetch("/api/users/me/avatar", { method: "POST", headers: cookieHeader(user.token), body: fd });
    expectStatus(res, 200);
    if (res.body?.success !== true) throw new Error(`success false: ${JSON.stringify(res.body)}`);
    avatarUrl = res.body?.data?.profile_picture;
    if (!avatarUrl) throw new Error(`no avatar url: ${JSON.stringify(res.body)}`);
    // Verify it's actually fetchable
    const fetched = await fetch(avatarUrl);
    if (!fetched.ok) throw new Error(`avatar URL not fetchable: ${fetched.status}`);
  });

  // ── /api/download ───────────────────────────────────────────────────────
  await step("GET /api/download without auth → 401", async () => {
    const res = await nextFetch("/api/download?url=https://example.com/x");
    if (res.status !== 401) throw new Error(`want 401, got ${res.status}`);
  });

  await step("GET /api/download with non-R2 url → 400", async () => {
    if (!user) throw new Error("no user");
    const res = await nextFetch("/api/download?url=https://example.com/x", { headers: cookieHeader(user.token) });
    if (res.status !== 400) throw new Error(`want 400, got ${res.status}`);
  });

  await step("GET /api/download missing url → 400", async () => {
    if (!user) throw new Error("no user");
    const res = await nextFetch("/api/download", { headers: cookieHeader(user.token) });
    if (res.status !== 400) throw new Error(`want 400, got ${res.status}`);
  });

  await step("GET /api/download streams R2 file with attachment headers", async () => {
    if (!user || !avatarUrl) throw new Error("no upload to download");
    const res = await nextFetch(`/api/download?url=${encodeURIComponent(avatarUrl)}&name=test.png`, {
      headers: cookieHeader(user.token),
    });
    expectStatus(res, 200);
    const dispo = res.headers.get("content-disposition");
    if (!dispo || !dispo.includes("attachment")) throw new Error(`bad Content-Disposition: ${dispo}`);
    if (res.body.byteLength !== TINY_PNG.length) {
      throw new Error(`downloaded size ${res.body.byteLength} != ${TINY_PNG.length}`);
    }
  });

  // ── Legacy backend avatar route (multer + local disk) ──────────────────
  await step("legacy backend POST /api/auth/profile-picture still works", async () => {
    if (!user) throw new Error("no user");
    const fd = new FormData();
    fd.set("profile_picture", new Blob([TINY_PNG], { type: "image/png" }), "legacy.png");
    const res = await fetch(`http://localhost:4000/api/auth/profile-picture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${user.token}` },
      body: fd,
    });
    const txt = await res.text();
    if (res.status !== 200) throw new Error(`status ${res.status}: ${txt.slice(0, 200)}`);
    const data = JSON.parse(txt);
    if (!data?.data?.profile_picture) throw new Error(`no profile_picture in response`);
  });
} finally {
  summarize();
  await closeSql();
}
