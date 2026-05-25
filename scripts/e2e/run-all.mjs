// Runs all E2E suites sequentially in fresh node sub-processes so each suite
// has its own postgres client lifecycle and global state. Logs to stdout and
// aggregates pass/fail counts at the end.

import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const suites = readdirSync(here)
  .filter((f) => /^\d+_.+\.test\.mjs$/.test(f))
  .sort();

const ENV_FILE = "frontend/.env.local";
const aggregate = [];
const t0 = Date.now();

for (const file of suites) {
  console.log(`\n────────────────────────────────────────`);
  console.log(`▶ ${file}`);
  console.log(`────────────────────────────────────────`);
  const res = spawnSync(
    process.execPath,
    [`--env-file=${ENV_FILE}`, join(here, file)],
    { stdio: ["inherit", "inherit", "inherit"] },
  );
  aggregate.push({ file, code: res.status ?? -1 });
}

const dt = ((Date.now() - t0) / 1000).toFixed(1);
console.log("\n========================================");
console.log("SUITE SUMMARY");
console.log("========================================");
for (const r of aggregate) {
  const tag = r.code === 0 ? "PASS" : "FAIL";
  console.log(`  ${tag}  ${r.file} (exit ${r.code})`);
}
const fails = aggregate.filter((r) => r.code !== 0).length;
console.log(`\n${aggregate.length - fails}/${aggregate.length} suites exited 0 in ${dt}s`);
process.exitCode = fails > 0 ? 1 : 0;
