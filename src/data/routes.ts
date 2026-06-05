export const siteBasePath = "";

export const routePath = (path = "") => {
  const base = siteBasePath.replace(/\/$/, "");
  const segment = path.replace(/^\/+|\/+$/g, "");
  return `${base}${segment ? `/${segment}` : ""}/`;
};

export const siteNav = [
  { label: "Home", href: routePath() },
  { label: "Research", href: routePath("research") },
  { label: "Publications", href: routePath("publications") },
  { label: "Projects", href: routePath("projects") },
  { label: "Talks", href: routePath("talks") },
  { label: "About", href: routePath("about") },
  { label: "Contact", href: routePath("contact") }
] as const;
