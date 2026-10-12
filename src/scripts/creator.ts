import {
  ACCENT_COLORS,
  CLOTH_COLORS,
  DEFAULT_APPEARANCE,
  FINISHES,
  type Appearance,
} from "../lib/character";
import { renderCardBack, renderCardFront, svgToPng } from "../lib/character-svg";
import { RARITY_RULE_VERSION, rateCharacter, type Rarity } from "../lib/rarity";

const STORAGE_KEY = "lego-archive.brick-legends.drafts.v1";

interface Draft {
  localId: string;
  name: string;
  creator: string;
  year: number;
  bio: string;
  abilities: { name: string; text: string }[];
  stats: { power: number; creativity: number; defense: number };
  overall: number;
  rarity: Rarity;
  ruleVersion: string;
  appearance: Appearance;
  publication: "local-draft";
  savedAt: string;
}

function readAppearance(form: HTMLFormElement): Appearance {
  const data = new FormData(form);
  const value = (key: string, fallback: string) => String(data.get(key) || fallback);
  return {
    finish: value("finish", DEFAULT_APPEARANCE.finish),
    head: value("head", DEFAULT_APPEARANCE.head) as Appearance["head"],
    expression: value("expression", DEFAULT_APPEARANCE.expression) as Appearance["expression"],
    hair: value("hair", DEFAULT_APPEARANCE.hair) as Appearance["hair"],
    hat: value("hat", DEFAULT_APPEARANCE.hat) as Appearance["hat"],
    helmet: value("helmet", DEFAULT_APPEARANCE.helmet) as Appearance["helmet"],
    torso: value("torso", DEFAULT_APPEARANCE.torso) as Appearance["torso"],
    torsoColor: value("torsoColor", DEFAULT_APPEARANCE.torsoColor),
    arms: value("arms", DEFAULT_APPEARANCE.arms) as Appearance["arms"],
    armColor: value("armColor", DEFAULT_APPEARANCE.armColor),
    legs: value("legs", DEFAULT_APPEARANCE.legs) as Appearance["legs"],
    legColor: value("legColor", DEFAULT_APPEARANCE.legColor),
    accessory: value("accessory", DEFAULT_APPEARANCE.accessory) as Appearance["accessory"],
    accent: value("accent", DEFAULT_APPEARANCE.accent),
    background: value("background", DEFAULT_APPEARANCE.background) as Appearance["background"],
  };
}

function readStats(form: HTMLFormElement): { power: number; creativity: number; defense: number } {
  const data = new FormData(form);
  const num = (key: string) => Number(data.get(key));
  return { power: num("power"), creativity: num("creativity"), defense: num("defense") };
}

function loadDrafts(): Draft[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as Draft[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function cardCopy(form: HTMLFormElement, rarity: Rarity, overall: number) {
  const data = new FormData(form);
  const abilities = [1, 2, 3].map((index) => ({
    name: String(data.get(`abilityName${index}`) || "").trim(),
    text: String(data.get(`abilityText${index}`) || "").trim(),
  })).filter((ability) => ability.name || ability.text);
  return {
    idLabel: "LOCAL DRAFT",
    name: String(data.get("name") || "Untitled").slice(0, 64),
    creator: String(data.get("creator") || "Anonymous").slice(0, 64),
    year: Number(data.get("cardYear") || new Date().getFullYear()),
    rarity,
    overall,
    power: Number(data.get("power")),
    creativity: Number(data.get("creativity")),
    defense: Number(data.get("defense")),
    bio: String(data.get("bio") || "").slice(0, 600),
    abilities,
    banner: "NOT PUBLISHED · LOCAL DRAFT · NOT A LEGO PRODUCT",
  };
}

async function download(svg: string, filename: string): Promise<void> {
  const png = await svgToPng(svg);
  const url = URL.createObjectURL(png);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function mountCreator(root: HTMLElement): void {
  const form = root.querySelector("form");
  const front = root.querySelector("#card-front");
  const back = root.querySelector("#card-back");
  const readout = root.querySelector("#rarity-readout");
  const drafts = root.querySelector("#drafts");
  if (!(form instanceof HTMLFormElement) || !(front instanceof HTMLElement) || !(back instanceof HTMLElement) || !(readout instanceof HTMLElement) || !(drafts instanceof HTMLElement)) return;

  const paint = () => {
    const appearance = readAppearance(form);
    const rated = rateCharacter(readStats(form));
    if (!rated) {
      readout.textContent = "Enter whole-number stats from 0 to 100. Rarity is withheld until they are valid.";
      return;
    }
    const copy = cardCopy(form, rated.rarity, rated.overall);
    front.innerHTML = renderCardFront(appearance, copy, "live");
    back.innerHTML = renderCardBack(copy, "live-back");
    readout.textContent = `Fictional overall ${rated.overall}. Rarity ${rated.rarity} under ${RARITY_RULE_VERSION}. Creativity is weighted ${40}%, power ${34}%, defense ${26}%. This is not a community rank.`;
    root.dataset.rarity = rated.rarity;
  };

  const listDrafts = () => {
    const saved = loadDrafts();
    drafts.replaceChildren();
    if (saved.length === 0) {
      drafts.append("No drafts on this browser yet.");
      return;
    }
    for (const draft of saved) {
      const row = document.createElement("p");
      const load = document.createElement("button");
      load.type = "button";
      load.textContent = `Load ${draft.name}`;
      load.addEventListener("click", () => {
        const assign = (name: string, value: string) => {
          const field = form.elements.namedItem(name);
          if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) field.value = value;
          if (field instanceof RadioNodeList) {
            for (const item of field) {
              if (item instanceof HTMLInputElement) item.checked = item.value === value;
            }
          }
        };
        assign("name", draft.name);
        assign("creator", draft.creator);
        assign("cardYear", String(draft.year));
        assign("bio", draft.bio);
        for (let index = 1; index <= 3; index += 1) {
          const ability = draft.abilities[index - 1];
          assign(`abilityName${index}`, ability?.name ?? "");
          assign(`abilityText${index}`, ability?.text ?? "");
        }
        assign("power", String(draft.stats.power));
        assign("creativity", String(draft.stats.creativity));
        assign("defense", String(draft.stats.defense));
        for (const [key, value] of Object.entries(draft.appearance)) assign(key, value);
        paint();
      });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Delete";
      remove.addEventListener("click", () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loadDrafts().filter((item) => item.localId !== draft.localId)));
        listDrafts();
      });
      row.append(load, document.createTextNode(` ${draft.localId} · ${draft.rarity} · ${draft.overall} · saved only in this browser `), remove);
      drafts.append(row);
    }
  };

  form.addEventListener("input", paint);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const rated = rateCharacter(readStats(form));
    if (!rated) return;
    const data = new FormData(form);
    const draft: Draft = {
      localId: `BL-DRAFT-${Date.now().toString(36)}`,
      name: String(data.get("name") || "Untitled").slice(0, 64),
      creator: String(data.get("creator") || "Anonymous").slice(0, 64),
      year: Number(data.get("cardYear") || new Date().getFullYear()),
      bio: String(data.get("bio") || "").slice(0, 600),
      abilities: [1, 2, 3].map((index) => ({
        name: String(data.get(`abilityName${index}`) || "").trim(),
        text: String(data.get(`abilityText${index}`) || "").trim(),
      })).filter((ability) => ability.name || ability.text),
      stats: readStats(form),
      overall: rated.overall,
      rarity: rated.rarity,
      ruleVersion: RARITY_RULE_VERSION,
      appearance: readAppearance(form),
      publication: "local-draft",
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([draft, ...loadDrafts()].slice(0, 24)));
    listDrafts();
    readout.textContent = `Saved ${draft.localId} in this browser only. It is not published and has no public card number. ${readout.textContent}`;
  });

  root.querySelector("#download-front")?.addEventListener("click", async () => {
    const svg = front.querySelector("svg");
    if (!svg) return;
    await download(svg.outerHTML, "brick-legends-card-front.png");
  });
  root.querySelector("#download-back")?.addEventListener("click", async () => {
    const svg = back.querySelector("svg");
    if (!svg) return;
    await download(svg.outerHTML, "brick-legends-card-back.png");
  });

  paint();
  listDrafts();
}

export const CREATOR_SWATCHES = { FINISHES, CLOTH_COLORS, ACCENT_COLORS };
