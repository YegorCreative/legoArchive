/**
 * Price records are optional. Missing money is null, never zero.
 * Percentage change is withheld unless both amounts are usable.
 */
export type PriceKind = "original-retail" | "market-new" | "market-used";
export type PriceVerification = "verified" | "estimated";

export interface PriceObservation {
  id: string;
  setId: string;
  kind: PriceKind;
  /** Major currency units, such as US dollars. Never a sentinel zero for "unknown". */
  amount: number;
  currency: string;
  /** Country or market the figure applies to, when known. */
  market: string | null;
  /** ISO date (YYYY-MM-DD) the figure was observed. */
  date: string | null;
  source: string;
  verification: PriceVerification;
  note: string | null;
}

export function percentChange(
  original: number | null,
  current: number | null,
  currencies?: { from: string | null; to: string | null },
): number | null {
  if (original == null || current == null) return null;
  if (!Number.isFinite(original) || !Number.isFinite(current) || original <= 0) return null;
  if (currencies?.from && currencies?.to && currencies.from !== currencies.to) return null;
  return ((current - original) / original) * 100;
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
