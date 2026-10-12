import {
  buildCatalog,
  imageUrl,
  printedNumber,
  relatedSets,
  rootTheme,
  variantChoices,
  type LoadedCatalog,
  type SetRecord,
} from "../lib/catalog";

function text(tag: string, value: string, className?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = value;
  return node;
}

function fact(term: string, value: Node | string): HTMLElement {
  const wrap = document.createElement("div");
  const dd = document.createElement("dd");
  dd.append(value instanceof Node ? value : document.createTextNode(value));
  wrap.append(text("dt", term), dd);
  return wrap;
}

function link(base: string, path: string, label: string): HTMLAnchorElement {
  const anchor = document.createElement("a");
  anchor.href = `${base}${path.replace(/^\//, "")}`;
  anchor.textContent = label;
  return anchor;
}

function renderSet(root: HTMLElement, catalog: LoadedCatalog, set: SetRecord, base: string): void {
  const theme = catalog.themeById.get(set.themeId) ?? null;
  const group = rootTheme(set.themeId, catalog.themeById);
  root.replaceChildren();
  const article = document.createElement("article");
  article.className = "set-page";

  const header = document.createElement("header");
  header.className = "set-hero";
  const figure = document.createElement("figure");
  figure.className = "shot";
  const image = document.createElement("img");
  image.className = "set-img";
  image.src = imageUrl(catalog.snapshot, set.id);
  image.alt = `${set.name}, set ${set.id}`;
  image.width = 800;
  image.height = 800;
  figure.append(image);
  const intro = document.createElement("div");
  intro.append(
    text("p", `${group?.name ?? "Theme unavailable"}${theme && theme.id !== group?.id ? ` · ${theme.name}` : ""}`, "eyebrow"),
    text("h1", set.name),
    text("p", `Set ${set.id} · ${set.year}`, "deck"),
    text("p", "Verified fields come from the Rebrickable snapshot. Missing prices, dates, ages, and minifigure counts stay unavailable.", "quiet"),
  );
  header.append(figure, intro);

  const facts = document.createElement("dl");
  facts.className = "facts";
  facts.append(
    fact("Catalog number", set.id),
    fact("Printed number", printedNumber(set.id)),
    fact("Release year", link(base, `years/${set.year}/`, String(set.year))),
    fact("Theme", group ? link(base, `themes/${group.slug}/`, group.name) : "Unavailable"),
    fact("Piece count", set.parts == null ? "Unavailable" : set.parts.toLocaleString("en-US")),
    fact("Original retail price", "Unavailable"),
    fact("Current market value", "Unavailable"),
    fact("Retirement year", "Unavailable"),
  );

  const price = document.createElement("section");
  price.append(text("h2", "Price information"), text("p", "No verified price observations are stored for this set. Percentage change and inflation adjustment are not calculated.", "notice"));

  const related = document.createElement("section");
  related.append(text("h2", "Related sets"));
  const relations = relatedSets(catalog, set);
  const blocks = [
    ["Same printed number", relations.variants],
    [`More from ${set.year}`, relations.sameYear],
    ["More from this theme", relations.sameTheme],
  ] as const;
  for (const [title, sets] of blocks) {
    const panel = document.createElement("div");
    panel.className = "panel";
    panel.append(text("h3", title));
    if (sets.length === 0) panel.append(text("p", "None in this snapshot."));
    else {
      const list = document.createElement("ul");
      for (const item of sets) {
        const li = document.createElement("li");
        li.append(link(base, `sets/${item.id}/`, `${item.name} · ${item.id}`));
        list.append(li);
      }
      panel.append(list);
    }
    related.append(panel);
  }

  article.append(header, facts, price, related);
  root.append(article);
  document.title = `${set.name} · LEGO Archive`;
}

export async function mountSetExplorer(node: HTMLElement): Promise<void> {
  const status = node.querySelector("#set-status");
  const root = node.querySelector("#set-root");
  if (!(root instanceof HTMLElement) || !(status instanceof HTMLElement)) return;
  const base = node.dataset.base || "/";
  const parts = window.location.pathname.split("/").filter(Boolean);
  const marker = parts.lastIndexOf("sets");
  const rawId = marker >= 0 ? decodeURIComponent(parts[marker + 1] || "") : "";
  if (!rawId || rawId === "set-viewer") {
    status.textContent = "Open a set from search or a year page.";
    return;
  }
  try {
    const response = await fetch(node.dataset.catalog || "");
    if (!response.ok) throw new Error("Catalog request failed");
    const catalog = buildCatalog(await response.json());
    const exact = catalog.setById.get(rawId);
    const choices = exact ? [exact] : variantChoices(catalog, rawId);
    if (choices.length === 1) {
      status.textContent = exact ? "" : `Showing catalog record ${choices[0].id} for printed number ${rawId}.`;
      renderSet(root, catalog, choices[0], base);
      return;
    }
    if (choices.length > 1) {
      status.textContent = `Several catalog records share ${rawId}.`;
      const list = document.createElement("ul");
      for (const set of choices) {
        const item = document.createElement("li");
        item.append(link(base, `sets/${set.id}/`, `${set.name} (${set.id})`));
        list.append(item);
      }
      root.replaceChildren(list);
      return;
    }
    status.textContent = `No set numbered ${rawId} is in this snapshot.`;
  } catch {
    status.textContent = "The catalog index could not be loaded.";
  }
}
