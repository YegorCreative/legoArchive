import type { Brick } from "./iso-brick";

const plate = 0.32;

/** Original museum entrance. Not a copy of a catalog set. */
export function museumGate(): Brick[] {
  const colors = ["#e3000b", "#0057b8", "#ffd500", "#00852d", "#f47b20", "#6b2d8b"];
  const ground: Brick = { x: 0, y: 0, w: 12, d: 7, z: 0, h: plate, color: "#2f9e2a", tile: true, delay: 0 };
  const path: Brick = { x: 3, y: 3.15, w: 5, d: 3, z: plate, h: 0.18, color: "#e4d2ae", tile: true, delay: 80 };
  const brickH = 0.78;
  const towers = colors.flatMap((color, index) => {
    const z = plate + index * brickH;
    const delay = 280 + index * 90;
    return [
      { x: 1, y: 1, w: 2, d: 2, z, h: brickH, color, delay },
      { x: 8, y: 1, w: 2, d: 2, z, h: brickH, color, delay: delay + 40 },
    ];
  });
  const lintelZ = plate + colors.length * brickH;
  const lintelH = 0.58;
  const lintel: Brick = { x: 1, y: 1, w: 9, d: 2, z: lintelZ, h: lintelH, color: "#d5dbe3", delay: 920 };
  const roof: Brick = { x: 1, y: 1, w: 9, d: 2, z: lintelZ + lintelH, h: 0.58, color: "#e8a000", delay: 1060 };
  const beacon: Brick = { x: 5, y: 1.45, w: 1, d: 1, z: lintelZ + lintelH + 0.58, h: 0.66, color: "#e3000b", delay: 1200 };
  const lamps: Brick[] = [
    { x: 0.15, y: 2.15, w: 0.8, d: 0.8, z: plate + brickH * 2, h: 0.5, color: "#ffd500", delay: 620 },
    { x: 10.05, y: 2.15, w: 0.8, d: 0.8, z: plate + brickH * 2, h: 0.5, color: "#ffd500", delay: 660 },
  ];
  return [ground, path, ...towers, ...lamps, lintel, roof, beacon];
}

/** Original launch pad for the Space room. Not a catalog set. */
export function spaceLaunch(): Brick[] {
  const pad: Brick = { x: 0, y: 0, w: 9, d: 7, z: 0, h: plate, color: "#9aa6b5", tile: true, delay: 0 };
  const ring: Brick = { x: 4, y: 3.2, w: 4, d: 3.2, z: plate, h: 0.18, color: "#ffd500", tile: true, delay: 30 };
  const rx = 5;
  const ry = 3.7;
  const body = (z: number, h: number, color: string, delay: number, kind?: Brick["kind"]): Brick => ({
    x: rx, y: ry, w: 2, d: 2, z, h, color, delay, kind,
  });
  const gantry: Brick[] = [0, 1, 2, 3, 4, 5].map((index) => ({
    x: 0.4,
    y: 0.6,
    w: 1.7,
    d: 1.7,
    z: plate + index * 0.72,
    h: 0.68,
    color: index % 2 === 0 ? "#d5dbe3" : "#ffd500",
    delay: 160 + index * 60,
  }));
  const arm: Brick = { x: 2.1, y: 1.05, w: 2.7, d: 0.7, z: plate + 4 * 0.72, h: 0.32, color: "#ffd500", delay: 560 };
  const rover: Brick[] = [
    { x: 0.35, y: 4.3, w: 0.5, d: 0.5, z: plate, h: 0.34, color: "#1a1408", studs: false, delay: 200 },
    { x: 1.7, y: 4.3, w: 0.5, d: 0.5, z: plate, h: 0.34, color: "#1a1408", studs: false, delay: 220 },
    { x: 0.35, y: 5.35, w: 0.5, d: 0.5, z: plate, h: 0.34, color: "#1a1408", studs: false, delay: 240 },
    { x: 1.7, y: 5.35, w: 0.5, d: 0.5, z: plate, h: 0.34, color: "#1a1408", studs: false, delay: 260 },
    { x: 0.25, y: 4.4, w: 2, d: 1.3, z: 0.7, h: 0.5, color: "#0057b8", delay: 340 },
    { x: 0.65, y: 4.55, w: 1.1, d: 0.95, z: 1.2, h: 0.42, color: "#d7e6ff", delay: 420 },
  ];
  return [
    pad,
    ring,
    ...gantry,
    arm,
    { x: rx - 1.7, y: ry + 0.2, w: 1.5, d: 1.6, z: 0.5, h: 1.15, color: "#e3000b", delay: 240 },
    { x: rx + 2.2, y: ry + 0.2, w: 1.5, d: 1.6, z: 0.5, h: 1.15, color: "#e3000b", delay: 280 },
    { x: rx + 0.2, y: ry + 2, w: 1.6, d: 1.15, z: 0.5, h: 0.95, color: "#e3000b", delay: 320 },
    { x: rx + 0.25, y: ry + 1.7, w: 1.5, d: 1.1, z: 0.7, h: 0.2, color: "#f47b20", kind: "flame", studs: false, delay: 200 },
    body(0.62, 0.95, "#f4f7fb", 400),
    body(1.57, 0.95, "#f4f7fb", 490),
    body(2.52, 0.58, "#0057b8", 580),
    body(3.1, 0.95, "#f4f7fb", 670),
    body(4.05, 0.95, "#f4f7fb", 760),
    body(5, 0.46, "#ffd500", 850),
    body(5.46, 1.7, "#e3000b", 960, "cone"),
    ...rover,
  ];
}

/** Shared museum plinth. The photograph is placed on the anchored yellow plate. */
export function displayPlinth(): Brick[] {
  return [
    { x: 0, y: 0, w: 8, d: 5.4, z: 0, h: 0.5, color: "#5e584e", studs: false, delay: 0 },
    { x: 0.5, y: 0.4, w: 7, d: 4.4, z: 0.5, h: 0.42, color: "#8a8376", studs: false, delay: 80 },
    { x: 1, y: 0.8, w: 6, d: 3.5, z: 0.92, h: 0.3, color: "#ffd500", anchor: true, delay: 160 },
    { x: 1, y: 0.8, w: 0.72, d: 0.72, z: 1.22, h: 1.05, color: "#e3000b", delay: 240 },
    { x: 6.28, y: 0.8, w: 0.72, d: 0.72, z: 1.22, h: 1.05, color: "#0057b8", delay: 280 },
    { x: 1, y: 3.55, w: 0.62, d: 0.62, z: 1.22, h: 0.62, color: "#00852d", delay: 320 },
    { x: 6.38, y: 3.55, w: 0.62, d: 0.62, z: 1.22, h: 0.62, color: "#f47b20", delay: 360 },
  ];
}

export const PLINTH_HEADROOM = 28;
