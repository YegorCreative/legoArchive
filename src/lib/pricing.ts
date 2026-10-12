/**
 * Price records are optional. Missing money is null, never zero.
 * Percentage change is withheld unless both amounts are usable.
 * A mail-order catalog price is not a store MSRP, and a shop price is not a resale value.
 */
export type PriceKind =
  | "original-retail"
  | "mail-order"
  | "discounted-retail"
  | "current-shop"
  | "market-new"
  | "market-used"
  | "market-incomplete"
  | "auction-sale";

export type PriceClass =
  | "msrp"
  | "launch-retail"
  | "mail-order"
  | "discounted-retail"
  | "current-shop"
  | "market-new"
  | "market-used"
  | "market-incomplete"
  | "auction-sale";

export type PriceCondition = "not-applicable" | "new-sealed" | "used-complete" | "used-incomplete";
export type PriceVerification = "verified" | "estimated";

export interface PriceObservation {
  id: string;
  setId: string;
  kind: PriceKind;
  priceClass: PriceClass;
  condition: PriceCondition;
  /** Major currency units, such as US dollars. Never a sentinel zero for "unknown". */
  amount: number;
  currency: string;
  /** Country or market the figure applies to. */
  market: string;
  /** ISO date (YYYY-MM-DD) associated with the observation. */
  date: string;
  source: string;
  sourceUrl: string;
  /** When the source itself was published, if that day is known. */
  publicationDate: string | null;
  verifiedAt: string;
  verification: PriceVerification;
  note: string | null;
}

const CLASS_FOR_KIND: Record<PriceKind, readonly PriceClass[]> = {
  "original-retail": ["msrp", "launch-retail"],
  "mail-order": ["mail-order"],
  "discounted-retail": ["discounted-retail"],
  "current-shop": ["current-shop"],
  "market-new": ["market-new"],
  "market-used": ["market-used"],
  "market-incomplete": ["market-incomplete"],
  "auction-sale": ["auction-sale"],
};

const CONDITION_FOR_KIND: Record<PriceKind, readonly PriceCondition[]> = {
  "original-retail": ["not-applicable"],
  "mail-order": ["not-applicable"],
  "discounted-retail": ["not-applicable"],
  "current-shop": ["not-applicable"],
  "market-new": ["new-sealed"],
  "market-used": ["used-complete"],
  "market-incomplete": ["used-incomplete"],
  "auction-sale": ["new-sealed", "used-complete", "used-incomplete"],
};

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function observationIssues(price: PriceObservation, today = "2026-10-12"): string[] {
  const issues: string[] = [];
  const id = price?.id || "(missing id)";
  const say = (message: string) => issues.push(`${id}: ${message}`);
  if (!price || typeof price !== "object") return ["A price record is missing."];
  if (!price.id || !/^[a-z0-9-]{8,80}$/.test(price.id)) say("id must be a short lowercase slug");
  if (!/^\d+-\d+$/.test(price.setId || "")) say("set id must look like 7140-1");
  const classes = CLASS_FOR_KIND[price.kind];
  if (!classes) say("kind is not supported");
  else if (!classes.includes(price.priceClass)) say("price class does not match kind");
  const conditions = CONDITION_FOR_KIND[price.kind];
  if (conditions && !conditions.includes(price.condition)) say("condition does not match kind");
  if (!Number.isFinite(price.amount) || price.amount <= 0) say("amount must be a positive number");
  if (!/^[A-Z]{3}$/.test(price.currency || "")) say("currency must be a three-letter ISO code");
  if (!price.market || price.market.length > 80) say("market is required");
  if (!isIsoDate(price.date) || price.date < "1949-01-01" || price.date > today) say("date is not a usable observation date");
  if (!isIsoDate(price.verifiedAt) || price.verifiedAt > today) say("verifiedAt is not a usable date");
  if (price.publicationDate != null && !isIsoDate(price.publicationDate)) say("publicationDate must be an ISO date or null");
  if (!price.source || price.source.length > 180) say("source attribution is required");
  if (!/^https:\/\/\S+$/.test(price.sourceUrl || "")) say("source URL must be https");
  if (price.verification !== "verified" && price.verification !== "estimated") say("verification is invalid");
  if (price.note != null && price.note.length > 800) say("note is too long");
  return issues;
}

export function duplicateObservationIds(prices: PriceObservation[]): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const price of prices) {
    const key = [price.setId, price.kind, price.priceClass, price.condition, price.currency, price.market, price.date, price.amount, price.sourceUrl].join("|");
    if (seen.has(key) || seen.has(`id:${price.id}`)) duplicates.push(price.id);
    seen.add(key);
    seen.add(`id:${price.id}`);
  }
  return duplicates;
}

export function percentChange(
  original: number | null,
  current: number | null,
  context?: { from?: string | null; to?: string | null; fromMarket?: string | null; toMarket?: string | null },
): number | null {
  if (original == null || current == null) return null;
  if (!Number.isFinite(original) || !Number.isFinite(current) || original <= 0) return null;
  if (context?.from && context?.to && context.from !== context.to) return null;
  if (context?.fromMarket && context?.toMarket && context.fromMarket !== context.toMarket) return null;
  return ((current - original) / original) * 100;
}

/**
 * Appreciation compares a verified store MSRP or launch price with a later
 * verified market observation in the same currency and market.
 * A mail-order price includes charges a store shelf price may not, so it is not used.
 */
export function appreciationPercent(original: PriceObservation | null, current: PriceObservation | null): number | null {
  if (!original || !current) return null;
  if (original.verification !== "verified" || current.verification !== "verified") return null;
  if (original.kind !== "original-retail") return null;
  const comparable = current.kind === "market-new" || current.kind === "market-used" || current.kind === "market-incomplete" || current.kind === "auction-sale";
  if (!comparable) return null;
  return percentChange(original.amount, current.amount, {
    from: original.currency,
    to: current.currency,
    fromMarket: original.market,
    toMarket: current.market,
  });
}

export function pricePerPiece(amount: number | null, pieces: number | null): number | null {
  if (amount == null || pieces == null) return null;
  if (!Number.isFinite(amount) || !Number.isFinite(pieces) || pieces <= 0 || amount < 0) return null;
  return amount / pieces;
}

/**
 * Missing numbers sort after every real value, in either direction.
 * They are not treated as zero.
 */
export function compareMissingLast(
  a: number | null,
  b: number | null,
  direction: "asc" | "desc",
): number {
  const aMissing = a == null || !Number.isFinite(a);
  const bMissing = b == null || !Number.isFinite(b);
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;
  return direction === "asc" ? a - b : b - a;
}

export function formatMoney(amount: number | null, currency: string | null): string {
  if (amount == null || !currency) return "Unavailable";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function formatPercent(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "Not calculated";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

/** Average only the supplied verified amounts. An empty list, a non-positive amount, or mixed currencies return null. */
export function meanAmount(prices: Pick<PriceObservation, "amount" | "currency" | "verification">[]): number | null {
  if (prices.length === 0) return null;
  const currency = prices[0]?.currency;
  let total = 0;
  for (const price of prices) {
    if (price.verification !== "verified") return null;
    if (!Number.isFinite(price.amount) || price.amount <= 0) return null;
    if (price.currency !== currency) return null;
    total += price.amount;
  }
  return total / prices.length;
}
