// Statische Prüfungen der gebauten Seite (Links, JSON-LD, Meta, Längen, Verbote).
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
import { serve } from "./serve.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 8799; const O = `http://localhost:${PORT}`; const BASE = "/fhir-viewer/";
const srv = await serve(PORT);
let bad = 0; const fail = (m) => { bad++; console.log("FEHLER:", m); }; const warn = (m) => console.log("Hinweis:", m);
const info = JSON.parse(fs.readFileSync(path.join(root, ".build-info.json"), "utf8"));
const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const files = [...info.pages.map((p) => p.path + "index.html"), "404.html"];
let flex = 0; const ids = {};
for (const f of files) {
  const html = fs.readFileSync(path.join(root, f), "utf8");
  const p = info.pages.find((x) => x.path + "index.html" === f);
  const t = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || ""; const d = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
  const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  if (p) { console.log(`${f.padEnd(40)} T${decode(t).length} D${decode(d).length} | ${decode(t)}`); if (decode(t).length > 70) warn(f + ": Title " + decode(t).length); if (decode(d).length > 165 || decode(d).length < 70) warn(f + ": Description " + decode(d).length); }
  const h1 = html.match(/<h1[ >]/g) || []; if (p && h1.length !== 1) fail(f + ": h1 x" + h1.length);
  for (const must of ['name="google-site-verification" content="6pYvtFCnU7UFcQFajtMSkQ7tYMy3Z_Bt7teKiT5yKNg"', 'name="msvalidate.01" content="E1F30DEB311AAF5458907DB431B481AC"', 'name="theme-color"', 'rel="icon"', 'lang="de"', "Content-Security-Policy"]) if (!html.includes(must)) fail(f + ": fehlt " + must);
  if (p && !html.includes(`<link rel="canonical" href="https://freimoser.github.io/fhir-viewer/${p.path}">`)) fail(f + ": canonical");
  if (p && !html.includes("Zuletzt aktualisiert")) fail(f + ": Zuletzt aktualisiert");
  if (/<script(?![^>]*(src=|type="application\/ld\+json"))[^>]*>/.test(html)) fail(f + ": Inline-Skript");
  if (/\sstyle="/.test(html) || /<style/.test(html)) fail(f + ": Inline-Style");
  if (/\son[a-z]+="/.test(html)) fail(f + ": Inline-Handler");
  // JSON-LD
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch (e) { fail(f + ": JSON-LD " + e.message); } }
  // FAQ-Gleichheit
  if (f === "index.html") {
    const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1])).flatMap((x) => x["@graph"] || x);
    const faq = ld.find((x) => x["@type"] === "FAQPage"); const app = ld.find((x) => [].concat(x["@type"]).includes("WebApplication"));
    if (!faq || !app) fail("JSON-LD FAQPage/WebApplication fehlt"); else {
      const vis = [...html.matchAll(/<details[^>]*><summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)];
      const txt = (s) => decode(s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
      if (vis.length !== faq.mainEntity.length) fail(`FAQ sichtbar ${vis.length} vs LD ${faq.mainEntity.length}`);
      faq.mainEntity.forEach((q, i) => { if (vis[i] && (txt(vis[i][1]) !== q.name.replace(/\s+/g, " ").trim() || txt(vis[i][2]) !== q.acceptedAnswer.text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim())) fail("FAQ-Abweichung Nr. " + (i + 1) + ": " + txt(vis[i][1]) + " | " + txt(vis[i][2]).slice(0, 60) + " <> " + q.acceptedAnswer.text.slice(0, 60)); });
      if (app.aggregateRating) fail("aggregateRating vorhanden");
    }
  }
  // IDs und Links
  const idl = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]); const seen = new Set();
  for (const i of idl) { if (seen.has(i)) fail(f + ": doppelte id " + i); seen.add(i); } ids[f] = seen;
  flex += (html.match(/href="https:\/\/flexchange-medical\.de/g) || []).length;
  if (new RegExp(["Thai", "land|Patt", "aya"].join(""), "i").test(html)) fail(f + ": verbotenes Wort");
}
// interne Links
for (const f of files) {
  const html = fs.readFileSync(path.join(root, f), "utf8");
  const hrefs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  for (const h of hrefs) {
    if (/^(mailto:|data:|#|https?:\/\/(?!freimoser\.github\.io\/fhir-viewer))/.test(h)) { if (h.startsWith("#")) { if (h.length > 1 && !ids[f].has(h.slice(1))) fail(f + ": Anker " + h); } continue; }
    const u = new URL(h, "https://freimoser.github.io" + BASE + (f === "404.html" ? "" : f.replace(/index\.html$/, "")));
    const rel = u.pathname; const r = await fetch(O + rel); if (r.status !== 200) { fail(f + ": " + h + " -> " + r.status); continue; }
    if (u.hash && rel.endsWith("/")) { const tf = rel.slice(BASE.length) + "index.html"; if (ids[tf] && !ids[tf].has(u.hash.slice(1))) fail(f + ": Anker " + h); }
  }
}
for (const u of urls) { const r = await fetch(O + u.replace("https://freimoser.github.io", "")); if (r.status !== 200) fail("Sitemap " + u + " " + r.status); }
for (const f of ["robots.txt", "llms.txt", "c67e9b3d19be863e1c5ec56c3a89f916.txt", "og-image.png", "favicon.ico", "favicon.svg", "favicon-32.png", "apple-touch-icon.png", "THIRD-PARTY-LICENSES", "assets/app.js", "assets/menu.js", "assets/styles.css"]) { const r = await fetch(`${O}${BASE}${f}`); if (r.status !== 200) fail(f + " " + r.status); }
const og = fs.readFileSync(path.join(root, "og-image.png")); if (og.readUInt32BE(16) !== 1200 || og.readUInt32BE(20) !== 630) fail("og-image Größe");
if (fs.readFileSync(path.join(root, "c67e9b3d19be863e1c5ec56c3a89f916.txt"), "utf8") !== "c67e9b3d19be863e1c5ec56c3a89f916") fail("IndexNow-Schlüssel");
{
  const allowed = new Set(["index.html", "was-ist-fhir/index.html", "fhirpath-tester/index.html"]);
  const sister = /freimoser\.github\.io\/(?:cda-viewer|hl7v2-viewer|ldt-bdt-viewer|gdt-viewer|dicom-viewer)\//g;
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.name === "node_modules" || e.name === ".git" ? [] : e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".html") ? [path.join(d, e.name)] : []);
  for (const fp of walk(root)) {
    const rel = path.relative(root, fp); const h = fs.readFileSync(fp, "utf8");
    const blocks = (h.match(/id="weitere"/g) || []).length;
    if (blocks > 1) fail(rel + ": mehr als ein Werkzeug-Block");
    if (blocks === 1 && !allowed.has(rel)) fail(rel + ": Werkzeug-Block nicht vorgesehen");
    const links = (h.match(sister) || []).length;
    if (blocks === 0 && links) fail(rel + ": Schwester-Links außerhalb des Blocks");
    if (/<footer[\s\S]*?freimoser\.github\.io\/(?!fhir-viewer)/.test(h)) fail(rel + ": Viewer-Links im Footer");
  }
}
if (flex > 1) fail("flexchange-Links: " + flex + " (erlaubt: 0 oder 1)");
console.log("flexchange-Links:", flex, "| Sitemap-URLs:", urls.length, "| Fehler:", bad);
srv.close(); process.exit(bad ? 1 : 0);
