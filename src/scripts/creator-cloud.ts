import { appearanceFromRecord, authErrorMessage, keptAfterImport, LOCAL_DRAFT_KEY, planDraftImport } from "../lib/community";
import { createCommunityClient } from "../lib/supabase-browser";
import { applyToForm, snapshotFromForm } from "./creator";

interface LocalDraft {
  localId: string;
  name: string;
  creator: string;
  year: number;
  bio: string;
  abilities: { name: string; text: string }[];
  stats: { power: number; creativity: number; defense: number };
  appearance: Record<string, string>;
}

function readLocal(): LocalDraft[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_DRAFT_KEY) || "[]") as LocalDraft[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function mountCloudStudio(panel: HTMLElement, form: HTMLFormElement): void {
  const status = document.createElement("p");
  status.id = "cloud-status";
  panel.append(status);
  const client = createCommunityClient();
  if (!client) {
    status.textContent = "Cloud saving is off until a Supabase project is connected. Local drafts are unchanged.";
    return;
  }

  const actions = document.createElement("div");
  actions.className = "pager";
  const save = document.createElement("button");
  save.type = "button";
  save.className = "primary";
  save.textContent = "Save to my account";
  const importButton = document.createElement("button");
  importButton.type = "button";
  importButton.textContent = "Import local drafts";
  actions.append(save, importButton);
  panel.append(actions);

  let userId: string | null = null;
  const refresh = async () => {
    const { data } = await client.auth.getSession();
    userId = data.session?.user.id ?? null;
    if (!userId) {
      status.textContent = "Sign in to save this character to your account. The local draft button still keeps a copy on this browser.";
      save.disabled = true;
      importButton.disabled = true;
      return;
    }
    const { data: profile } = await client.from("profiles").select("username").eq("user_id", userId).maybeSingle();
    if (!profile) {
      status.textContent = "Claim a username before saving characters to the account.";
      save.disabled = true;
      importButton.disabled = true;
      return;
    }
    save.disabled = false;
    importButton.disabled = false;
    const count = readLocal().length;
    status.textContent = count > 0
      ? `Signed in as ${profile.username}. ${count} local draft${count === 1 ? "" : "s"} can be imported. Local copies stay until you remove them.`
      : `Signed in as ${profile.username}. A cloud save stores the character data, not a PNG.`;
  };

  save.addEventListener("click", async () => {
    if (!userId) return;
    const snapshot = snapshotFromForm(form);
    if (!snapshot) {
      status.textContent = "Enter whole-number stats from 0 to 100 before saving to the account.";
      return;
    }
    const payload = {
      creator_id: userId,
      name: snapshot.name,
      biography: snapshot.bio,
      appearance: snapshot.appearance,
      abilities: snapshot.abilities,
      statistics: snapshot.stats,
      card_year: snapshot.year,
    };
    const editing = form.dataset.cloudId;
    status.textContent = "Saving to the account…";
    const result = editing
      ? await client.from("characters").update(payload).eq("id", editing).select("id").maybeSingle()
      : await client.from("characters").insert(payload).select("id").maybeSingle();
    if (result.error || !result.data) {
      status.textContent = result.error ? authErrorMessage(result.error.message) : "The account did not confirm the save. The local draft was not removed.";
      return;
    }
    form.dataset.cloudId = result.data.id;
    status.textContent = "Saved in your account. The local draft, if you made one, is still on this browser. This did not publish the card.";
  });

  importButton.addEventListener("click", async () => {
    if (!userId) return;
    const local = readLocal();
    const { data: remote, error } = await client.from("characters").select("local_id");
    const { count } = await client.from("characters").select("id", { count: "exact", head: true });
    if (error) {
      status.textContent = authErrorMessage(error.message);
      return;
    }
    const plan = planDraftImport(local, (remote ?? []).map((row) => String(row.local_id || "")).filter(Boolean), count ?? 0);
    if (plan.ready.length === 0) {
      status.textContent = `Nothing new to import. ${plan.alreadyStored.length} already stored, ${plan.invalid.length} skipped, ${plan.heldForQuota.length} over the storage limit. Local drafts were kept.`;
      return;
    }
    const imported: string[] = [];
    for (const item of plan.ready) {
      const { error: insertError } = await client.from("characters").insert({
        creator_id: userId,
        name: item.name,
        biography: item.biography,
        appearance: item.appearance,
        abilities: item.abilities,
        statistics: item.statistics,
        card_year: item.card_year,
        local_id: item.local_id,
      });
      if (insertError) {
        status.textContent = `${authErrorMessage(insertError.message)} Local drafts were kept.`;
        return;
      }
      if (item.local_id) imported.push(item.local_id);
    }
    status.textContent = `Imported ${imported.length} characters. Local copies are still here.`;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove imported local copies";
    remove.addEventListener("click", () => {
      const remaining = keptAfterImport(readLocal(), imported);
      localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(remaining));
      status.textContent = "Imported local copies were removed. Characters that failed or were not imported are still on this browser.";
      remove.remove();
    });
    panel.append(remove);
  });

  const edit = new URLSearchParams(window.location.search).get("edit");
  void (async () => {
    await refresh();
    if (!edit || !/^[0-9a-f-]{36}$/i.test(edit) || !userId) return;
    const { data, error } = await client.from("characters").select("id, name, biography, appearance, abilities, statistics, card_year").eq("id", edit).maybeSingle();
    if (error || !data) {
      status.textContent = error ? authErrorMessage(error.message) : "That character is not in this account.";
      return;
    }
    const creatorField = form.elements.namedItem("creator");
    const appearance = appearanceFromRecord(data.appearance);
    const statistics = data.statistics as { power?: unknown; creativity?: unknown; defense?: unknown };
    if (!appearance || typeof statistics.power !== "number") {
      status.textContent = "The saved character could not be read back.";
      return;
    }
    applyToForm(form, {
      name: data.name,
      creator: creatorField instanceof HTMLInputElement ? creatorField.value : "",
      year: data.card_year,
      bio: data.biography,
      abilities: Array.isArray(data.abilities) ? data.abilities : [],
      stats: {
        power: Number(statistics.power),
        creativity: Number(statistics.creativity),
        defense: Number(statistics.defense),
      },
      appearance,
    });
    form.dataset.cloudId = data.id;
    status.textContent = "Loaded from your account. Saving updates that character. A local copy is not deleted.";
  })();
}
