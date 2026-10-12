/**
 * Builds public/data/catalog.json from the official Rebrickable CSV downloads.
 * Rebrickable allows these files to be downloaded at most once a day.
 * Do not scrape rebrickable.com HTML.
 *
 * Usage:
 *   node scripts/import-catalog.mjs
 *   node scripts/import-catalog.mjs --src /tmp/lego-raw
 */
import { createWriteStream } from "node:fs";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import { Readable } from "node:stream";
import { slugify } from "../src/lib/slug.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const RAW = path.join(ROOT, "data/raw");
const OUT = path.join(ROOT, "public/data/catalog.json");
const IMAGE_BASE = "https://cdn.rebrickable.com/media/sets/";
const FILES = {
  sets: "https://cdn.rebrickable.com/media/downloads/sets.csv.gz",
  themes: "https://cdn.rebrickable.com/media/downloads/themes.csv.gz",
};

const srcArg = process.argv.indexOf("--src");
const srcDir = srcArg >= 0 ? path.resolve(process.argv[srcArg + 1]) : null;

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((entry) => entry.some((value) => value.length > 0));
}

async function downloadGzip(url, destination) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "LEGOArchiveCatalogBot/1.0 (fan encyclopedia; official CSV download)",
    },
  });
  if (!response.ok || !response.body) {
    throw new Error(`Download failed ${response.status} ${url}`);
  }
  await pipeline(Readable.fromWeb(response.body), createGunzip(), createWriteStream(destination));
}

async function ensureCsv(name) {
  const csvPath = path.join(srcDir ?? RAW, `${name}.csv`);
  if (srcDir) return readFile(csvPath, "utf8");
  await mkdir(RAW, { recursive: true });
  try {
    const info = await stat(csvPath);
    const age = Date.now() - info.mtimeMs;
    if (age < 20 * 60 * 60 * 1000) return readFile(csvPath, "utf8");
  } catch {
    // Download when the daily file is absent.
  }
  const gzPath = `${csvPath}.gz`;
  await downloadGzip(FILES[name], gzPath);
  const compressed = await readFile(gzPath);
  const { gunzipSync } = await import("node:zlib");
  const text = gunzipSync(compressed).toString("utf8");
  await writeFile(csvPath, text);
  await rm(gzPath, { force: true });
  return text;
}

function assignSlugs(themes) {
  const used = new Set();
  const roots = themes.filter((theme) => theme.parentId == null);
  const children = themes.filter((theme) => theme.parentId != null);
  const claim = (theme, preferClean) => {
    const base = slugify(theme.name);
    let slug = base;
    if (!preferClean || used.has(slug)) slug = `${base}-${theme.id}`;
    let n = 2;
    while (used.has(slug)) {
      slug = `${base}-${theme.id}-${n}`;
      n += 1;
    }
    used.add(slug);
    theme.slug = slug;
  };
  roots.sort((a, b) => b.descendantHint - a.descendantHint || a.id.localeCompare(b.id));
  for (const theme of roots) claim(theme, true);
  children.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  for (const theme of children) claim(theme, true);
}

const retrievedAt = new Date().toISOString();
const [setsText, themesText] = await Promise.all([ensureCsv("sets"), ensureCsv("themes")]);
const setRows = parseCsv(setsText);
const themeRows = parseCsv(themesText);
const setHeader = setRows.shift();
const themeHeader = themeRows.shift();
if (!setHeader || setHeader[0] !== "set_num") throw new Error("Unexpected sets.csv header");
if (!themeHeader || themeHeader[0] !== "id") throw new Error("Unexpected themes.csv header");

const themes = themeRows.map(([id, name, parentId]) => ({
  id,
  name,
  parentId: parentId || null,
  slug: "",
  descendantHint: 0,
}));
const byId = new Map(themes.map((theme) => [theme.id, theme]));
const sets = [];
let imageMismatches = 0;

for (const [id, name, yearText, themeId, partsText, img] of setRows) {
  const year = Number(yearText);
  const partsNumber = Number(partsText);
  if (!id || !name || !Number.isInteger(year) || !byId.has(themeId)) {
    throw new Error(`Invalid set row ${id}`);
  }
  const expected = `${IMAGE_BASE}${id}.jpg`;
  // Rebrickable's CDN lowercases file names. Any other difference is stored as unknown.
  if (img !== expected && img !== expected.toLowerCase()) imageMismatches += 1;
  // Rebrickable stores 0 when a part inventory was not recorded. Keep that unknown.
  const parts = partsNumber > 0 ? partsNumber : null;
  sets.push({ id, name, year, themeId, parts });
  let cursor = byId.get(themeId);
  const seen = new Set();
  while (cursor && !seen.has(cursor.id)) {
    seen.add(cursor.id);
    cursor.descendantHint += 1;
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
  }
}

if (imageMismatches > 0) {
  throw new Error(`${imageMismatches} set images did not match the public CDN pattern`);
}

assignSlugs(themes);
for (const theme of themes) delete theme.descendantHint;

const catalog = {
  snapshot: {
    retrievedAt,
    sourceName: "Rebrickable",
    sourceUrl: "https://rebrickable.com/downloads/",
    termsUrl: "https://rebrickable.com/terms/",
    files: [FILES.sets, FILES.themes],
    imageBase: IMAGE_BASE,
    imageSuffix: ".jpg",
    setCount: sets.length,
    themeCount: themes.length,
    attribution: "Contains data from Rebrickable. Set images are used under Rebrickable's permission to display set images on external sites.",
    limitations: [
      "This is the Rebrickable official-item catalog, not a certified list of every LEGO set ever released.",
      "Original retail prices, current market values, retirement years, ages, and minifigure counts are not in these files.",
      "A num_parts value of 0 is stored here as an unknown piece count, not as zero pieces.",
      "Theme groups follow Rebrickable's parent chain. Town and City stay separate.",
    ],
  },
  themes: themes.map(({ id, name, parentId, slug }) => [id, name, parentId, slug]),
  sets: sets.map(({ id, name, year, themeId, parts }) => [id, name, year, themeId, parts]),
};

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(catalog));
const bytes = (await stat(OUT)).size;
console.log(`Wrote ${sets.length} sets and ${themes.length} themes (${bytes} bytes) to ${OUT}`);
