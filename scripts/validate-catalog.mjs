import { readFileSync } from "node:fs";
import path from "node:path";

const file = path.resolve(import.meta.dirname, "../public/data/catalog.json");
const catalog = JSON.parse(readFileSync(file, "utf8"));
const errors = [];

if (!catalog.snapshot?.retrievedAt) errors.push("Missing snapshot timestamp");
if (catalog.snapshot?.sourceName !== "Rebrickable") errors.push("Source must stay attributed to Rebrickable");
if (!Array.isArray(catalog.sets) || catalog.sets.length < 1000) errors.push("Catalog is unexpectedly small");
if (catalog.snapshot.setCount !== catalog.sets.length) errors.push("setCount does not match records");

const ids = new Set();
const slugs = new Set();
const themeIds = new Set(catalog.themes.map((theme) => theme[0]));
for (const theme of catalog.themes) {
  const [id, name, parentId, slug] = theme;
  if (!id || !name || !slug) errors.push(`Broken theme ${id}`);
  if (slugs.has(slug)) errors.push(`Duplicate slug ${slug}`);
  slugs.add(slug);
  if (parentId && !themeIds.has(parentId)) errors.push(`Missing parent ${parentId}`);
}
const themeById = new Map(catalog.themes.map((theme) => [theme[0], theme]));
let starWars1999 = 0;
let has7140 = false;
for (const set of catalog.sets) {
  const [id, name, year, themeId, parts] = set;
  if (ids.has(id)) errors.push(`Duplicate set ${id}`);
  ids.add(id);
  if (!name || !Number.isInteger(year) || year < 1949 || year > 2035) errors.push(`Bad year for ${id}`);
  if (!themeById.has(themeId)) errors.push(`Missing theme for ${id}`);
  if (parts != null && (!Number.isInteger(parts) || parts <= 0)) errors.push(`Bad parts for ${id}`);
  if (id === "7140-1") {
    has7140 = true;
    if (year !== 1999 || name !== "X-wing Fighter" || parts !== 271) {
      errors.push(`7140-1 drifted from the snapshot fields: ${name} ${year} ${parts}`);
    }
  }
  if (year === 1999) {
    let cursor = themeById.get(themeId);
    const seen = new Set();
    while (cursor && cursor[2] && !seen.has(cursor[0])) {
      seen.add(cursor[0]);
      cursor = themeById.get(cursor[2]);
    }
    if (cursor && cursor[1] === "Star Wars" && cursor[2] == null) starWars1999 += 1;
  }
}
if (!has7140) errors.push("7140-1 is missing");
if (starWars1999 < 10) errors.push(`Expected the 1999 Star Wars root theme, found ${starWars1999}`);
const town = catalog.themes.find((theme) => theme[1] === "Town" && theme[2] == null);
const city = catalog.themes.find((theme) => theme[1] === "City" && theme[2] == null);
if (!town || !city || town[0] === city[0]) errors.push("Town and City must remain separate root themes");
if (JSON.stringify(catalog).includes('"amount"')) errors.push("Prices must not be invented in the catalog file");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Catalog OK: ${catalog.sets.length} sets, ${starWars1999} root Star Wars sets in 1999.`);
