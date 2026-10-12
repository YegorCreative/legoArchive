/** Isometric brick geometry. One stud is the grid unit. +x runs down-right, +y down-left, +z up. */

export type BrickKind = "box" | "cone" | "flame";

export type Brick = {
  x: number;
  y: number;
  z: number;
  w?: number;
  d?: number;
  h?: number;
  color: string;
  delay?: number;
  /** Expand into 1×1 cells so a baseplate sorts correctly against the build. */
  tile?: boolean;
  studs?: boolean;
  kind?: BrickKind;
  /** Mark the top face used to place a photograph. */
  anchor?: boolean;
};

export type Stud = { cx: number; cy: number; rx: number; ry: number; wall: string; top: string };

export type IsoNode = {
  delay: number;
  pop: number;
  kind: BrickKind;
  left: string;
  right: string;
  top: string;
  leftFill: string;
  rightFill: string;
  topFill: string;
  edge: string;
  studs: Stud[];
};

export type IsoLayout = {
  viewBox: string;
  width: number;
  height: number;
  nodes: IsoNode[];
  shadow: { cx: number; cy: number; rx: number; ry: number };
  anchorX: number;
  anchorY: number;
};

const TW = 22;
const TH = 11;
const BH = 16;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function mix(hex: string, toward: string, amount: number): string {
  const [ar, ag, ab] = hexToRgb(hex);
  const [br, bg, bb] = hexToRgb(toward);
  const channel = (a: number, b: number) => Math.max(0, Math.min(255, Math.round(a + (b - a) * amount)));
  return `#${[channel(ar, br), channel(ag, bg), channel(ab, bb)].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

function pt(x: number, y: number, z: number): [number, number] {
  return [(x - y) * TW, (x + y) * TH - z * BH];
}

function poly(points: [number, number][]): string {
  return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

function expand(bricks: Brick[]): Brick[] {
  const cells: Brick[] = [];
  for (const brick of bricks) {
    const w = brick.w ?? 1;
    const d = brick.d ?? 1;
    const h = brick.h ?? 1;
    const spans = w > 2 || d > 2;
    if ((brick.tile || spans) && (brick.kind ?? "box") === "box") {
      const base = brick.delay ?? 0;
      for (let ix = 0; ix < w; ix += 1) {
        for (let iy = 0; iy < d; iy += 1) {
          cells.push({
            ...brick,
            x: brick.x + ix,
            y: brick.y + iy,
            w: 1,
            d: 1,
            h,
            tile: false,
            delay: base + (ix + iy) * 14,
          });
        }
      }
    } else {
      cells.push({ ...brick, w, d, h });
    }
  }
  cells.sort((a, b) => a.x + a.y - (b.x + b.y) || a.z - b.z || a.x - b.x);
  return cells;
}

export function project(bricks: Brick[], headroom = 0): IsoLayout {
  const cells = expand(bricks);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let anchor: [number, number] | null = null;
  const consider = (x: number, y: number) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };

  const nodes: IsoNode[] = cells.map((brick) => {
    const x = brick.x;
    const y = brick.y;
    const z = brick.z;
    const w = brick.w ?? 1;
    const d = brick.d ?? 1;
    const h = brick.h ?? 1;
    const kind = brick.kind ?? "box";
    const color = brick.color;
    const topFill = mix(color, "#ffffff", 0.42);
    const leftFill = mix(color, "#ffffff", 0.12);
    const rightFill = mix(color, "#1a1408", 0.3);
    const apex = pt(x + w / 2, y + d / 2, z + h);
    const far = pt(x, y, z + h);
    const rightTop = pt(x + w, y, z + h);
    const front = pt(x + w, y + d, z + h);
    const leftTop = pt(x, y + d, z + h);
    const farBottom = pt(x, y, z);
    const rightBottom = pt(x + w, y, z);
    const frontBottom = pt(x + w, y + d, z);
    const leftBottom = pt(x, y + d, z);
    for (const point of [far, rightTop, front, leftTop, farBottom, rightBottom, frontBottom, leftBottom, apex]) consider(point[0], point[1]);

    const studs: Stud[] = [];
    if (kind === "box" && brick.studs !== false) {
      for (let i = 0; i < w; i += 1) {
        for (let j = 0; j < d; j += 1) {
          const [cx, cy] = pt(x + i + 0.5, y + j + 0.5, z + h);
          const rx = TW * 0.33;
          const ry = TH * 0.33;
          consider(cx - rx, cy - ry);
          consider(cx + rx, cy + ry + ry * 0.7);
          studs.push({ cx, cy, rx, ry, wall: mix(color, "#1a1408", 0.22), top: mix(color, "#ffffff", 0.55) });
        }
      }
    }
    if (brick.anchor) anchor = pt(x + w / 2, y + d * 0.42, z + h);

    let left = "";
    let right = "";
    let top = "";
    let edge = "";
    if (kind === "cone") {
      left = poly([leftBottom, frontBottom, apex]);
      right = poly([rightBottom, frontBottom, apex]);
      top = "";
      edge = poly([leftBottom, apex, rightBottom]);
    } else if (kind === "flame") {
      const tip = pt(x + w / 2, y + d + 1.15, z - 1.35);
      const skirtL = pt(x - 0.15, y + d + 0.15, z - 0.15);
      const skirtR = pt(x + w + 0.15, y + d + 0.15, z - 0.15);
      const innerTip = pt(x + w / 2, y + d + 0.7, z - 0.7);
      consider(tip[0], tip[1]);
      consider(skirtL[0], skirtL[1]);
      consider(skirtR[0], skirtR[1]);
      left = poly([leftBottom, skirtL, tip, frontBottom]);
      right = poly([frontBottom, tip, skirtR, rightBottom]);
      top = poly([pt(x + 0.35, y + d * 0.2, z), pt(x + w - 0.35, y + d * 0.2, z), innerTip]);
      edge = "";
    } else {
      left = poly([leftBottom, frontBottom, front, leftTop]);
      right = poly([rightBottom, frontBottom, front, rightTop]);
      top = poly([far, rightTop, front, leftTop]);
      edge = poly([far, leftTop, front]);
    }

    return {
      delay: brick.delay ?? 0,
      pop: Math.min(1.8, 0.35 + z * 0.16),
      kind,
      left,
      right,
      top,
      leftFill: kind === "flame" ? "#e3000b" : leftFill,
      rightFill: kind === "flame" ? "#f47b20" : rightFill,
      topFill: kind === "flame" ? "#ffe14a" : topFill,
      edge,
      studs,
    };
  });

  const pad = 18;
  if (!Number.isFinite(minX)) {
    minX = 0;
    minY = 0;
    maxX = 10;
    maxY = 10;
  }
  const vbX = minX - pad;
  const vbY = minY - pad - headroom;
  const vbW = maxX - minX + pad * 2;
  const vbH = maxY - minY + pad * 2 + headroom;
  const anchorPoint = anchor ?? [(minX + maxX) / 2, (minY + maxY) / 2];
  return {
    viewBox: `${vbX.toFixed(1)} ${vbY.toFixed(1)} ${vbW.toFixed(1)} ${vbH.toFixed(1)}`,
    width: Math.ceil(vbW),
    height: Math.ceil(vbH),
    nodes,
    shadow: {
      cx: (minX + maxX) / 2,
      cy: maxY - 2,
      rx: Math.max(24, (maxX - minX) * 0.34),
      ry: 11,
    },
    anchorX: ((anchorPoint[0] - vbX) / vbW) * 100,
    anchorY: ((anchorPoint[1] - vbY) / vbH) * 100,
  };
}

function nodeMarkup(node: IsoNode, animate: boolean): string {
  const motion = animate ? ` class="${node.kind === "flame" ? "iso-brick iso-flame" : "iso-brick"}" style="--delay:${node.delay};--pop:${node.pop.toFixed(2)}"` : "";
  const faces = [
    node.left ? `<polygon points="${node.left}" fill="${node.leftFill}"/>` : "",
    node.right ? `<polygon points="${node.right}" fill="${node.rightFill}"/>` : "",
    node.top ? `<polygon points="${node.top}" fill="${node.topFill}"/>` : "",
    node.edge && node.kind !== "flame" ? `<polyline points="${node.edge}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.1" stroke-linejoin="round"/>` : "",
    ...node.studs.flatMap((stud) => [
      `<ellipse cx="${stud.cx.toFixed(1)}" cy="${(stud.cy + stud.ry * 0.62).toFixed(1)}" rx="${stud.rx.toFixed(1)}" ry="${(stud.ry * 0.72).toFixed(1)}" fill="${stud.wall}"/>`,
      `<ellipse cx="${stud.cx.toFixed(1)}" cy="${stud.cy.toFixed(1)}" rx="${stud.rx.toFixed(1)}" ry="${stud.ry.toFixed(1)}" fill="${stud.top}"/>`,
      `<ellipse cx="${(stud.cx - stud.rx * 0.28).toFixed(1)}" cy="${(stud.cy - stud.ry * 0.32).toFixed(1)}" rx="${(stud.rx * 0.28).toFixed(1)}" ry="${(stud.ry * 0.22).toFixed(1)}" fill="rgba(255,255,255,0.9)"/>`,
    ]),
  ];
  return `<g${motion}>${faces.join("")}</g>`;
}

export function renderSvg(bricks: Brick[], headroom = 0): { markup: string; layout: IsoLayout } {
  const layout = project(bricks, headroom);
  const { shadow } = layout;
  const body = [
    `<ellipse cx="${shadow.cx.toFixed(1)}" cy="${shadow.cy.toFixed(1)}" rx="${shadow.rx.toFixed(1)}" ry="${shadow.ry.toFixed(1)}" fill="rgba(12,16,28,0.35)"/>`,
    ...layout.nodes.map((node) => nodeMarkup(node, false)),
  ].join("");
  const markup = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="${layout.viewBox}" width="${layout.width}" height="${layout.height}" role="img" aria-hidden="true">${body}</svg>\n`;
  return { markup, layout };
}
