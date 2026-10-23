import type { APIRoute } from 'astro';

// One indexable page. 404.html is noindex and the verification files are not pages.
export const GET: APIRoute = ({ site }) => {
  const home = new URL('/', site).href;
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${home}</loc></url>\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
