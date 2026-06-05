import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Deploy target: GitHub Pages (static).
// `site` must match the published origin so canonical/OG/sitemap URLs are correct.
// - User/org page (repo `<name>.github.io`):  site: "https://<name>.github.io"  (no base)
// - Project page   (repo `portfolio`):        site: "https://<user>.github.io", base: "/portfolio"
//   (assets use root-absolute paths, so set `base` for a project page.)
export default defineConfig({
  site: "https://yongkyung-oh.github.io",
  output: "static",
  devToolbar: {
    enabled: false
  },
  integrations: [sitemap({ filter: (page) => !page.includes("/404") })]
});
