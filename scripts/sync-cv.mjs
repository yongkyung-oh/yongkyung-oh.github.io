import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { projectBundle } from './cv-adapter.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
let check = false;
let source = process.env.CV_EXPORT_DIR || path.resolve(root, '../CV_publish');
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--check') check = true;
  else if (args[i] === '--source' && args[i + 1]) source = path.resolve(args[++i]);
  else throw new Error('Usage: npm run sync:cv -- [--check] [--source /absolute/path/to/CV_publish]');
}
const hash = (buffer) => createHash('sha256').update(buffer).digest('hex');
const files = ['data/publications.json', 'data/cv_items.json', 'data/recognitions.json', 'manifest.yaml', 'CV.pdf'];
const buffers = Object.fromEntries(await Promise.all(files.map(async (file) => [file, await readFile(path.join(source, file))])));
const curationBuffer = await readFile(path.join(root, 'data/curation.json'));
const curation = JSON.parse(curationBuffer);
assert.equal(hash(buffers['CV.pdf']), curation.identityEvidence.sha256, 'Public PDF changed: review page 1 identity/links and update the reviewed curation hash before importing.');
assert(buffers['CV.pdf'].subarray(0, 5).toString() === '%PDF-', 'Invalid public CV PDF');
const generatedAt = buffers['manifest.yaml'].toString().match(/^generated_at:\s*['"]?([^'"\n]+)['"]?\s*$/m)?.[1];
assert(generatedAt && !Number.isNaN(Date.parse(generatedAt)), 'Missing/invalid source generated_at');
const raw = {
  publications: JSON.parse(buffers['data/publications.json']),
  items: JSON.parse(buffers['data/cv_items.json']),
  recognitions: JSON.parse(buffers['data/recognitions.json']), generatedAt,
};
const data = projectBundle(raw, curation);
const dataBuffer = Buffer.from(JSON.stringify(data, null, 2) + '\n');
const selected = [...curation.publications, ...curation.career, ...curation.education, ...curation.funding, ...curation.recognitions, ...curation.teaching, ...curation.patents].map((choice) => {
  const record = raw.items.find((item) => item.sourcePath === choice.sourcePath);
  assert(record, `Selected record missing from cv_items: ${choice.sourcePath}`);
  return { sourcePath: choice.sourcePath, recordType: record.recordType, verificationStatus: record.verificationStatus, warnings: record.sourceWarnings, reviewReason: choice.reviewReason || 'Curated career fields checked against the exported plainText.', ...(choice.authorEvidence ? { sourceAuthors: choice.expectedAuthors, displayAuthors: choice.displayAuthors, authorEvidence: choice.authorEvidence } : {}) };
});
const manifest = {
  schemaVersion: 2, sourceBundle: 'CV_publish', sourceGeneratedAt: generatedAt,
  curationSha256: hash(curationBuffer),
  generatedDataSha256: hash(dataBuffer),
  sources: Object.fromEntries(files.map((file) => [file, { sha256: hash(buffers[file]), bytes: buffers[file].length }])),
  selected,
};
const outputs = {
  'src/data/cv.generated.json': dataBuffer,
  'src/data/build-integrity.json': Buffer.from(JSON.stringify({ schemaVersion: 1, generatedDataSha256: hash(dataBuffer), cvPdfSha256: hash(buffers['CV.pdf']) }, null, 2) + '\n'),
  'data/source-manifest.json': Buffer.from(JSON.stringify(manifest, null, 2) + '\n'),
  'public/cv/YongKyung-Oh-CV.pdf': buffers['CV.pdf'],
};
if (check) {
  for (const [file, expected] of Object.entries(outputs)) assert.equal(hash(await readFile(path.join(root, file))), hash(expected), `Stale project snapshot: ${file}. Review then run sync:cv.`);
  console.log(`CV snapshot matches all five source files and curation (${data.sourceDate}). No files changed.`);
} else {
  for (const [file, buffer] of Object.entries(outputs)) {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await writeFile(path.join(root, file), buffer);
  }
  console.log(`Imported ${data.publications.length} papers, ${data.career.length} career entries, ${data.education.length} degrees, ${data.funding.length} grants/fellowships and ${data.recognitions.length} distinctions, ${data.patents.length} patents, ${data.teaching.length} teaching entries, ${data.publications.flatMap((paper) => paper.links).filter((link) => link.label === 'Slides').length} slide and ${data.publications.flatMap((paper) => paper.links).filter((link) => link.label === 'Poster').length} poster links; unchanged public CV PDF (${data.sourceDate}).`);
}
