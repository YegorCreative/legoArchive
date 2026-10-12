export interface Appearance {
  finish: string;
  head: "block" | "rounded" | "wide";
  expression: "smile" | "focus" | "wink" | "surprise" | "calm";
  hair: "none" | "crop" | "sweep" | "long" | "spikes";
  hat: "none" | "cap" | "crown" | "brim";
  helmet: "none" | "dome" | "knight" | "pilot";
  torso: "tunic" | "jacket" | "armor" | "coat" | "vest";
  torsoColor: string;
  arms: "plain" | "sleeves" | "guards";
  armColor: string;
  legs: "straight" | "boots" | "wrapped";
  legColor: string;
  accessory: "none" | "cape" | "shield" | "staff" | "satchel" | "lantern";
  accent: string;
  background: "paper" | "night" | "desert" | "aurora" | "field" | "harbor";
}

export interface Swatch {
  id: string;
  label: string;
  value: string;
}

export const FINISHES: Swatch[] = [
  { id: "porcelain", label: "Porcelain", value: "#f3e2cf" },
  { id: "amber", label: "Amber", value: "#e2a45a" },
  { id: "clay", label: "Clay", value: "#c4846c" },
  { id: "walnut", label: "Walnut", value: "#694033" },
  { id: "stone", label: "Stone", value: "#c8c2b8" },
  { id: "ink", label: "Ink", value: "#2b313a" },
];

export const CLOTH_COLORS: Swatch[] = [
  { id: "crimson", label: "Crimson", value: "#9d2c38" },
  { id: "navy", label: "Navy", value: "#243656" },
  { id: "forest", label: "Forest", value: "#2d5b45" },
  { id: "gold", label: "Gold", value: "#c6a15a" },
  { id: "plum", label: "Plum", value: "#70456a" },
  { id: "sand", label: "Sand", value: "#d9c7a4" },
  { id: "coal", label: "Coal", value: "#2c2a28" },
  { id: "ivory", label: "Ivory", value: "#f4f0e6" },
];

export const ACCENT_COLORS: Swatch[] = [
  { id: "gold", label: "Gold", value: "#e4c27a" },
  { id: "copper", label: "Copper", value: "#b8734a" },
  { id: "ice", label: "Ice", value: "#d5e4ea" },
  { id: "signal", label: "Signal red", value: "#c4372f" },
];

export const HEAD_OPTIONS = [
  { id: "block", label: "Block" },
  { id: "rounded", label: "Rounded" },
  { id: "wide", label: "Wide" },
] as const;

export const EXPRESSIONS = [
  { id: "smile", label: "Smile" },
  { id: "focus", label: "Focus" },
  { id: "wink", label: "Wink" },
  { id: "surprise", label: "Surprise" },
  { id: "calm", label: "Calm" },
] as const;

export const HAIR_OPTIONS = [
  { id: "none", label: "None" },
  { id: "crop", label: "Crop" },
  { id: "sweep", label: "Sweep" },
  { id: "long", label: "Long" },
  { id: "spikes", label: "Spikes" },
] as const;

export const HAT_OPTIONS = [
  { id: "none", label: "None" },
  { id: "cap", label: "Cap" },
  { id: "crown", label: "Crown" },
  { id: "brim", label: "Wide brim" },
] as const;

export const HELMET_OPTIONS = [
  { id: "none", label: "None" },
  { id: "dome", label: "Dome" },
  { id: "knight", label: "Knight" },
  { id: "pilot", label: "Pilot" },
] as const;

export const TORSO_OPTIONS = [
  { id: "tunic", label: "Tunic" },
  { id: "jacket", label: "Jacket" },
  { id: "armor", label: "Armor" },
  { id: "coat", label: "Coat" },
  { id: "vest", label: "Vest" },
] as const;

export const ARM_OPTIONS = [
  { id: "plain", label: "Plain" },
  { id: "sleeves", label: "Sleeves" },
  { id: "guards", label: "Guards" },
] as const;

export const LEG_OPTIONS = [
  { id: "straight", label: "Straight" },
  { id: "boots", label: "Boots" },
  { id: "wrapped", label: "Wrapped" },
] as const;

export const ACCESSORIES = [
  { id: "none", label: "None" },
  { id: "cape", label: "Cape" },
  { id: "shield", label: "Shield" },
  { id: "staff", label: "Staff" },
  { id: "satchel", label: "Satchel" },
  { id: "lantern", label: "Lantern" },
] as const;

export const BACKGROUNDS = [
  { id: "paper", label: "Studio paper" },
  { id: "night", label: "Night" },
  { id: "desert", label: "Desert" },
  { id: "aurora", label: "Aurora" },
  { id: "field", label: "Star field" },
  { id: "harbor", label: "Harbor" },
] as const;

export const DEFAULT_APPEARANCE: Appearance = {
  finish: "porcelain",
  head: "rounded",
  expression: "smile",
  hair: "sweep",
  hat: "none",
  helmet: "none",
  torso: "jacket",
  torsoColor: "navy",
  arms: "sleeves",
  armColor: "navy",
  legs: "boots",
  legColor: "coal",
  accessory: "cape",
  accent: "gold",
  background: "night",
};

export function swatch(list: Swatch[], id: string, fallback: string): string {
  return list.find((item) => item.id === id)?.value ?? fallback;
}
