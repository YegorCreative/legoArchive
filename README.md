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

Prices are not invented. Unknown piece counts are not treated as zero. Fourteen Fall 1999 US Shop at Home prices are stored as mail-order figures that include shipping. They are not store MSRP. Current market values are not stored.

## Brick Legends

See [docs/brick-legends.md](docs/brick-legends.md). Drafts stay in the browser. Demonstration rankings are not real votes. Cloud accounts use Supabase only after the project URL and publishable key are supplied. See [docs/community.md](docs/community.md). The service-role key is never part of the site.

## Security

The site is built with Astro 7.3.8. `npm audit` reports no known vulnerabilities in the installed tree after that upgrade. HTML whitespace stays on the previous HTML-aware setting (`compressHTML: true`) so inline text does not collapse. There is no `src/fetch.ts`, no legacy content collection, and no Astro DB.

## Deploy

Pushes to `main` run `.github/workflows/pages.yml`, which tests, builds, and deploys with GitHub Actions. The catalog snapshot is committed, so the build does not download Rebrickable.
