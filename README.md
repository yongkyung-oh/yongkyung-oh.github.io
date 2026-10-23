# YongKyung Oh — Academic CV

Source for the personal academic CV at <https://yongkyung-oh.github.io/>.

The site is a responsive, single-page CV built with Astro and Tailwind CSS. It includes research interests, professional experience, education, publications, research support, recognition, teaching, and patents. It follows the visitor's light/dark preference and supports printing.

## Development and verification

Use the Node version in `.nvmrc`, then install the locked dependencies:

```sh
npm ci
npm run dev
```

The development server uses `http://127.0.0.1:4400`. For static validation:

```sh
npm test
npm run build
```

For the complete standalone verification, including browser checks, install Python, the packages in `requirements-qa.txt`, and Google Chrome:

```sh
python3 -m pip install -r requirements-qa.txt
python3 -m playwright install --with-deps chrome
npm run verify -- --ci
```

`--ci` skips only the upstream CV freshness check, whose input is unavailable in this standalone repository. Tests, build checks, browser checks, and preview cleanup still run. Generated output is in `dist/`.

## Maintenance and publication

Site content is exported one way from a maintained local working copy. Public CV snapshots are reviewed there before import. Curation decisions and provenance records stay local and are excluded from Git and source exports. The standalone build verifies the exported snapshot and PDF using the hash-only `src/data/build-integrity.json`. Keep content changes in that working copy, then run its `scripts/export-repo.mjs` with `--check` before `--write` against this repository. The export rejects internal review notes and personal source paths in publishable text before writing any files.

`export-manifest.json` identifies files managed by that export. Repository-specific README and deployment workflow are maintained here and preserved by subsequent exports. GitHub Actions verifies the production artifact before deploying it to GitHub Pages.

The CV PDF button keeps the owner's Google Drive URL. The PDF stored under `public/cv/` is the reviewed snapshot used for build and synchronization checks.
