/** Decade helper and the set ids that receive a real HTML file. */

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

/** Every cataloged set is a static page so its URL can return HTTP 200. */
export function prerenderIdSet(sets) {
  return new Set(sets.map((set) => set.id));
}

export function shouldPrerenderSet(set, ids) {
  return ids.has(set.id);
}
