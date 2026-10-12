import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCatalog, type LoadedCatalog } from "./catalog.ts";

let cache: LoadedCatalog | null = null;

export function loadCatalog(): LoadedCatalog {
  if (cache) return cache;
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const raw = JSON.parse(readFileSync(path.join(root, "public/data/catalog.json"), "utf8"));
  cache = buildCatalog(raw);
  return cache;
}
