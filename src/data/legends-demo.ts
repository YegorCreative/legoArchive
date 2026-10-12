import {
  DEFAULT_APPEARANCE,
  type Appearance,
} from "../lib/character.ts";
import { RARITY_RULE_VERSION, rateCharacter, type CharacterStats, type Rarity } from "../lib/rarity.ts";

export interface DemoCharacter {
  id: string;
  name: string;
  creator: string;
  year: number;
  bio: string;
  abilities: { name: string; text: string }[];
  stats: CharacterStats;
  overall: number;
  rarity: Rarity;
  ruleVersion: string;
  appearance: Appearance;
  publication: "demonstration";
  annualFive: boolean;
  edition: string | null;
}

function demo(
  entry: Omit<DemoCharacter, "overall" | "rarity" | "ruleVersion" | "publication">,
): DemoCharacter {
  const rated = rateCharacter(entry.stats);
  if (!rated) throw new Error(`Invalid demo stats for ${entry.name}`);
  return {
    ...entry,
    overall: rated.overall,
    rarity: rated.rarity,
    ruleVersion: RARITY_RULE_VERSION,
    publication: "demonstration",
  };
}

const look = (patch: Partial<Appearance>): Appearance => ({ ...DEFAULT_APPEARANCE, ...patch });

/** Fictional layout samples. These are not community submissions or award winners. */
export const DEMO_CHARACTERS: DemoCharacter[] = [
  demo({
    id: "DEMO-2027-001",
    name: "Captain Brickstorm",
    creator: "Archive Studio",
    year: 2027,
    edition: "2027-001",
    annualFive: true,
    bio: "A fictional harbor pilot who charts storms with a lantern and a paper map. Created only to show the card layout.",
    abilities: [
      { name: "Lantern beam", text: "Lights a path across the card's night background." },
      { name: "Steady keel", text: "Holds the pose when the card is flipped." },
    ],
    stats: { power: 90, creativity: 96, defense: 80 },
    appearance: look({
      finish: "amber",
      expression: "focus",
      hair: "sweep",
      helmet: "pilot",
      torso: "jacket",
      torsoColor: "navy",
      arms: "guards",
      armColor: "navy",
      legs: "boots",
      legColor: "coal",
      accessory: "cape",
      accent: "gold",
      background: "night",
    }),
  }),
  demo({
    id: "DEMO-2027-002",
    name: "Lumen Quill",
    creator: "Archive Studio",
    year: 2027,
    edition: "2027-002",
    annualFive: true,
    bio: "A fictional archivist who writes in light. The quill is a design prop, not a licensed character.",
    abilities: [{ name: "Margin note", text: "Leaves a gold line on the card border." }],
    stats: { power: 70, creativity: 99, defense: 60 },
    appearance: look({
      finish: "porcelain",
      expression: "calm",
      hair: "long",
      hat: "brim",
      helmet: "none",
      torso: "coat",
      torsoColor: "plum",
      arms: "sleeves",
      armColor: "plum",
      legs: "wrapped",
      legColor: "sand",
      accessory: "staff",
      accent: "gold",
      background: "paper",
    }),
  }),
  demo({
    id: "DEMO-2027-003",
    name: "Harbor Knox",
    creator: "Archive Studio",
    year: 2027,
    edition: "2027-003",
    annualFive: true,
    bio: "A fictional dock guardian built from simple blocks. No auction and no physical card exists.",
    abilities: [{ name: "Lock gate", text: "A shield pose for the card front." }],
    stats: { power: 88, creativity: 72, defense: 90 },
    appearance: look({
      finish: "walnut",
      expression: "focus",
      hair: "crop",
      helmet: "knight",
      torso: "armor",
      torsoColor: "forest",
      arms: "guards",
      armColor: "forest",
      legs: "boots",
      legColor: "coal",
      accessory: "shield",
      accent: "copper",
      background: "desert",
    }),
  }),
  demo({
    id: "DEMO-2027-004",
    name: "Moss Vesper",
    creator: "Archive Studio",
    year: 2027,
    edition: "2027-004",
    annualFive: true,
    bio: "A fictional gardener of rooftop courtyards. Included so the uncommon band is visible in the layout.",
    abilities: [{ name: "Vine step", text: "A wrapped-leg silhouette." }],
    stats: { power: 40, creativity: 62, defense: 48 },
    appearance: look({
      finish: "clay",
      expression: "smile",
      hair: "spikes",
      hat: "cap",
      helmet: "none",
      torso: "tunic",
      torsoColor: "forest",
      arms: "plain",
      armColor: "clay",
      legs: "wrapped",
      legColor: "forest",
      accessory: "satchel",
      accent: "copper",
      background: "aurora",
    }),
  }),
  demo({
    id: "DEMO-2027-005",
    name: "Ivo Circuit",
    creator: "Archive Studio",
    year: 2027,
    edition: "2027-005",
    annualFive: true,
    bio: "A fictional signal keeper. The rare band comes from the published score formula, not from a random draw.",
    abilities: [{ name: "Signal", text: "A copper accent on a coal coat." }],
    stats: { power: 55, creativity: 58, defense: 52 },
    appearance: look({
      finish: "stone",
      expression: "wink",
      hair: "none",
      helmet: "dome",
      torso: "jacket",
      torsoColor: "coal",
      arms: "sleeves",
      armColor: "coal",
      legs: "straight",
      legColor: "navy",
      accessory: "none",
      accent: "ice",
      background: "field",
    }),
  }),
  demo({
    id: "DEMO-LAYOUT-006",
    name: "Nia Pebble",
    creator: "Archive Studio",
    year: 2027,
    edition: null,
    annualFive: false,
    bio: "A fictional common-band example for the rarity scale. Not nominated for anything.",
    abilities: [{ name: "Skip stone", text: "A small studio-paper portrait." }],
    stats: { power: 20, creativity: 30, defense: 25 },
    appearance: look({
      finish: "porcelain",
      expression: "smile",
      hair: "crop",
      hat: "none",
      helmet: "none",
      torso: "tunic",
      torsoColor: "sand",
      arms: "plain",
      armColor: "porcelain",
      legs: "straight",
      legColor: "sand",
      accessory: "none",
      accent: "copper",
      background: "paper",
    }),
  }),
  demo({
    id: "DEMO-LAYOUT-007",
    name: "Sol Arch",
    creator: "Archive Studio",
    year: 2027,
    edition: null,
    annualFive: false,
    bio: "A fictional mythic-band example. This score is creator-assigned math, not a community ranking.",
    abilities: [{ name: "Arch light", text: "Shows the top rarity frame." }],
    stats: { power: 98, creativity: 100, defense: 96 },
    appearance: look({
      finish: "amber",
      head: "wide",
      expression: "surprise",
      hair: "long",
      hat: "crown",
      helmet: "none",
      torso: "armor",
      torsoColor: "gold",
      arms: "guards",
      armColor: "gold",
      legs: "boots",
      legColor: "crimson",
      accessory: "cape",
      accent: "gold",
      background: "aurora",
    }),
  }),
];

export const ANNUAL_FIVE = DEMO_CHARACTERS.filter((character) => character.annualFive);
