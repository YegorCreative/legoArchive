import {
  ACCENT_COLORS,
  CLOTH_COLORS,
  FINISHES,
  swatch,
  type Appearance,
} from "./character.ts";
import type { Rarity } from "./rarity";

export interface CardCopy {
  idLabel: string;
  name: string;
  creator: string;
  year: number;
  rarity: Rarity;
  overall: number;
  power: number;
  creativity: number;
  defense: number;
  bio: string;
  abilities: { name: string; text: string }[];
  banner: string;
}

const RARITY_FRAME: Record<Rarity, string> = {
  Common: "#8d877c",
  Uncommon: "#3f7d55",
  Rare: "#2f6394",
  Epic: "#7a4d93",
  Legendary: "#b89045",
  Mythic: "#d7c4ff",
};

function esc(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function wrap(value: string, width: number, limit: number): string[] {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, limit);
}

function background(id: string, prefix: string): string {
  const key = `${prefix}-bg`;
  if (id === "night") {
    return `<linearGradient id="${key}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#141826"/><stop offset="1" stop-color="#3a2a38"/></linearGradient>`;
  }
  if (id === "desert") {
    return `<linearGradient id="${key}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0d2a4"/><stop offset="1" stop-color="#c47a4a"/></linearGradient>`;
  }
  if (id === "aurora") {
    return `<linearGradient id="${key}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#12343a"/><stop offset="0.5" stop-color="#3d6b62"/><stop offset="1" stop-color="#d7efe4"/></linearGradient>`;
  }
  if (id === "field") {
    return `<linearGradient id="${key}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1224"/><stop offset="1" stop-color="#1c2748"/></linearGradient>`;
  }
  return `<linearGradient id="${key}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7f1e6"/><stop offset="1" stop-color="#e4d3bc"/></linearGradient>`;
}

export function renderCharacter(appearance: Appearance, prefix = "fig"): string {
  const skin = swatch(FINISHES, appearance.finish, "#f3e2cf");
  const cloth = swatch(CLOTH_COLORS, appearance.torsoColor, "#243656");
  const sleeves = swatch(CLOTH_COLORS, appearance.armColor, cloth);
  const legs = swatch(CLOTH_COLORS, appearance.legColor, "#2c2a28");
  const accent = swatch(ACCENT_COLORS, appearance.accent, "#e4c27a");
  const headRx = appearance.head === "rounded" ? 48 : appearance.head === "wide" ? 28 : 18;
  const headW = appearance.head === "wide" ? 150 : 124;
  const headX = (300 - headW) / 2;
  const showHair = appearance.helmet === "none";
  const showHat = appearance.helmet === "none" && appearance.hat !== "none";
  const eye = skin === "#2b313a" ? "#f4efe6" : "#1c1915";
  const bg = `${prefix}-bg`;

  const face = faceMarkup(appearance.expression, eye, headX, headW);
  const hair = showHair ? hairMarkup(appearance.hair, cloth, headX, headW) : "";
  const hat = showHat ? hatMarkup(appearance.hat, accent, cloth) : "";
  const helmet = appearance.helmet === "none" ? "" : helmetMarkup(appearance.helmet, cloth, accent, skin);
  const torso = torsoMarkup(appearance.torso, cloth, accent, skin);
  const arms = armMarkup(appearance.arms, appearance.armColor === appearance.finish && appearance.arms === "plain" ? skin : sleeves, accent);
  const legMarkup = legsMarkup(appearance.legs, legs, accent);
  const accessory = accessoryMarkup(appearance.accessory, cloth, accent);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 420" role="img" aria-hidden="true">
    <defs>${background(appearance.background, prefix)}</defs>
    <rect width="300" height="420" rx="28" fill="url(#${bg})"/>
    ${appearance.background === "field" ? `<g fill="#f4efe6" opacity="0.8"><circle cx="40" cy="50" r="1.4"/><circle cx="250" cy="80" r="1.2"/><circle cx="70" cy="120" r="1"/><circle cx="220" cy="36" r="1.5"/><circle cx="180" cy="100" r="1"/></g>` : ""}
    ${appearance.accessory === "cape" ? `<path d="M92 168 C40 210 34 300 58 360 L96 360 C78 290 86 220 112 176 Z" fill="${cloth}" opacity="0.92"/><path d="M208 168 C260 210 266 300 242 360 L204 360 C222 290 214 220 188 176 Z" fill="${accent}" opacity="0.35"/>` : ""}
    <ellipse cx="150" cy="392" rx="70" ry="10" fill="#1c1915" opacity="0.18"/>
    ${legMarkup}
    ${torso}
    ${arms}
    ${accessory === "back" ? "" : accessory}
    <rect x="${headX}" y="48" width="${headW}" height="112" rx="${headRx}" fill="${skin}"/>
    <rect x="${headX + 10}" y="78" width="${headW - 20}" height="64" rx="18" fill="#fff" opacity="0.14"/>
    ${face}
    ${hair}
    ${hat}
    ${helmet}
  </svg>`;
}

function faceMarkup(expression: Appearance["expression"], eye: string, headX: number, headW: number): string {
  const left = headX + headW * 0.28;
  const right = headX + headW * 0.62;
  const y = 96;
  if (expression === "wink") {
    return `<circle cx="${left}" cy="${y}" r="6" fill="${eye}"/><path d="M${right - 8} ${y} H${right + 10}" stroke="${eye}" stroke-width="3" stroke-linecap="round"/><path d="M${left} 128 Q${headX + headW / 2} 142 ${right} 128" fill="none" stroke="${eye}" stroke-width="3" stroke-linecap="round"/>`;
  }
  if (expression === "surprise") {
    return `<circle cx="${left}" cy="${y}" r="8" fill="${eye}"/><circle cx="${right}" cy="${y}" r="8" fill="${eye}"/><circle cx="${headX + headW / 2}" cy="132" r="8" fill="none" stroke="${eye}" stroke-width="3"/>`;
  }
  if (expression === "focus") {
    return `<rect x="${left - 8}" y="${y - 3}" width="18" height="6" rx="3" fill="${eye}"/><rect x="${right - 8}" y="${y - 3}" width="18" height="6" rx="3" fill="${eye}"/><path d="M${left} 132 H${right}" stroke="${eye}" stroke-width="3" stroke-linecap="round"/>`;
  }
  if (expression === "calm") {
    return `<path d="M${left - 8} ${y} Q${left} ${y - 6} ${left + 10} ${y}" fill="none" stroke="${eye}" stroke-width="3" stroke-linecap="round"/><path d="M${right - 8} ${y} Q${right} ${y - 6} ${right + 10} ${y}" fill="none" stroke="${eye}" stroke-width="3" stroke-linecap="round"/><path d="M${left + 4} 130 Q${headX + headW / 2} 136 ${right - 2} 130" fill="none" stroke="${eye}" stroke-width="3" stroke-linecap="round"/>`;
  }
  return `<circle cx="${left}" cy="${y}" r="6" fill="${eye}"/><circle cx="${right}" cy="${y}" r="6" fill="${eye}"/><path d="M${left - 2} 126 Q${headX + headW / 2} 146 ${right + 4} 126" fill="none" stroke="${eye}" stroke-width="3" stroke-linecap="round"/>`;
}

function hairMarkup(hair: Appearance["hair"], color: string, headX: number, headW: number): string {
  if (hair === "none") return "";
  if (hair === "crop") return `<path d="M${headX + 8} 78 Q${headX + headW / 2} 36 ${headX + headW - 8} 78 L${headX + headW - 16} 70 Q${headX + headW / 2} 48 ${headX + 16} 70 Z" fill="${color}"/>`;
  if (hair === "sweep") return `<path d="M${headX - 6} 90 Q${headX + 20} 24 ${headX + headW + 16} 70 Q${headX + headW} 40 ${headX + 30} 58 Q${headX + 10} 70 ${headX - 6} 90 Z" fill="${color}"/>`;
  if (hair === "long") return `<path d="M${headX - 4} 70 Q${headX + headW / 2} 28 ${headX + headW + 4} 70 L${headX + headW + 8} 168 Q${headX + headW - 10} 150 ${headX + headW - 18} 80 L${headX + 18} 80 Q${headX + 8} 150 ${headX - 8} 168 Z" fill="${color}"/>`;
  return `<g fill="${color}"><polygon points="${headX + 20},70 ${headX + 34},28 ${headX + 48},68"/><polygon points="${headX + headW / 2 - 12},66 ${headX + headW / 2},18 ${headX + headW / 2 + 12},66"/><polygon points="${headX + headW - 48},68 ${headX + headW - 34},26 ${headX + headW - 20},70"/></g>`;
}

function hatMarkup(hat: Appearance["hat"], accent: string, cloth: string): string {
  if (hat === "cap") return `<path d="M78 70 Q150 18 214 78 L206 86 Q150 48 92 84 Z" fill="${cloth}"/><rect x="168" y="74" width="62" height="10" rx="5" fill="${accent}"/>`;
  if (hat === "crown") return `<path d="M92 78 L104 40 L128 70 L150 34 L172 70 L196 40 L210 78 Z" fill="${accent}"/>`;
  if (hat === "brim") return `<ellipse cx="150" cy="86" rx="92" ry="16" fill="${cloth}"/><path d="M104 84 Q150 36 196 84 Z" fill="${accent}"/>`;
  return "";
}

function helmetMarkup(helmet: Appearance["helmet"], cloth: string, accent: string, skin: string): string {
  if (helmet === "dome") {
    return `<path d="M78 108 Q78 40 150 36 Q222 40 222 108 L210 112 Q150 96 90 112 Z" fill="${cloth}"/><rect x="108" y="100" width="84" height="16" rx="8" fill="${accent}" opacity="0.85"/>`;
  }
  if (helmet === "knight") {
    return `<path d="M84 120 L96 42 H204 L216 120 L196 132 V108 H104 V132 Z" fill="${cloth}"/><rect x="116" y="78" width="68" height="18" fill="${skin}" opacity="0.35"/><path d="M146 96 V120" stroke="${accent}" stroke-width="3"/>`;
  }
  return `<path d="M80 112 Q86 42 150 38 Q214 42 220 112 L200 118 Q150 100 100 118 Z" fill="${cloth}"/><circle cx="86" cy="112" r="16" fill="${accent}"/><circle cx="214" cy="112" r="16" fill="${accent}"/><rect x="118" y="92" width="64" height="14" rx="7" fill="#101218"/>`;
}

function torsoMarkup(torso: Appearance["torso"], cloth: string, accent: string, skin: string): string {
  const hem = torso === "coat" ? 292 : 258;
  const body = `<path d="M108 168 H192 L206 ${hem} H94 Z" fill="${cloth}"/>`;
  if (torso === "jacket") return `${body}<path d="M150 176 V${hem - 8}" stroke="${accent}" stroke-width="3"/><path d="M122 176 L150 198 L178 176" fill="none" stroke="${skin}" stroke-width="3"/>`;
  if (torso === "armor") return `${body}<rect x="122" y="188" width="56" height="40" rx="8" fill="${accent}" opacity="0.9"/>`;
  if (torso === "coat") return `${body}<path d="M150 180 V${hem - 12}" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>`;
  return `${body}<path d="M128 176 L150 202 L172 176" fill="${accent}"/>`;
}

function armMarkup(style: Appearance["arms"], color: string, accent: string): string {
  const band = style === "guards" ? `<rect x="62" y="196" width="28" height="8" fill="${accent}"/><rect x="210" y="196" width="28" height="8" fill="${accent}"/>` : "";
  return `<rect x="62" y="174" width="34" height="92" rx="16" fill="${color}"/><rect x="204" y="174" width="34" height="92" rx="16" fill="${color}"/>${band}<rect x="66" y="252" width="26" height="22" rx="8" fill="#f3e2cf" opacity="0.85"/><rect x="208" y="252" width="26" height="22" rx="8" fill="#f3e2cf" opacity="0.85"/>`;
}

function legsMarkup(style: Appearance["legs"], color: string, accent: string): string {
  const boots = style === "boots" ? `<rect x="112" y="336" width="32" height="28" rx="8" fill="#1c1915"/><rect x="156" y="336" width="32" height="28" rx="8" fill="#1c1915"/>` : "";
  const wrap = style === "wrapped" ? `<path d="M114 300 H142 M114 316 H142 M158 300 H186 M158 316 H186" stroke="${accent}" stroke-width="3"/>` : "";
  return `<rect x="112" y="248" width="32" height="116" rx="12" fill="${color}"/><rect x="156" y="248" width="32" height="116" rx="12" fill="${color}"/>${boots}${wrap}`;
}

function accessoryMarkup(accessory: Appearance["accessory"], cloth: string, accent: string): string {
  if (accessory === "shield") return `<path d="M214 230 H268 V280 Q241 312 214 280 Z" fill="${accent}" stroke="${cloth}" stroke-width="4"/>`;
  if (accessory === "staff") return `<rect x="250" y="120" width="8" height="230" rx="4" fill="${accent}"/><circle cx="254" cy="116" r="10" fill="${cloth}"/>`;
  if (accessory === "satchel") return `<rect x="188" y="214" width="36" height="28" rx="6" fill="${accent}"/><path d="M196 214 Q206 196 216 214" fill="none" stroke="${cloth}" stroke-width="3"/>`;
  return "";
}

function statRow(label: string, value: number, y: number, color: string): string {
  const width = Math.max(0, Math.min(100, value)) * 2.4;
  return `<text x="78" y="${y}" fill="#f6f1e7" font-family="Georgia, serif" font-size="18">${esc(label)}</text>
    <text x="672" y="${y}" text-anchor="end" fill="#f6f1e7" font-family="Georgia, serif" font-size="18">${value}</text>
    <rect x="230" y="${y - 14}" width="240" height="10" rx="5" fill="#ffffff22"/>
    <rect x="230" y="${y - 14}" width="${width}" height="10" rx="5" fill="${color}"/>`;
}

export function renderCardFront(appearance: Appearance, copy: CardCopy, prefix = "card"): string {
  const frame = RARITY_FRAME[copy.rarity];
  const figure = renderCharacter(appearance, `${prefix}-fig`).replace("<svg ", "<svg x=\"210\" y=\"150\" width=\"330\" height=\"462\" ");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 750 1050" width="750" height="1050" role="img">
    <title>${esc(copy.name)} card front</title>
    <defs>
      <linearGradient id="${prefix}-plate" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#171a22"/>
        <stop offset="1" stop-color="#2a241c"/>
      </linearGradient>
    </defs>
    <rect width="750" height="1050" rx="36" fill="url(#${prefix}-plate)"/>
    <rect x="18" y="18" width="714" height="1014" rx="28" fill="none" stroke="${frame}" stroke-width="10"/>
    <rect x="40" y="40" width="670" height="970" rx="20" fill="none" stroke="${frame}" stroke-width="2" opacity="0.7"/>
    <text x="375" y="86" text-anchor="middle" fill="#e4c27a" font-family="Georgia, serif" font-size="28" letter-spacing="6">BRICK LEGENDS</text>
    <text x="375" y="122" text-anchor="middle" fill="#f6f1e7" font-family="Georgia, serif" font-size="18">${esc(copy.idLabel)}</text>
    ${figure}
    <text x="375" y="660" text-anchor="middle" fill="#f6f1e7" font-family="Georgia, serif" font-size="40">${esc(copy.name)}</text>
    <text x="375" y="700" text-anchor="middle" fill="#d9d0c3" font-family="Georgia, serif" font-size="20">${esc(copy.creator)} · ${copy.year}</text>
    <text x="375" y="748" text-anchor="middle" fill="${frame}" font-family="Georgia, serif" font-size="28">${esc(copy.rarity)} · ${copy.overall}</text>
    ${statRow("Power", copy.power, 810, frame)}
    ${statRow("Creativity", copy.creativity, 858, frame)}
    ${statRow("Defense", copy.defense, 906, frame)}
    <text x="375" y="968" text-anchor="middle" fill="#e4c27a" font-family="Georgia, serif" font-size="16">${esc(copy.banner)}</text>
  </svg>`;
}

export function renderCardBack(copy: CardCopy, prefix = "back"): string {
  const frame = RARITY_FRAME[copy.rarity];
  const bio = wrap(copy.bio, 42, 5)
    .map((line, index) => `<text x="80" y="${250 + index * 32}" fill="#f6f1e7" font-family="Georgia, serif" font-size="22">${esc(line)}</text>`)
    .join("");
  const abilities = copy.abilities
    .slice(0, 3)
    .map((ability, index) => {
      const y = 460 + index * 78;
      return `<text x="80" y="${y}" fill="${frame}" font-family="Georgia, serif" font-size="24">${esc(ability.name)}</text>
        <text x="80" y="${y + 32}" fill="#f6f1e7" font-family="Georgia, serif" font-size="20">${esc(wrap(ability.text, 46, 1)[0] ?? "")}</text>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 750 1050" width="750" height="1050" role="img">
    <title>${esc(copy.name)} card back</title>
    <rect width="750" height="1050" rx="36" fill="#141820"/>
    <rect x="18" y="18" width="714" height="1014" rx="28" fill="none" stroke="${frame}" stroke-width="10"/>
    <text x="375" y="100" text-anchor="middle" fill="#e4c27a" font-family="Georgia, serif" font-size="28" letter-spacing="4">BRICK LEGENDS</text>
    <text x="80" y="180" fill="#f6f1e7" font-family="Georgia, serif" font-size="36">${esc(copy.name)}</text>
    <text x="80" y="214" fill="#d9d0c3" font-family="Georgia, serif" font-size="20">Rule ${esc(copy.idLabel.includes("DRAFT") ? "bl-rarity-1" : "bl-rarity-1")} · fictional stats</text>
    ${bio}
    ${abilities}
    <text x="80" y="860" fill="#d9d0c3" font-family="Georgia, serif" font-size="18">Overall ${copy.overall} · ${esc(copy.rarity)}</text>
    <text x="80" y="900" fill="#d9d0c3" font-family="Georgia, serif" font-size="18">These numbers are not community votes.</text>
    <text x="375" y="980" text-anchor="middle" fill="#e4c27a" font-family="Georgia, serif" font-size="16">${esc(copy.banner)}</text>
  </svg>`;
}

export async function svgToPng(svg: string, width = 1500, height = 2100): Promise<Blob> {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.decoding = "sync";
    const loaded = new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Could not draw the card."));
    });
    image.src = url;
    await loaded;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable.");
    context.drawImage(image, 0, 0, width, height);
    const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!png) throw new Error("Could not export a PNG.");
    return png;
  } finally {
    URL.revokeObjectURL(url);
  }
}
