# Data sources & structure design (diagnosis)

Status: authoritative sourcing + structure contract for `portfolio.github.io`
Last updated: 2026-06-05
Audience: every agent (Claude Code, Codex, owner) working on this site.

This document exists so agents do not get confused about **where site content may come from** and
**how much to bring**. Read it before adding or changing any factual content.

## 0. Deploy / work / source map

| Thing | Path / URL | Role |
| --- | --- | --- |
| **Deploy target** | `https://yongkyung-oh.github.io` | Target URL for this Astro source. Still legacy until cutover is completed and verified. |
| **Work here** | `portfolio.github.io/` (this folder) | The Astro source we develop. |
| **Upstream (source of truth)** | `~/Documents/Working/Achivement/` | The Achivement pipeline. Only facts verifiable here may ship. |
| **Legacy (reference only)** | `../yongkyung-oh.github.io/` | Current live Jekyll site. Reference for prose/structure/public-profile discovery — **not authoritative**, do not bulk-copy. |
| **Archived sandbox** | `../_archive/portfolio-working/` | Where the visual language (Atlas Ledger) was chosen. Design history only. |

## 1. Source-of-truth hierarchy (hard rule)

1. **Achivement upstream is authoritative.** A factual claim (publication, award, appointment,
   education, grant, patent, talk) may appear on the site **only if it is backed by a record in**
   `~/Documents/Working/Achivement/achievement_records/…`. Each shipped record stores its
   `sourcePath` (relative to the Achivement repo) and a `verificationStatus`.
2. **Legacy is reference, not source.** `../yongkyung-oh.github.io` may be read for wording, structure,
   and to discover public profile/contact links — but any fact taken from it must be **verified against
   Achivement before shipping**. Do not paste legacy prose as truth.
3. **No fabrication.** No citation counts, h-index, GitHub stars, funding amounts, clinical-impact
   claims, team members, or unverifiable honors. Solo profile.

## 2. Achivement upstream map

Source of truth lives at `~/Documents/Working/Achivement/`:

- `achievement_records/` — the canonical per-item YAML records, grouped by category:
  `publications/`, `accepted_in_press/`, `awards/`, `career/`, `education/`, `grants/`, `patents/`,
  `presentations/`, `profiles/`, `review/`, `service/`.
- `data/` — raw evidence the records derive from: `zotero/`, `bibtex/`, `scopus.csv`, `evidence/`,
  `input_csv/`, presentation sheets. (Evidence, not for direct site use.)
- `scripts/` — the pipeline (`run_achievement_pipeline.py`, `build_*`, `verify_*`,
  `export_zotero_references.py`, …). Publication data on the site is **export-generated** from here;
  `src/data/publications.ts` is marked "Generated … Do not bulk-edit by hand."

## 3. Site data architecture (structure design)

The goal is a **minimal, verifiable** structure — not a full CV port. Each `src/data/*` module maps to
one upstream category and is consumed by specific routes:

| Site module | Upstream category | Route(s) | Launch status |
| --- | --- | --- | --- |
| `site.ts` → `profile` | `achievement_records/career/ucla_health_postdoctoral_researcher_2023.yaml` + discovered public links | all (header/footer/about/contact) | **in** — curated, verifiable identity + links |
| `site.ts` → `siteContent` (tagline, focusAreas, mission) | derived from research narrative (verified) | `/`, `/research/` | **in** — curated framing, no fabricated claims |
| `publications.ts` | `achievement_records/publications/**` + `accepted_in_press/` | `/`, `/publications/` | **in** — **selected subset** w/ `sourcePath` + `verificationStatus` |
| `derived.ts` (counts, featured, recognitions) | computed from `publications.ts` + `awards/` | `/`, `/publications/`, `/about/` | **in** — honest derived figures only |
| `projects.ts` (software) | public GitHub repos (verified) | `/projects/`, `/software/` | **in** — 4 repos, paper-linked |
| `portfolioRecords.ts` | verified upstream records only | `/projects/`, `/portfolio-dev/`, `/portfolio-mgt/` | **in** — selected Achivement-backed development records; consulting route empty until verified |
| `talks.ts` | `achievement_records/presentations/**` | `/talks/`, `/presentations/` | **in** — selected verified slice, not full presentation dump |
| `career.ts` | `achievement_records/career/` | `/about/` | **in** — selected verified rows |
| `education.ts` | `achievement_records/education/` | `/about/` | **in** — verified degree rows |
| `grants.ts` | `achievement_records/grants/` | `/about/` | **in** — selected rows, no public amount rendering |
| `patents.ts` | `achievement_records/patents/` | `/about/` | **in** — selected invention records |
| `people.ts` | solo, backed by current career record | `/about/` | **in** — single `postdoc` profile, no fabricated team or PI/lab role |
| *(optional)* service/teaching | matching upstream categories | future routes or About/CV | **deferred** — add only verified rows |

Design intent: keep the module set small; extend by **adding one verified category at a time**, never
by importing the legacy site wholesale.

## 4. Verification contract

Every factual record that can be traced to Achivement carries:

- `sourcePath` — path within the Achivement repo (e.g.
  `achievement_records/publications/conference/oh_flowpath_2026.yaml`).
- `verificationStatus` — one of: `verified` (record + evidence confirmed), `partially_verified`
  (record present, some evidence pending), `unverified` (do **not** ship). Current publication subset is
  `partially_verified`; promote to `verified` as the Achivement evidence pipeline confirms each item.

A record without a resolvable `sourcePath` must not be added to the site.

Local gate: from `portfolio.github.io/`, run `npm run build && npm run verify:content && npm run verify:cutover`. The
verifier checks that the selected publication ids stay within the curated launch subset, every `src/data` `sourcePath`
resolves in the local Achivement upstream, no `legacy_public` records are shipped, and public `dist/` output does not
expose local/private source markers. It also checks that the public identity fields in `site.ts` match the UCLA
postdoctoral career record, that the current `people.ts` record is not marked `PI`, and that NRF fellowship PI wording is
backed by the NRF grant record. It smoke-checks the exact 17-page launch route surface, Astro home navigation, the
optimized podium image, and the empty verified-consulting surface. For live promotion, use
`npm run verify:cutover -- --list` as the copy manifest. The cutover verifier checks that generated/local directories
such as `dist/`, `.astro/`, and `node_modules/` are excluded from the repository-promotion payload; unreferenced local
reference images are excluded too.

## 5. Minimal launch policy

- Ship the **smallest verifiable set** that makes the routed site coherent: identity, selected
  publication record, research software, selected Achivement-backed project records, talks, CV sections, recognitions,
  and contact. That is the launch scope.
- "Selected subset" ≠ full CV. The publication list is curated featured/representative items, each
  traceable to upstream records — not an automated dump of all 30+ records.
- Defer service/teaching/team expansion until explicitly requested; add each as a verified module slice, minimally.

## 6. Legacy usage rules (`../yongkyung-oh.github.io`)

- Allowed: read for structure/wording inspiration and to confirm public links (Scholar, GitHub,
  LinkedIn, CV) already present in `profile`.
- Not allowed: copying bios, award lists, appointment text, or publication lists as-is. Every such fact
  must be re-sourced from Achivement and marked with `sourcePath`/`verificationStatus`.
- The legacy site stays live until this site is deployed to `yongkyung-oh.github.io` and verified.

## 7. For dev agents — do / don't

**Do:** trace every factual claim to an `achievement_records/…` `sourcePath`; keep the data modules
minimal; mark `verificationStatus`; treat `publications.ts` as export-generated; keep the visual system
from `DESIGN.md`/`tokens.css`.
**Don't:** bulk-import the legacy site; add unverified honors/metrics/people; hand-edit generated
publication data; expand beyond the launch module set without a request; expose internal terms
(`sourcePath`, `verificationStatus`, `Achivement`, `variant`) in public UI.

## Provenance of this doc

Diagnosis written by Claude Code (docs/spec lane). Data implementation (the selected `publications.ts`
subset with `sourcePath`/`verificationStatus`, About content) is authored by the data agent; this doc
governs *what may be sourced and how much*, not the per-record values.
