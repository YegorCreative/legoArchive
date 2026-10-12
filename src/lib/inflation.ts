import cpi from "../data/cpi-u.json" with { type: "json" };

export interface CpiFile {
  seriesId: string;
  seriesName: string;
  source: string;
  sourceUrl: string;
  retrievedAt: string;
  method: string;
  partialYearsOmitted: { year: number; months: number }[];
  observations: { year: number; value: number; months: number }[];
}

const file = cpi as CpiFile;
const byYear = new Map<number, number>();
for (const row of file.observations) {
  if (row.months === 12 && Number.isFinite(row.value) && row.value > 0) byYear.set(row.year, row.value);
}

export function cpiSeries(): CpiFile {
  return file;
}

export function cpiValue(year: number): number | null {
  return byYear.get(year) ?? null;
}

export function latestCompleteCpiYear(): number | null {
  let latest: number | null = null;
  for (const year of byYear.keys()) {
    if (latest == null || year > latest) latest = year;
  }
  return latest;
}

/**
 * Adjust an amount for US purchasing power.
 * This is not a collectible market value.
 * Result is amount × (CPI in the later year ÷ CPI in the earlier year).
 * Returns null when the amount or either annual index is missing.
 */
export function adjustPurchasingPower(
  amount: number | null,
  fromYear: number | null,
  toYear: number | null,
): number | null {
  if (amount == null || fromYear == null || toYear == null) return null;
  if (!Number.isFinite(amount) || amount < 0) return null;
  const from = cpiValue(fromYear);
  const to = cpiValue(toYear);
  if (from == null || to == null || from <= 0) return null;
  return (amount * to) / from;
}
