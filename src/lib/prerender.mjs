/** Which set pages are real HTML files. The rest use the client set viewer. */

export function decadeOf(year) {
  return Math.floor(year / 10) * 10;
}

/** Largest recorded piece count in each decade. Ties break toward the lower set id. */
export function largestByDecade(sets) {
  const best = new Map();
  for (const set of sets) {
    if (set.parts == null) continue;
    const decade = decadeOf(set.year);
    const current = best.get(decade);
    if (
      !current ||
      set.parts > current.parts ||
      (set.parts === current.parts && set.id < current.id)
    ) {
      best.set(decade, set);
    }
  }
  return [...best.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([decade, set]) => ({ decade, set }));
}

export function prerenderIdSet(sets) {
  const ids = new Set();
  for (const set of sets) {
    if (set.year === 1999) ids.add(set.id);
  }
  for (const entry of largestByDecade(sets)) ids.add(entry.set.id);
  return ids;
}

export function shouldPrerenderSet(set, ids) {
  return ids.has(set.id);
}
