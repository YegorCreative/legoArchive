import { largestByDecade, prerenderIdSet } from "./prerender.mjs";

export interface ThemeRecord {
  id: string;
  name: string;
  parentId: string | null;
  slug: string;
}

export interface SetRecord {
  id: string;
  name: string;
  year: number;
  themeId: string;
  /** Null when Rebrickable recorded 0, which this archive treats as unknown. */
  parts: number | null;
}

export interface SnapshotMeta {
  retrievedAt: string;
  sourceName: string;
  sourceUrl: string;
  termsUrl: string;
  files: string[];
  imageBase: string;
  imageSuffix: string;
  setCount: number;
  themeCount: number;
  attribution: string;
  limitations: string[];
}

interface RawCatalog {
  snapshot: SnapshotMeta;
  themes: [string, string, string | null, string][];
  sets: [string, string, number, string, number | null][];
}

export interface LoadedCatalog {
  snapshot: SnapshotMeta;
  themes: ThemeRecord[];
  sets: SetRecord[];
  themeById: Map<string, ThemeRecord>;
  themeBySlug: Map<string, ThemeRecord>;
  setById: Map<string, SetRecord>;
  years: number[];
  prerenderIds: Set<string>;
}

export function buildCatalog(raw: RawCatalog): LoadedCatalog {
  const themes: ThemeRecord[] = raw.themes.map(([id, name, parentId, slug]) => ({
    id,
    name,
    parentId,
    slug,
  }));
  const sets: SetRecord[] = raw.sets.map(([id, name, year, themeId, parts]) => ({
    id,
    name,
    year,
    themeId,
    parts,
  }));
  const themeById = new Map(themes.map((theme) => [theme.id, theme]));
  const themeBySlug = new Map(themes.map((theme) => [theme.slug, theme]));
  const setById = new Map(sets.map((set) => [set.id, set]));
  const years = [...new Set(sets.map((set) => set.year))].sort((a, b) => a - b);
  const prerenderIds = prerenderIdSet(sets);
  return { snapshot: raw.snapshot, themes, sets, themeById, themeBySlug, setById, years, prerenderIds };
}

export function imageUrl(snapshot: SnapshotMeta, setId: string): string {
  return `${snapshot.imageBase}${setId.toLowerCase()}${snapshot.imageSuffix}`;
}

export function printedNumber(setId: string): string {
  const match = /^(.+)-\d+$/.exec(setId);
  return match?.[1] ?? setId;
}

export function rootTheme(themeId: string, themeById: Map<string, ThemeRecord>): ThemeRecord | null {
  let current = themeById.get(themeId) ?? null;
  const seen = new Set<string>();
  while (current?.parentId && !seen.has(current.id)) {
    seen.add(current.id);
    const parent = themeById.get(current.parentId);
    if (!parent) break;
    current = parent;
  }
  return current;
}

export function decadeOf(year: number): number {
  return Math.floor(year / 10) * 10;
}

export function pieceStats(sets: SetRecord[]): { known: number; unknown: number; total: number | null } {
  let known = 0;
  let total = 0;
  for (const set of sets) {
    if (set.parts == null) continue;
    known += 1;
    total += set.parts;
  }
  return { known, unknown: sets.length - known, total: known > 0 ? total : null };
}

export function largestSet(sets: SetRecord[]): SetRecord | null {
  let best: SetRecord | null = null;
  for (const set of sets) {
    if (set.parts == null) continue;
    if (!best || set.parts > (best.parts ?? 0) || (set.parts === best.parts && set.id < best.id)) best = set;
  }
  return best;
}

export interface ThemeGroup {
  theme: ThemeRecord;
  sets: SetRecord[];
}

export function groupByRootTheme(sets: SetRecord[], catalog: LoadedCatalog): ThemeGroup[] {
  const groups = new Map<string, ThemeGroup>();
  for (const set of sets) {
    const theme = rootTheme(set.themeId, catalog.themeById);
    if (!theme) continue;
    const group = groups.get(theme.id) ?? { theme, sets: [] };
    group.sets.push(set);
    groups.set(theme.id, group);
  }
  for (const group of groups.values()) {
    group.sets.sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));
  }
  return [...groups.values()].sort(
    (a, b) => b.sets.length - a.sets.length || a.theme.name.localeCompare(b.theme.name),
  );
}

export function setsInYear(catalog: LoadedCatalog, year: number): SetRecord[] {
  return catalog.sets.filter((set) => set.year === year);
}

export function setsForRoot(catalog: LoadedCatalog, rootId: string): SetRecord[] {
  return catalog.sets.filter((set) => rootTheme(set.themeId, catalog.themeById)?.id === rootId);
}

export function directChildren(catalog: LoadedCatalog, themeId: string): ThemeRecord[] {
  return catalog.themes
    .filter((theme) => theme.parentId === themeId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function subthemeName(set: SetRecord, catalog: LoadedCatalog, root: ThemeRecord): string | null {
  const direct = catalog.themeById.get(set.themeId);
  if (!direct || direct.id === root.id) return null;
  return direct.name;
}

export interface RelatedSets {
  variants: SetRecord[];
  sameYear: SetRecord[];
  sameTheme: SetRecord[];
  sameSubtheme: SetRecord[];
}

export function relatedSets(catalog: LoadedCatalog, set: SetRecord): RelatedSets {
  const printed = printedNumber(set.id);
  const root = rootTheme(set.themeId, catalog.themeById);
  const variants = catalog.sets.filter((other) => other.id !== set.id && printedNumber(other.id) === printed);
  const sameYear = catalog.sets
    .filter((other) => other.id !== set.id && other.year === set.year && rootTheme(other.themeId, catalog.themeById)?.id === root?.id)
    .slice(0, 6);
  const sameTheme = root
    ? catalog.sets
        .filter((other) => other.id !== set.id && other.year !== set.year && rootTheme(other.themeId, catalog.themeById)?.id === root.id)
        .slice(0, 6)
    : [];
  const sameSubtheme =
    catalog.themeById.get(set.themeId)?.id === root?.id
      ? []
      : catalog.sets.filter((other) => other.id !== set.id && other.themeId === set.themeId).slice(0, 6);
  return { variants, sameYear, sameTheme, sameSubtheme };
}

export function decadeHighlights(catalog: LoadedCatalog): { decade: number; set: SetRecord }[] {
  return largestByDecade(catalog.sets);
}

export function variantChoices(catalog: LoadedCatalog, printed: string): SetRecord[] {
  return catalog.sets.filter((set) => printedNumber(set.id) === printed || set.id === printed);
}

export { largestByDecade };
