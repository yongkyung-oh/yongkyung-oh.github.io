import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { collectCutoverPayload, repoRoot } from "./cutover_payload.mjs";

const argValue = (flag) => {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const help = process.argv.includes("--help") || process.argv.includes("-h");
const legacyRoot = path.resolve(argValue("--legacy") ?? path.join(repoRoot, "..", "yongkyung-oh.github.io"));
const reportPath = argValue("--report");

if (help) {
  console.log("Usage: node scripts/diff_cutover_against_legacy.mjs [--legacy <repo>] [--report <markdown-file>]");
  console.log("Read-only comparison of the verified Astro cutover payload against the legacy GitHub Pages repo.");
  process.exit(0);
}

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

if (!existsSync(path.join(legacyRoot, ".git"))) {
  fail(`Legacy repo not found or is not a git repository: ${legacyRoot}`);
}

if (path.resolve(legacyRoot) === repoRoot) {
  fail("Refusing to compare the source tree against itself.");
}

const git = (args) => execFileSync("git", ["-C", legacyRoot, ...args], { encoding: "utf8" });
const status = git(["status", "--porcelain"]);
if (status.trim()) {
  fail(`Legacy repo must be clean before cutover diff review:\n${status}`);
}

const { failures, payloadFiles, warnings } = collectCutoverPayload();
if (failures.length) {
  fail(`Cannot diff because cutover payload verification failed:\n- ${failures.join("\n- ")}`);
}

const legacyFiles = git(["ls-files"])
  .split(/\r?\n/)
  .filter(Boolean)
  .sort();

const payloadSet = new Set(payloadFiles);
const legacySet = new Set(legacyFiles);

const hashFile = (file) => crypto.createHash("sha256").update(readFileSync(file)).digest("hex");
const sharedFiles = payloadFiles.filter((file) => legacySet.has(file));
const changedFiles = sharedFiles.filter(
  (file) => hashFile(path.join(repoRoot, file)) !== hashFile(path.join(legacyRoot, file))
);
const unchangedFiles = sharedFiles.filter((file) => !changedFiles.includes(file));
const addedFiles = payloadFiles.filter((file) => !legacySet.has(file));
const removedFiles = legacyFiles.filter((file) => !payloadSet.has(file));

const jekyllRemovals = removedFiles.filter(
  (file) =>
    file === "_config.yml" ||
    file === "Gemfile" ||
    file === "Gemfile.lock" ||
    file.startsWith("_") ||
    file.startsWith("assets/") ||
    file.startsWith("_sass/")
);

const lines = [
  "# Cutover Diff Review",
  "",
  `Astro source: ${repoRoot}`,
  `Legacy repo: ${legacyRoot}`,
  "",
  "## Summary",
  "",
  `- Payload files: ${payloadFiles.length}`,
  `- Legacy tracked files: ${legacyFiles.length}`,
  `- Added by Astro payload: ${addedFiles.length}`,
  `- Changed in-place: ${changedFiles.length}`,
  `- Unchanged path/content: ${unchangedFiles.length}`,
  `- Removed from legacy root: ${removedFiles.length}`,
  `- Jekyll/legacy-looking removals: ${jekyllRemovals.length}`,
  "",
  "## Added",
  "",
  ...(addedFiles.length ? addedFiles.map((file) => `- ${file}`) : ["- none"]),
  "",
  "## Changed",
  "",
  ...(changedFiles.length ? changedFiles.map((file) => `- ${file}`) : ["- none"]),
  "",
  "## Removed",
  "",
  ...(removedFiles.length ? removedFiles.map((file) => `- ${file}`) : ["- none"]),
  "",
  "## Warnings",
  "",
  ...(warnings.length ? warnings.map((warning) => `- ${warning}`) : ["- none"])
];

const report = `${lines.join("\n")}\n`;
if (reportPath) {
  const resolvedReportPath = path.resolve(reportPath);
  writeFileSync(resolvedReportPath, report);
  console.log(`Cutover diff report written to ${resolvedReportPath}`);
} else {
  process.stdout.write(report);
}
