import test from 'node:test';
import assert from 'node:assert/strict';
import { byPath, publicUrl, driveUrl, projectPublication, citationText, projectEntry, projectBundle, formatCitation } from '../scripts/cv-adapter.mjs';

function fixture() {
  const sourcePath = ['achievement_records', 'accepted_in_press/conference/example.yaml'].join('/');
  const choice = { id: 'example', sourcePath, recordType: 'accepted_in_press', title: 'A study of evidence', venue: 'ICML', venueEvidence: 'ICML', expectedYear: 2026, expectedVerification: 'partially_verified', expectedWarnings: ['accepted_in_press_local_metadata'], reviewReason: 'Keep accepted status visible.', category: 'Position paper', citationItalics: ['ICML 2026'] };
  Object.assign(choice, { expectedAuthors: 'Oh, Y.', displayAuthors: ['YongKyung Oh'], ownerAuthorIndex: 0, authorEvidence: { url: 'https://arxiv.org/abs/2605.17273', reviewedOn: '2026-09-10', note: 'Verified full name for this selected record.' } });
  const record = { sourcePath, key: 'shared-key', recordType: choice.recordType, verificationStatus: choice.expectedVerification, sourceWarnings: choice.expectedWarnings, record: { title: 'A Study of Evidence.', authors: 'Oh, Y.', venue: 'ICML 2026', year: 2026 }, plainText: '[C14] Oh, Y. (2026). A study of evidence. In ICML 2026. (accepted, in press) [arxiv]', authorRoles: [], recordLinks: [{ type: 'arxiv', category: 'arxiv', url: 'https://arxiv.org/abs/2605.17273' }, { category: 'poster', url: 'https://drive.google.com/file/d/private-poster_1' }, { category: 'slide', url: 'https://drive.google.com/file/d/private-slide' }] };
  return { choice, record };
}

test('work-level keys can repeat across record paths; duplicate paths cannot', () => {
  const a = { sourcePath: ['records', 'example/a.yaml'].join('/'), key: 'same' };
  const b = { sourcePath: ['achievement_records', 'presentations/a.yaml'].join('/'), key: 'same' };
  assert.equal(byPath([a, b]).size, 2);
  assert.throws(() => byPath([a, { ...a }]), /Duplicate/);
  assert.throws(() => byPath([{ sourcePath: ['achievement_records', '../private.yaml'].join('/') }]), /Invalid/);
});

test('accepted paper keeps its status; slides and posters are projected in source order after the other links', () => {
  const { record, choice } = fixture();
  const output = projectPublication(record, choice, []);
  assert.equal(output.status, 'Accepted · in press');
  assert.deepEqual(output.links, [{ label: 'Preprint', url: 'https://arxiv.org/abs/2605.17273' }, { label: 'Poster', url: 'https://drive.google.com/file/d/private-poster_1' }, { label: 'Slides', url: 'https://drive.google.com/file/d/private-slide' }]);
  assert.equal(driveUrl('https://drive.google.com/file/d/abc-DEF_1'), 'https://drive.google.com/file/d/abc-DEF_1');
  for (const url of ['http://drive.google.com/file/d/a', 'https://drive.google.com/drive/folders/a', 'https://drive.google.com/file/d/a/view?usp=sharing', 'https://docs.google.com/file/d/a', 'https://drive.google.com.evil.test/file/d/a']) assert.throws(() => driveUrl(url));
  assert(!JSON.stringify(output).includes('sourcePath'));
});

test('title, type and verification drift stop import', () => {
  for (const mutate of [
    (r) => { r.record.title = 'A different finding'; },
    (r) => { r.recordType = 'publication'; },
    (r) => { r.sourceWarnings = ['missing_acceptance']; },
    (r) => { r.verificationStatus = 'unverified'; },
  ]) {
    const { record, choice } = fixture();
    mutate(record);
    assert.throws(() => projectPublication(record, choice, []));
  }
});

test('recognition requires the selected paper path, exact award key and verified status', () => {
  const { record, choice } = fixture();
  choice.recognition = { key: 'award_example', expectedText: 'Best Paper Award', label: 'Best Paper Award' };
  record.plainText += ' Best Paper Award.';
  const note = { award: 'award_example', text: 'Best Paper Award', status: 'verified' };
  assert.throws(() => projectPublication(record, choice, [{ sourcePath: 'another', note }]), /recognition/);
  assert.throws(() => projectPublication(record, choice, [{ sourcePath: record.sourcePath, note: { ...note, status: 'unverified' } }]), /recognition/);
  assert.equal(projectPublication(record, choice, [{ sourcePath: record.sourcePath, note }]).recognition, 'Best Paper Award');
  const projected = projectPublication(record, choice, [{ sourcePath: record.sourcePath, note }]);
  assert(projected.citation.endsWith('Best Paper Award.'));
  assert(!projected.citationParts.map(p => p.text).join('').includes('Best Paper Award'));
  record.plainText = record.plainText.replace('Best Paper Award.', 'Unreviewed award.');
  assert.throws(() => projectPublication(record, choice, [{ sourcePath: record.sourcePath, note }]), /suffix changed/);
});

test('public links reject unsafe protocols, lookalike hosts and unreviewed repositories', () => {
  for (const url of ['javascript:alert(1)', 'http://arxiv.org/abs/1', 'https://arxiv.org.evil.test/1', 'https://github.com/other/repo', 'https://user:pass@arxiv.org/abs/1', 'https://drive.google.com/file/1']) assert.throws(() => publicUrl(url));
  assert.equal(publicUrl('https://github.com/yongkyung-oh/FlowPath'), 'https://github.com/yongkyung-oh/FlowPath');
});

test('APA citation retains accepted status and removes display-only TeX/link tokens', () => {
  const result = citationText('[C14] Oh, Y.$^*$, & Bui, A.$^\\dagger$ (2026). Title. (accepted, in press) [paper] [code]');
  assert.equal(result, 'Oh, Y., & Bui, A. (2026). Title. (accepted, in press)');
});

test('abbreviated source author has a reviewed full byline and an unchanged APA citation', () => {
  const { record, choice } = fixture();
  const result = projectPublication(record, choice, []);
  assert.deepEqual(result.authors, [{ name: 'YongKyung Oh', owner: true, marker: '' }]);
  assert(result.citation.startsWith('Oh, Y. (2026).'));
  assert.equal(record.record.authors, 'Oh, Y.');
});

test('initials alone never identify the owner; an exact record-specific author review is required', () => {
  const { record, choice } = fixture();
  delete choice.ownerAuthorIndex;
  assert.throws(() => projectPublication(record, choice, []), /owner index/);
  choice.ownerAuthorIndex = 0;
  record.record.authors = 'Oh, Young';
  assert.throws(() => projectPublication(record, choice, []), /Author list changed/);
});

test('full-name normalization preserves source-order contribution markers', () => {
  const { record, choice } = fixture();
  record.record.authors = 'Oh, YongKyung and Lim, Dongyoung and Kim, Sungil';
  record.authorRoles = [{ name: 'Oh, YongKyung', role: 'co_first' }, { name: 'Lim, Dongyoung', role: 'co_first' }];
  choice.expectedAuthors = record.record.authors;
  choice.displayAuthors = ['YongKyung Oh', 'Dong-Young Lim', 'Sungil Kim'];
  const result = projectPublication(record, choice, []);
  assert.deepEqual(result.authors.map(({ name, marker, owner }) => ({ name, marker, owner })), [
    { name: 'YongKyung Oh', marker: '*', owner: true },
    { name: 'Dong-Young Lim', marker: '*', owner: false },
    { name: 'Sungil Kim', marker: '', owner: false },
  ]);
  record.record.authors = 'Lim, Dongyoung and Oh, YongKyung and Kim, Sungil';
  assert.throws(() => projectPublication(record, choice, []), /Author list changed/);
});

test('multiple APA-formatted authors retain their reviewed boundaries and contribution roles', () => {
  const { record, choice } = fixture();
  record.record.authors = 'Oh, Y., & Bui, A.';
  record.authorRoles = [{ name: 'Bui, A.', role: 'corresponding' }];
  Object.assign(choice, { expectedAuthors: record.record.authors, sourceAuthorNames: ['Oh, Y.', 'Bui, A.'], displayAuthors: ['YongKyung Oh', 'Alex Bui'] });
  const output = projectPublication(record, choice, []);
  assert.deepEqual(output.authors, [{ name: 'YongKyung Oh', owner: true, marker: '' }, { name: 'Alex Bui', owner: false, marker: '†' }]);
  choice.sourceAuthorNames.reverse();
  assert.throws(() => projectPublication(record, choice, []), /boundaries/);
});

test('journal DOI is used without exposing an insecure publisher URL', () => {
  const { record, choice } = fixture();
  record.record.url = 'http://publisher.test/paper';
  record.record.doi = '10.1007/978-981-97-9003-6\\_7';
  assert.equal(projectPublication(record, choice, []).links[0].url, 'https://doi.org/10.1007/978-981-97-9003-6_7');
  assert.equal(projectPublication(record, choice, []).citationDoi, 'https://doi.org/10.1007/978-981-97-9003-6_7');
  assert.equal(record.record.doi, '10.1007/978-981-97-9003-6\\_7');
});

test('a malformed poster now fails closed; selected preprints still fail closed', () => {
  const { record, choice } = fixture();
  record.record.doi = '10.1007/example';
  assert.equal(projectPublication(record, choice, []).links[0].url, 'https://doi.org/10.1007/example');
  record.recordLinks.push({ category: 'poster', url: '' });
  assert.throws(() => projectPublication(record, choice, []), /Invalid URL/);
  record.recordLinks.pop();
  record.recordLinks[0].url = '';
  assert.throws(() => projectPublication(record, choice, []), /Invalid URL/);
  record.recordLinks[0].url = 'https://doi.org/10.1007/not-a-preprint';
  assert.throws(() => projectPublication(record, choice, []), /Invalid preprint/);
});

test('grant roles and award nominations stop import when their source wording or status changes', () => {
  const item = { sourcePath: ['records', 'awards/ucla.yaml'].join('/'), recordType: 'award', verificationStatus: 'evidence_verified', sourceWarnings: [], plainText: "Chancellor's Award for Postdoctoral Research Nominee (2025). UCLA." };
  const choice = { ...item, id: 'nominee', expectedText: ['Nominee', '2025', 'UCLA'], expectedVerification: item.verificationStatus, expectedWarnings: [], reviewReason: 'Nomination, not a win.', title: 'Chancellor’s Award — Nominee', organization: 'UCLA', detail: 'Nomination', date: '2025' };
  assert.equal(projectEntry(item, choice, 'award').title, 'Chancellor’s Award — Nominee');
  assert.throws(() => projectEntry({ ...item, plainText: item.plainText.replace('Nominee', 'Winner') }, choice, 'award'), /evidence changed/);
  assert.throws(() => projectEntry({ ...item, verificationStatus: 'unverified' }, choice, 'award'), /Verification/);
  assert.throws(() => projectEntry(item, choice, 'grant'), /wrong/);
});

test('complete publication coverage requires review when the public export gains a paper', () => {
  const { record, choice } = fixture();
  const pnu = { sourcePath: ['records', 'career/pnu.yaml'].join('/'), recordType: 'career', verificationStatus: 'verified', sourceWarnings: [], plainText: 'Assistant Professor at PNU' };
  const curation = { identity: { name: 'YongKyung Oh' }, publications: [choice], career: [{ id: 'pnu', sourcePath: pnu.sourcePath, recordType: 'career', expectedVerification: 'verified', expectedWarnings: [], expectedText: ['Assistant Professor'], reviewReason: 'Current appointment', title: 'Assistant Professor', organization: 'PNU', detail: '', date: 'Current' }], education: [], funding: [], recognitions: [], teaching: [], patents: [] };
  const raw = { publications: [record], items: [pnu], recognitions: [], generatedAt: '2026-09-08' };
  assert.equal(projectBundle(raw, curation).publications.length, 1);
  raw.publications.push({ ...record, sourcePath: ['records', 'example/new.yaml'].join('/') });
  assert.throws(() => projectBundle(raw, curation), /coverage changed/);
});


test('citation italics distinguish journal and volume from article title and issue', () => {
  const citation = 'Oh, Y. (2025). Study title. Journal of Evidence, 39(6), 12-18.';
  const parts = formatCitation(citation, ['Journal of Evidence', '39']);
  assert.deepEqual(parts.filter(p => p.italic).map(p => p.text), ['Journal of Evidence', '39']);
  assert.equal(parts.map(p => p.text).join(''), citation);
  assert(parts.some(p => !p.italic && p.text.includes('(6)')));
  assert.throws(() => formatCitation(citation, ['Changed journal']), /no longer matches/);
});

test('recognition group is the bundle sectionId and keeps the CV subsection order', () => {
  const { record, choice } = fixture();
  const mk = (id, sectionId, label) => ({ sourcePath: ['records', `awards/${id}.yaml`].join('/'), recordType: 'award', sectionId, label, verificationStatus: 'verified', sourceWarnings: [], plainText: id });
  const pnu = { sourcePath: ['records', 'career/pnu.yaml'].join('/'), recordType: 'career', verificationStatus: 'verified', sourceWarnings: [], plainText: 'Assistant Professor at PNU' };
  const h1 = mk('h1', 'honors', 'H01'); const r1 = mk('r1', 'honors_research_awards', 'HR01');
  const pick = (item) => ({ id: item.label, sourcePath: item.sourcePath, recordType: 'award', expectedVerification: 'verified', expectedWarnings: [], expectedText: [item.plainText], reviewReason: 'test', title: item.label, organization: '', detail: '', date: '2026' });
  const career = [{ id: 'pnu', sourcePath: pnu.sourcePath, recordType: 'career', expectedVerification: 'verified', expectedWarnings: [], expectedText: ['Assistant Professor'], reviewReason: 'Current appointment', title: 'Assistant Professor', organization: 'PNU', detail: '', date: 'Current' }];
  const curation = (recognitions) => ({ identity: { name: 'YongKyung Oh' }, publications: [choice], career, education: [], funding: [], recognitions, teaching: [], patents: [] });
  const raw = { publications: [record], items: [pnu, h1, r1], recognitions: [], generatedAt: '2026-09-08' };
  assert.deepEqual(projectBundle(raw, curation([pick(h1), pick(r1)])).recognitions.map((entry) => entry.group), ['honors', 'honors_research_awards']);
  assert.throws(() => projectBundle(raw, curation([pick(r1), pick(h1)])), /subsection order/);
});

test('teaching selects only PNU Instructor lines and requires review when another appears', () => {
  const { record, choice } = fixture();
  const mk = (id, label, title, organization) => ({ sourcePath: ['records', `service/${id}.yaml`].join('/'), recordType: 'service', sectionId: 'services_teaching', label, verificationStatus: 'owner_prepared_syllabus', sourceWarnings: [], plainText: title, record: { title, organization } });
  const pnu = { sourcePath: ['records', 'career/pnu.yaml'].join('/'), recordType: 'career', verificationStatus: 'verified', sourceWarnings: [], plainText: 'Assistant Professor at PNU' };
  const ml = mk('ml', 'ST01', 'Machine Learning, Instructor', 'Pusan National University');
  const ta = mk('ta', 'ST05', 'MGT205 Financial Accounting, TA', 'UNIST');
  const pick = (item) => ({ id: item.label, sourcePath: item.sourcePath, recordType: 'service', expectedVerification: 'owner_prepared_syllabus', expectedWarnings: [], expectedText: [item.plainText], reviewReason: 'test', title: item.label, organization: 'Pusan National University', detail: '', date: 'Fall 2026' });
  const career = [{ id: 'pnu', sourcePath: pnu.sourcePath, recordType: 'career', expectedVerification: 'verified', expectedWarnings: [], expectedText: ['Assistant Professor'], reviewReason: 'Current appointment', title: 'Assistant Professor', organization: 'PNU', detail: '', date: 'Current' }];
  const curation = (teaching) => ({ identity: { name: 'YongKyung Oh' }, publications: [choice], career, education: [], funding: [], recognitions: [], teaching, patents: [] });
  const raw = { publications: [record], items: [pnu, ml, ta], recognitions: [], generatedAt: '2026-09-08' };
  assert.deepEqual(projectBundle(raw, curation([pick(ml)])).teaching.map((entry) => entry.id), ['ST01']);
  assert.throws(() => projectBundle(raw, curation([pick(ml), pick(ta)])), /PNU Instructor/);
  raw.items.push(mk('ds', 'ST02', 'Data Structure, Instructor', 'Pusan National University'));
  assert.throws(() => projectBundle(raw, curation([pick(ml)])), /teaching coverage changed/);
});
