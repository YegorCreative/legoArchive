import { appearanceFromRecord, authErrorMessage, normalizeUsername } from "../lib/community";
import { renderCharacter } from "../lib/character-svg";
import { createCommunityClient } from "../lib/supabase-browser";

export function mountProfileViewer(root: HTMLElement): void {
  const status = root.querySelector("#profile-status");
  const result = root.querySelector("#profile-result");
  if (!(status instanceof HTMLElement) || !(result instanceof HTMLElement)) return;
  const requested = new URLSearchParams(window.location.search).get("u")?.trim() ?? "";
  if (!requested) {
    status.textContent = "Open a profile with ?u=username. That address is a real page on this static site.";
    return;
  }
  const username = normalizeUsername(requested);
  if (!username) {
    status.textContent = "That username is not a valid public profile address.";
    return;
  }
  if (username === "archive-studio") {
    status.textContent = "Archive Studio is a labeled demonstration, not a registered account.";
    return;
  }
  const client = createCommunityClient();
  if (!client) {
    status.textContent = `The address for ${username} is ready. Accounts are not connected, so this profile cannot be loaded.`;
    return;
  }
  status.textContent = "Loading the public profile…";
  void (async () => {
    const { data: profile, error } = await client.from("profiles").select("user_id, username, display_name, biography, created_at").eq("username", username).maybeSingle();
    if (error) {
      status.textContent = authErrorMessage(error.message);
      return;
    }
    if (!profile) {
      status.textContent = "No creator is registered with that username.";
      return;
    }
    status.textContent = "";
    const heading = document.createElement("h2");
    heading.textContent = profile.display_name;
    const facts = document.createElement("dl");
    facts.className = "facts";
    const add = (term: string, value: string) => {
      const wrap = document.createElement("div");
      wrap.append(Object.assign(document.createElement("dt"), { textContent: term }), Object.assign(document.createElement("dd"), { textContent: value }));
      facts.append(wrap);
    };
    add("Username", profile.username);
    add("Joined", new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));
    add("Biography", profile.biography || "No biography.");
    add("Community ranking", "Not recorded");
    add("Annual Five awards", "None");
    result.append(heading, facts);
    const { data: cards, error: cardError } = await client.from("gallery_cards").select("card_id, name, appearance, rarity, overall, rarity_rule_version, published_at").eq("username", username).order("published_at", { ascending: false }).limit(24);
    const list = document.createElement("div");
    list.className = "card-grid";
    if (cardError) {
      list.textContent = authErrorMessage(cardError.message);
    } else if (!cards || cards.length === 0) {
      list.textContent = "No published cards.";
    } else {
      for (const card of cards) {
        const article = document.createElement("article");
        article.className = "card";
        const appearance = appearanceFromRecord(card.appearance);
        if (appearance) {
          const figure = document.createElement("div");
          figure.className = "card-stage";
          figure.innerHTML = renderCharacter(appearance, `profile-${card.card_id}`);
          article.append(figure);
        }
        const body = document.createElement("div");
        body.className = "card-body";
        body.append(
          Object.assign(document.createElement("h3"), { textContent: String(card.name) }),
          Object.assign(document.createElement("p"), { textContent: `${card.rarity} · fictional overall ${card.overall}` }),
        );
        article.append(body);
        list.append(article);
      }
    }
    result.append(list);
  })();
}
