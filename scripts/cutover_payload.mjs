import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const requiredFiles = [
  ".github/workflows/deploy.yml",
  ".gitignore",
  "astro.config.mjs",
  "DATA_SOURCES.md",
  "package-lock.json",
  "package.json",
  "public/favicon.svg",
  "public/images/og-card.jpg",
  "public/images/yongkyung-oh-speaking-1100.jpg",
  "public/images/yongkyung-oh-speaking.webp",
  "public/llms.txt",
  "public/robots.txt",
  "README.md",
  "scripts/cutover_payload.mjs",
  "scripts/diff_cutover_against_legacy.mjs",
  "scripts/export_cutover_payload.mjs",
  "scripts/prepare_cutover_worktree.mjs",
  "scripts/simulate_cutover_review.mjs",
  "scripts/verify_cutover_payload.mjs",
  "scripts/verify_deploy_readiness.mjs",
  "scripts/verify_mvp.mjs",
  "src/layouts/BaseHtml.astro",
  "src/layouts/SiteLayout.astro",
  "src/pages/index.astro",
  "src/data/publications.ts",
  "src/styles/tokens.css",
  "tsconfig.json"
];

export const excludedNames = new Set([
  ".astro",
  ".git",
  ".DS_Store",
  "CUTOVER_PAYLOAD.md",
  "CUTOVER_SIMULATION.md",
  "CUTOVER_WORKTREE.md",
  "dist",
  "node_modules",
  "qc"
]);

export const forbiddenPayloadPatterns = [
  /^dist\//,
  /^node_modules\//,
  /^\.astro\//,
  /^qc\//,
  /^\.git\//,
  /(^|\/)\.DS_Store$/,
  /(^|\/)npm-debug\.log/
];

export const localOnlyFiles = new Set(["public/images/research-background.jpg", "public/images/yongkyung-oh.jpg"]);

export const requiredGitignoreEntries = [
  "node_modules/",
  "dist/",
  ".astro/",
  "qc/",
  ".DS_Store",
  "npm-debug.log*",
  "CUTOVER_*.md"
];

export const walkPayload = (dir = repoRoot, out = []) => {
  for (const entry of readdirSync(dir)) {
    if (excludedNames.has(entry)) continue;
    const full = path.join(dir, entry);
    const relative = path.relative(repoRoot, full).split(path.sep).join("/");
    const stats = statSync(full);
    if (stats.isDirectory()) {
      walkPayload(full, out);
    } else if (!localOnlyFiles.has(relative)) {
      out.push(relative);
    }
  }
  return out;
};

export const collectCutoverPayload = () => {
  const failures = [];
  const warnings = [];

  for (const file of requiredFiles) {
    if (!existsSync(path.join(repoRoot, file))) failures.push(`Missing required cutover file: ${file}`);
  }

  const payloadFiles = walkPayload(repoRoot).sort();
  const gitignore = existsSync(path.join(repoRoot, ".gitignore"))
    ? readFileSync(path.join(repoRoot, ".gitignore"), "utf8")
    : "";

  for (const entry of requiredGitignoreEntries) {
    if (!gitignore.split(/\r?\n/).includes(entry)) {
      failures.push(`.gitignore must exclude generated/local artifact from cutover: ${entry}`);
    }
  }

  for (const file of payloadFiles) {
    for (const pattern of forbiddenPayloadPatterns) {
      if (pattern.test(file)) failures.push(`Forbidden file would be included in cutover payload: ${file}`);
    }
  }

  for (const file of localOnlyFiles) {
    if (existsSync(path.join(repoRoot, file))) {
      warnings.push(`${file} exists locally but is excluded from the cutover payload because it is not referenced by the current MVP`);
    }
  }

  if (!payloadFiles.includes(".github/workflows/deploy.yml")) {
    failures.push("Cutover payload does not include the GitHub Pages deploy workflow");
  }

  if (!payloadFiles.some((file) => file.startsWith("src/pages/"))) {
    failures.push("Cutover payload does not include Astro source pages");
  }

  if (!payloadFiles.some((file) => file.startsWith("src/data/"))) {
    failures.push("Cutover payload does not include source data modules");
  }

  if (existsSync(path.join(repoRoot, "dist"))) {
    warnings.push("dist/ exists locally and is excluded from the cutover payload; GitHub Actions should rebuild it");
  }

  if (existsSync(path.join(repoRoot, ".astro"))) {
    warnings.push(".astro/ exists locally and is excluded from the cutover payload");
  }

  if (existsSync(path.join(repoRoot, "node_modules"))) {
    warnings.push("node_modules/ exists locally and is excluded from the cutover payload");
  }

  const legacyRepo = path.resolve(repoRoot, "..", "yongkyung-oh.github.io", ".git");
  if (!existsSync(legacyRepo)) {
    warnings.push("Legacy yongkyung-oh.github.io git repo was not found next to this source tree");
  }

  return { failures, payloadFiles, warnings };
};
