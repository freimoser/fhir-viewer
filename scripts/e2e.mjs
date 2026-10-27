// Browser-Test (Chrome + puppeteer-core) gegen die lokal unter /fhir-viewer/ servierte Seite, oder gegen E2E_BASE (live).
import fs from "node:fs"; import path from "node:path"; import puppeteer from "puppeteer-core";
import { serve } from "./serve.mjs";
const live = process.env.E2E_BASE; const PORT = Number(process.env.E2E_PORT || 18766);
const BASE = live || `http://localhost:${PORT}/fhir-viewer/`;
const SHOTS = process.env.SHOTS || "/workspace/work-hl7/shots"; fs.mkdirSync(SHOTS, { recursive: true });
const srv = live ? null : await serve(PORT);
const info = JSON.parse(fs.readFileSync(new URL("../.build-info.json", import.meta.url), "utf8"));
const SAMPLE_IDS = ["patient", "observation", "blutdruck", "condition", "encounter", "bundle-verweise", "bundle-suche", "bundle-transaktion"];
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox"] });
let bad = 0, okc = 0; const fail = (m) => { bad++; console.log("FEHLER:", m); }; const ok = (m) => { okc++; if (process.env.V) console.log("ok:", m); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function open(w, p, h = 900) {
  const pg = await browser.newPage(); const errs = [];
  await pg.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  pg.on("console", (m) => { if (["error", "warning"].includes(m.type())) errs.push("console." + m.type() + ": " + m.text()); });
  pg.on("pageerror", (e) => errs.push("pageerror: " + e.message));
  pg.on("requestfailed", (r) => errs.push("requestfailed: " + r.url()));
  pg.on("response", (r) => { if (r.status() >= 400 && !r.url().endsWith("/404.html")) errs.push("HTTP " + r.status() + " " + r.url()); });
  const reqs = []; pg.on("request", (r) => reqs.push(r.url()));
  await pg.goto(BASE + p, { waitUntil: "networkidle0" });
  return { pg, errs, reqs };
}
const overflow = (pg) => pg.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, bw: document.body.scrollWidth }));
const stat = (pg) => pg.evaluate(() => (document.querySelector("#fv-status") || {}).textContent || "");

const SKIP = process.env.SKIP12 === "1";
// 1. alle Seiten bei 320/360/1280: Überlauf, Konsole, Menü
for (const w of SKIP ? [] : [320, 360, 1280]) {
  for (const p of [...info.pages.map((x) => x.path), "404.html"]) {
    const { pg, errs } = await open(w, p);
    const o = await overflow(pg); if (o.sw > o.cw || o.bw > o.cw) fail(`Überlauf ${w}px ${p || "/"}: ${JSON.stringify(o)}`); else ok("kein Überlauf " + w + " " + p);
    if (errs.length) fail(`Konsole ${w}px ${p}: ${errs.join(" | ")}`);
    if (w <= 760) {
      const vis0 = await pg.evaluate(() => getComputedStyle(document.querySelector("#site-nav")).display !== "none");
      await pg.click("#menu-btn"); await sleep(150);
      const exp = await pg.evaluate(() => document.querySelector("#menu-btn").getAttribute("aria-expanded"));
      const vis1 = await pg.evaluate(() => { const r = document.querySelector("#site-nav").getBoundingClientRect(); return r.height > 20 && getComputedStyle(document.querySelector("#site-nav")).display !== "none"; });
      if (vis0 || !vis1 || exp !== "true") fail(`Menü ${w}px ${p}: zu=${vis0} auf=${vis1} aria=${exp}`); else ok("Menü " + w);
      const o2 = await overflow(pg); if (o2.sw > o2.cw) fail(`Überlauf bei offenem Menü ${w}px ${p}`);
      await pg.click("#menu-btn"); await sleep(100);
      if (p === "") await pg.screenshot({ path: `${SHOTS}/fhir-home-${w}.png` });
    } else if (p === "" ) await pg.screenshot({ path: `${SHOTS}/fhir-home-${w}.png` });
    if (w > 760) { const v = await pg.evaluate(() => getComputedStyle(document.querySelector("#menu-btn")).display); if (v !== "none") fail("Hamburger sichtbar bei " + w); }
    await pg.close();
  }
}
console.log("Seiten-Test fertig, Fehler bisher:", bad);

// 2. Beispiele laden (alle 8) bei 1280 und 360
for (const w of SKIP ? [] : [1280, 360]) for (const id of SAMPLE_IDS) {
  const { pg, errs, reqs } = await open(w, "");
  await pg.click(`[data-sample="${id}"]`); await pg.waitForSelector("#fv-out:not([hidden])", { timeout: 5000 }).catch(() => {});
  await sleep(200);
  const st = await stat(pg); const shown = await pg.evaluate(() => !document.querySelector("#fv-out").hidden && document.querySelector("#fv-out").textContent.length > 40);
  if (!shown) fail(`Beispiel ${id} (${w}) nicht angezeigt: ${st}`); else ok("Beispiel " + id);
  const o = await overflow(pg); if (o.sw > o.cw) fail(`Überlauf nach Beispiel ${id} ${w}: ${JSON.stringify(o)}`);
  if (errs.length) fail(`Konsole Beispiel ${id}: ${errs.join(" | ")}`);
  if (reqs.some((u) => !u.startsWith(BASE) && !u.startsWith("data:") && !u.startsWith("blob:"))) fail("Fremde Anfrage: " + reqs.filter((u) => !u.startsWith(BASE)).join(","));
  if (id === "patient" && w === 1280) await pg.screenshot({ path: `${SHOTS}/fhir-patient-karte-${w}.png` });
  if (id === "bundle-verweise") await pg.screenshot({ path: `${SHOTS}/fhir-bundle-${w}.png` });
  await pg.close();
}

// 3. Bundle: Referenz anklicken
{
  const { pg, errs } = await open(1280, "");
  await pg.click('[data-sample="bundle-verweise"]'); await pg.waitForSelector("#fv-entries .entry", { timeout: 5000 });
  const n = await pg.$$eval("#fv-entries .entry", (e) => e.length);
  await (await pg.$$("#fv-entries .entry"))[1].click(); await sleep(200);
  const before = await pg.$eval("#fv-detail", (d) => d.textContent.slice(0, 80));
  const ref = await pg.$("#fv-detail button.ref"); 
  if (!ref) fail("Keine klickbare Referenz im Detail (Eintrag 2)"); else {
    const t1 = await pg.$eval("#fv-detail", (d) => d.textContent); await ref.click(); await sleep(250);
    const t2 = await pg.$eval("#fv-detail", (d) => d.textContent); const back = await pg.$("#fv-back");
    if (t1 === t2) fail("Referenzklick änderte nichts"); else ok("Referenz geklickt"); if (!back) fail("Zurück-Button fehlt nach Referenzklick");
    await pg.screenshot({ path: `${SHOTS}/fhir-bundle-referenz-1280.png` });
  }
  console.log("Bundle-Einträge:", n);
  const moreVis = await pg.$eval("#fv-more", (m) => m.offsetParent !== null).catch(() => false); if (moreVis) fail("\"Weitere Einträge\"-Knopf sichtbar bei " + n + " Einträgen"); else ok("Mehr-Knopf versteckt");
  // Filter
  await pg.$eval('input[aria-label="Einträge filtern"]', (i) => { i.value = "Observation"; i.dispatchEvent(new Event("input", { bubbles: true })); }); await sleep(200);
  const n2 = await pg.$$eval("#fv-entries .entry", (e) => e.length); if (!(n2 > 0 && n2 <= n)) fail("Filter ohne Wirkung " + n2); else ok("Filter " + n + "→" + n2);
  if (errs.length) fail("Konsole Bundle: " + errs.join(" | "));
  await pg.close();
}

// 4. Download (CSP: Blob-URL)
{
  const dir = "/tmp/fhir-dl"; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir);
  const { pg, errs } = await open(1280, "");
  const cdp = await pg.createCDPSession(); await cdp.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: dir });
  await pg.click('[data-sample="patient"]'); await pg.waitForSelector("#fv-download", { timeout: 5000 }); await pg.click("#fv-download"); await sleep(800);
  const files = fs.readdirSync(dir); if (!files.length) fail("Download unter CSP kam nicht an"); else { const j = JSON.parse(fs.readFileSync(path.join(dir, files[0]), "utf8")); if (j.resourceType !== "Patient") fail("Download-Inhalt"); else ok("Download " + files[0]); }
  if (errs.length) fail("Konsole Download: " + errs.join(" | "));
  await pg.close();
}

// 5. Einfügen: JSON, XML, Fehler
{
  const { pg, errs } = await open(1280, "");
  const xml = `<Patient xmlns="http://hl7.org/fhir"><id value="x1"/><name><family value="Muster"/><given value="Max"/></name><birthDate value="1980-02-30"/></Patient>`;
  await pg.$eval("#fv-input", (i) => { i.value = ""; }); await pg.type("#fv-input", xml, { delay: 0 }); await pg.click("#fv-show"); await sleep(300);
  const t = await pg.$eval("#fv-out", (o) => o.textContent); if (!/Muster/.test(t)) fail("XML nicht angezeigt"); else ok("XML eingefügt"); console.log("XML-Hinweise:", (await stat(pg)).slice(0, 200), "|", /30|Datum/.test(t) ? "Datumshinweis vorhanden" : "kein Datumshinweis");
  await pg.$eval("#fv-input", (i) => { i.value = '{"resourceType":"Patient", "id": '; }); await pg.click("#fv-show"); await sleep(200);
  const s2 = await stat(pg); if (!s2) fail("Keine Fehlermeldung bei kaputtem JSON"); else ok("Fehlermeldung: " + s2.slice(0, 100)); console.log("Meldung kaputtes JSON:", s2.slice(0, 200));
  // Zu große Datei: altes Ergebnis darf nicht stehen bleiben
  await pg.$eval("#fv-input", (i) => { i.value = '{"resourceType":"Patient","id":"alt"}'; }); await pg.click("#fv-show"); await sleep(200);
  const big = "/tmp/fv-gross.json"; fs.writeFileSync(big, Buffer.alloc(21 * 1024 * 1024, 32));
  await (await pg.$("#fv-file")).uploadFile(big); await sleep(500);
  const gross = await pg.evaluate(() => ({ out: document.querySelector("#fv-out").hidden || !document.querySelector("#fv-out").textContent.trim(), st: document.querySelector("#fv-status, .status")?.textContent || "" }));
  if (!gross.out || !/20 MB/.test(gross.st)) fail("Nach zu großer Datei bleibt altes Ergebnis oder Fehler fehlt: " + JSON.stringify(gross)); else ok("Zu große Datei leert Ergebnis");
  fs.unlinkSync(big);
  // Deutsche JSON-Meldung
  await pg.$eval("#fv-input", (i) => { i.value = '{"a":1,}'; }); await pg.click("#fv-show"); await sleep(200);
  const dj = await stat(pg); if (/Unexpected|Expected|JSON\.parse/.test(dj)) fail("Englische JSON-Meldung: " + dj.slice(0, 160)); else ok("Deutsche JSON-Meldung");
  if (errs.length) fail("Konsole Einfügen: " + errs.join(" | "));
  await pg.close();
}

// 6. FHIRPath im Viewer (lazy)
{
  const { pg, errs, reqs } = await open(1280, "");
  const chunkBefore = reqs.filter((u) => /chunk-/.test(u)).length;
  await pg.click('[data-sample="patient"]'); await pg.waitForSelector("#fv-out:not([hidden])");
  const tab = await pg.evaluateHandle(() => [...document.querySelectorAll('#fv-out [role="tab"], #fv-out button')].find((b) => /FHIRPath/.test(b.textContent)));
  await tab.asElement().click(); await sleep(300);
  await pg.waitForSelector("#fv-fp-expr", { visible: true, timeout: 5000 });
  await pg.$eval("#fv-fp-expr", (i) => { i.value = ""; }); await pg.type("#fv-fp-expr", "name.where(use='official').given.first()"); await pg.click("#fv-fp-run");
  await pg.waitForFunction(() => /Peter/.test(document.querySelector("#fv-fp-result").textContent), { timeout: 8000 }).then(() => ok("FHIRPath Ergebnis"), () => fail("FHIRPath-Ergebnis fehlt: " + "(" + "")); 
  const txt = await pg.$eval("#fv-fp-result", (r) => r.textContent); console.log("FHIRPath-Ausgabe:", txt.slice(0, 160));
  await pg.screenshot({ path: `${SHOTS}/fhir-fhirpath-1280.png` });
  await pg.$eval("#fv-fp-expr", (i) => { i.value = ""; }); await pg.type("#fv-fp-expr", "name.where(use='official'"); await pg.click("#fv-fp-run"); await sleep(500);
  console.log("FHIRPath-Fehlerausgabe:", (await pg.$eval("#fv-fp-result", (r) => r.textContent)).slice(0, 200));
  console.log("Chunks nachgeladen:", reqs.filter((u) => /chunk-/.test(u)).length, "(vorher", chunkBefore + ")");
  if (errs.length) fail("Konsole FHIRPath: " + errs.join(" | "));
  await pg.close();
}

// 7. FHIRPath-Seite: alle Beispielknöpfe
{
  const { pg, errs } = await open(1280, "fhirpath-tester/");
  const n = await pg.$$eval("[data-fp-sample]", (b) => b.length); console.log("FHIRPath-Beispielknöpfe:", n);
  for (let i = 0; i < n; i++) {
    const exprExpected = await pg.$$eval("[data-fp-sample]", (b, i) => b[i].dataset.fpExpr, i);
    await (await pg.$$("[data-fp-sample]"))[i].click(); await sleep(700);
    const val = await pg.$eval("#fv-fp-expr", (e) => e.value).catch(() => null); const res = await pg.$eval("#fv-fp-result", (r) => r.textContent).catch(() => "");
    if (val !== exprExpected) fail(`FHIRPath-Knopf ${i}: Ausdruck ${val} != ${exprExpected}`); else if (!res || /nicht|Fehler/i.test(res.slice(0, 40))) fail(`FHIRPath-Knopf ${i}: Ergebnis "${res.slice(0, 80)}"`); else ok("FP-Knopf " + i);
  }
  await pg.screenshot({ path: `${SHOTS}/fhir-fhirpath-seite-1280.png`, fullPage: false });
  if (errs.length) fail("Konsole FHIRPath-Seite: " + errs.join(" | "));
  await pg.close();
}

// 8. Ressourcenseiten: Beispiel öffnen
for (const [p, id] of [["fhir-patient-beispiel/", "patient"], ["fhir-observation-beispiel/", "observation"], ["fhir-encounter-beispiel/", "encounter"], ["fhir-condition-beispiel/", "condition"], ["fhir-bundle-anzeigen/", "bundle-verweise"], ["was-ist-fhir/", "encounter"]]) {
  const { pg, errs } = await open(360, p);
  const b = await pg.$(`[data-sample="${id}"]`); if (!b) { fail(`${p}: Knopf ${id} fehlt`); await pg.close(); continue; }
  await b.click(); await pg.waitForSelector("#fv-out:not([hidden])", { timeout: 5000 }).catch(() => fail(p + ": nichts angezeigt"));
  const o = await overflow(pg); if (o.sw > o.cw) fail(`Überlauf ${p} nach Beispiel`);
  if (errs.length) fail(`Konsole ${p}: ${errs.join(" | ")}`);
  await pg.screenshot({ path: `${SHOTS}/fhir-${p.replace(/\//g, "") || "home"}-360.png` });
  await pg.close();
}
await browser.close(); if (srv) srv.close();
console.log(`\nE2E: ${okc} ok, ${bad} Fehler`); process.exit(bad ? 1 : 0);
