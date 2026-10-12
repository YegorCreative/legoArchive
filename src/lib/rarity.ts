/**
 * Brick Legends rarity rule bl-rarity-1.
 *
 * Rarity is a label for fictional, creator-assigned character statistics.
 * It is not a claim about how many copies exist, and it is not a community rank.
 * A saved card stores the rule version and the rarity produced at creation time
 * so a later rule does not rewrite old cards.
 */
export const RARITY_RULE_VERSION = "bl-rarity-1";

export const RARITY_LEVELS = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"] as const;
export type Rarity = (typeof RARITY_LEVELS)[number];

export interface CharacterStats {
  power: number;
  creativity: number;
  defense: number;
}

export const RARITY_WEIGHTS = {
  power: 0.34,
  creativity: 0.4,
  defense: 0.26,
} as const;

export function isStat(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 100;
}

export function overallScore(stats: CharacterStats): number | null {
  if (!isStat(stats.power) || !isStat(stats.creativity) || !isStat(stats.defense)) return null;
  const raw =
    stats.power * RARITY_WEIGHTS.power +
    stats.creativity * RARITY_WEIGHTS.creativity +
    stats.defense * RARITY_WEIGHTS.defense;
  return Math.round(raw);
}

export function rarityForOverall(overall: number): Rarity | null {
  if (!Number.isInteger(overall) || overall < 0 || overall > 100) return null;
  if (overall < 40) return "Common";
  if (overall < 55) return "Uncommon";
  if (overall < 70) return "Rare";
  if (overall < 83) return "Epic";
  if (overall < 94) return "Legendary";
  return "Mythic";
}

export function rateCharacter(stats: CharacterStats): { overall: number; rarity: Rarity } | null {
  const overall = overallScore(stats);
  if (overall == null) return null;
  const rarity = rarityForOverall(overall);
  if (rarity == null) return null;
  return { overall, rarity };
}

export const RARITY_BANDS: { rarity: Rarity; range: string }[] = [
  { rarity: "Common", range: "0–39" },
  { rarity: "Uncommon", range: "40–54" },
  { rarity: "Rare", range: "55–69" },
  { rarity: "Epic", range: "70–82" },
  { rarity: "Legendary", range: "83–93" },
  { rarity: "Mythic", range: "94–100" },
];
