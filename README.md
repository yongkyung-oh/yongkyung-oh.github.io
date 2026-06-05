# portfolio.github.io

YongKyung Oh's academic/research site — a routed **Astro 6** static source tree for the public
`https://yongkyung-oh.github.io` target. The visual language is the academic-aligned Atlas Ledger
direction: Newsreader serif + IBM Plex Sans/Mono, warm graphite paper, brass accent, text-first
publication lists, real profile imagery, and device-aware light/dark with compact icon buttons.

Deployment cutover is not complete from local evidence: this folder is not currently a git repository,
while `../yongkyung-oh.github.io` is the legacy repo connected to
`https://github.com/yongkyung-oh/yongkyung-oh.github.io.git`.

## Routes

| Route | Page |
| --- | --- |
| `/` | Home — profile, representative papers, research program, and recent updates |
| `/research/` | Research directions with related papers and software |
| `/publications/` | Selected publications (APA metadata, reader-facing links) |
| `/projects/` | Research software and selected Achivement-backed development records |
| `/talks/` | Selected talks and presentations |
| `/software/` | Research software subset preserved as a stable route |
| `/about/` | Current role, career, education, funding, recognitions, and selected patents |
| `/contact/` | Contact + public profiles |
| `/presentations/` | Legacy route preserved as the Talks view |
| `/portfolio-dev/`, `/portfolio-mgt/` | Legacy route surfaces preserved; only Achivement-backed development slug pages are generated |
| `/404` | Not found |

## Develop

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # astro check + static build → dist/
npm run verify:content # content, identity, route-surface, and public-output gate
npm run verify:deploy # local deploy-source checks + cutover warnings
npm run verify:cutover # dry-run source payload check for repo promotion
npm run diff:cutover # read-only diff against ../yongkyung-oh.github.io
npm run export:cutover -- --target /private/tmp/portfolio-github-io-cutover-payload # export reviewed payload to an empty staging dir
npm run simulate:cutover -- --target /private/tmp/portfolio-github-io-live-repo-sim # clone legacy repo and apply payload in temp
npm run prepare:cutover-worktree -- --target /private/tmp/portfolio-github-io-cutover-worktree # detached git worktree review
npm run preview
```

## Architecture

- `src/layouts/BaseHtml.astro` — HTML shell: SEO (canonical/OG/Twitter plus `Person`/`WebSite` JSON-LD)
  and the no-flash theme runtime (saved preference, otherwise device setting). Indexable by default.
- `src/layouts/SiteLayout.astro` — site chrome: sticky header + nav (active `aria-current`), `<main>`,
  compact icon-only light/dark controls, footer links derived from `profile`, skip-to-content, and
  visual-language CSS.
- `src/components/` — page headers, publication lists, research-area lists, project/archive cards, talk rows,
  CV timeline rows, funding rows, patent rows, and profile imagery.
- `src/data/` — traceable site content (`site`, selected `publications`, `projects`, `portfolioRecords`,
  `talks`, `career`, `education`, `grants`, `patents`, `people`, `derived`) and `routes.ts`
  (single-source nav + `routePath()`). No fabricated metrics, awards, people, or claims.
- `src/styles/tokens.css` — semantic design tokens (light + `prefers-color-scheme: dark` + `[data-theme]`).

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` builds with `withastro/action` and publishes via `actions/deploy-pages`
on push to `main`. In the repo: **Settings → Pages → Source = GitHub Actions**.

Current local topology:

- `portfolio.github.io/` is the Astro source tree and contains the deploy workflow.
- `portfolio.github.io/` is not currently a git repo, so GitHub Actions will not run from this folder
  until cutover.
- `../yongkyung-oh.github.io/` is the legacy git repo with origin
  `https://github.com/yongkyung-oh/yongkyung-oh.github.io.git`.

Cutover options:

1. Promote this Astro tree into a branch of the legacy `../yongkyung-oh.github.io/` repo, replacing the
   Jekyll root only after review.
2. Initialize/push this folder as the `yongkyung-oh/yongkyung-oh.github.io` user-page repo.

Do not claim the live URL has changed until the remote repo, branch, GitHub Pages source, and first
Actions deployment are verified.

**Set the right origin** in `astro.config.mjs` so canonical/OG/sitemap URLs are correct:
- User/org page (repo literally `<account>.github.io`): `site: "https://<account>.github.io"` (no `base`).
- Project page (e.g. repo `portfolio`): `site: "https://<account>.github.io"`, `base: "/portfolio"`
  (assets use root-absolute paths, so a project page needs `base`).

Currently set to `https://yongkyung-oh.github.io`, which is correct for the user-page target.

## Provenance

Promoted from the `portfolio-working` design sandbox, but intentionally reduced for launch scope. Legacy
`../yongkyung-oh.github.io` is used only for public profile/contact discovery; publication and
recognition data must be backed by the local Achivement upstream (`achievement_records/`).
Infrastructure (deploy workflow, config, public assets) follows `../_archive/academic-homepage-astro`.

Current publication data is a selected subset, not a full CV import. Each item in
`src/data/publications.ts` stores its Achivement `sourcePath` and `verificationStatus`.
Legacy-only portfolio entries are not part of the launch data; `verify:content` fails if `src/data/`
contains `legacy_public` or non-Achivement `sourcePath` values.

Run `npm run build && npm run verify:content && npm run verify:deploy && npm run verify:cutover` before calling the
source tree ready for cutover. Use `npm run verify:cutover -- --list` to print the exact promotion payload,
`npm run diff:cutover -- --report <markdown-file>` to compare the payload against the clean legacy repo without writing
to it, `npm run export:cutover -- --target <empty-staging-dir>` to copy the same verified payload into a review
directory, or `npm run simulate:cutover -- --target <new-temp-clone-dir>` to clone the legacy repo and apply the payload
in a disposable review branch. Use `npm run prepare:cutover-worktree -- --target <new-worktree-dir>` for the closest
local rehearsal: it creates a detached git worktree from the legacy repo, applies the payload there, and leaves the
original legacy working tree untouched. Add `--branch <review-branch>` only when ready to create a pushable review
branch.
These checks cover selected publication ids, Achivement source-path presence, public-output leaks, canonical deployment origin,
identity consistency against the UCLA career record, NRF fellowship wording against the NRF grant record, workflow shape,
the expected 17-page launch route surface, home navigation, empty verified-consulting surface, publication
`ScholarlyArticle` JSON-LD count, local cutover warnings, and the non-generated source payload that should be promoted
into the user-page repo. Local-only reference images may remain on disk, but they are excluded from the cutover payload
unless referenced by the current MVP.

See `../docs/portfolio-deploy-cutover.md` for the live-site cutover runbook. As of 2026-06-05, the live
`https://yongkyung-oh.github.io` URL still serves the legacy Jekyll site; do not claim deployment completion until the
live URL shows the Astro navigation and GitHub Actions Pages deploy is green.
