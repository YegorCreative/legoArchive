import { buildCatalog, rootTheme } from "../lib/catalog";
import { parseOptionalNumber, searchSets, type SearchRecord, type SearchSort } from "../lib/search";

const PAGE_SIZE = 24;
const SORTS: SearchSort[] = ["oldest", "newest", "most-pieces", "fewest-pieces", "name", "price-retail", "price-market"];

function readSort(value: string | null): SearchSort {
  if (value && SORTS.includes(value as SearchSort)) return value as SearchSort;
  return "newest";
}

export async function mountSearch(node: HTMLElement): Promise<void> {
  const status = node.querySelector("#search-status");
  const results = node.querySelector("#search-results");
  const form = node.querySelector("form");
  if (!(status instanceof HTMLElement) || !(results instanceof HTMLElement) || !(form instanceof HTMLFormElement)) return;
  const base = node.dataset.base || "/";
  status.textContent = "Loading the search index…";
  const response = await fetch(node.dataset.catalog || "");
  if (!response.ok) {
    status.textContent = "The search index could not be loaded.";
    return;
  }
  const catalog = buildCatalog(await response.json());
  const records: SearchRecord[] = catalog.sets.map((set) => ({
    id: set.id,
    name: set.name,
    year: set.year,
    themeId: set.themeId,
    rootThemeId: rootTheme(set.themeId, catalog.themeById)?.id ?? set.themeId,
    parts: set.parts,
  }));
  const themes = [...catalog.themeById.values()].filter((theme) => theme.parentId == null).sort((a, b) => a.name.localeCompare(b.name));
  const themeSelect = form.querySelector<HTMLSelectElement>("[name=theme]");
  const yearSelect = form.querySelector<HTMLSelectElement>("[name=year]");
  if (themeSelect) {
    for (const theme of themes) {
      const option = document.createElement("option");
      option.value = theme.slug;
      option.textContent = theme.name;
      themeSelect.append(option);
    }
  }
  if (yearSelect) {
    for (const year of catalog.years) {
      const option = document.createElement("option");
      option.value = String(year);
      option.textContent = String(year);
      yearSelect.append(option);
    }
  }

  const params = new URLSearchParams(window.location.search);
  const setValue = (name: string, value: string | null) => {
    const field = form.elements.namedItem(name);
    if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) field.value = value ?? "";
  };
  setValue("q", params.get("q"));
  setValue("year", params.get("year"));
  setValue("decade", params.get("decade"));
  setValue("theme", params.get("theme"));
  setValue("min", params.get("min"));
  setValue("max", params.get("max"));
  setValue("sort", params.get("sort") || "newest");
  let page = Math.max(1, parseOptionalNumber(params.get("page")) ?? 1);

  const render = () => {
    const data = new FormData(form);
    const themeSlug = String(data.get("theme") || "");
    const theme = themeSlug ? catalog.themeBySlug.get(themeSlug) : null;
    const sort = readSort(String(data.get("sort") || ""));
    const priceSort = sort === "price-retail" || sort === "price-market";
    const filtered = searchSets(records, {
      query: String(data.get("q") || ""),
      year: parseOptionalNumber(String(data.get("year") || "")),
      decade: parseOptionalNumber(String(data.get("decade") || "")),
      rootThemeId: theme?.id ?? null,
      partsMin: parseOptionalNumber(String(data.get("min") || "")),
      partsMax: parseOptionalNumber(String(data.get("max") || "")),
      sort: priceSort ? "name" : sort,
    });
    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    page = Math.min(page, pages);
    const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    status.textContent = `${filtered.length.toLocaleString("en-US")} sets. Missing piece counts stay out of piece filters and sort after known counts.`;
    results.replaceChildren();
    if (priceSort) {
      results.append(Object.assign(document.createElement("p"), {
        className: "notice",
        textContent: "Original price and market value cannot be sorted yet. No verified prices are in this snapshot, and missing prices are not treated as zero.",
      }));
    }
    const grid = document.createElement("div");
    grid.className = "card-grid";
    for (const record of slice) {
      const article = document.createElement("article");
      article.className = "card";
      const anchor = document.createElement("a");
      anchor.className = "card-link";
      anchor.href = `${base}sets/${record.id}/`;
      const body = document.createElement("div");
      body.className = "card-body";
      const themeName = catalog.themeById.get(record.rootThemeId)?.name ?? "Theme";
      body.append(
        Object.assign(document.createElement("p"), { className: "eyebrow", textContent: themeName }),
        Object.assign(document.createElement("h3"), { textContent: record.name }),
        Object.assign(document.createElement("p"), { className: "meta", textContent: `${record.id} · ${record.year}` }),
        Object.assign(document.createElement("p"), { textContent: record.parts == null ? "Piece count unavailable" : `${record.parts.toLocaleString("en-US")} pieces` }),
        Object.assign(document.createElement("p"), { className: "quiet", textContent: "Retail price unavailable" }),
      );
      anchor.append(body);
      article.append(anchor);
      grid.append(article);
    }
    results.append(grid);
    const pager = document.createElement("div");
    pager.className = "pager";
    const prev = document.createElement("button");
    prev.type = "button";
    prev.textContent = "Previous";
    prev.disabled = page <= 1;
    prev.addEventListener("click", () => { page -= 1; render(); });
    const next = document.createElement("button");
    next.type = "button";
    next.textContent = "Next";
    next.disabled = page >= pages;
    next.addEventListener("click", () => { page += 1; render(); });
    pager.append(prev, Object.assign(document.createElement("span"), { textContent: `Page ${page} of ${pages}` }), next);
    results.append(pager);

    const nextParams = new URLSearchParams();
    for (const [key, value] of data.entries()) {
      if (typeof value === "string" && value.trim()) nextParams.set(key, value.trim());
    }
    if (page > 1) nextParams.set("page", String(page));
    const query = nextParams.toString();
    history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    page = 1;
    render();
  });
  form.addEventListener("change", () => {
    page = 1;
    render();
  });
  render();
}
