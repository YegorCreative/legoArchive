import { readFileSync } from "node:fs";
import path from "node:path";
import { buildCatalog, type LoadedCatalog } from "./catalog.ts";

let cache: LoadedCatalog | null = null;

export function loadCatalog(): LoadedCatalog {
  if (cache) return cache;
  // Astro 7 runs prerender from a chunk under dist/, so import.meta.url is not the source file.
  const raw = JSON.parse(readFileSync(path.join(process.cwd(), "public/data/catalog.json"), "utf8"));
  cache = buildCatalog(raw);
  return cache;
}
