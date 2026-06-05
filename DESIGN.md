# DESIGN.md — portfolio.github.io design system

Status: canonical design spec, 2026-06-05. Authoritative for look, tone, component design, and page intent.
This is the buildable consolidation of the audits and references; read it before authoring UI.

**Companions (do not duplicate — defer to them):**
- Content sourcing: [`DATA_SOURCES.md`](DATA_SOURCES.md) · Tone/realignment: [`DESIGN_NOTES.md`](DESIGN_NOTES.md)
- UX/element audit: [`../docs/portfolio-ux-audit.md`](../docs/portfolio-ux-audit.md)
- Information architecture: [`../docs/portfolio-information-architecture.md`](../docs/portfolio-information-architecture.md)
- SEO/GEO/mobile: [`../docs/portfolio-seo-geo-mobile-audit.md`](../docs/portfolio-seo-geo-mobile-audit.md)
- References: `../refs/researcher-sites.md`, `../refs/academic-homepage-visual-patterns-2026.md`,
  `../refs/academic-ui-component-patterns.md`, `../refs/korean-university-lab-sites.md`
- Tokens source of truth: [`src/styles/tokens.css`](src/styles/tokens.css)

## 1. Intent

A **single, honest, individual researcher page now**, deliberately structured to become a **faculty / PI-led-lab page
after appointment** via an additive content patch — **not** a runtime two-mode build (owner decision; see IA doc). The
present site states only current status (postdoc, UCLA Health); no lab/group identity, team, or "we" voice. The
reference class for *now* is individual researcher homepages; the reference class for *later* is Korean university lab
sites (DMQA-class). Build the structure for both; render only the present.

## 2. Design principles (grounded in refs)

1. **Text-first, content-first.** Compact identity above the fold; restraint over decoration. (researcher-sites,
   DESIGN_NOTES.) Decoration is subordinate to academic content.
2. **Publications are the primary credibility surface.** Selected papers lead the home page; titles/venues/years and
   Paper/DOI/Preprint/Code links matter more than visual cards. No publication-count "metrics flex" (UX-audit F3).
3. **Conventional navigation**, 5–7 items, plain labels. No invented section names, no internal/dev vocabulary in the UI.
4. **Quiet, scholarly tone.** Not industry-IR/marketing. Tame the "Atlas Ledger" editorial conceit — hairlines and mono
   kickers are accents, not the dominant motif (UX-audit F7).
5. **Elements before pages.** Every content type is a reusable, data-driven component; pages compose them. Never hardcode
   a grid to today's item count (UX-audit F1/F2).
6. **Honest and source-backed.** No fabricated metrics, grants amounts, team, or honors (DATA_SOURCES). `sourcePath` /
   `verificationStatus` exist in data but are never rendered.
7. **Fast and accessible on mobile first.** Optimized images, AA contrast, keyboard/focus, reduced-motion.

## 3. Visual language — "Atlas Ledger" (dialed down)

**Tokens are defined once in `src/styles/tokens.css`; components consume semantic tokens only — never hard-code hex.**

- **Color (dual-mode, device-preference):** `:root` light → `@media (prefers-color-scheme: dark)` → `:root[data-theme]`
  manual override. Surfaces `--bg/--surface/--surface-2/--surface-invert`; text `--text/--text-muted`; structure
  `--line`; one swappable accent `--accent` (brass) + `--accent-contrast`; viz `--viz-1/2`; `--focus` (mode-independent
  blue). **Every text/surface pair ≥ 4.5:1 (AA) in both modes.** A visual language may override **only**
  `--accent`/`--accent-contrast`.
- **Type:** display = Newsreader (serif) for headings; body = IBM Plex Sans; mono = IBM Plex Mono for kickers/labels.
  Scale in tokens (`--text-xs … --text-3xl`). **Restraint:** the home `<h1>` is the name but must not be a billboard —
  cap hero display and let paper titles read at a confident body/subhead size (UX-audit F6/F8).
- **Space/layout:** 4px spacing scale; `--max` content width; `--measure` (72ch) prose; `--gutter`; `--radius`.
- **Decoration budget:** thin `--line` hairlines and a single accent hairline at the top of the header are allowed; the
  earlier 5px black/white masthead rule and heavy ruled-table look are **out** (F7). Mono uppercase kickers: at most one
  per section, not on every block.

## 4. Component kit (the element layer)

Author each as a component with: anatomy, props, states (default/hover/focus/active/empty), token usage, **N-item
behavior** (list or `auto-fit minmax()`, never fixed columns), and a11y. Spec details: `../refs/academic-ui-component-patterns.md`.

Core elements (existing + to standardize):
- **PublicationList / PublicationItem** — the template component. Title · authors (self bolded) · venue+year · status tag
  · link chips in fixed order **Paper → DOI/PDF → Preprint/arXiv → Code → Slides/Poster**. Optional `limit` for selected.
- **ResearchAreaList** — text + methods tags per area; no big viz.
- **NewsList / NewsItem** — date · title (optional link) · one line; reverse-chronological list.
- **ProjectList / ProjectCard** — name · track (research/industry) · status · summary · role+period · links; industry/NDA
  shown minimally.
- **PortfolioRecordList**, **TalkList**, **CareerTimeline**, **EducationList**, **GrantList**, **PatentList**,
  **RecognitionList** — CV/record surfaces; quiet rows, consistent meta typography.
- **MetaList** — shared `label: value` definition-list primitive (profile, project meta, CV rows).
- **ResearchProgramPanel** — home identity panel: optimized portrait (`<picture>` webp + jpg, width/height set) +
  role/affiliation + a short definition list. No "Research Leadership"/lab wording at the individual stage.
- Chrome: **SiteHeader/Nav** (`aria-current`, single focus style, Light/Dark toggle), **Footer**, **skip-link**.

Rules: semantic tokens only; one chip vocabulary site-wide; one date format; `derived.shortVenue()` for venues; no
component ships a fabricated value or a count-locked grid.

## 5. Page intent

- **Home (`/`) — highest priority.** Order: compact identity (name, role, affiliation, 1–2 sentence research statement,
  links; portrait optional) → **selected publications lead** → research areas (brief) → news → footer. Email is a
  *secondary* action, not the loudest CTA. No metrics strip, no name-billboard, no "Site Record" meta copy.
- **Research (`/research/`)** — a few research-area blocks (text + representative works).
- **Publications (`/publications/`)** — selected representative record, text-led list with link chips.
- **Projects (`/projects/`)** (+ legacy `/portfolio-dev/`, `/portfolio-mgt/`, `/presentations/` archives) — research +
  industry tracks, minimal for NDA.
- **Talks (`/talks/`)** — selected talks/presentations, reverse-chronological.
- **About (`/about/`)** — short bio + CV sections (career, education, funding, recognitions, selected patents).
- **Contact (`/contact/`)** — email + profile links.

## 6. Landing-page spec (most urgent surface)

- **Performance:** the hero portrait must be an optimized `<picture>` (webp + jpg fallback, ~1100px, `width`/`height`
  set, `fetchpriority="high"`). No multi-megapixel originals in the cutover payload. Target mobile LCP < 2.5 s.
  *(Done 2026-06-05: 5.2 MB PNG → 26 KB webp.)*
- **Hierarchy:** identity → selected publications first; quiet type; one accent.
- **Mobile:** legible at 390/768/1440, no overflow, tap targets ≥ 44px, hero type tamed on small screens.

## 7. Accessibility gates (per page, before "done")

One `<h1>`; sensible heading outline; visible focus rings; `aria-current` nav; skip-link; AA contrast in both themes;
reduced-motion respected; images have meaningful `alt`; 0px horizontal overflow at 390/768/1440.

## 8. SEO / GEO / discoverability baseline

- Per-page `canonical`, distinct `description`, OG/Twitter with a **dedicated 1200×900 OG card** (`og:site_name`,
  `og:locale`, `og:image:width/height/alt`).
- **JSON-LD** `Person` (+ `sameAs`: Scholar/GitHub/LinkedIn; add ORCID when available) and `WebSite`; per-publication
  `ScholarlyArticle` is a planned add.
- `robots.txt` (AI crawlers explicitly allowed) + sitemap + **`llms.txt`** (identity + key links, single honest mode).
  *(Done 2026-06-05.)*
- Static SSG output (crawlable by search and AI engines) — keep. Remaining: font `preload`, apple-touch-icon + manifest,
  per-publication schema, a measured Lighthouse pass.

## 9. Forward-compatibility (lab stage — do not render yet)

Data models are typed for growth (`people.ts` multi-person with roles/alumni; `projects.ts`, `talks.ts`, `news.ts`,
`grants.ts`, `patents.ts`). At appointment, a content patch maps these onto a DMQA-class lab IA (Members, Projects,
Seminar/News, Funding, Patents, Join), reusing the same element kit. Until then: single individual mode, no lab surfaces.
Reference for that stage: `../refs/korean-university-lab-sites.md`.

## 10. Do / Don't

**Do:** author elements before pages; consume semantic tokens; keep publications primary; keep one honest mode; optimize
images; verify both themes + 3 breakpoints + 0/N items.
**Don't:** hardcode item-count grids; hard-code hex in components; ship marketing/IR framing, metrics flex, fake graphics,
or internal/dev vocabulary; render lab/team/"we" or grant amounts; introduce a runtime stage switch.
