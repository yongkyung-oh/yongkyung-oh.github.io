import assert from 'node:assert/strict';

const hosts = new Set(['arxiv.org', 'ojs.aaai.org', 'proceedings.mlr.press', 'openreview.net', 'doi.org', 'github.com', 'www.proquest.com']);
const collaboratorRepos = new Set(['/jonghun-lee0/Continuum-Dropout', '/Elena145/SmokeBERT']);
export function publicUrl(value) {
  const url = new URL(value);
  assert(url.protocol === 'https:' && !url.username && !url.password && !url.port && hosts.has(url.hostname), `Unapproved public URL: ${value}`);
  if (url.hostname === 'github.com') assert(url.pathname.startsWith('/yongkyung-oh/') || collaboratorRepos.has(url.pathname), 'Only reviewed repositories are permitted');
  if (url.hostname === 'www.proquest.com') assert(url.pathname === '/docview/2511385302' && !url.search, 'Use the reviewed public ProQuest record without institutional parameters');
  return url.href;
}

// slides and posters are Google Drive files the owner shared.
export function driveUrl(value) {
  const url = new URL(value);
  assert(url.protocol === 'https:' && !url.username && !url.password && !url.port && url.hostname === 'drive.google.com' && /^\/file\/d\/[\w-]+$/.test(url.pathname) && !url.search && !url.hash, `Unapproved Drive URL: ${value}`);
  return url.href;
}

export function byPath(items) {
  const map = new Map();
  for (const item of items) {
    assert(typeof item.sourcePath === 'string' && /^(?:achievement_records|records)\//.test(item.sourcePath) && !item.sourcePath.split('/').includes('..'), 'Invalid sourcePath');
    assert(!map.has(item.sourcePath), `Duplicate sourcePath: ${item.sourcePath}`);
    map.set(item.sourcePath, item);
  }
  return map;
}

const normalizeTitle = (title) => title.toLowerCase().replace(/\.$/, '').trim();
export function citationText(text) {
  return text.replace(/^\[[A-Z]+\d+\]\s*/, '')
    .replace(/\$\^\\dagger\$/g, '').replace(/\$\^\*\$/g, '')
    .replace(/\s*\[(?:paper|arxiv|code|poster|slide|news|webpage|workshop)\]/g, '').trim();
}

export function formatCitation(citation, italicText) {
  assert(Array.isArray(italicText) && italicText.length > 0, 'Reviewed citation emphasis is required');
  const parts = [];
  let cursor = 0;
  for (const text of italicText) {
    assert(typeof text === 'string' && text.length > 0, 'Invalid citation emphasis');
    const index = citation.indexOf(text, cursor);
    assert(index >= cursor, `Citation emphasis no longer matches the source: ${text}`);
    if (index > cursor) parts.push({ text: citation.slice(cursor, index), italic: false });
    parts.push({ text, italic: true });
    cursor = index + text.length;
  }
  if (cursor < citation.length) parts.push({ text: citation.slice(cursor), italic: false });
  assert.equal(parts.map((part) => part.text).join(''), citation, 'Citation wording must be preserved');
  return parts;
}

function authorList(record, choice) {
  assert.equal(record.record.authors, choice.expectedAuthors, `Author list changed: ${choice.id}`);
  const sourceNames = choice.sourceAuthorNames || record.record.authors.split(' and ');
  if (choice.sourceAuthorNames) {
    const apa = sourceNames.length === 1 ? sourceNames[0] : `${sourceNames.slice(0, -1).join(', ')}, & ${sourceNames.at(-1)}`;
    assert.equal(apa, record.record.authors, `Reviewed APA author boundaries changed: ${choice.id}`);
  }
  assert(Array.isArray(choice.displayAuthors) && choice.displayAuthors.length === sourceNames.length, `Reviewed full names required: ${choice.id}`);
  assert(Number.isInteger(choice.ownerAuthorIndex) && choice.ownerAuthorIndex >= 0 && choice.ownerAuthorIndex < sourceNames.length, `Reviewed owner index required: ${choice.id}`);
  assert(choice.authorEvidence?.reviewedOn && choice.authorEvidence?.note?.trim(), `Author evidence required: ${choice.id}`);
  if (choice.authorEvidence.url) publicUrl(choice.authorEvidence.url);
  else assert.equal(choice.authorEvidence.source, 'CV_publish/data/publications.json', 'Author evidence must identify the reviewed export');
  for (const role of record.authorRoles) {
    assert(sourceNames.includes(role.name) && ['co_first', 'co_corresponding', 'corresponding'].includes(role.role), `Unmapped author role: ${choice.id}`);
  }
  return sourceNames.map((sourceName, index) => {
    const name = choice.displayAuthors[index];
    assert(typeof name === 'string' && name.trim().split(/\s+/).length >= 2 && !/^[A-Z]\.\s/.test(name), `Use a reviewed full byline name: ${choice.id}`);
    const roles = record.authorRoles.filter((author) => author.name === sourceName).map((author) => author.role);
    return { name, owner: index === choice.ownerAuthorIndex, marker: roles.includes('co_first') ? '*' : roles.some((role) => role.endsWith('corresponding')) ? '†' : '' };
  });
}

export function projectPublication(record, choice, recognitions) {
  assert(record, `Missing publication: ${choice.sourcePath}`);
  assert(record.sourcePath === choice.sourcePath && record.recordType === choice.recordType, 'Publication identity/type changed');
  assert.equal(normalizeTitle(record.record.title), normalizeTitle(choice.title), `Title changed: ${choice.id}`);
  assert.equal(record.record.year, choice.expectedYear, `Year changed: ${choice.id}`);
  assert(record.record.venue.includes(choice.venueEvidence), `Venue changed: ${choice.id}`);
  assert.equal(record.verificationStatus, choice.expectedVerification, `Verification status changed: ${choice.id}`);
  assert.deepEqual([...record.sourceWarnings].sort(), [...choice.expectedWarnings].sort(), `Warnings changed: ${choice.id}`);
  assert(choice.reviewReason?.trim(), 'An explicit selection review reason is required');
  const accepted = record.recordType === 'accepted_in_press';
  const links = [];
  // Prefer the stable DOI when a publisher URL is insecure or institution-specific.
  const doi = record.record.doi?.replaceAll('\\_', '_');
  const primary = doi ? `https://doi.org/${doi}` : record.recordLinks.find((link) => link.category === 'paper' && link.url.startsWith('https://doi.org/'))?.url
    || (record.record.url?.includes('proquest.com') ? record.recordLinks.find((link) => link.url === 'https://www.proquest.com/docview/2511385302')?.url : record.record.url);
  if (primary) links.push({ label: 'Paper', url: publicUrl(primary) });
  const preprint = record.recordLinks.find((link) => link.category === 'arxiv');
  if (preprint) assert(new URL(preprint.url).hostname === 'arxiv.org', `Invalid preprint link: ${choice.id}`);
  if (preprint) links.push({ label: 'Preprint', url: publicUrl(preprint.url) });
  const code = record.recordLinks.find((link) => link.category === 'code');
  if (code) links.push({ label: 'Code', url: publicUrl(code.url) });
  // every slide/poster link, in source order, as in the lab site.
  for (const link of record.recordLinks) {
    if (link.category === 'slide') links.push({ label: 'Slides', url: driveUrl(link.url) });
    else if (link.category === 'poster') links.push({ label: 'Poster', url: driveUrl(link.url) });
  }
  assert(links.length > 0 && (primary || preprint), 'Paper needs a public reading link');
  let recognition = null;
  if (choice.recognition) {
    const matches = recognitions.filter((item) => item.sourcePath === record.sourcePath && item.note.award === choice.recognition.key);
    assert(matches.length === 1 && matches[0].note.status === 'verified', `Unverified/ambiguous recognition: ${choice.id}`);
    assert.equal(matches[0].note.text, choice.recognition.expectedText, 'Recognition text changed');
    recognition = choice.recognition.label;
  }
  const citation = citationText(record.plainText);
  assert(!/[\\$<>]/.test(citation), `Unsupported citation markup: ${choice.id}`);
  // Keep the source reference separately; only verified CV-only award notes are removed.
  let reference = citation;
  if (choice.recognition) {
    const suffix = ` ${choice.recognition.expectedText}.`;
    assert(reference.endsWith(suffix), `Recognition citation suffix changed: ${choice.id}`);
    reference = reference.slice(0, -suffix.length);
  }
  const citationDoi = links.find((link) => link.label === 'Paper' && new URL(link.url).hostname === 'doi.org')?.url ?? null;
  return {
    id: choice.id, title: choice.title, year: record.record.year, venue: choice.venue,
    category: choice.category, status: accepted ? 'Accepted · in press' : null,
    authors: authorList(record, choice), recognition, links, citation, citationDoi,
    citationParts: formatCitation(reference, choice.citationItalics),
  };
}

export function projectEntry(item, choice, expectedType) {
  assert(item && item.sourcePath === choice.sourcePath && item.recordType === expectedType && choice.recordType === expectedType, `Missing/wrong ${expectedType} record: ${choice.id}`);
  assert.equal(item.verificationStatus, choice.expectedVerification, `Verification status changed: ${choice.id}`);
  assert.deepEqual(item.sourceWarnings, choice.expectedWarnings, `Warnings changed: ${choice.id}`);
  assert(choice.expectedText?.length && choice.reviewReason?.trim(), `Entry review required: ${choice.id}`);
  for (const proof of choice.expectedText) assert(item.plainText.includes(proof), `Entry evidence changed: ${choice.id}: ${proof}`);
  const { id, title, organization, detail, date, note = '' } = choice;
  return { id, title, organization, detail, date, note };
}

export function projectBundle(raw, curation) {
  const publications = byPath(raw.publications);
  const items = byPath(raw.items);
  assert.equal(new Set(curation.publications.map((p) => p.id)).size, curation.publications.length, 'Duplicate selected ID');
  assert.equal(new Set(curation.publications.map((p) => p.sourcePath)).size, curation.publications.length, 'Duplicate selected source');
  assert.deepEqual(new Set(curation.publications.map((p) => p.sourcePath)), new Set(publications.keys()), 'Public CV publication coverage changed: review additions/removals before sync');
  const work = curation.publications.map((choice) => projectPublication(publications.get(choice.sourcePath), choice, raw.recognitions));
  for (const paper of work) assert.equal(paper.authors.find((author) => author.owner)?.name, curation.identity.name, `Owner byline differs from profile: ${paper.id}`);
  const projectEntries = (choices, type) => {
    assert.equal(new Set(choices.map((c) => c.sourcePath)).size, choices.length, `Duplicate ${type} source`);
    assert.equal(new Set(choices.map((c) => c.id)).size, choices.length, `Duplicate ${type} ID`);
    return choices.map((choice) => projectEntry(items.get(choice.sourcePath), choice, type));
  };
  const career = projectEntries(curation.career, 'career');
  const education = projectEntries(curation.education, 'education');
  const funding = projectEntries(curation.funding, 'grant');
  // Recognition mirrors the CV subsections. `group` is the bundle sectionId, never typed by hand.
  const recognitions = projectEntries(curation.recognitions, 'award').map((entry, index) => ({ ...entry, group: items.get(curation.recognitions[index].sourcePath).sectionId }));
  const patents = projectEntries(curation.patents, 'patent');
  // only the PNU Instructor lines of Teaching Experience; TA and other service lines stay out.
  assert(Array.isArray(curation.teaching), 'Teaching selection is required');
  const teaching = projectEntries(curation.teaching, 'service');
  const teachingItems = curation.teaching.map((c) => items.get(c.sourcePath));
  for (const [index, item] of teachingItems.entries()) {
    assert(item.sectionId === 'services_teaching' && item.record.organization === 'Pusan National University' && /, Instructor$/.test(item.record.title), `Teaching must be a PNU Instructor line from services_teaching: ${curation.teaching[index].id}`);
  }
  assert(teachingItems.every((item, index) => index === 0 || teachingItems[index - 1].label < item.label), 'Teaching order must follow the CV item order');
  assert.deepEqual(new Set(curation.teaching.map((c) => c.sourcePath)), new Set(raw.items.filter((item) => item.sectionId === 'services_teaching' && item.record.organization === 'Pusan National University' && /, Instructor$/.test(item.record.title)).map((item) => item.sourcePath)), 'PNU teaching coverage changed: review before sync');
  for (const [type, choices] of [['education', curation.education], ['career', curation.career], ['grant', curation.funding]]) {
    assert.deepEqual(new Set(choices.map((c) => c.sourcePath)), new Set(raw.items.filter((item) => item.recordType === type).map((item) => item.sourcePath)), `${type} coverage changed: review before sync`);
  }
  // honors + research awards only; scholarships and competitions stay out of the web selection.
  const awardSections = new Map(raw.items.filter((item) => item.recordType === 'award').map((item) => [item.sourcePath, item.sectionId]));
  assert(!('recognitionsHeld' in curation), 'The held recognition list was retired 2026-10-02; select every honors/research award');
  const selectedPaths = curation.recognitions.map((c) => c.sourcePath);
  assert.equal(new Set(selectedPaths).size, selectedPaths.length, 'Duplicate recognition source');
  assert.deepEqual(new Set(selectedPaths), new Set([...awardSections].filter(([, section]) => ['honors', 'honors_research_awards'].includes(section)).map(([path]) => path)), 'Recognition coverage changed: review before sync');
  for (const path of selectedPaths) assert(['honors', 'honors_research_awards'].includes(awardSections.get(path)), `Scholarship/competition must not be selected: ${path}`);
  const groupOrder = ['honors', 'honors_research_awards'];
  const recognitionItems = curation.recognitions.map((c) => items.get(c.sourcePath));
  recognitions.forEach((entry, index) => assert.equal(entry.group, recognitionItems[index].sectionId, `Recognition group must equal its bundle sectionId: ${entry.id}`));
  assert(recognitions.every((entry, index) => index === 0 || groupOrder.indexOf(entry.group) >= groupOrder.indexOf(recognitions[index - 1].group)), 'Recognition must follow the CV subsection order: Honors, then Research Awards');
  assert(recognitionItems.every((item, index) => index === 0 || recognitionItems[index - 1].sectionId !== item.sectionId || recognitionItems[index - 1].label < item.label), 'Recognition order within a subsection must follow the CV item order');
  // valid applications and grants only (no discontinued or unregistered filings).
  assert.deepEqual(new Set(curation.patents.map((c) => c.sourcePath)), new Set(raw.items.filter((item) => item.sectionId === 'patents').map((item) => item.sourcePath)), 'Patent coverage changed: review before sync');
  const current = career.find((entry) => entry.id === 'pnu');
  assert(current, 'Current appointment is required');
  return {
    schemaVersion: 2,
    sourceDate: raw.generatedAt.slice(0, 10),
    identity: { ...curation.identity, title: current.title, organization: current.organization },
    publications: work, career, education, funding, recognitions, teaching, patents,
  };
}
