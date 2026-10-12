import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { displayPlinth, PLINTH_HEADROOM } from "../src/lib/build-models.ts";
import { project, renderSvg } from "../src/lib/iso-brick.ts";

test("shared plinth art matches the display-stand geometry", () => {
  const { markup, layout } = renderSvg(displayPlinth(), PLINTH_HEADROOM);
  const file = readFileSync(new URL("../public/build/plinth.svg", import.meta.url), "utf8");
  assert.equal(file, markup);
  assert.ok(layout.anchorX > 40 && layout.anchorX < 60);
  assert.ok(layout.anchorY > 55 && layout.anchorY < 85);
  const live = project(displayPlinth(), PLINTH_HEADROOM);
  assert.equal(live.viewBox, layout.viewBox);
  assert.ok(live.nodes.some((node) => node.studs.length > 0));
});
