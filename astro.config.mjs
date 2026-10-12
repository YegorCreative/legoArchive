import { readFileSync } from "node:fs";
import { defineConfig } from "astro/config";
import { buildCatalog } from "./src/lib/catalog.ts";

let prerenderIds;

function ids() {
  if (!prerenderIds) {
    const raw = JSON.parse(readFileSync(new URL("./public/data/catalog.json", import.meta.url), "utf8"));
    prerenderIds = buildCatalog(raw).prerenderIds;
  }
  return prerenderIds;
}

function setViewerFallback() {
  return {
    name: "set-viewer-fallback",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url ?? "";
        const pathOnly = url.split("?")[0];
        const match = pathOnly.match(/\/sets\/([^/]+)\/?$/);
        if (match) {
          const id = decodeURIComponent(match[1]);
          if (!ids().has(id)) {
            const query = url.includes("?") ? `?${url.split("?")[1]}` : "";
            req.url = `/legoArchive/set-viewer/${query}`;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  site: "https://yegorcreative.github.io",
  base: "/legoArchive",
  trailingSlash: "always",
  // Keep HTML-aware whitespace so inline text does not collapse the way JSX compression would.
  compressHTML: true,
  build: { format: "directory" },
  vite: { plugins: [setViewerFallback()] },
});
