import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const achievementRoot = process.env.ACHIEVEMENT_ROOT
  ? path.resolve(process.env.ACHIEVEMENT_ROOT)
  : path.resolve(repoRoot, "../../../Working/Achivement");
const workspaceRoot = path.resolve(repoRoot, "..");

const expectedIds = ["C12", "C07", "C04", "J12", "J11", "C14"];
const expectedHtmlOutputs = [
  "404.html",
  "about/index.html",
  "contact/index.html",
  "index.html",
  "portfolio-dev/Bayesian_Boostrap_for_AIS/index.html",
  "portfolio-dev/CMU_studio_project/index.html",
  "portfolio-dev/GM-internship/index.html",
  "portfolio-dev/Multichannel_CNN/index.html",
  "portfolio-dev/TE_for_propagation/index.html",
  "portfolio-dev/index.html",
  "portfolio-mgt/index.html",
  "presentations/index.html",
  "projects/index.html",
  "publications/index.html",
  "research/index.html",
  "software/index.html",
  "talks/index.html"
];
const expectedHomeNav = [
  ['href="/"', ">Home<"],
  ['href="/research/"', ">Research<"],
  ['href="/publications/"', ">Publications<"],
  ['href="/projects/"', ">Projects<"],
  ['href="/talks/"', ">Talks<"],
  ['href="/about/"', ">About<"],
  ['href="/contact/"', ">Contact<"]
];
const publicForbidden = [
  /\/Users\//,
  /Documents\/GitHub/,
  /private_official/i,
  /evidence\/user/i,
  /achievement_records\//,
  /sourcePath/,
  /verificationStatus/,
  /\bMVP\b/i,
  /source-backed/i,
  /source backed/i,
  /Achivement/i,
  /Official/,
  /Verified records/,
  /Achivement sourced/,
  /\bdummy\b/i,
  /\blorem\b/i,
  /\bTODO\b/
];
const sourceForbidden = [
  /\/Users\//,
  /Documents\/GitHub/,
  /private_official/i,
  /evidence\/user/i,
  /Official/,
  /Verified records/,
  /Achivement sourced/,
  /\bdummy\b/i,
  /\blorem\b/i,
  /\bTODO\b/
];

const failures = [];

const read = (relativePath) => readFileSync(path.join(repoRoot, relativePath), "utf8");
const normalize = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[-,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const extractObjectString = (source, objectName, key) => {
  const objectMatch = source.match(new RegExp(`export const ${objectName} = \\{([\\s\\S]*?)\\n\\};`));
  if (!objectMatch) return "";
  const fieldMatch = objectMatch[1].match(new RegExp(`\\b${key}:\\s*"([^"]+)"`));
  return fieldMatch ? fieldMatch[1] : "";
};

const walkFiles = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) walkFiles(full, out);
    else out.push(full);
  }
  return out;
};

const assertNoMatches = (files, patterns, label) => {
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        failures.push(`${label}: ${path.relative(repoRoot, file)} matches ${pattern}`);
      }
    }
  }
};

const assertSourceBackedIdentity = () => {
  if (!existsSync(achievementRoot)) return;

  const siteSource = read("src/data/site.ts");
  const peopleSource = read("src/data/people.ts");
  const careerRecordPath = path.join(achievementRoot, "achievement_records/career/ucla_health_postdoctoral_researcher_2023.yaml");
  const grantRecordPath = path.join(achievementRoot, "achievement_records/grants/nrf_postdoctoral_fellowship_2024.yaml");

  if (!existsSync(careerRecordPath)) {
    failures.push("Missing Achivement identity source: achievement_records/career/ucla_health_postdoctoral_researcher_2023.yaml");
    return;
  }

  const careerRecord = readFileSync(careerRecordPath, "utf8");
  const profileRole = extractObjectString(siteSource, "profile", "role");
  const profileAffiliation = extractObjectString(siteSource, "profile", "affiliation");
  const profileGroup = extractObjectString(siteSource, "profile", "group");
  const profileLocation = extractObjectString(siteSource, "profile", "location");

  if (!profileRole || !careerRecord.includes(`title: ${profileRole}`)) {
    failures.push("profile.role must match the UCLA Achivement career title");
  }
  if (!profileAffiliation || !normalize(careerRecord).includes(normalize(profileAffiliation))) {
    failures.push("profile.affiliation must match the UCLA Achivement career organization");
  }
  if (!profileGroup || !normalize(careerRecord).includes(normalize(profileGroup))) {
    failures.push("profile.group must match the UCLA Achivement career unit");
  }
  if (!profileLocation || !normalize(careerRecord).includes(normalize(profileLocation))) {
    failures.push("profile.location must match the UCLA Achivement career location");
  }
  if (/^\s{4,}role:\s*"PI"/m.test(peopleSource)) {
    failures.push('people.ts must not mark the current single-person profile as role: "PI" before a real faculty/lab content patch');
  }

  if (!existsSync(grantRecordPath)) {
    failures.push("Missing Achivement grant source: achievement_records/grants/nrf_postdoctoral_fellowship_2024.yaml");
    return;
  }
  const grantRecord = readFileSync(grantRecordPath, "utf8");
  if (!grantRecord.includes("role: Principal Investigator")) {
    failures.push("NRF fellowship Achivement grant record must verify the public PI fellowship wording");
  }
  if (!grantRecord.includes("funder: National Research Foundation of Korea")) {
    failures.push("NRF fellowship Achivement grant record must verify the public funder wording");
  }
};

const assertRouteSurface = (distDir) => {
  const htmlFiles = walkFiles(distDir)
    .filter((file) => /\.html$/i.test(file))
    .map((file) => path.relative(distDir, file).split(path.sep).join("/"))
    .sort();
  const missing = expectedHtmlOutputs.filter((file) => !htmlFiles.includes(file));
  const unexpected = htmlFiles.filter((file) => !expectedHtmlOutputs.includes(file));
  if (missing.length) failures.push(`Missing MVP HTML outputs: ${missing.join(", ")}`);
  if (unexpected.length) failures.push(`Unexpected HTML outputs in MVP build: ${unexpected.join(", ")}`);

  const homePath = path.join(distDir, "index.html");
  if (!existsSync(homePath)) {
    failures.push("dist/index.html is missing");
    return;
  }
  const homeHtml = readFileSync(homePath, "utf8");
  for (const [href, label] of expectedHomeNav) {
    if (!homeHtml.includes(href) || !homeHtml.includes(label)) {
      failures.push(`Home nav is missing ${label.replace(/[><]/g, "")} (${href})`);
    }
  }
  if (homeHtml.includes("Development works") || homeHtml.includes("Consulting works") || homeHtml.includes("Powered by Jekyll")) {
    failures.push("Home page still contains legacy Jekyll navigation/footer wording");
  }
  if (!homeHtml.includes("/images/yongkyung-oh-speaking.webp")) {
    failures.push("Home page must use the optimized podium image webp asset");
  }

  const consultingPath = path.join(distDir, "portfolio-mgt", "index.html");
  if (!existsSync(consultingPath)) {
    failures.push("dist/portfolio-mgt/index.html is missing");
  } else {
    const consultingHtml = readFileSync(consultingPath, "utf8");
    if (!consultingHtml.includes("No consulting records are listed on the public site yet.")) {
      failures.push("portfolio-mgt must remain an empty verified-record surface until consulting records are sourced");
    }
  }
};

const publicationsSource = read("src/data/publications.ts");
const foundIds = Array.from(publicationsSource.matchAll(/\bid:\s*"([^"]+)"/g)).map((match) => match[1]);
const missingIds = expectedIds.filter((id) => !foundIds.includes(id));
const extraIds = foundIds.filter((id) => !expectedIds.includes(id));

if (foundIds.length !== expectedIds.length) {
  failures.push(`Expected ${expectedIds.length} curated publication records, found ${foundIds.length}`);
}
if (missingIds.length) failures.push(`Missing curated publication ids: ${missingIds.join(", ")}`);
if (extraIds.length) failures.push(`Unexpected curated publication ids: ${extraIds.join(", ")}`);

const sourcePaths = Array.from(publicationsSource.matchAll(/sourcePath:\s*"([^"]+)"/g)).map((match) => match[1]);
const verificationStatuses = Array.from(publicationsSource.matchAll(/verificationStatus:\s*"([^"]+)"/g)).map(
  (match) => match[1]
);

if (sourcePaths.length !== expectedIds.length) {
  failures.push(`Expected ${expectedIds.length} sourcePath fields, found ${sourcePaths.length}`);
}
if (verificationStatuses.length !== expectedIds.length) {
  failures.push(`Expected ${expectedIds.length} verificationStatus fields, found ${verificationStatuses.length}`);
}
for (const status of verificationStatuses) {
  if (!["verified", "partially_verified"].includes(status)) {
    failures.push(`Invalid shipped verificationStatus: ${status}`);
  }
}

if (!existsSync(achievementRoot)) {
  failures.push(`Achivement upstream not found: ${achievementRoot}. Set ACHIEVEMENT_ROOT to override.`);
} else {
  for (const sourcePath of sourcePaths) {
    const full = path.join(achievementRoot, sourcePath);
    if (!existsSync(full)) failures.push(`Missing Achivement sourcePath: ${sourcePath}`);
  }
  assertSourceBackedIdentity();
}

const dataFiles = walkFiles(path.join(repoRoot, "src", "data")).filter((file) => /\.ts$/i.test(file));
const allDataSourcePaths = [];
for (const file of dataFiles) {
  const text = readFileSync(file, "utf8");
  for (const match of text.matchAll(/sourcePath:\s*"([^"]+)"/g)) {
    allDataSourcePaths.push({
      file: path.relative(repoRoot, file),
      sourcePath: match[1]
    });
  }
  if (/legacy_public/.test(text)) {
    failures.push(`${path.relative(repoRoot, file)} uses legacy_public; launch data must be Achivement-backed`);
  }
  if (/verificationStatus:\s*"unverified"/.test(text)) {
    failures.push(`${path.relative(repoRoot, file)} renders an unverified record`);
  }
}

for (const { file, sourcePath } of allDataSourcePaths) {
  if (path.isAbsolute(sourcePath) || sourcePath.includes("..")) {
    failures.push(`${file} has unsafe sourcePath: ${sourcePath}`);
    continue;
  }
  if (!sourcePath.startsWith("achievement_records/")) {
    failures.push(`${file} has non-Achivement sourcePath: ${sourcePath}`);
    continue;
  }
  const full = path.join(achievementRoot, sourcePath);
  if (!existsSync(full)) failures.push(`${file} references missing Achivement sourcePath: ${sourcePath}`);
}

const legacySourcePaths = allDataSourcePaths.filter(({ sourcePath }) => sourcePath.startsWith("yongkyung-oh.github.io/"));
if (legacySourcePaths.length) {
  for (const { file, sourcePath } of legacySourcePaths) {
    const full = path.join(workspaceRoot, sourcePath);
    failures.push(
      `${file} still points to legacy-only source ${sourcePath}${existsSync(full) ? "" : " (also missing locally)"}`
    );
  }
}

const distDir = path.join(repoRoot, "dist");
if (!existsSync(distDir)) {
  failures.push("dist/ is missing; run npm run build before npm run verify:mvp");
} else {
  const publicFiles = walkFiles(distDir).filter((file) => /\.(html|xml|txt|json|js|css)$/i.test(file));
  assertNoMatches(publicFiles, publicForbidden, "public output leak");
  assertRouteSurface(distDir);

  const publicationsHtml = path.join(distDir, "publications", "index.html");
  if (!existsSync(publicationsHtml)) {
    failures.push("dist/publications/index.html is missing");
  } else {
    const html = readFileSync(publicationsHtml, "utf8");
    const renderedRecords = (html.match(/data-pub-kind=/g) || []).length;
    if (renderedRecords !== expectedIds.length) {
      failures.push(`Expected ${expectedIds.length} rendered publication rows, found ${renderedRecords}`);
    }
    if (!html.includes("Selected Publications")) {
      failures.push("Publications page does not use public selected-publications heading");
    }
    const scholarlyArticleRecords = (html.match(/"@type":"ScholarlyArticle"/g) || []).length;
    if (scholarlyArticleRecords !== expectedIds.length) {
      failures.push(`Expected ${expectedIds.length} ScholarlyArticle JSON-LD records, found ${scholarlyArticleRecords}`);
    }
    if (!html.includes('"@context":"https://schema.org"')) {
      failures.push("Publications page must include schema.org JSON-LD context");
    }
  }
}

const sourceFiles = [
  ...walkFiles(path.join(repoRoot, "src")).filter((file) => /\.(astro|ts|js|css)$/i.test(file)),
  path.join(repoRoot, "README.md"),
  path.join(repoRoot, "DATA_SOURCES.md"),
  path.join(repoRoot, "astro.config.mjs"),
  path.join(repoRoot, ".github", "workflows", "deploy.yml")
].filter((file) => existsSync(file));
assertNoMatches(sourceFiles, sourceForbidden, "source hygiene");

const config = read("astro.config.mjs");
if (!config.includes('site: "https://yongkyung-oh.github.io"')) {
  failures.push("astro.config.mjs site must be https://yongkyung-oh.github.io for the user-page deploy target");
}

if (failures.length) {
  console.error("Content verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Content verification passed (${expectedIds.length} selected publication records).`);
