import { appearanceFromRecord, authErrorMessage, GALLERY_PAGE_SIZE } from "../lib/community";
import { renderCharacter } from "../lib/character-svg";
import type { Rarity } from "../lib/rarity";
import { createCommunityClient } from "../lib/supabase-browser";

interface GalleryRow {
  card_id: string;
  published_at: string;
  character_id: string;
  name: string;
  appearance: unknown;
  overall: number;
  rarity: Rarity;
  rarity_rule_version: string;
  username: string;
  display_name: string;
  status?: string;
}

export function mountGallery(root: HTMLElement): void {
  const status = root.querySelector("#gallery-status");
  const results = root.querySelector("#gallery-results");
  const form = root.querySelector("#gallery-form");
  const pager = root.querySelector("#gallery-pager");
  if (!(status instanceof HTMLElement) || !(results instanceof HTMLElement) || !(form instanceof HTMLFormElement) || !(pager instanceof HTMLElement)) return;
  const client = createCommunityClient();
  if (!client) {
    status.textContent = "Accounts are not connected. No card is approved, so the gallery is empty.";
    return;
  }

  let page = 0;
  const render = async () => {
    status.textContent = "Loading published cards…";
    results.replaceChildren();
    pager.replaceChildren();
    const data = new FormData(form);
    const rarity = String(data.get("rarity") || "");
    const needle = String(data.get("name") || "").trim().slice(0, 64).replace(/[%_,]/g, "");
    const sort = String(data.get("sort") || "newest");
    let query = client.from("gallery_cards").select("card_id, published_at, character_id, name, appearance, overall, rarity, rarity_rule_version, username, display_name", { count: "exact" });
    if (rarity) query = query.eq("rarity", rarity);
    if (needle) query = query.ilike("name", `%${needle}%`);
    if (sort === "oldest") query = query.order("published_at", { ascending: true });
    else if (sort === "name") query = query.order("name", { ascending: true });
    else query = query.order("published_at", { ascending: false });
    const from = page * GALLERY_PAGE_SIZE;
    const { data: rows, error, count } = await query.range(from, from + GALLERY_PAGE_SIZE - 1);
    if (error) {
      status.textContent = authErrorMessage(error.message);
      return;
    }
    const cards = (rows ?? []) as GalleryRow[];
    const total = count ?? cards.length;
    status.textContent = total === 0
      ? "No published cards. Private drafts are hidden, and publication review is closed."
      : `${total.toLocaleString("en-US")} published cards.`;
    for (const card of cards) {
      const article = document.createElement("article");
      article.className = "card";
      const appearance = appearanceFromRecord(card.appearance);
      if (appearance) {
        const figure = document.createElement("div");
        figure.className = "card-stage";
        figure.innerHTML = renderCharacter(appearance, `gallery-${card.card_id}`);
        article.append(figure);
      }
      const body = document.createElement("div");
      body.className = "card-body";
      body.append(
        Object.assign(document.createElement("p"), { className: "eyebrow", textContent: card.rarity }),
        Object.assign(document.createElement("h3"), { textContent: card.name }),
        Object.assign(document.createElement("p"), { textContent: card.username }),
        Object.assign(document.createElement("p"), { className: "meta", textContent: `Fictional overall ${card.overall} · ${card.rarity_rule_version}` }),
        Object.assign(document.createElement("p"), { className: "quiet", textContent: new Date(card.published_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) }),
      );
      const report = document.createElement("button");
      report.type = "button";
      report.textContent = "Report";
      report.addEventListener("click", async () => {
        const reason = window.prompt("Describe the problem in at least 10 characters.");
        if (!reason) return;
        const { error: reportError } = await client.rpc("file_report", { target: card.character_id, reason });
        status.textContent = reportError ? authErrorMessage(reportError.message) : "Report sent to the moderation queue.";
      });
      body.append(report);
      article.append(body);
      results.append(article);
    }
    const pages = Math.max(1, Math.ceil(total / GALLERY_PAGE_SIZE));
    const previous = document.createElement("button");
    previous.type = "button";
    previous.textContent = "Previous";
    previous.disabled = page <= 0;
    previous.addEventListener("click", () => { page -= 1; void render(); });
    const next = document.createElement("button");
    next.type = "button";
    next.textContent = "Next";
    next.disabled = page + 1 >= pages;
    next.addEventListener("click", () => { page += 1; void render(); });
    pager.append(previous, Object.assign(document.createElement("span"), { textContent: `Page ${page + 1} of ${pages}` }), next);
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    page = 0;
    void render();
  });
  form.addEventListener("change", () => {
    page = 0;
    void render();
  });
  void render();
}
