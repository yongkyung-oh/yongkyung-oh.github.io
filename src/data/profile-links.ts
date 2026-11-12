import catalog from './profile-links.json' with { type: 'json' };

export const profileLinks = catalog.links.filter((link) => !link.omitOn.includes('personal'));
export const profileUrl = (id: string) => {
  const link = catalog.links.find((entry) => entry.id === id);
  if (!link) throw new Error(`Unknown profile link: ${id}`);
  return link.url;
};
export const personProfileUrls = catalog.links
  .filter((link) => !['lab', 'cv', 'personal'].includes(link.id))
  .map((link) => link.url);
