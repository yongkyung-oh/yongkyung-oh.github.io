import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { editorial } from '../src/data/editorial.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const hash = (buffer) => createHash('sha256').update(buffer).digest('hex');
const manifest = JSON.parse(await readFile(path.join(root, 'data/source-manifest.json')));
const snapshot = await readFile(path.join(root, 'src/data/cv.generated.json'));
const cv = JSON.parse(snapshot);
assert.equal(hash(snapshot), manifest.generatedDataSha256, 'Generated CV data changed outside sync:cv');
assert.equal(hash(await readFile(path.join(root, 'data/curation.json'))), manifest.curationSha256, 'Curation changed: run sync:cv');
assert.equal(hash(await readFile(path.join(root, 'dist/cv/YongKyung-Oh-CV.pdf'))), manifest.sources['CV.pdf'].sha256, 'Public PDF must equal the reviewed source');
const html = await readFile(path.join(root, 'dist/index.html'), 'utf8');
assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, 'Page needs exactly one h1');
// Owner decision 2026-10-02: the document title is the name alone, without the institution.
assert.equal(html.match(/<title>([^<]*)<\/title>/)?.[1], cv.identity.name, 'Page title must be the name only');
// Owner decision 2026-10-02: a transparent favicon, served at the implicit /favicon.ico path as well.
for (const icon of ['favicon.ico', 'favicon.png']) {
  assert(html.includes(`href="/${icon}"`), `Missing <link rel="icon"> for ${icon}`);
  await readFile(path.join(root, 'dist', icon));
}
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Duplicate HTML IDs');
for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) assert(ids.includes(target), `Broken anchor: ${target}`);
for (const paper of cv.publications) assert(ids.includes(paper.id), `Missing paper: ${paper.id}`);
for (const entry of [...cv.career, ...cv.education, ...cv.funding, ...cv.recognitions, ...cv.teaching, ...cv.patents]) assert(ids.includes(entry.id), `Missing CV entry: ${entry.id}`);
assert.equal((html.match(/class="paper"/g) || []).length, cv.publications.length, 'Each publication must appear once');
assert.equal((html.match(/class="citation-content"/g) || []).length, cv.publications.length, 'Each publication needs one APA citation');
const researchHtml = html.match(/id="research"[\s\S]*?<\/section>/)?.[0] ?? '';
assert.deepEqual([...researchHtml.matchAll(/data-research-id="([^"]+)"/g)].map((match) => match[1]), editorial.research.map(({ id }) => id), 'Research must render all stable IDs in the reviewed display order');
const escapeText = (text) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
for (const area of editorial.research) {
  assert(researchHtml.includes(`<strong>${escapeText(area.title)}.</strong>`) && researchHtml.includes(escapeText(area.description)), `Research title or summary differs from editorial: ${area.id}`);
}
assert(html.includes('Chancellor’s Award for Postdoctoral Research — Nominee') && html.includes('Lead Scientist'), 'Recognition status and funding role must be explicit');
const internalPublicationStates = new Set([
  'Presented · proceedings pending',
  'proceedings pending',
  ...cv.publications.map((paper) => paper.status).filter(Boolean),
]);
for (const status of internalPublicationStates) assert(!html.includes(status), `Internal publication workflow status must not be exposed: ${status}`);
// ICML C14 is a published Zotero record in CV_publish since the 2026-10-02 A1 sync;
// the citation now comes from the public CV export (no web overlay).
assert(html.includes('https://proceedings.mlr.press/v306/oh26d.html') && /pp\. 171583[-–]171601/.test(html), 'ICML needs the published PMLR proceedings citation');
// Authorship wording is shared with the public CV and the lab site: "sole-authored" is canonical.
assert(!/single[- ]author|solo[- ]author/i.test(html), 'ICML authorship must read "sole-authored", not "single-author(ed)" or "solo-authored"');
const profileStart = html.indexOf('class="profile-links"');
const profileEnd = html.indexOf('</div>', profileStart);
const profileHtml = html.slice(profileStart, profileEnd);
const publicCvUrl = 'https://drive.google.com/file/d/12kr_OViGjSfBox5_kUnpnpop87liNlyV/view?usp=sharing';
const profileOrder = ['https://scientific-inference-lab.github.io/', cv.identity.orcid, cv.identity.scholar, cv.identity.github, 'https://www.linkedin.com/in/yongkyung-oh', publicCvUrl].map((url) => profileHtml.indexOf(`href="${url}"`));
assert(profileOrder.every((position) => position >= 0) && profileOrder.every((position, index) => index === 0 || position > profileOrder[index - 1]), 'Text profile links must start with the lab and end with CV in the reviewed order');
// Spec 022: the owner's CV link plus the Slides/Poster Drive files projected from the bundle are the only Drive URLs.
const materialLinks = cv.publications.flatMap((paper) => paper.links.filter((link) => link.label === 'Slides' || link.label === 'Poster'));
assert.equal(materialLinks.filter((link) => link.label === 'Slides').length, 7, 'Expected exactly 7 Slides links');
assert.equal(materialLinks.filter((link) => link.label === 'Poster').length, 5, 'Expected exactly 5 Poster links');
for (const link of materialLinks) assert(/^https:\/\/drive\.google\.com\/file\/d\/[\w-]+$/.test(link.url), `Unexpected material URL: ${link.url}`);
const driveUrls = [...html.matchAll(/https:\/\/drive\.google\.com\/[^"'\s<>]*/g)].map((match) => match[0]);
assert.deepEqual(driveUrls.slice().sort(), [publicCvUrl, ...materialLinks.map((link) => link.url)].sort(), 'Drive URLs must be exactly the owner-reviewed CV link plus the bundle-projected Slides/Poster links');
assert.equal((html.match(/<a href="https:\/\/drive\.google\.com\/file\/d\/[\w-]+" aria-label="Slides: /g) || []).length, 7, 'Seven Slides links must be rendered in paper action rows');
assert.equal((html.match(/<a href="https:\/\/drive\.google\.com\/file\/d\/[\w-]+" aria-label="Poster: /g) || []).length, 5, 'Five Poster links must be rendered in paper action rows');
// Spec 022 patents: 7 valid filings; unregistered or discontinued filings must not leak.
assert.equal(cv.patents.length, 7, 'Expected 7 patent entries');
assert.equal((html.match(/\bKR 10-\d/g) || []).length, 7, 'Expected one KR number per listed patent (7)');
for (const number of ['KR 10-2608343', 'KR 10-2604575', 'JP 7453296', 'JP 7453297']) assert(html.includes(number), `Missing patent: ${number}`);
for (const hidden of ['18/395,620', '18/012,626', 'PCT/KR', 'Notice of Allowance', 'prosecution discontinued']) assert(!html.includes(hidden), `Excluded patent text must not appear: ${hidden}`);
// Spec 022 (+ Addendum 2): all 13 honors and research awards; HR09/HR10 carry the certificate wording.
assert.equal(cv.recognitions.length, 13, 'Expected 13 recognition entries');
assert(!html.includes('Distinguished Paper Award'), 'The retired "Distinguished Paper Award" wording must not appear');
assert(html.includes('Encouragement Award') && html.includes('Excellence Award'), 'HR09/HR10 must show Encouragement Award and Excellence Award');
assert.deepEqual([...new Set(cv.recognitions.map((entry) => entry.group))], ['honors', 'honors_research_awards'], 'Recognition groups must be Honors then Research Awards');
assert.equal(cv.recognitions.filter((entry) => entry.group === 'honors').length, 3, 'Expected 3 honors');
assert.equal(cv.recognitions.filter((entry) => entry.group === 'honors_research_awards').length, 10, 'Expected 10 research awards');
assert(html.indexOf('>Honors</h3>') > 0 && html.indexOf('>Honors</h3>') < html.indexOf('>Research Awards</h3>'), 'Recognition subheadings must render Honors before Research Awards');
for (const id of ['recognition', 'patents']) assert(new RegExp(`id="${id}"[\\s\\S]*?<details class="cv-disclosure [^"]*"(?![^>]*\\bopen)`).test(html), `${id} disclosure must be collapsed by default`);
const curation = JSON.parse(await readFile(path.join(root, 'data/curation.json')));
assert(!('recognitionsHeld' in curation), 'The held recognition list is retired');
// Spec 022 Addendum 2: Teaching lists exactly the two PNU Instructor entries and no TA/other lines.
assert.equal(cv.teaching.length, 2, 'Expected 2 teaching entries');
const teachingHtml = html.match(/id="teaching"[\s\S]*?<\/section>/)?.[0] ?? '';
assert((teachingHtml.match(/class="career-row/g) || []).length === 2 && teachingHtml.includes('Machine Learning') && teachingHtml.includes('Data Structure') && teachingHtml.includes('Fall 2026') && !/\bTA\b|UNIST|Catalyst/.test(teachingHtml), 'Teaching must show only the two PNU Instructor entries');
const headerOrder = ['class="affiliation"', 'class="header-email"', 'class="profile-links"'].map((marker) => html.indexOf(marker));
assert(headerOrder.every((position) => position >= 0) && headerOrder.every((position, index) => index === 0 || position > headerOrder[index - 1]), 'Header contact information must follow affiliation, email, profile order');
assert(html.includes('https://scientific-inference-lab.github.io/'), 'Header and contact need the reviewed lab URL');
const sectionOrder = ['id="bio"', 'id="research"', 'id="experience"', 'id="education"', 'id="work"', 'id="funding"', 'id="recognition"', 'id="teaching"', 'id="patents"', 'id="contact"'].map((marker) => html.indexOf(marker));
assert(sectionOrder.every((position) => position >= 0) && sectionOrder.every((position, index) => index === 0 || position > sectionOrder[index - 1]), 'Page sections must follow the CV order');
// No manual theme control: the device preference decides (spec 013; the 2026-09-22 toggle removal stands).
assert(!html.includes('id="theme-toggle"') && !html.includes('data-theme=') && !html.includes('localStorage'), 'Theme follows the device: no manual control or stored override');
const css = await readFile(path.join(root, 'src/styles/global.css'), 'utf8');
assert(html.includes('media="(prefers-color-scheme: dark)"') && html.includes('media="(prefers-color-scheme: light)"'), 'Both device colour schemes need theme-color metadata');
assert(html.includes('<meta name="color-scheme" content="dark light">'), 'color-scheme metadata must advertise both schemes');
const darkBlock = css.match(/@theme\s*\{([\s\S]*?)\n\}/)?.[1];
const lightBlock = css.match(/@media \(prefers-color-scheme: light\)\s*\{([\s\S]*?)\n\}/)?.[1];
assert(lightBlock, 'The light override block is missing from global.css');
// Print is a third palette in `@media print { html { ... } }`.
const printBlock = css.match(/@media print\s*\{\s*html\s*\{([^}]*)\}/)?.[1];
assert(printBlock, 'The print palette block is missing from global.css');
// Verify the public machine-readable palette without depending on local operating documents.
const tokenNames = ['--color-paper', '--color-ink', '--color-muted', '--color-rule', '--color-accent'];
const tokenValue = (block, name, label) => {
  const match = block?.match(new RegExp(`${name}:\\s*([^;]+);`));
  assert(match, `Could not read ${name} from the ${label} block in global.css`);
  return match[1].trim().toLowerCase();
};
const expectedTokens = Object.fromEntries([
  ['light', lightBlock], ['dark', darkBlock], ['print', printBlock],
].map(([scheme, block]) => [scheme, Object.fromEntries(tokenNames.map((name) => [name, tokenValue(block, name, scheme)]))]));
const designTokens = JSON.parse(await readFile(path.join(root, 'src/data/design-tokens.json'), 'utf8'));
assert.deepEqual(designTokens, expectedTokens, 'Public design tokens drifted from global.css');
// theme-color is a hand-written copy of --color-paper; keep the two from drifting apart.
const cssPaper = { dark: tokenValue(darkBlock, '--color-paper', 'dark @theme'), light: tokenValue(lightBlock, '--color-paper', 'light :root') };
for (const scheme of ['dark', 'light']) {
  const meta = html.match(new RegExp(`<meta name="theme-color" content="([^"]+)" media="\\(prefers-color-scheme: ${scheme}\\)"`));
  assert(meta, `Missing theme-color metadata for the ${scheme} scheme`);
  assert.equal(meta[1].trim().toLowerCase(), cssPaper[scheme], `theme-color for ${scheme} drifted from --color-paper in global.css`);
}
assert(!/\/Users\/|(?:achievement_records|records)\/|CV_working\/|verificationStatus|sourceWarnings|astro-island/.test(html), 'Internal provenance or unexpected island/link leaked into HTML');
const allFiles = await readdir(path.join(root, 'dist'), { recursive: true });
// spec 021: the CV page plus 404.html are the only generated pages; the other .html files are search-console tokens.
const verification = JSON.parse(await readFile(path.join(root, 'src/data/site-verification.json')));
const tokenFiles = Object.keys(verification.files);
assert.deepEqual(allFiles.filter((file) => file.endsWith('.html') && !tokenFiles.includes(file)).sort(), ['404.html', 'index.html'], 'Only the CV page and 404.html should be generated');
for (const [file, sha256] of Object.entries(verification.files)) assert.equal(hash(await readFile(path.join(root, 'dist', file))), sha256, `Search-console token ${file} must stay byte-identical to the legacy site`);
for (const { name, content } of verification.meta) assert.equal((html.match(new RegExp(`<meta name="${name.replace('.', '\\.')}" content="${content}">`, 'g')) || []).length, 1, `Missing or duplicated ${name} meta tag`);
const canonicalUrl = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
assert(canonicalUrl, 'Missing canonical URL');
const robots = await readFile(path.join(root, 'dist/robots.txt'), 'utf8');
assert(/^User-agent: \*$/m.test(robots) && /^Allow: \/$/m.test(robots) && robots.includes(`Sitemap: ${canonicalUrl}sitemap.xml`), 'robots.txt must allow crawling and point at the sitemap');
const sitemapLocs = [...(await readFile(path.join(root, 'dist/sitemap.xml'), 'utf8')).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.deepEqual(sitemapLocs, [canonicalUrl], 'sitemap.xml must list exactly the canonical CV page');
const notFound = await readFile(path.join(root, 'dist/404.html'), 'utf8');
assert(notFound.includes('<meta name="robots" content="noindex">') && notFound.includes('href="/"') && !/<script/.test(notFound), '404.html must be noindex, script-free and link home');
let jsBytes = 0;
for (const file of allFiles.filter((file) => /\.(?:m?js)$/.test(file))) jsBytes += (await readFile(path.join(root, 'dist', file))).length;
for (const [, attributes, code] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
  if (!attributes.includes('application/ld+json') && !attributes.includes('src=')) jsBytes += new TextEncoder().encode(code).length;
}
assert(jsBytes < 3000, `Client JavaScript budget exceeded: ${jsBytes} bytes`);
assert(!allFiles.some((file) => /source-manifest|curation|cv\.generated|\.json$/.test(file)), 'Build-only data exposed in dist');
console.log(`Static checks passed: CV page + 404, 3 search-console tokens, robots/sitemap, ${cv.publications.length} papers, ${jsBytes} bytes of client JavaScript, identical CV PDF, valid anchors, no source metadata in HTML.`);
