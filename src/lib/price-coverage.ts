import { adjustPurchasingPower, latestCompleteCpiYear } from "./inflation.ts";
import { pricesFor } from "./price-index.ts";
import { meanAmount, pricePerPiece, type PriceKind, type PriceObservation } from "./pricing.ts";

export interface CoveredSet {
  id: string;
  name: string;
  year: number;
  parts: number | null;
}

export interface PricedRow {
  set: CoveredSet;
  price: PriceObservation;
  perPiece: number | null;
  adjusted: number | null;
  comparisonYear: number | null;
}

export function pricedRows(sets: CoveredSet[], kind: PriceKind): PricedRow[] {
  const comparisonYear = latestCompleteCpiYear();
  const rows: PricedRow[] = [];
  for (const set of sets) {
    const price = pricesFor(set.id).find((item) => item.kind === kind && item.verification === "verified");
    if (!price) continue;
    const year = Number(price.date.slice(0, 4));
    rows.push({
      set,
      price,
      perPiece: pricePerPiece(price.amount, set.parts),
      adjusted: price.currency === "USD" ? adjustPurchasingPower(price.amount, year, comparisonYear) : null,
      comparisonYear: price.currency === "USD" ? comparisonYear : null,
    });
  }
  return rows.sort((a, b) => b.price.amount - a.price.amount || a.set.id.localeCompare(b.set.id));
}

export function sampleMean(rows: PricedRow[]): number | null {
  return meanAmount(rows.map((row) => row.price));
}

export function coverageLabel(priced: number, total: number): string {
  return `${priced.toLocaleString("en-US")} of ${total.toLocaleString("en-US")}`;
}

export function countVerified(setIds: string[], kind: PriceKind): number {
  let count = 0;
  for (const id of setIds) {
    if (pricesFor(id).some((price) => price.kind === kind && price.verification === "verified")) count += 1;
  }
  return count;
}
