import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { DEFAULT_APPEARANCE } from "../src/lib/character.ts";
import {
  CHARACTER_QUOTA,
  creatorShareQuery,
  isPublicGalleryCard,
  keptAfterImport,
  nextStoredRarity,
  normalizeUsername,
  planDraftImport,
  readCommunityConfig,
  tokenRole,
} from "../src/lib/community.ts";
import { RARITY_RULE_VERSION } from "../src/lib/rarity.ts";

function jwt(role: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ role })).toString("base64url");
  return `${header}.${body}.signature`;
}

test("usernames are unique-safe and reserve the demonstration profile", () => {
  assert.equal(normalizeUsername("BrickMaster2027"), "brickmaster2027");
  assert.equal(normalizeUsername("ab"), null);
  assert.equal(normalizeUsername("bad--name"), null);
  assert.equal(normalizeUsername("archive-studio"), null);
  assert.equal(normalizeUsername("admin"), null);
  assert.match(creatorShareQuery("brickmaster2027"), /\?u=brickmaster2027$/);
});

test("community config rejects a service-role key and accepts an anon key", () => {
  assert.equal(readCommunityConfig({ url: "", anonKey: "" }), null);
  assert.equal(readCommunityConfig({ url: "https://example.com", anonKey: jwt("anon") }), null);
  assert.equal(readCommunityConfig({ url: "https://legoarchive.supabase.co", anonKey: jwt("service_role") }), null);
  assert.equal(readCommunityConfig({ url: "https://legoarchive.supabase.co", anonKey: "sb_secret_not_for_the_browser" }), null);
  const config = readCommunityConfig({ url: "https://legoarchive.supabase.co/", anonKey: jwt("anon") });
  assert.equal(config?.url, "https://legoarchive.supabase.co");
  assert.equal(tokenRole(jwt("anon")), "anon");
});

test("private and unapproved characters stay out of the gallery", () => {
  assert.equal(isPublicGalleryCard({ visibility: "private", moderation_status: "draft" }), false);
  assert.equal(isPublicGalleryCard({ visibility: "public", moderation_status: "submitted" }), false);
  assert.equal(isPublicGalleryCard({ visibility: "public", moderation_status: "approved" }), true);
  assert.equal(isPublicGalleryCard({ status: "published" }), true);
  assert.equal(isPublicGalleryCard({ status: "removed" }), false);
});

test("unchanged statistics keep the stored rarity rule", () => {
  const stats = { power: 90, creativity: 96, defense: 80 };
  const first = nextStoredRarity(null, stats);
  assert.ok(first);
  assert.equal(first?.ruleVersion, RARITY_RULE_VERSION);
  const kept = nextStoredRarity({ ...first, ruleVersion: "bl-rarity-0", rarity: "Common", overall: 1 }, stats);
  assert.equal(kept?.ruleVersion, "bl-rarity-0");
  assert.equal(kept?.rarity, "Common");
  const changed = nextStoredRarity(kept, { ...stats, power: 10 });
  assert.equal(changed?.ruleVersion, RARITY_RULE_VERSION);
  assert.notEqual(changed?.rarity, "Common");
});

test("local draft import skips duplicates and keeps failures local", () => {
  const draft = {
    localId: "BL-DRAFT-abcd",
    name: "Harbor Knight",
    bio: "A paper sailor.",
    year: 2027,
    abilities: [{ name: "Lantern", text: "Lights the dock." }],
    stats: { power: 40, creativity: 80, defense: 30 },
    appearance: DEFAULT_APPEARANCE,
  };
  const plan = planDraftImport([draft, draft, { localId: "nope" }], ["BL-DRAFT-abcd"], 0);
  assert.equal(plan.ready.length, 0);
  assert.deepEqual(plan.alreadyStored, ["BL-DRAFT-abcd"]);
  assert.equal(plan.invalid.length, 1);
  const fresh = planDraftImport([draft], [], CHARACTER_QUOTA);
  assert.equal(fresh.ready.length, 0);
  assert.deepEqual(fresh.heldForQuota, ["BL-DRAFT-abcd"]);
  const open = planDraftImport([draft], [], 0);
  assert.equal(open.ready.length, 1);
  assert.equal(open.ready[0]?.local_id, "BL-DRAFT-abcd");
  const local = [{ localId: "BL-DRAFT-abcd" }, { localId: "BL-DRAFT-zzzz" }];
  assert.deepEqual(keptAfterImport(local, ["BL-DRAFT-abcd"]).map((item) => item.localId), ["BL-DRAFT-zzzz"]);
});

test("migration locks user-data tables and does not open voting", () => {
  const sql = readFileSync(new URL("../supabase/migrations/202610110001_community.sql", import.meta.url), "utf8");
  for (const table of ["profiles", "characters", "published_cards", "favorites", "awards", "votes", "reports", "annual_five_seasons", "annual_five_entries", "commercial_consents", "moderators", "app_settings"]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
  }
  assert.match(sql, /publication_open boolean not null default false/);
  assert.match(sql, /voting_open boolean not null default false/);
  assert.equal(/on public\.votes for insert/.test(sql), false);
  assert.equal(/on public\.awards for insert/.test(sql), false);
  assert.equal(/on public\.published_cards for insert/.test(sql), false);
  assert.match(sql, /revoke all on table public\.votes from anon, authenticated/);
  assert.match(sql, /raise exception 'Publication is closed'/);
  assert.match(sql, /new\.rarity_rule_version := 'bl-rarity-1'/);
  assert.match(sql, /power \* 0\.34 \+ creativity \* 0\.40 \+ defense \* 0\.26/);
  assert.match(sql, /security_invoker = true/);
  assert.equal(sql.includes("service_role_key"), false);
});
