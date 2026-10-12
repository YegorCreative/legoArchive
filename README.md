# LEGO Archive

Every LEGO set. Every year. Every story.

An unofficial fan encyclopedia of LEGO sets, built with Astro for GitHub Pages. Brick Legends, a local character-card studio, lives in the same site.

LEGO® is a trademark of the LEGO Group of companies, which does not sponsor, authorize, or endorse this site.

The repository is [YegorCreative/legoArchive](https://github.com/YegorCreative/legoArchive). `YegorCreative/lego-archive` does not exist, so the site base path is `/legoArchive/`.

Planned address: <https://yegorcreative.github.io/legoArchive/>

## Develop

```bash
npm install
npm test
npm run dev
```

The dev server uses the `/legoArchive/` base path. `npm run build` writes one HTML file for every cataloged set, then a sitemap. `npm run preview` serves that output the way GitHub Pages does. A set number that is not in the snapshot still falls through to the 404 explorer.

## Data

The catalog in `public/data/catalog.json` comes from Rebrickable’s official downloads, with attribution. See [docs/data-sources.md](docs/data-sources.md). Refresh it with `npm run import` at most once a day. Do not scrape Rebrickable.

Prices are not invented. Unknown piece counts are not treated as zero.

## Brick Legends

See [docs/brick-legends.md](docs/brick-legends.md). Drafts stay in the browser. Demonstration rankings are not real votes.

## Security

`npm audit` reports three dependency issues. The only offered fix is Astro 7.3.8, a major upgrade from the Astro 5 release this site is built with, so it was not applied in this phase.

- `astro` at 5.x is inside the vulnerable range `<=7.2.7`. The advisories cover `define:vars` script sanitizing, server-island parameter replay, and spread-attribute escaping. This site is a static build: it does not use server islands or `define:vars`. The published pages do not ship Astro’s server runtime.
- `esbuild` 0.27–0.28 is a development-server issue (arbitrary file read when the dev server runs on Windows). Production Pages hosting does not run that server. Development here is on macOS.
- `sharp` `<=0.35.5-rc.1` inherits image-library vulnerabilities through Astro. This project does not run Sharp to transform set images; those images are hotlinked.

Revisit the audit when an Astro 5 patch exists, or when a planned upgrade to Astro 7.3.8 or newer is tested against the full build.

## Deploy

Pushes to `main` run `.github/workflows/pages.yml`, which tests, builds, and deploys with GitHub Actions. The catalog snapshot is committed, so the build does not download Rebrickable.
