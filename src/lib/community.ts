import {
  ACCENT_COLORS,
  ACCESSORIES,
  ARM_OPTIONS,
  BACKGROUNDS,
  CLOTH_COLORS,
  EXPRESSIONS,
  FINISHES,
  HAIR_OPTIONS,
  HAT_OPTIONS,
  HEAD_OPTIONS,
  HELMET_OPTIONS,
  LEG_OPTIONS,
  TORSO_OPTIONS,
  type Appearance,
} from "./character.ts";
import { RARITY_RULE_VERSION, rateCharacter, type CharacterStats, type Rarity } from "./rarity.ts";

export const LOCAL_DRAFT_KEY = "lego-archive.brick-legends.drafts.v1";
export const CHARACTER_QUOTA = 200;
export const GALLERY_PAGE_SIZE = 12;

const RESERVED_USERNAMES = new Set([
  "archive-studio",
  "admin",
  "moderator",
  "support",
  "system",
  "lego",
  "api",
]);

export interface CommunityConfig {
  url: string;
  anonKey: string;
}

export interface AbilityInput {
  name: string;
  text: string;
}

export interface CloudCharacterInput {
  name: string;
  biography: string;
  appearance: Appearance;
  abilities: AbilityInput[];
  statistics: CharacterStats;
  card_year: number;
  local_id: string | null;
}

export interface StoredRarity {
  statistics: CharacterStats;
  overall: number;
  rarity: Rarity;
  ruleVersion: string;
}

export interface ImportPlan {
  ready: CloudCharacterInput[];
  alreadyStored: string[];
  invalid: string[];
  heldForQuota: string[];
}

const ids = (rows: readonly { id: string }[]) => new Set(rows.map((row) => row.id));
const FINISH_IDS = ids(FINISHES);
const CLOTH_IDS = ids(CLOTH_COLORS);
const ACCENT_IDS = ids(ACCENT_COLORS);

function oneOf<T extends string>(value: string, allowed: readonly { id: T }[]): value is T {
  return allowed.some((item) => item.id === value);
}

export function normalizeUsername(value: string): string | null {
  const username = value.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/.test(username)) return null;
  if (username.includes("--")) return null;
  if (RESERVED_USERNAMES.has(username)) return null;
  return username;
}

export function normalizeDisplayName(value: string): string | null {
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 1 || name.length > 64) return null;
  if (/[\u0000-\u001f<>]/.test(name)) return null;
  return name;
}

export function normalizeBiography(value: string): string | null {
  const text = value.replace(/\r\n/g, "\n").trim();
  if (text.length > 600) return null;
  return text;
}

export function creatorShareQuery(username: string): string {
  return `brick-legends/creators/?u=${encodeURIComponent(username)}`;
}

export function tokenRole(token: string): string | null {
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const padded = part.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (part.length % 4)) % 4);
    const json = JSON.parse(globalThis.atob(padded)) as { role?: unknown };
    return typeof json.role === "string" ? json.role : null;
  } catch {
    return null;
  }
}

export function readCommunityConfig(env: { url?: string; anonKey?: string }): CommunityConfig | null {
  const url = env.url?.trim().replace(/\/$/, "") ?? "";
  const anonKey = env.anonKey?.trim() ?? "";
  if (!url || !anonKey) return null;
  const local = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(url);
  const hosted = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url);
  if (!local && !hosted) return null;
  if (anonKey.length < 20) return null;
  if (/^sb_secret_/i.test(anonKey)) return null;
  const role = tokenRole(anonKey);
  if (role === "service_role" || role === "supabase_admin") return null;
  return { url, anonKey };
}

export function appearanceFromRecord(value: unknown): Appearance | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const text = (key: string) => (typeof row[key] === "string" ? row[key] : "");
  const appearance = {
    finish: text("finish"),
    head: text("head"),
    expression: text("expression"),
    hair: text("hair"),
    hat: text("hat"),
    helmet: text("helmet"),
    torso: text("torso"),
    torsoColor: text("torsoColor"),
    arms: text("arms"),
    armColor: text("armColor"),
    legs: text("legs"),
    legColor: text("legColor"),
    accessory: text("accessory"),
    accent: text("accent"),
    background: text("background"),
  };
  if (!FINISH_IDS.has(appearance.finish)) return null;
  if (!oneOf(appearance.head, HEAD_OPTIONS)) return null;
  if (!oneOf(appearance.expression, EXPRESSIONS)) return null;
  if (!oneOf(appearance.hair, HAIR_OPTIONS)) return null;
  if (!oneOf(appearance.hat, HAT_OPTIONS)) return null;
  if (!oneOf(appearance.helmet, HELMET_OPTIONS)) return null;
  if (!oneOf(appearance.torso, TORSO_OPTIONS)) return null;
  if (!CLOTH_IDS.has(appearance.torsoColor) || !CLOTH_IDS.has(appearance.armColor) || !CLOTH_IDS.has(appearance.legColor)) return null;
  if (!oneOf(appearance.arms, ARM_OPTIONS)) return null;
  if (!oneOf(appearance.legs, LEG_OPTIONS)) return null;
  if (!oneOf(appearance.accessory, ACCESSORIES)) return null;
  if (!ACCENT_IDS.has(appearance.accent)) return null;
  if (!oneOf(appearance.background, BACKGROUNDS)) return null;
  return appearance;
}

export function abilitiesFromRecord(value: unknown): AbilityInput[] | null {
  if (!Array.isArray(value) || value.length > 3) return null;
  const abilities: AbilityInput[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const name = "name" in item && typeof item.name === "string" ? item.name.trim() : "";
    const text = "text" in item && typeof item.text === "string" ? item.text.trim() : "";
    if (name.length > 40 || text.length > 160) return null;
    if (!name && !text) continue;
    abilities.push({ name, text });
  }
  return abilities;
}

export function statisticsFromRecord(value: unknown): CharacterStats | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const stats = {
    power: Number(row.power),
    creativity: Number(row.creativity),
    defense: Number(row.defense),
  };
  return rateCharacter(stats) ? stats : null;
}

function sameStats(left: CharacterStats, right: CharacterStats): boolean {
  return left.power === right.power && left.creativity === right.creativity && left.defense === right.defense;
}

export function nextStoredRarity(previous: StoredRarity | null, statistics: CharacterStats): StoredRarity | null {
  const rated = rateCharacter(statistics);
  if (!rated) return null;
  if (previous && sameStats(previous.statistics, statistics)) {
    return {
      statistics,
      overall: previous.overall,
      rarity: previous.rarity,
      ruleVersion: previous.ruleVersion,
    };
  }
  return { statistics, overall: rated.overall, rarity: rated.rarity, ruleVersion: RARITY_RULE_VERSION };
}

export function isPublicGalleryCard(row: { visibility?: string; moderation_status?: string; status?: string }): boolean {
  if (row.status != null) return row.status === "published";
  return row.visibility === "public" && row.moderation_status === "approved";
}

export function authErrorMessage(message: string): string {
  if (/invalid login credentials/i.test(message)) return "That email and password did not match.";
  if (/email not confirmed/i.test(message)) return "Confirm your email before signing in. The verification message is sent by the account service.";
  if (/user already registered/i.test(message)) return "An account with that email already exists. Sign in, or reset the password.";
  if (/password/i.test(message) && /weak|short|at least/i.test(message)) return "Use a password of at least 8 characters.";
  if (/rate limit|too many/i.test(message)) return "Too many attempts. Wait a moment and try again.";
  if (/provider is not enabled|unsupported provider/i.test(message)) return "That sign-in provider is not enabled in the Supabase project yet.";
  if (message.length > 180 || /bearer|service_role|secret/i.test(message)) return "The account service rejected the request.";
  return message;
}

interface LooseDraft {
  localId?: unknown;
  name?: unknown;
  bio?: unknown;
  year?: unknown;
  abilities?: unknown;
  stats?: unknown;
  appearance?: unknown;
}

export function planDraftImport(drafts: unknown[], remoteLocalIds: readonly string[], remoteCount: number): ImportPlan {
  const seen = new Set(remoteLocalIds);
  const plan: ImportPlan = { ready: [], alreadyStored: [], invalid: [], heldForQuota: [] };
  let room = Math.max(0, CHARACTER_QUOTA - remoteCount);
  if (!Array.isArray(drafts)) return plan;
  for (const item of drafts) {
    const draft = item as LooseDraft;
    const localId = typeof draft?.localId === "string" ? draft.localId : "";
    const label = localId || "untitled draft";
    if (localId && seen.has(localId)) {
      if (!plan.alreadyStored.includes(localId)) plan.alreadyStored.push(localId);
      continue;
    }
    const name = typeof draft?.name === "string" ? draft.name.trim() : "";
    const biography = typeof draft?.bio === "string" ? normalizeBiography(draft.bio) : null;
    const appearance = appearanceFromRecord(draft?.appearance);
    const abilities = abilitiesFromRecord(draft?.abilities ?? []);
    const statistics = statisticsFromRecord(draft?.stats);
    const year = Number(draft?.year);
    const localOk = /^BL-DRAFT-[a-z0-9-]{4,40}$/.test(localId);
    if (!name || name.length > 64 || biography == null || !appearance || !abilities || !statistics || !Number.isInteger(year) || year < 2026 || year > 2100 || !localOk) {
      plan.invalid.push(label);
      continue;
    }
    if (room <= 0) {
      plan.heldForQuota.push(localId);
      continue;
    }
    room -= 1;
    seen.add(localId);
    plan.ready.push({
      name,
      biography,
      appearance,
      abilities,
      statistics,
      card_year: year,
      local_id: localId,
    });
  }
  return plan;
}

export function keptAfterImport(drafts: { localId: string }[], importedIds: readonly string[]): { localId: string }[] {
  const done = new Set(importedIds);
  return drafts.filter((draft) => !done.has(draft.localId));
}
