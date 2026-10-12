import assert from "node:assert/strict";
import { test } from "node:test";
import { loadCatalog } from "../src/lib/load-catalog.ts";
import { adjustPurchasingPower, cpiValue } from "../src/lib/inflation.ts";
import { allPrices, verifiedPrice } from "../src/lib/price-index.ts";
import { pricedRows, sampleMean } from "../src/lib/price-coverage.ts";
import {
  appreciationPercent,
  duplicateObservationIds,
  meanAmount,
  observationIssues,
  percentChange,
  pricePerPiece,
  type PriceObservation,
} from "../src/lib/pricing.ts";

function sample(overrides: Partial<PriceObservation> = {}): PriceObservation {
  return {
    id: "shop-1999-fall-7140-1",
    setId: "7140-1",
    kind: "mail-order",
    priceClass: "mail-order",
    condition: "not-applicable",
    amount: 33,
    currency: "USD",
    market: "United States",
    date: "1999-11-30",
    source: "LEGO Shop at Home, Fall 1999, United States",
    sourceUrl: "https://archive.org/details/1999FallUSShopAtHome/page/n9/mode/1up",
    publicationDate: null,
    verifiedAt: "2026-10-12",
    verification: "verified",
    note: null,
    ...overrides,
  };
}

test("price records reject bad identifiers, amounts, currencies, dates, and sources", () => {
  assert.deepEqual(observationIssues(sample()), []);
  assert.ok(observationIssues(sample({ setId: "x-wing" })).some((issue) => issue.includes("set id")));
  assert.ok(observationIssues(sample({ amount: -1 })).some((issue) => issue.includes("amount")));
  assert.ok(observationIssues(sample({ amount: 0 })).some((issue) => issue.includes("amount")));
  assert.ok(observationIssues(sample({ currency: "usd" })).some((issue) => issue.includes("currency")));
  assert.ok(observationIssues(sample({ source: "" })).some((issue) => issue.includes("source")));
  assert.ok(observationIssues(sample({ sourceUrl: "http://example.com/a" })).some((issue) => issue.includes("source URL")));
  assert.ok(observationIssues(sample({ condition: "new-sealed" })).some((issue) => issue.includes("condition")));
  assert.ok(observationIssues(sample({ date: "1948-12-31" })).some((issue) => issue.includes("date")));
  assert.ok(observationIssues(sample({ date: "2026-10-13" })).some((issue) => issue.includes("date")));
  assert.ok(observationIssues(sample({ verification: "guessed" as "verified" })).some((issue) => issue.includes("verification")));
  assert.ok(observationIssues(sample({ kind: "market-new", priceClass: "market-new", condition: "not-applicable" })).some((issue) => issue.includes("condition")));
});

test("duplicate observations are detected by id and by the same facts", () => {
  const first = sample();
  assert.deepEqual(duplicateObservationIds([first, sample({ id: "shop-1999-fall-7140-1b" })]), ["shop-1999-fall-7140-1b"]);
  assert.deepEqual(duplicateObservationIds([first, sample({ id: "shop-1999-fall-7140-1", amount: 34 })]), ["shop-1999-fall-7140-1"]);
  assert.deepEqual(duplicateObservationIds([first, sample({ id: "shop-1999-fall-7150-1", setId: "7150-1", amount: 54 })]), []);
});

test("means ignore empty lists, unverified rows, and mixed currencies", () => {
  assert.equal(meanAmount([]), null);
  assert.equal(meanAmount([sample({ verification: "estimated" })]), null);
  assert.equal(meanAmount([sample(), sample({ id: "other", currency: "EUR", amount: 10 })]), null);
  assert.equal(meanAmount([sample({ amount: 10 }), sample({ id: "other", setId: "7110-1", amount: 20 })]), 15);
});

test("inflation, percentage, and price per piece stay withheld when inputs disagree", () => {
  const from = cpiValue(1999);
  const to = cpiValue(2024);
  assert.ok(from && to);
  const adjusted = adjustPurchasingPower(33, 1999, 2024);
  assert.ok(adjusted != null);
  assert.equal(adjusted, (33 * to) / from);
  assert.equal(adjustPurchasingPower(33, 1999, 2026), null);
  assert.equal(adjustPurchasingPower(null, 1999, 2024), null);
  assert.equal(percentChange(33, null), null);
  assert.equal(percentChange(33, 40, { from: "USD", to: "EUR" }), null);
  assert.equal(percentChange(33, 40, { fromMarket: "United States", toMarket: "Germany" }), null);
  assert.equal(pricePerPiece(33, 271), 33 / 271);
  assert.equal(pricePerPiece(33, 0), null);
  assert.equal(pricePerPiece(33, null), null);
});

test("the imported Shop at Home sample is verified and is not treated as MSRP", () => {
  const catalog = loadCatalog();
  const prices = allPrices();
  assert.equal(prices.length, 14);
  for (const price of prices) {
    assert.deepEqual(observationIssues(price), []);
    assert.ok(catalog.setById.get(price.setId), price.setId);
    assert.equal(price.kind, "mail-order");
    assert.equal(price.currency, "USD");
    assert.equal(price.market, "United States");
    assert.equal(price.verification, "verified");
    assert.equal(verifiedPrice(price.setId, "original-retail"), null);
    assert.equal(verifiedPrice(price.setId, "market-new"), null);
  }
  assert.deepEqual(duplicateObservationIds(prices), []);
  const xwing = verifiedPrice("7140-1", "mail-order");
  assert.equal(xwing?.amount, 33);
  const set = catalog.setById.get("7140-1");
  assert.equal(set?.parts, 271);
  assert.equal(pricePerPiece(xwing?.amount ?? null, set?.parts ?? null), 33 / 271);
  const rows = pricedRows([{ id: "7140-1", name: "X-wing Fighter", year: 1999, parts: 271 }], "mail-order");
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.adjusted, adjustPurchasingPower(33, 1999, 2024));
  assert.equal(sampleMean(rows), 33);
  const msrp = sample({ id: "msrp-7140-1", kind: "original-retail", priceClass: "msrp", amount: 20 });
  const sealed = sample({
    id: "sold-7140-1",
    kind: "market-new",
    priceClass: "market-new",
    condition: "new-sealed",
    amount: 30,
    market: "Germany",
  });
  assert.equal(appreciationPercent(xwing, sealed), null);
  assert.equal(appreciationPercent(msrp, sealed), null);
  assert.equal(appreciationPercent(msrp, { ...sealed, market: "United States" }), 50);
});
