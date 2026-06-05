import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { collectCutoverPayload, repoRoot } from "./cutover_payload.mjs";

const argValue = (flag) => {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const targetArg = argValue("--target");
const help = process.argv.includes("--help") || process.argv.includes("-h");

if (help || !targetArg) {
  console.log("Usage: node scripts/export_cutover_payload.mjs --target <empty-staging-dir>");
  console.log("Copies the verified Astro source payload into an empty staging directory.");
  process.exit(help ? 0 : 1);
}

const targetRoot = path.resolve(targetArg);
const relativeToRepo = path.relative(repoRoot, targetRoot);
const insideSourceTree = relativeToRepo && !relativeToRepo.startsWith("..") && !path.isAbsolute(relativeToRepo);

if (insideSourceTree || targetRoot === repoRoot) {
  console.error(`Refusing to export inside the source tree: ${targetRoot}`);
  process.exit(1);
}

if (existsSync(path.join(targetRoot, ".git"))) {
  console.error(`Refusing to export directly into a git repository: ${targetRoot}`);
  process.exit(1);
}

if (existsSync(targetRoot) && readdirSync(targetRoot).length > 0) {
  console.error(`Target directory must be empty: ${targetRoot}`);
  process.exit(1);
}

const { failures, payloadFiles, warnings } = collectCutoverPayload();
if (failures.length) {
  console.error("Cannot export because cutover payload verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

for (const file of payloadFiles) {
  const source = path.join(repoRoot, file);
  const target = path.join(targetRoot, file);
  mkdirSync(path.dirname(target), { recursive: true });
  if (!statSync(source).isFile()) {
    console.error(`Payload entry is not a regular file: ${file}`);
    process.exit(1);
  }
  copyFileSync(source, target);
}

const manifest = [
  "# portfolio.github.io Cutover Payload",
  "",
  `Source: ${repoRoot}`,
  `Target: ${targetRoot}`,
  `Files: ${payloadFiles.length}`,
  "",
  "## Files",
  "",
  ...payloadFiles.map((file) => `- ${file}`),
  "",
  "## Warnings",
  "",
  ...(warnings.length ? warnings.map((warning) => `- ${warning}`) : ["- none"])
].join("\n");

writeFileSync(path.join(targetRoot, "CUTOVER_PAYLOAD.md"), `${manifest}\n`);

console.log(`Exported ${payloadFiles.length} cutover source files to ${targetRoot}`);
console.log("Review the staging directory, then copy it into a clean review branch of the live user-page repo.");
for (const warning of warnings) console.warn(`warning: ${warning}`);
