import prices from "../data/prices.json" with { type: "json" };
import { duplicateObservationIds, observationIssues, type PriceKind, type PriceObservation } from "./pricing.ts";

const records = prices as PriceObservation[];
const shapeIssues = records.flatMap((price) => observationIssues(price));
const duplicates = duplicateObservationIds(records);
if (shapeIssues.length > 0 || duplicates.length > 0) {
  throw new Error(`Price file failed validation: ${[...shapeIssues, ...duplicates.map((id) => `${id}: duplicate`)].join("; ")}`);
}

const bySet = new Map<string, PriceObservation[]>();
for (const price of records) {
  const list = bySet.get(price.setId);
  if (list) list.push(price);
  else bySet.set(price.setId, [price]);
}

export function allPrices(): PriceObservation[] {
  return records;
}

export function pricesFor(setId: string): PriceObservation[] {
  return bySet.get(setId) ?? [];
}

export function priceOf(setId: string, kind: PriceKind): PriceObservation | null {
  return pricesFor(setId).find((price) => price.kind === kind) ?? null;
}

export function verifiedPrice(setId: string, kind: PriceKind): PriceObservation | null {
  const price = priceOf(setId, kind);
  return price?.verification === "verified" ? price : null;
}
