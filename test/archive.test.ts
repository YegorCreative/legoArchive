import assert from "node:assert/strict";
import { test } from "node:test";
import { loadCatalog } from "../src/lib/load-catalog.ts";
import { printedNumber, rootTheme } from "../src/lib/catalog.ts";
import { compareMissingLast, percentChange, pricePerPiece } from "../src/lib/pricing.ts";
import { overallScore, rarityForOverall, rateCharacter } from "../src/lib/rarity.ts";
import { parseOptionalNumber, searchSets, type SearchRecord } from "../src/lib/search.ts";
import { DEMO_CHARACTERS } from "../src/data/legends-demo.ts";

test("missing prices are not zero and do not produce a percentage", () => {
  assert.equal(percentChange(null, 40), null);
  assert.equal(percentChange(20, null), null);
  assert.equal(percentChange(0, 10), null);
  assert.equal(pricePerPiece(null, 100), null);
  assert.equal(pricePerPiece(10, null), null);
  assert.equal(compareMissingLast(null, 5, "asc"), 1);
  assert.equal(compareMissingLast(5, null, "desc"), -1);
});

test("rarity rule bl-rarity-1 is deterministic", () => {
  assert.equal(overallScore({ power: 90, creativity: 96, defense: 80 }), 90);
  assert.equal(rarityForOverall(90), "Legendary");
  assert.equal(overallScore({ power: 20, creativity: 30, defense: 25 }), 25);
  assert.equal(rarityForOverall(25), "Common");
  assert.equal(overallScore({ power: 98, creativity: 100, defense: 96 }), 98);
  assert.equal(rarityForOverall(98), "Mythic");
  assert.equal(overallScore({ power: 1.5, creativity: 10, defense: 10 }), null);
});

test("demo cards keep stored rarity aligned with the published rule", () => {
  assert.equal(DEMO_CHARACTERS.length >= 5, true);
  for (const character of DEMO_CHARACTERS) {
    const rated = rateCharacter(character.stats);
    assert.ok(rated);
    assert.equal(character.overall, rated.overall);
    assert.equal(character.rarity, rated.rarity);
    assert.equal(character.ruleVersion, "bl-rarity-1");
    assert.equal(character.publication, "demonstration");
  }
  const annual = DEMO_CHARACTERS.filter((character) => character.annualFive);
  assert.equal(annual.length, 5);
});

test("search ignores blank piece filters and does not treat unknown pieces as zero", () => {
  const records: SearchRecord[] = [
    { id: "2-1", name: "Brick", year: 1999, themeId: "1", rootThemeId: "1", parts: null },
    { id: "10-1", name: "Gate", year: 1980, themeId: "1", rootThemeId: "1", parts: 40 },
    { id: "3-1", name: "Tower", year: 2001, themeId: "2", rootThemeId: "2", parts: 10 },
  ];
  assert.equal(parseOptionalNumber(""), null);
  assert.equal(parseOptionalNumber("0"), 0);
  const fewest = searchSets(records, {
    query: "",
    year: null,
    decade: null,
    rootThemeId: null,
    partsMin: null,
    partsMax: null,
    sort: "fewest-pieces",
  });
  assert.deepEqual(fewest.map((record) => record.id), ["3-1", "10-1", "2-1"]);
  const filtered = searchSets(records, {
    query: "gat",
    year: null,
    decade: 1980,
    rootThemeId: "1",
    partsMin: 1,
    partsMax: null,
    sort: "name",
  });
  assert.deepEqual(filtered.map((record) => record.id), ["10-1"]);
});

test("snapshot keeps 1999 Star Wars and separates Town from City", () => {
  const catalog = loadCatalog();
  const set = catalog.setById.get("7140-1");
  assert.ok(set);
  assert.equal(set.year, 1999);
  assert.equal(set.parts, 271);
  const theme = rootTheme(set.themeId, catalog.themeById);
  assert.equal(theme?.name, "Star Wars");
  assert.equal(theme?.slug, "star-wars");
  assert.equal(printedNumber("7140-1"), "7140");
  const town = catalog.themes.find((item) => item.name === "Town" && item.parentId == null);
  const city = catalog.themes.find((item) => item.name === "City" && item.parentId == null);
  assert.ok(town && city && town.id !== city.id);
  const year1999 = catalog.sets.filter((item) => item.year === 1999);
  assert.ok(year1999.length > 13);
  assert.equal(catalog.snapshot.setCount, catalog.sets.length);
});
