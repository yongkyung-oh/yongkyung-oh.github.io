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
const branchName = argValue("--branch");
const legacyRoot = path.resolve(argValue("--legacy") ?? path.join(repoRoot, "..", "yongkyung-oh.github.io"));

if (help || !targetArg) {
  console.log("Usage: node scripts/prepare_cutover_worktree.mjs --target <new-worktree-dir> [--branch <review-branch>] [--legacy <repo>]");
  console.log("Creates a separate git worktree from the clean legacy repo and replaces only that worktree root with the verified Astro payload.");
  console.log("Without --branch, the worktree is detached for safe local validation.");
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

if (!existsSync(path.join(legacyRoot, ".git"))) fail(`Legacy repo not found or is not a git repository: ${legacyRoot}`);
if (existsSync(targetRoot)) fail(`Target worktree directory must not already exist: ${targetRoot}`);
if (targetRoot === repoRoot || isInside(targetRoot, repoRoot)) fail(`Refusing to prepare inside the source tree: ${targetRoot}`);
if (targetRoot === legacyRoot || isInside(targetRoot, legacyRoot)) fail(`Refusing to prepare inside the legacy repo: ${targetRoot}`);

const gitLegacy = (args) => execFileSync("git", ["-C", legacyRoot, ...args], { encoding: "utf8" });
const legacyStatus = gitLegacy(["status", "--porcelain"]);
if (legacyStatus.trim()) fail(`Legacy repo must be clean before cutover worktree preparation:\n${legacyStatus}`);

if (branchName) {
  const branches = gitLegacy(["branch", "--format=%(refname:short)"]).split(/\r?\n/).filter(Boolean);
  if (branches.includes(branchName)) fail(`Branch already exists in legacy repo: ${branchName}`);
}

const { failures, payloadFiles, warnings } = collectCutoverPayload();
if (failures.length) fail(`Cannot prepare worktree because cutover payload verification failed:\n- ${failures.join("\n- ")}`);

mkdirSync(path.dirname(targetRoot), { recursive: true });
const addArgs = branchName
  ? ["-C", legacyRoot, "worktree", "add", "-b", branchName, targetRoot, "HEAD"]
  : ["-C", legacyRoot, "worktree", "add", "--detach", targetRoot, "HEAD"];
execFileSync("git", addArgs, { stdio: "inherit" });

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

const gitWorktree = (args) => execFileSync("git", ["-C", targetRoot, ...args], { encoding: "utf8" });
const status = gitWorktree(["status", "--short"]);
const diffStat = gitWorktree(["diff", "--stat"]);
const currentBranch = gitWorktree(["branch", "--show-current"]).trim() || "(detached)";
const trackedLegacyCount = gitLegacy(["ls-files"]).split(/\r?\n/).filter(Boolean).length;

const report = [
  "# Cutover Worktree Preparation",
  "",
  `Astro source: ${repoRoot}`,
  `Legacy repo: ${legacyRoot}`,
  `Prepared worktree: ${targetRoot}`,
  `Branch: ${currentBranch}`,
  "",
  "## Summary",
  "",
  `- Payload files copied: ${payloadFiles.length}`,
  `- Legacy tracked files before replacement: ${trackedLegacyCount}`,
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

writeFileSync(path.join(targetRoot, "CUTOVER_WORKTREE.md"), `${report}\n`);

console.log(`Cutover worktree prepared at ${targetRoot}`);
console.log(`Report: ${path.join(targetRoot, "CUTOVER_WORKTREE.md")}`);
if (!branchName) console.log("Detached worktree prepared. Re-run with --branch <review-branch> when ready to create a pushable review branch.");
for (const warning of warnings) console.warn(`warning: ${warning}`);
