import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { editorial } from '../src/data/editorial.ts';
import { renderLlms } from '../src/data/llms.ts';

const cv = JSON.parse(await readFile(new URL('../src/data/cv.generated.json', import.meta.url), 'utf8'));
const site = 'https://yongkyung-oh.github.io/';
const sections = (text) => Object.fromEntries(text.split('\n## ').slice(1).map((section) => {
  const [name, ...lines] = section.split('\n');
  return [name, lines.filter((line) => line.startsWith('- '))];
}));
const links = (lines) => lines.map((line) => line.match(/^\- \[(.*)\]\((https:\/\/[^\s)]+)\)(?:: (.*))?$/));

test('llms gives readers the current profile, research directions and published paper destinations', () => {
  const text = renderLlms(cv, editorial, site);
  assert(text.startsWith(`# ${cv.identity.name}\n\n> ${editorial.description}\n`));
  const content = sections(text);
  assert.deepEqual(Object.keys(content), ['Profile', 'Research', 'Publications']);
  const profile = links(content.Profile);
  assert(profile.every(Boolean), 'Every profile item must have an absolute HTTPS Markdown link');
  assert.deepEqual(profile.map((match) => match[2]), [site, editorial.cv.url, editorial.lab.url, cv.identity.orcid, cv.identity.scholar, cv.identity.github, editorial.social.linkedin]);
  const research = links(content.Research);
  assert.equal(research.length, 4);
  for (const [index, match] of research.entries()) {
    assert(match);
    assert.equal(match[2], `${site}#research`);
    assert.equal(match[3], editorial.research[index].description);
  }
  const publications = links(content.Publications);
  assert.equal(publications.length, 28);
  for (const [index, match] of publications.entries()) {
    const paper = cv.publications[index];
    assert(match);
    assert.equal(match[1], paper.title);
    assert.equal(match[2], paper.links.find(({ label }) => label === 'Paper').url);
    assert(match[3].includes(paper.venue) && match[3].includes(String(paper.year)));
  }
});

test('llms projection omits private fields, unrelated records, IDs and extra link types', () => {
  const cvWithPrivateFields = structuredClone(cv);
  const editorialWithPrivateFields = structuredClone(editorial);
  const secret = 'PRIVATE_CANARY_86371';
  cvWithPrivateFields.sourcePath = ['', 'Users', 'private', 'records', `${secret}.yaml`].join('/');
  cvWithPrivateFields.verificationStatus = secret;
  cvWithPrivateFields.identity.internalNote = secret;
  for (const collection of ['career', 'education', 'funding', 'recognitions', 'teaching', 'patents']) {
    cvWithPrivateFields[collection] = [{ title: secret, amount: secret, courseCode: secret }];
  }
  for (const paper of cvWithPrivateFields.publications) {
    paper.id = secret;
    paper.sourcePath = secret;
    paper.citation = secret;
    paper.authors = [{ name: secret }];
    paper.links.push({ label: 'Internal', url: `https://example.com/${secret}` });
  }
  editorialWithPrivateFields.biography = secret;
  editorialWithPrivateFields.internalNote = secret;
  editorialWithPrivateFields.research.forEach((area) => { area.id = secret; area.sourcePath = secret; });
  const text = renderLlms(cvWithPrivateFields, editorialWithPrivateFields, site);
  assert(!text.includes(secret), 'Only selected public fields may be serialized');
  assert(text.includes(cv.publications[0].title), 'Public content must survive the projection');
  assert(!/sourcePath|verificationStatus|courseCode|\/Users\/|records\//.test(text));
});
