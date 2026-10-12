import assert from "node:assert/strict";
import { test } from "node:test";
import { loadCatalog } from "../src/lib/load-catalog.ts";
import { printedNumber, relatedSets, rootTheme } from "../src/lib/catalog.ts";
import { renderCardFront } from "../src/lib/character-svg.ts";
import { DEFAULT_APPEARANCE } from "../src/lib/character.ts";
import { compareMissingLast, percentChange, pricePerPiece } from "../src/lib/pricing.ts";
import { adjustPurchasingPower, cpiValue, latestCompleteCpiYear } from "../src/lib/inflation.ts";
import { overallScore, rarityForOverall, rateCharacter } from "../src/lib/rarity.ts";
import { parseOptionalNumber, searchSets, type SearchRecord } from "../src/lib/search.ts";
import { DEMO_CHARACTERS } from "../src/data/legends-demo.ts";

test("missing prices are not zero and do not produce a percentage", () => {
  assert.equal(percentChange(null, 40), null);
  assert.equal(percentChange(20, null), null);
  assert.equal(percentChange(0, 10), null);
  assert.equal(percentChange(10, 15, { from: "USD", to: "EUR" }), null);
  assert.equal(percentChange(10, 15, { from: "USD", to: "USD" }), 50);
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
  assert.equal(catalog.prerenderIds.size, catalog.sets.length);
  assert.equal(catalog.prerenderIds.has("75192-1"), true);
  const related = relatedSets(catalog, set);
  assert.equal(related.variants.some((item) => item.id === "7140-1"), false);
  assert.ok(related.sameYear.length <= 8);
});

test("CPI adjustment uses stored annual indexes and skips gaps", () => {
  assert.equal(cpiValue(1999), 166.575);
  assert.equal(cpiValue(2025), null);
  assert.equal(cpiValue(2026), null);
  assert.equal(latestCompleteCpiYear(), 2024);
  const adjusted = adjustPurchasingPower(100, 1999, 2024);
  assert.ok(adjusted != null && adjusted > 100);
  assert.equal(adjustPurchasingPower(100, 1999, 2025), null);
  assert.equal(adjustPurchasingPower(null, 1999, 2024), null);
});

test("long card names wrap onto more than one line", () => {
  const svg = renderCardFront(DEFAULT_APPEARANCE, {
    idLabel: "LOCAL DRAFT",
    name: "Captain Brickstorm of the Paper Sea",
    creator: "Archive Studio",
    year: 2027,
    rarity: "Legendary",
    overall: 90,
    power: 90,
    creativity: 96,
    defense: 80,
    bio: "A long biography stays wrapped.",
    abilities: [],
    banner: "NOT PUBLISHED",
  });
  assert.match(svg, />Captain Brickstorm of</);
  assert.match(svg, />the Paper Sea</);
});
