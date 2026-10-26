type PublicCV = {
  identity: {
    name: string;
    orcid: string;
    scholar: string;
    github: string;
  };
  publications: {
    title: string;
    venue: string;
    year: number;
    links: { label: string; url: string }[];
  }[];
};

type PublicEditorial = {
  description: string;
  cv: { url: string };
  lab: { url: string };
  social: { linkedin: string };
  research: { title: string; description: string }[];
};

const inline = (value: string) => value.replace(/\s+/g, ' ').trim().replace(/([\\`*_\[\]<>])/g, '\\$1');
const link = (label: string, url: string) => `[${inline(label)}](${url.replace(/\(/g, '%28').replace(/\)/g, '%29')})`;

export function renderLlms(cv: PublicCV, editorial: PublicEditorial, site: string | URL): string {
  const home = new URL('/', site).href;
  const profileLinks = [
    ['Academic website', home],
    ['CV PDF', editorial.cv.url],
    ['Scientific Inference Lab', editorial.lab.url],
    ['ORCID', cv.identity.orcid],
    ['Google Scholar', cv.identity.scholar],
    ['GitHub', cv.identity.github],
    ['LinkedIn', editorial.social.linkedin],
  ];
  const research = editorial.research.map((area) => `- ${link(area.title, new URL('#research', home).href)}: ${inline(area.description)}`);
  const publications = cv.publications.map((paper) => {
    const url = paper.links.find(({ label }) => label === 'Paper')?.url;
    if (!url) throw new Error('Each listed publication needs a public Paper link.');
    return `- ${link(paper.title, url)}: ${inline(paper.venue)}, ${paper.year}.`;
  });
  return [
    `# ${inline(cv.identity.name)}`,
    '',
    `> ${inline(editorial.description)}`,
    '',
    '## Profile',
    '',
    ...profileLinks.map(([label, url]) => `- ${link(label, url)}`),
    '',
    '## Research',
    '',
    ...research,
    '',
    '## Publications',
    '',
    ...publications,
    '',
  ].join('\n');
}
