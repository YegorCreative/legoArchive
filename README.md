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

The dev server uses the `/legoArchive/` base path. `npm run build` then `npm run preview` serves the static output the way GitHub Pages does, including the 404 fallback for set numbers that were not pre-rendered.

## Data

The catalog in `public/data/catalog.json` comes from Rebrickable’s official downloads, with attribution. See [docs/data-sources.md](docs/data-sources.md). Refresh it with `npm run import` at most once a day. Do not scrape Rebrickable.

Prices are not invented. Unknown piece counts are not treated as zero.

## Brick Legends

See [docs/brick-legends.md](docs/brick-legends.md). Drafts stay in the browser. Demonstration rankings are not real votes.

## Deploy

Pushes to `main` run `.github/workflows/pages.yml`, which tests, builds, and deploys with GitHub Actions. The catalog snapshot is committed, so the build does not download Rebrickable.
