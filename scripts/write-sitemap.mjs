import { readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const dist = path.resolve("dist");
const origin = "https://yegorcreative.github.io/legoArchive/";
const urls = [];

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === "index.html") {
      const relative = path.relative(dist, directory).split(path.sep).join("/");
      urls.push(relative ? `${origin}${relative}/` : origin);
    }
  }
}

walk(dist);
urls.sort();
const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}
</urlset>
`;
writeFileSync(path.join(dist, "sitemap.xml"), body);
const bytes = statSync(path.join(dist, "sitemap.xml")).size;
console.log(`Sitemap: ${urls.length} urls, ${bytes} bytes`);
if (urls.length > 50000) {
  console.error("Sitemap exceeds the 50,000 URL protocol limit.");
  process.exit(1);
}
