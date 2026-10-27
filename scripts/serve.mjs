// Lokaler Server: liefert das Repo-Wurzelverzeichnis unter /fhir-viewer/ (wie GitHub Pages).
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT || 8765); const BASE = "/fhir-viewer/";
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml", ".md": "text/markdown" };
export function serve(p = port) {
  return new Promise((res) => {
    const s = http.createServer((req, rsp) => {
      let u = decodeURIComponent(req.url.split("?")[0]);
      if (!u.startsWith(BASE)) { rsp.writeHead(404); return rsp.end("nicht gefunden"); }
      let f = path.join(root, u.slice(BASE.length));
      if (!f.startsWith(root)) { rsp.writeHead(403); return rsp.end(); }
      if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
      if (!fs.existsSync(f)) { rsp.writeHead(404, { "content-type": types[".html"] }); return rsp.end(fs.readFileSync(path.join(root, "404.html"))); }
      rsp.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(rsp);
    });
    s.listen(p, () => res(s));
  });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) { await serve(); console.log(`http://localhost:${port}${BASE}`); }
