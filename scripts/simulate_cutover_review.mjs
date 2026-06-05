import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { collectCutoverPayload, repoRoot } from "./cutover_payload.mjs";

const argValue = (flag) => {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const help = process.argv.includes("--help") || process.argv.includes("-h");
const targetArg = argValue("--target");
const legacyRoot = path.resolve(argValue("--legacy") ?? path.join(repoRoot, "..", "yongkyung-oh.github.io"));

if (help || !targetArg) {
  console.log("Usage: node scripts/simulate_cutover_review.mjs --target <new-temp-clone-dir> [--legacy <repo>]");
  console.log("Clones the clean legacy repo into a temp directory, replaces its root with the verified Astro payload, and writes a review report.");
  process.exit(help ? 0 : 1);
}

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const targetRoot = path.resolve(targetArg);
const isInside = (candidate, parent) => {
  const relative = path.relative(parent, candidate);
  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
};

if (!existsSync(path.join(legacyRoot, ".git"))) {
  fail(`Legacy repo not found or is not a git repository: ${legacyRoot}`);
}
if (existsSync(targetRoot)) {
  fail(`Target simulation directory must not already exist: ${targetRoot}`);
}
if (targetRoot === repoRoot || isInside(targetRoot, repoRoot)) {
  fail(`Refusing to simulate inside the source tree: ${targetRoot}`);
}
if (targetRoot === legacyRoot || isInside(targetRoot, legacyRoot)) {
  fail(`Refusing to simulate inside the legacy repo: ${targetRoot}`);
}

const gitLegacy = (args) => execFileSync("git", ["-C", legacyRoot, ...args], { encoding: "utf8" });
const legacyStatus = gitLegacy(["status", "--porcelain"]);
if (legacyStatus.trim()) {
  fail(`Legacy repo must be clean before cutover simulation:\n${legacyStatus}`);
}

const { failures, payloadFiles, warnings } = collectCutoverPayload();
if (failures.length) {
  fail(`Cannot simulate because cutover payload verification failed:\n- ${failures.join("\n- ")}`);
}

mkdirSync(path.dirname(targetRoot), { recursive: true });
execFileSync("git", ["clone", "--local", legacyRoot, targetRoot], { stdio: "inherit" });
execFileSync("git", ["-C", targetRoot, "checkout", "-b", "astro-mvp-cutover-review"], { stdio: "inherit" });

for (const entry of readdirSync(targetRoot)) {
  if (entry === ".git") continue;
  rmSync(path.join(targetRoot, entry), { recursive: true, force: true });
}

for (const file of payloadFiles) {
  const source = path.join(repoRoot, file);
  const target = path.join(targetRoot, file);
  mkdirSync(path.dirname(target), { recursive: true });
  if (!statSync(source).isFile()) fail(`Payload entry is not a regular file: ${file}`);
  copyFileSync(source, target);
}

const gitSim = (args) => execFileSync("git", ["-C", targetRoot, ...args], { encoding: "utf8" });
const status = gitSim(["status", "--short"]);
const diffStat = gitSim(["diff", "--stat"]);
const trackedLegacyCount = gitLegacy(["ls-files"]).split(/\r?\n/).filter(Boolean).length;

const report = [
  "# Cutover Review Simulation",
  "",
  `Astro source: ${repoRoot}`,
  `Legacy source repo: ${legacyRoot}`,
  `Simulation clone: ${targetRoot}`,
  "",
  "## Summary",
  "",
  `- Payload files copied: ${payloadFiles.length}`,
  `- Legacy tracked files before replacement: ${trackedLegacyCount}`,
  `- Simulation branch: astro-mvp-cutover-review`,
  `- Git status entries after replacement: ${status.split(/\r?\n/).filter(Boolean).length}`,
  "",
  "## Git Diff Stat",
  "",
  "```text",
  diffStat.trim() || "No diff",
  "```",
  "",
  "## Git Status",
  "",
  "```text",
  status.trim() || "clean",
  "```",
  "",
  "## Warnings",
  "",
  ...(warnings.length ? warnings.map((warning) => `- ${warning}`) : ["- none"])
].join("\n");

writeFileSync(path.join(targetRoot, "CUTOVER_SIMULATION.md"), `${report}\n`);

console.log(`Cutover simulation written to ${targetRoot}`);
console.log(`Report: ${path.join(targetRoot, "CUTOVER_SIMULATION.md")}`);
for (const warning of warnings) console.warn(`warning: ${warning}`);
