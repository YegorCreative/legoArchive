import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";

const port = Number(process.env.PORT || 4321);
const root = path.resolve("dist");
const base = "/legoArchive";
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
};

function resolveFile(urlPath) {
  if (!urlPath.startsWith(base)) return null;
  let rel = decodeURIComponent(urlPath.slice(base.length)) || "/";
  if (rel.endsWith("/")) rel += "index.html";
  const full = path.normalize(path.join(root, rel));
  if (!full.startsWith(root)) return null;
  if (existsSync(full) && statSync(full).isFile()) return full;
  return null;
}

createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const file = resolveFile(url.pathname);
  const target = file ?? path.join(root, "404.html");
  if (!existsSync(target)) {
    res.writeHead(404);
    res.end("Missing build output. Run npm run build.");
    return;
  }
  res.writeHead(file ? 200 : 404, { "content-type": types[path.extname(target)] || "application/octet-stream" });
  createReadStream(target).pipe(res);
}).listen(port, () => {
  console.log(`Preview at http://localhost:${port}${base}/`);
});
