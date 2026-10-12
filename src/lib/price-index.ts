import prices from "../data/prices.json";
import type { PriceKind, PriceObservation } from "./pricing.ts";

const bySet = new Map<string, PriceObservation[]>();
for (const price of prices as PriceObservation[]) {
  const list = bySet.get(price.setId);
  if (list) list.push(price);
  else bySet.set(price.setId, [price]);
}

export function pricesFor(setId: string): PriceObservation[] {
  return bySet.get(setId) ?? [];
}

export function priceOf(setId: string, kind: PriceKind): PriceObservation | null {
  return pricesFor(setId).find((price) => price.kind === kind) ?? null;
}
