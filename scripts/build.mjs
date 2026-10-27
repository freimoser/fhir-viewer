// Baut die komplette Seite ins Repo-Wurzelverzeichnis (GitHub Pages liefert aus main:/).
//   node scripts/build.mjs            (BUILD_DATE=JJJJ-MM-TT setzt das Änderungsdatum)
globalThis.WebSocket ??= class { static CLOSING = 2; static CLOSED = 3; };
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import puppeteer from "puppeteer-core";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);
execFileSync("node", ["scripts/prepare-samples.mjs"], { stdio: "inherit" });

const cfg = await import("../src/site/config.mjs");
const { page, head, header, footer, esc, href, url } = await import("../src/site/layout.mjs");
const { buildPages } = await import("../src/site/pages.mjs");
const { legalPages, notFoundBody } = await import("../src/site/legal.mjs");
const { SAMPLES } = await import("../src/data/samples.mjs");
const { SRC } = await import("../src/site/content.mjs");
const { SITE, SLUG, LASTMOD, TOOLS, NAME, SHORT } = cfg;

const write = (rel, data) => { const f = path.join(root, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, data); };
const hash = (buf) => crypto.createHash("sha1").update(buf).digest("hex").slice(0, 8);

// ---------- 0. alte Ausgaben entfernen ----------
for (const d of ["assets", "fhir-bundle-anzeigen", "fhirpath-tester", "was-ist-fhir", "fhir-patient-beispiel", "fhir-observation-beispiel", "fhir-encounter-beispiel", "fhir-condition-beispiel", "quellen", "datenschutz"]) fs.rmSync(path.join(root, d), { recursive: true, force: true });

// ---------- 1. Skripte und CSS ----------
await esbuild.build({ entryPoints: { app: "src/app.js" }, bundle: true, format: "esm", splitting: true, minify: true, target: "es2020", outdir: "assets", chunkNames: "chunk-[hash]", legalComments: "none", logLevel: "warning" });
await esbuild.build({ entryPoints: { menu: "src/menu.js" }, bundle: true, format: "iife", minify: true, target: "es2020", outdir: "assets", logLevel: "warning" });
await esbuild.build({ entryPoints: { styles: "src/styles.css" }, bundle: true, minify: true, outdir: "assets", logLevel: "warning" });
const assets = { appV: hash(fs.readFileSync("assets/app.js")), menuV: hash(fs.readFileSync("assets/menu.js")), cssV: hash(fs.readFileSync("assets/styles.css")) };
console.log("assets", assets, fs.readdirSync("assets").map((f) => f + " " + fs.statSync("assets/" + f).size).join(", "));

// ---------- 2. Optionale Schwester-Tools nur bei HTTP 200 ----------
async function ok(u) {
  try { const r = await fetch(u, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(15000) }); return r.status === 200; } catch { return false; }
}
const tools = [];
const toolStatus = {};
for (const t of TOOLS) {
  const good = await ok(t.url);
  toolStatus[t.id] = good;
  if (good) tools.push(t); else if (!t.optional) throw new Error("Pflicht-Tool nicht erreichbar: " + t.url);
}
console.log("Tools:", toolStatus);

// ---------- 3. Seiten ----------
const pages = [...(await buildPages({ tools })), ...legalPages()];
for (const p of pages) {
  const body = p.body.replace(/\$\{TOOLS\}/g, "");
  let html = page({ path: p.path, title: p.title, desc: p.desc, jsonld: p.ld, assets, body, viewerScript: !p.noViewer });
  write(p.path + "index.html", html);
}
// Einheitliche Werkzeug-Liste auf der Startseite steckt in body (toolsBlock); alle übrigen Seiten verlinken sie über die Fußzeile bzw. "Weiterlesen".

// 404
{
  const f404 = page({ path: "404.html", title: "Seite nicht gefunden – " + NAME, desc: "Diese Seite gibt es nicht.", jsonld: [], assets, body: notFoundBody(tools), viewerScript: false })
    .replace('<meta name="robots" content="index,follow,max-image-preview:large">', '<meta name="robots" content="noindex">')
    .replace(/<link rel="canonical"[^>]*>\n?/, "");
  write("404.html", f404);
}

// ---------- 4. Sitemap, robots, llms.txt, Schlüsseldateien ----------
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `  <url><loc>${url(p.path)}</loc><lastmod>${p.lastmod || LASTMOD}</lastmod></url>`).join("\n")}\n</urlset>\n`);
write("robots.txt", `User-agent: *\nAllow: /\n\n# KI-Crawler dürfen die öffentlichen Seiten lesen\nUser-agent: GPTBot\nAllow: /\nUser-agent: ChatGPT-User\nAllow: /\nUser-agent: OAI-SearchBot\nAllow: /\nUser-agent: ClaudeBot\nAllow: /\nUser-agent: Claude-SearchBot\nAllow: /\nUser-agent: PerplexityBot\nAllow: /\nUser-agent: Google-Extended\nAllow: /\nUser-agent: Applebot-Extended\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`);
write(cfg.INDEXNOW_KEY + ".txt", cfg.INDEXNOW_KEY);
write(".nojekyll", "");

const L = (p) => url(p);
write("llms.txt", `# ${NAME}

> Kostenloser Viewer für FHIR-Daten im Browser (deutsch). Liest FHIR-Ressourcen und Bundles als JSON oder XML (Basis: FHIR R4), zeigt Karte und Baum, listet Bundle-Einträge, löst Referenzen innerhalb eines Bundles auf und wertet FHIRPath-Ausdrücke aus. Läuft vollständig im Browser, kein Upload, keine Cookies. Kein Validator: Profile und Terminologien werden nicht geprüft. Nur zur Ansicht, kein Medizinprodukt.

Eine Plausibilitätsprüfung deckt nur ausgewählte Regeln ab (Syntax, resourceType, einzelne Pflichtfelder, Bundle-Regeln bdl-1/3/4/7/9–12, Datumsformate, Referenzen). Der FHIRPath-Tester nutzt evalFhirPath aus @medplum/core (Apache-2.0); Ergebnisse können von anderen Implementierungen abweichen. R4B- und R5-Daten werden meist angezeigt, aber nicht vollständig geprüft.

## Seiten
- [${NAME}](${L("")}): das Werkzeug mit Beispielen und FAQ
- [Beispiele zum Ausprobieren](${L("")}#beispiele): acht Beispiele aus der FHIR-Spezifikation R4 (CC0)
- [Häufige Fehler und Meldungen](${L("")}#fehler): echte Meldungen des Viewers zu typischen Eingabefehlern
- [FHIR-Bundle anzeigen](${L("fhir-bundle-anzeigen/")}): Bundle-Typen, Einträge, Referenzen, Regeln
- [FHIRPath-Tester](${L("fhirpath-tester/")}): fünf Beispiele und typische Stolperstellen
- [Was ist FHIR?](${L("was-ist-fhir/")}): Ressourcen, JSON/XML, REST, FHIR in Deutschland mit Quellen
- [FHIR-Patient-Beispiel](${L("fhir-patient-beispiel/")})
- [FHIR-Observation-Beispiel](${L("fhir-observation-beispiel/")})
- [FHIR-Encounter-Beispiel](${L("fhir-encounter-beispiel/")})
- [FHIR-Condition-Beispiel](${L("fhir-condition-beispiel/")})
- [Quellen und Lizenzen](${L("quellen/")})
- [Datenschutz](${L("datenschutz/")})

## Verwandte Tools
${tools.map((t) => `- [${t.name}](${t.url}): ${t.desc}`).join("\n")}
- [Portfolio Thomas Freimoser](${cfg.AUTHOR.site})
- [LinkedIn Thomas Freimoser](${cfg.AUTHOR.linkedin})

## Hinweis zu Marken
${cfg.DISCLAIMER_TM}
`);

// ---------- 5. Lizenzdateien ----------
const medplumLic = fs.readFileSync("node_modules/@medplum/core/LICENSE.txt", "utf8");
write("THIRD-PARTY-LICENSES", `Drittanbieter-Lizenzen – ${NAME} (${SITE})
Die folgende Bibliothek ist in assets/ (gebündelt und minifiziert) enthalten.

================================================================================
@medplum/core 5.2.9 – https://github.com/medplum/medplum – https://www.medplum.com/
Lizenz: Apache License 2.0. Autor laut package.json: Medplum <hello@medplum.com>.
Verwendet wird nur evalFhirPath samt den davon benötigten Modulen; esbuild entfernt ungenutzten Code.
Änderungen am Quellcode: keine; die Bibliothek wird gebündelt und minifiziert.
Eine NOTICE-Datei liegt dem Paket @medplum/core nicht bei.
================================================================================

${medplumLic}
`);
const sampleRows = SAMPLES.map((s) => `| ${s.title} | ${s.bytes} Bytes | ${s.url} | ${s.removedSnomed ? s.removedSnomed + " SNOMED-CT-Codierung(en) bzw. Narrativ entfernt" : "nur Formatierung"} |`).join("\n");
write("quellen.md", `# Quellen und Lizenzen

Stand: ${LASTMOD}

## Beispiele
Alle Beispiele stammen aus der FHIR-Spezifikation R4 (4.0.1), die unter CC0 1.0 steht (${SRC.license.url}). Änderungen: Formatierung; wo vermerkt, wurden SNOMED-CT-Codierungen und das Narrativ entfernt, weil SNOMED CT gesondert lizenziert ist. Keine echten Daten.

| Beispiel | Größe | Original | Änderung |
|---|---|---|---|
${sampleRows}

## Fachquellen (für die Texte geöffnet und gelesen)
${Object.values(SRC).map((s) => `- ${s.label}: ${s.url}`).join("\n")}

## LOINC-Hinweis
This material contains content from LOINC (http://loinc.org). LOINC is copyright © Regenstrief Institute, Inc. and the Logical Observation Identifiers Names and Codes (LOINC) Committee and is available at no cost under the license at http://loinc.org/license. LOINC® is a registered United States trademark of Regenstrief Institute, Inc.

Deutsche Quellen abgerufen am ${LASTMOD}. Nicht als Quelle verwendet wurden Seiten, die nur in Suchergebnissen gesehen, aber nicht geöffnet wurden.

## Software
- @medplum/core 5.2.9, Apache-2.0 (siehe THIRD-PARTY-LICENSES)
- Build: esbuild, puppeteer-core (nur zur Entwicklung, nicht Teil der Seite)

## Marken
${cfg.DISCLAIMER_TM}
`);

// ---------- 6. Symbole und og:image ----------
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#0f3a5f"/><path d="M12 8c-3 0-3 2-3 4v2c0 1.5-1 2-2 2 1 0 2 .5 2 2v2c0 2 0 4 3 4M20 8c3 0 3 2 3 4v2c0 1.5 1 2 2 2-1 0-2 .5-2 2v2c0 2 0 4-3 4" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16" cy="16" r="2.2" fill="#ffb454"/></svg>`;
write("favicon.svg", svg);
const iconHtml = (s, pad) => `<!doctype html><html><body style="margin:0;background:transparent"><div style="width:${s}px;height:${s}px;overflow:hidden;border-radius:${pad ? 0 : Math.round(s * 0.22)}px">${svg.replace("<svg ", `<svg width="${s}" height="${s}" `).replace('rx="7"', pad ? 'rx="0"' : 'rx="7"')}</div></body></html>`;
const ogHtml = `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>
html,body{margin:0;width:1200px;height:630px;overflow:hidden}
body{background:linear-gradient(135deg,#0f3a5f,#165a8f);color:#fff;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;display:flex;flex-direction:column;justify-content:center;padding:0 90px;box-sizing:border-box}
.row{display:flex;align-items:center;gap:34px}.logo{width:150px;height:150px;flex:none}
h1{margin:0;font-size:72px;letter-spacing:-.02em;line-height:1.08}p{margin:16px 0 0;font-size:34px;color:#cfe3f4;line-height:1.35}
.badges{display:flex;gap:16px;margin-top:56px}.b{padding:12px 24px;border-radius:999px;border:2px solid rgba(255,255,255,.35);font-size:26px;font-weight:600}.b.v{background:#ffb454;border-color:#ffb454;color:#2a1a00}
</style></head><body><div class="row"><div class="logo">${svg.replace("<svg ", '<svg width="150" height="150" ')}</div><div><h1>${esc(NAME)}</h1><p>JSON und XML lesen, Bundles durchsuchen, FHIRPath testen</p></div></div>
<div class="badges"><span class="b">Ressourcen &amp; Bundles</span><span class="b">FHIRPath</span><span class="b v">Läuft im Browser – kein Upload</span></div></body></html>`;
const CHROME = process.env.CHROME || "/usr/bin/google-chrome";
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
try {
  const pg = await browser.newPage();
  const shots = {};
  for (const [name, size, pad] of [["favicon-32.png", 32, 0], ["favicon-48.png", 48, 0], ["apple-touch-icon.png", 180, 1], ["icon-192.png", 192, 0], ["icon-512.png", 512, 0]]) {
    await pg.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
    await pg.setContent(iconHtml(size, pad));
    const png = await pg.screenshot({ type: "png", omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
    write(name, png); shots[size] = png;
  }
  const png = shots[48];
  const h = Buffer.alloc(22); h.writeUInt16LE(0, 0); h.writeUInt16LE(1, 2); h.writeUInt16LE(1, 4); h.writeUInt8(48, 6); h.writeUInt8(48, 7); h.writeUInt16LE(1, 10); h.writeUInt16LE(32, 12); h.writeUInt32LE(png.length, 14); h.writeUInt32LE(22, 18);
  write("favicon.ico", Buffer.concat([h, png]));
  await pg.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await pg.setContent(ogHtml);
  write("og-image.png", await pg.screenshot({ type: "png", clip: { x: 0, y: 0, width: 1200, height: 630 } }));
} finally { await browser.close(); }
console.log("Seiten:", pages.map((p) => p.path || "/").join(", "));
fs.writeFileSync(path.join(root, ".build-info.json"), JSON.stringify({ pages: pages.map((p) => ({ path: p.path, title: p.title, desc: p.desc, h1: p.h1 })), tools: toolStatus }, null, 1));
