# Design notes — academic-reference alignment

Status: design-direction correction for `portfolio.github.io`
Last updated: 2026-06-05
Read with: [`DATA_SOURCES.md`](DATA_SOURCES.md) (content sourcing). This file governs *look & tone*.

## Core finding

The `portfolio-working` exploration drifted into an **industry-IR / marketing** aesthetic (big serif
"launch" hero, a fake signal graphic, a publication-count metrics strip, gateway product-cards). That
does **not** match how real academic homepages look in our own references. Realign to a **text-first,
content-first researcher page**. Decoration must be subordinate to academic content.

Sources: [`refs/researcher-sites.md`](../refs/researcher-sites.md),
[`refs/academic-homepage-visual-patterns-2026.md`](../refs/academic-homepage-visual-patterns-2026.md).

## 1. What real academic pages actually do (from refs)

- **Compact, text-first identity above the fold** — name, title, institution, email, a 1–2 sentence
  research statement, and CV/Scholar/GitHub links. (Surbhi Goel, Bassel El Mabsout.)
- **Publications/selected work are the primary credibility surface** — titles + venues + year, with
  Paper/PDF/DOI/Code link chips. "Publication titles and venues are more important than visual cards";
  "recent publications/news are text-led rather than marketing-led." (Pradeep Ravikumar, Bin Yu.)
- **Work shown as actionable artifacts**, not paragraphs — concise description + direct links.
  (Fred Hohman.)
- **Conventional navigation** — About, Research, Publications/Papers, Software, (People), Contact.
  (Bin Yu, Surbhi Goel.)
- **Real visual asset or none** — when a hero image is used it is a real photo/figure, not invented
  decoration; many strong researcher pages use no hero graphic at all. (Pande Lab uses a real image;
  Bin Yu/Pradeep use essentially none.)
- **Restraint** — "keep UI decoration subordinate to academic content"; "do not recreate the old
  portfolio-heavy site."

## 2. Where the current direction misaligns

| Current (Atlas Ledger / recommended) | Problem vs real academic refs |
| --- | --- |
| `SignalFigure` — invented "irregular signal" SVG in the hero | **Fake decoration.** Real pages use a real image or nothing. Remove. (Already being removed.) |
| Oversized serif "Trustworthy machine learning…" hero (6.4rem) | Marketing-launch tone; refs favor a compact text identity, not a large visual hero. |
| Metrics strip `30 / 13 / 17 / 2019–2026` | **Publication-count flex** reads as IR dashboard; not standard academic. Drop, or reduce to a quiet single line. |
| Gateway "Research directions, papers, and software" product-cards | Product-landing pattern; refs route via plain conventional nav + a selected-work list. |
| Tone leans "industry IR fancy" | Refs are credibility-first and plain; tone should be quiet and scholarly. |

## 3. Corrected direction (academic-aligned)

- **Home / above the fold:** compact identity block — name, role, affiliation, location, a 1–2 sentence
  research statement, and links (CV / Scholar / GitHub / email). Optional small real portrait. **No** fake
  graphic, **no** count-metrics dashboard, **no** oversized marketing headline.
- **Selected work is the hero content**, not a decorative panel: a text-led list of representative papers
  (title, authors with self highlighted, venue, year) + Paper/DOI/Preprint/Code chips.
- **Research:** a few concise research-area blocks (text + a couple representative works), not big cards
  with viz.
- **Publications:** the full selected record, text-led list. **Software:** repo list with links. **About:**
  short bio + (deferred) verified appointments/education. **Contact:** links.
- **Visuals:** use the requested podium portrait via optimized assets
  (`public/images/yongkyung-oh-speaking.webp` + `yongkyung-oh-speaking-1100.jpg`) and use it sparingly. Default to
  typography + whitespace; keep the existing tokens/dual-mode, just dial the drama down. Unreferenced image experiments
  are local-only unless deliberately promoted.

## 4. Keep / drop

**Keep:** conventional 6-route nav; `PublicationList` with link chips; research-area sections;
traceable data (`DATA_SOURCES.md`); dual-mode tokens; clean a11y (focus, contrast, skip-link).
**Drop / rework:** `SignalFigure` (fake); the metrics-count strip as a hero flourish; gateway product
cards; the oversized launch hero; any "industry-IR fancy" framing in copy.

**One-line test:** would this element appear on Bin Yu's / Pradeep Ravikumar's / Fred Hohman's page? If
it is a fake graphic, a count flex, or a marketing card — no.
