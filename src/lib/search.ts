import { compareMissingLast } from "./pricing.ts";

export interface SearchRecord {
  id: string;
  name: string;
  year: number;
  themeId: string;
  rootThemeId: string;
  parts: number | null;
}

export type SearchSort =
  | "oldest"
  | "newest"
  | "most-pieces"
  | "fewest-pieces"
  | "name"
  | "price-retail"
  | "price-market";

export interface SearchFilters {
  query: string;
  year: number | null;
  decade: number | null;
  rootThemeId: string | null;
  partsMin: number | null;
  partsMax: number | null;
  sort: SearchSort;
}

export function parseOptionalNumber(value: string | null | undefined): number | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const number = Number(trimmed);
  if (!Number.isFinite(number)) return null;
  return number;
}

export function searchSets(records: SearchRecord[], filters: SearchFilters): SearchRecord[] {
  const needle = filters.query.trim().toLowerCase();
  const matched = records.filter((record) => {
    if (filters.year != null && record.year !== filters.year) return false;
    if (filters.decade != null && Math.floor(record.year / 10) * 10 !== filters.decade) return false;
    if (filters.rootThemeId && record.rootThemeId !== filters.rootThemeId) return false;
    if (filters.partsMin != null || filters.partsMax != null) {
      if (record.parts == null) return false;
      if (filters.partsMin != null && record.parts < filters.partsMin) return false;
      if (filters.partsMax != null && record.parts > filters.partsMax) return false;
    }
    if (!needle) return true;
    return (
      record.id.toLowerCase().includes(needle) ||
      record.name.toLowerCase().includes(needle) ||
      record.year.toString() === needle
    );
  });

  const sorted = [...matched];
  sorted.sort((a, b) => {
    if (filters.sort === "oldest") return a.year - b.year || a.id.localeCompare(b.id, "en", { numeric: true });
    if (filters.sort === "newest") return b.year - a.year || a.id.localeCompare(b.id, "en", { numeric: true });
    if (filters.sort === "name") return a.name.localeCompare(b.name) || a.year - b.year;
    if (filters.sort === "most-pieces") {
      return compareMissingLast(a.parts, b.parts, "desc") || a.name.localeCompare(b.name);
    }
    if (filters.sort === "fewest-pieces") {
      return compareMissingLast(a.parts, b.parts, "asc") || a.name.localeCompare(b.name);
    }
    // No verified prices exist. Do not sort missing prices as zero.
    return a.name.localeCompare(b.name);
  });
  return sorted;
}
