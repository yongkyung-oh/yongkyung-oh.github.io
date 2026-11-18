import catalog from './profile-links.json' with { type: 'json' };

type ProfileLink = { id: string; label: string; url: string; group: string; omitOn: string[]; webFeatured?: boolean };

const links: ProfileLink[] = catalog.links;

export const profileLinks = links.filter((link) => !link.omitOn.includes('personal'));
// Only webFeatured links stay visible; the rest keep their order inside "More profiles".
export const featuredProfileLinks = profileLinks.filter((link) => link.webFeatured === true);
export const moreProfileLinks = profileLinks.filter((link) => link.webFeatured !== true);
export const profileUrl = (id: string) => {
  const link = links.find((entry) => entry.id === id);
  if (!link) throw new Error(`Unknown profile link: ${id}`);
  return link.url;
};
export const personProfileUrls = links
  .filter((link) => !['lab', 'cv', 'personal'].includes(link.id))
  .map((link) => link.url);
