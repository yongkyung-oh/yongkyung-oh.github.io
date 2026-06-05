import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const warnings = [];

const read = (relativePath) => readFileSync(path.join(repoRoot, relativePath), "utf8");
const requireFile = (relativePath) => {
  if (!existsSync(path.join(repoRoot, relativePath))) failures.push(`Missing ${relativePath}`);
};
const requireText = (relativePath, pattern, message) => {
  if (!pattern.test(read(relativePath))) failures.push(message);
};

requireFile("astro.config.mjs");
requireFile("package.json");
requireFile(".github/workflows/deploy.yml");
requireFile("public/robots.txt");

if (failures.length === 0) {
  requireText(
    "astro.config.mjs",
    /site:\s*"https:\/\/yongkyung-oh\.github\.io"/,
    'astro.config.mjs must set site: "https://yongkyung-oh.github.io"'
  );
  if (/^\s*base:/m.test(read("astro.config.mjs"))) {
    failures.push("User-page deployment should not set Astro base; remove base for yongkyung-oh.github.io");
  }
  requireText("package.json", /"build":\s*"[^"]*astro check[^"]*astro build/, "package.json build must run astro check and astro build");
  requireText(
    ".github/workflows/deploy.yml",
    /branches:\s*\[(?:main,\s*master|master,\s*main)\]/,
    "Deploy workflow should trigger on both main and master so the current legacy-repo branch can deploy"
  );
  requireText(
    ".github/workflows/deploy.yml",
    /pull_request:\s*\n\s*branches:\s*\[(?:main,\s*master|master,\s*main)\]/,
    "Deploy workflow should run the build job on pull requests to main/master for review-branch checks"
  );
  requireText(
    ".github/workflows/deploy.yml",
    /deploy:\s*\n\s*if:\s*github\.event_name\s*!=\s*'pull_request'/,
    "Deploy workflow must skip the deploy job on pull_request events"
  );
  requireText(".github/workflows/deploy.yml", /uses:\s*withastro\/action@v6/, "Deploy workflow must use withastro/action@v6");
  requireText(".github/workflows/deploy.yml", /uses:\s*actions\/deploy-pages@v5/, "Deploy workflow must use actions/deploy-pages@v5");
  requireText(".github/workflows/deploy.yml", /pages:\s*write/, "Deploy workflow must request pages: write");
  requireText(".github/workflows/deploy.yml", /id-token:\s*write/, "Deploy workflow must request id-token: write");
}

if (existsSync(path.join(repoRoot, ".git"))) {
  try {
    const remote = execFileSync("git", ["remote", "get-url", "origin"], {
      cwd: repoRoot,
      encoding: "utf8"
    }).trim();
    if (!/github\.com[:/]yongkyung-oh\/yongkyung-oh\.github\.io(?:\.git)?$/i.test(remote)) {
      warnings.push(`Git origin is ${remote}; expected yongkyung-oh/yongkyung-oh.github.io for user-page deployment`);
    }
  } catch {
    warnings.push("Git repo exists but origin remote could not be read");
  }
  try {
    const branch = execFileSync("git", ["branch", "--show-current"], {
      cwd: repoRoot,
      encoding: "utf8"
    }).trim();
    if (branch && !["main", "master"].includes(branch)) {
      warnings.push(`Current branch is ${branch}; deploy workflow triggers main/master`);
    }
  } catch {
    warnings.push("Git repo exists but current branch could not be read");
  }
} else {
  warnings.push("portfolio.github.io is a deploy-ready source tree, but it is not currently a git repository");
  const legacyGit = path.resolve(repoRoot, "..", "yongkyung-oh.github.io", ".git");
  if (existsSync(legacyGit)) {
    warnings.push("legacy ../yongkyung-oh.github.io currently owns the GitHub remote; cutover must promote this Astro tree into that repo or initialize/push this tree as the user-page repo");
  }
}

warnings.push("GitHub Pages Settings -> Source = GitHub Actions cannot be verified from local files");

if (failures.length) {
  console.error("Deploy readiness failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  for (const warning of warnings) console.error(`warning: ${warning}`);
  process.exit(1);
}

console.log("Deploy source checks passed.");
for (const warning of warnings) console.warn(`warning: ${warning}`);
