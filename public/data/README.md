# Catalog snapshot

`catalog.json` is generated from Rebrickable’s official `sets.csv.gz` and `themes.csv.gz` downloads.

Rebrickable permits those files to be downloaded at most once a day and used with attribution, including for a public fan site. Do not scrape Rebrickable HTML.

Regenerate with:

```bash
node scripts/import-catalog.mjs
```

The committed file is the snapshot the site builds from. Continuous deployment does not download a fresh copy on every push.

Set records are arrays: `[id, name, year, themeId, parts]`. A null piece count means Rebrickable stored `0`, which this archive treats as unknown rather than as zero pieces.

Theme records are arrays: `[id, name, parentId, slug]`.

No retail prices are included.
