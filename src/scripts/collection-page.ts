import { authErrorMessage } from "../lib/community";
import { createCommunityClient } from "../lib/supabase-browser";

interface OwnCharacter {
  id: string;
  name: string;
  rarity: string;
  overall: number;
  rarity_rule_version: string;
  moderation_status: string;
  visibility: string;
  created_at: string;
}

export function mountCollection(root: HTMLElement): void {
  const status = root.querySelector("#collection-status");
  const mine = root.querySelector("#my-characters");
  const published = root.querySelector("#my-published");
  const favorites = root.querySelector("#my-favorites");
  const awards = root.querySelector("#my-awards");
  if (!(status instanceof HTMLElement) || !(mine instanceof HTMLElement) || !(published instanceof HTMLElement) || !(favorites instanceof HTMLElement) || !(awards instanceof HTMLElement)) return;
  const createUrl = root.dataset.createUrl || "brick-legends/create/";
  const client = createCommunityClient();
  favorites.textContent = "Favorites are stored only for a published card. No published cards exist, and this page does not invent bookmarks.";
  awards.textContent = "No awards are recorded. This page cannot grant one.";
  if (!client) {
    status.textContent = "Accounts are not connected. Characters saved in this browser stay in the creator.";
    mine.textContent = "Sign-in is unavailable until Supabase is configured.";
    published.textContent = "Publication review is closed.";
    return;
  }

  const render = async () => {
    status.textContent = "Loading your library…";
    const { data } = await client.auth.getSession();
    if (!data.session) {
      status.textContent = "Sign in to see characters saved to your account.";
      mine.textContent = "No account session on this browser.";
      published.textContent = "Publication review is closed.";
      return;
    }
    const { data: rows, error } = await client.from("characters").select("id, name, rarity, overall, rarity_rule_version, moderation_status, visibility, created_at").order("created_at", { ascending: false });
    if (error) {
      status.textContent = authErrorMessage(error.message);
      return;
    }
    const characters = (rows ?? []) as OwnCharacter[];
    status.textContent = `${characters.length.toLocaleString("en-US")} saved characters. These are private unless a moderator later approves one.`;
    mine.replaceChildren();
    if (characters.length === 0) {
      mine.textContent = "No cloud characters yet. Save one from the creator. Local drafts are not copied until you import them.";
    }
    for (const character of characters) {
      const row = document.createElement("p");
      const edit = document.createElement("a");
      edit.href = `${createUrl}?edit=${character.id}`;
      edit.textContent = character.name;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Delete";
      remove.addEventListener("click", async () => {
        if (!window.confirm(`Delete ${character.name} from your account?`)) return;
        const { error: deleteError } = await client.from("characters").delete().eq("id", character.id);
        status.textContent = deleteError ? authErrorMessage(deleteError.message) : `${character.name} was deleted from the account.`;
        if (!deleteError) await render();
      });
      row.append(
        edit,
        document.createTextNode(` · ${character.rarity} · fictional overall ${character.overall} · ${character.rarity_rule_version} · ${character.visibility} · ${character.moderation_status} `),
        remove,
      );
      mine.append(row);
    }
    const approved = characters.filter((character) => character.moderation_status === "approved" && character.visibility === "public");
    published.textContent = approved.length === 0
      ? "No approved cards. Submitting for review is closed, and a draft cannot mark itself published."
      : approved.map((character) => character.name).join(", ");
    const { data: awardRows } = await client.from("awards").select("kind, season_year, note").eq("profile_id", data.session.user.id);
    awards.textContent = !awardRows || awardRows.length === 0
      ? "No awards are recorded. This page cannot grant one."
      : awardRows.map((award) => `${award.kind} ${award.season_year ?? ""}`.trim()).join(", ");
  };

  void render();
}
