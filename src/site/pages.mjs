import assert from "node:assert/strict";
import { SAMPLES } from "../data/samples.mjs";
import { parseInput } from "../lib/parse.mjs";
import { parseXml } from "../lib/xml.mjs";
import { buildModel, checkModel } from "../lib/model.mjs";
import { runFhirPath } from "../lib/fhirpath.mjs";
import { CARD_FIELDS } from "../lib/cards.mjs";
import { NAME, SHORT, SLUG, BASE, SITE, LASTMOD, AUTHOR, EDITORIAL, EDITORIAL_LINK, DEFINITION, DISCLAIMER_TM } from "./config.mjs";
import { esc, href, url, page, crumbs, breadcrumbLD, PERSON_LD, viewerBlock, toolsBlock, aboutBlock } from "./layout.mjs";
import { SRC, srcList, DE_FACTS, FAQ } from "./content.mjs";

const S = (id) => SAMPLES.find((s) => s.id === id);
const J = (id) => JSON.parse(S(id).json);
const code = (t) => `<code>${esc(t)}</code>`;
const sampleBtn = (id, label) => ({ id, label });
const viewerLink = (id, label = "Im Viewer öffnen") => `<a href="${href("")}?beispiel=${id}#viewer">${esc(label)}</a>`;
const clip = (v, n = 80) => { const t = typeof v === "string" ? JSON.stringify(v) : JSON.stringify(v); return t.length > n ? t.slice(0, n - 1) + "…" : t; };

async function fp(id, expr) {
  const r = await runFhirPath(expr, J(id));
  assert.ok(r.ok, `FHIRPath-Ausdruck schlägt fehl: ${expr}: ${r.error}`);
  return r.results.map((x) => x.value);
}
async function fpError(id, expr) {
  const r = await runFhirPath(expr, J(id));
  assert.equal(r.ok, false, `Fehler erwartet: ${expr}`);
  return r.error;
}
function hintsFor(res) { return checkModel(buildModel(res)); }
function viewerHints(mutate, id, type) {
  const r = JSON.parse(JSON.stringify(J(id))); mutate(r);
  return hintsFor(r).filter((h) => !type || h.level === type);
}

function sampleCards(ids) {
  return `<div class="samples">${ids.map((id) => { const s = S(id); return `<article class="sample"><h3>${esc(s.title)}</h3><p>${esc(s.desc)} ${s.bytes} Bytes.</p><button class="btn" type="button" data-sample="${id}">Beispiel laden</button></article>`; }).join("")}</div>`;
}

function faqHtml() {
  return `<div class="faq">${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div>`;
}

function faqLD() {
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
}

function webPageLD(path, title, desc, crumbItems) {
  return [
    { "@context": "https://schema.org", "@type": "WebPage", name: title, description: desc, url: url(path), inLanguage: "de-DE", dateModified: LASTMOD, isPartOf: { "@type": "WebSite", name: SHORT, url: SITE }, author: PERSON_LD },
    breadcrumbLD(crumbItems),
  ];
}

const FEATURES = [
  "FHIR-Ressourcen und Bundles als JSON oder XML einfügen oder als Datei öffnen",
  "Ressourcentyp erkennen und als Karte oder aufklappbaren Baum anzeigen",
  "Bundle-Übersicht mit Anzahl je Ressourcentyp, Eintragsliste und Filter",
  "Referenzen innerhalb eines Bundles anklicken (fullUrl, Typ/id, Identifier, contained)",
  "Plausibilitätshinweise zu Syntax, Pflichtfeldern, Bundle-Regeln, Datumsformaten und Referenzen",
  "FHIRPath-Ausdrücke auf einer Ressource oder einem ganzen Bundle auswerten",
  "Einzelne Ressourcen oder das ganze Bundle als JSON speichern oder kopieren",
  "Beispiele aus der FHIR-Spezifikation R4 (CC0) laden",
];

function homeErrors() {
  const cases = [
    ["Abgeschnittenes JSON", '{"resourceType": "Patient", "id": "x", "name": [{"family": "Muster"}'],
    ["Komma zu viel", '{"resourceType": "Patient",}'],
    ["Kein resourceType", '{"id": "x", "name": [{"family": "Muster"}]}'],
    ["Tippfehler im Typ", '{"resourceType": "Patent", "id": "x"}'],
    ["Deutsches Datumsformat", '{"resourceType": "Patient", "birthDate": "25.12.1974"}'],
    ["XML ohne Namensraum", '<Patient><id value="x"/></Patient>'],
    ["Bundle ohne type, Referenz ins Leere", '{"resourceType":"Bundle","entry":[{"resource":{"resourceType":"Observation","id":"o","status":"final","code":{"text":"x"},"subject":{"reference":"Patient/zzz"}}}]}'],
  ];
  const rows = cases.map(([label, input]) => {
    const r = parseInput(input);
    let msgs;
    if (!r.ok) msgs = [r.error.message + (r.error.hint ? " – " + r.error.hint : "")];
    else msgs = (r.notes || []).concat(checkModel(buildModel(r.resource))).map((h) => `${h.level === "error" ? "Fehler" : h.level === "warn" ? "Warnung" : "Info"}: ${h.msg}`);
    assert.ok(msgs.length > 0, "Fall ohne Meldung: " + label);
    return { label, input, msgs };
  });
  return `<div class="tablewrap"><table><thead><tr><th>Eingabe</th><th>Meldung des Viewers</th></tr></thead><tbody>${rows.map((r) => `<tr><td><strong>${esc(r.label)}</strong><br>${code(r.input.length > 90 ? r.input.slice(0, 89) + "…" : r.input)}</td><td>${r.msgs.map((m) => `<p>${esc(m)}</p>`).join("")}</td></tr>`).join("")}</tbody></table></div>`;
}

function fieldTable(rows, res) {
  const get = (path) => path.split(".").reduce((o, k) => { if (o == null) return undefined; const m = k.match(/^(\w+)\[(\d+)\]$/); return m ? (o[m[1]] || [])[+m[2]] : o[k]; }, res);
  return `<div class="tablewrap"><table><thead><tr><th>Element</th><th>Wert im Beispiel</th><th>Bedeutung</th></tr></thead><tbody>${rows.map(([p, d]) => { const v = get(p); assert.notEqual(v, undefined, "Beispiel hat kein Feld " + p); return `<tr><td>${code(p)}</td><td>${code(clip(v, 70))}</td><td>${d}</td></tr>`; }).join("")}</tbody></table></div>`;
}

function experiments(items) {
  return `<ul>${items.map(([what, hints]) => { assert.ok(hints.length > 0, "Experiment ohne Hinweis: " + what); return `<li>${what} Der Viewer meldet: ${hints.map((h) => `„${esc(h.msg)}“ (${h.level === "error" ? "Fehler" : h.level === "warn" ? "Warnung" : "Info"})`).join("; ")}</li>`; }).join("")}</ul>`;
}

function sampleInfo(id) {
  const s = S(id);
  return `<p class="stand">Beispiel „${esc(s.title)}“: <a href="${s.url}" rel="noopener">Original in der FHIR-Spezifikation R4</a>, Lizenz CC0 1.0. ${s.removedSnomed ? "Hier ohne SNOMED-CT-Codierungen und ohne Narrativ (<code>text</code>), weil SNOMED CT gesondert lizenziert ist." : "Unverändert bis auf die Formatierung."}</p>`;
}

export async function buildPages({ tools }) {
  const pages = [];
  const others = (cur) => `<section class="box"><h2>Weiterlesen</h2><ul class="cards">${[
    ["", "Viewer", "JSON oder XML einfügen und sofort ansehen"],
    ["fhir-bundle-anzeigen/", "FHIR-Bundle anzeigen", "Bundle-Typen, Einträge und Referenzen lesen"],
    ["fhirpath-tester/", "FHIRPath-Tester", "Pfadausdrücke an echten Beispielen ausprobieren"],
    ["was-ist-fhir/", "Was ist FHIR?", "Ressourcen, JSON/XML, REST und FHIR in Deutschland"],
  ].filter((x) => x[0] !== cur).map(([p, t, d]) => `<li><a href="${href(p)}">${esc(t)}</a><p>${esc(d)}</p></li>`).join("")}</ul></section>`;

  // ---------------- Startseite ----------------
  {
    const path = "";
    const title = "FHIR JSON & XML anzeigen – Viewer für FHIR-Daten im Browser";
    const desc = "FHIR-Ressourcen und Bundles als JSON oder XML lesen: Baum, Karten, Referenzen, Hinweise und FHIRPath-Tester. Im Browser, ohne Upload. Kein Validator.";
    const crumbItems = [{ label: SHORT, url: SITE }];
    const body = `
<h1>${esc(NAME)}</h1>
<p class="lead">${esc(DEFINITION)}</p>
<p class="lead">Dieser Viewer macht solche Daten lesbar: Sie fügen JSON oder XML einer Ressource oder eines Bundles ein, und die Seite zeigt Karte, Baum und Referenzen. Er ersetzt weder den offiziellen FHIR-Validator noch eine Profilprüfung und ist kein Medizinprodukt.</p>
${viewerBlock({ def: "patient", sampleButtons: [sampleBtn("patient", "Patient"), sampleBtn("blutdruck", "Blutdruck"), sampleBtn("bundle-verweise", "Bundle")] })}
<p class="stand">Zuletzt aktualisiert: ${LASTMOD.split("-").reverse().join(".")}. Grundlage ist FHIR R4 (4.0.1).</p>

<section class="prose" aria-labelledby="kann"><h2 id="kann">Was der Viewer kann</h2>
<ul>${FEATURES.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
<p>Eine Kartenansicht gibt es für ${Object.keys(CARD_FIELDS).length} Ressourcentypen (${Object.keys(CARD_FIELDS).join(", ")}); alle anderen Typen sehen Sie als Baum und mit einer allgemeinen Karte. Die Hinweise erklären Sie im Abschnitt <a href="#grenzen">Grenzen</a>.</p></section>

<section class="prose" aria-labelledby="grenzen"><h2 id="grenzen">Grenzen: was der Viewer nicht tut</h2>
<ul>
<li><strong>Keine Validierung.</strong> Profile (zum Beispiel von KBV oder gematik), Terminologien, ValueSets und die meisten Invarianten werden nicht geprüft. Die Hinweise betreffen nur die in den <a href="#faq">FAQ</a> genannten Regeln. „Keine Auffälligkeiten“ heißt nicht „gültig“.</li>
<li><strong>R4 als Grundlage.</strong> R4B- und R5-Daten werden meist angezeigt, die Hinweise sind aber auf R4 ausgerichtet.</li>
<li><strong>FHIRPath mit einer Fremdbibliothek.</strong> Der Tester nutzt <code>evalFhirPath</code> aus <a href="https://github.com/medplum/medplum" rel="noopener">@medplum/core</a>. Die Bibliothek ist nachsichtig: Ein fehlender Punkt wie in <code>name.where(use='official')family</code> wird nicht gemeldet. Ergebnisse können von anderen FHIRPath-Implementierungen abweichen. Mehr dazu im <a href="${href("fhirpath-tester/")}">FHIRPath-Tester</a>.</li>
<li><strong>Kein Medizinprodukt.</strong> Nur zur Ansicht; nicht für Diagnose, Therapie oder Abrechnung.</li>
</ul></section>

<section aria-labelledby="beispiele"><h2 id="beispiele">Beispiele zum Ausprobieren</h2>
<p>Acht Beispiele aus der FHIR-Spezifikation R4, jeweils unter 10 KB. Sie enthalten keine echten Daten. Lizenz: CC0 1.0. Wo SNOMED-CT-Codierungen oder Narrativ entfernt wurden, steht das nach dem Laden beim Beispiel; die Liste aller Quellen finden Sie unter <a href="${href("quellen/")}">Quellen und Lizenzen</a>.</p>
${sampleCards(SAMPLES.map((s) => s.id))}</section>

<section aria-labelledby="erklaert"><h2 id="erklaert">Ressourcen und Bundles erklärt</h2>
<ul class="cards">
<li><a href="${href("fhir-patient-beispiel/")}">FHIR-Patient-Beispiel</a><p>Namen mit <code>use</code>, Adresse, Kontakt: Feld für Feld erklärt.</p></li>
<li><a href="${href("fhir-observation-beispiel/")}">FHIR-Observation-Beispiel</a><p>Körpergewicht und Blutdruck mit <code>component</code>; Code, Wert und Einheit.</p></li>
<li><a href="${href("fhir-encounter-beispiel/")}">FHIR-Encounter-Beispiel</a><p>Der kleinste sinnvolle Behandlungsfall: <code>status</code> und <code>class</code>.</p></li>
<li><a href="${href("fhir-condition-beispiel/")}">FHIR-Condition-Beispiel</a><p>Diagnose mit klinischem Status und Verifizierungsstatus.</p></li>
<li><a href="${href("fhir-bundle-anzeigen/")}">FHIR-Bundle anzeigen</a><p>Wenn eine Datei mehrere Ressourcen enthält und diese aufeinander zeigen.</p></li>
<li><a href="${href("fhirpath-tester/")}">FHIRPath-Tester</a><p>Pfadausdrücke an den Beispielen ausprobieren, inklusive typischer Stolperstellen.</p></li>
<li><a href="${href("was-ist-fhir/")}">Was ist FHIR?</a><p>Grundbegriffe und belegte Quellen zu FHIR in Deutschland.</p></li>
</ul></section>

<section class="prose" aria-labelledby="fehler"><h2 id="fehler">Häufige Fehler und was der Viewer dazu sagt</h2>
<p>Die folgenden Meldungen stammen aus dem Viewer selbst: Beim Erzeugen dieser Seite wurden die Eingaben durch dieselben Funktionen geschickt, die auch im Browser laufen. Bei JSON-Syntaxfehlern kommt der Satzteil nach dem Doppelpunkt vom JSON-Parser Ihres Browsers und kann je nach Browser anders lauten.</p>
${homeErrors()}</section>

<section aria-labelledby="faq"><h2 id="faq">FAQ</h2>${faqHtml()}</section>

${toolsBlock(tools)}
${aboutBlock()}
`;
    const ld = [
      { "@context": "https://schema.org", "@type": ["WebApplication", "DeveloperApplication"], name: NAME, alternateName: SHORT, url: SITE, description: desc, applicationCategory: "DeveloperApplication", operatingSystem: "Webbrowser mit JavaScript", browserRequirements: "JavaScript, aktueller Browser", inLanguage: "de-DE", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" }, featureList: FEATURES, dateModified: LASTMOD, author: PERSON_LD, creator: PERSON_LD },
      faqLD(),
      breadcrumbLD(crumbItems),
      { "@context": "https://schema.org", ...PERSON_LD },
    ];
    pages.push({ path, title, desc, ld, body, h1: NAME, lastmod: LASTMOD });
  }

  // ---------------- Bundle ----------------
  {
    const path = "fhir-bundle-anzeigen/";
    const title = "FHIR Bundle anzeigen: Einträge, Typen und Referenzen lesen";
    const desc = "FHIR-Bundle als JSON oder XML ansehen: Bundle.type, Einträge je Ressourcentyp, anklickbare Referenzen und Regelhinweise (bdl). Im Browser, ohne Upload.";
    const crumbItems = [{ label: SHORT, url: SITE }, { label: "FHIR-Bundle anzeigen", url: url(path) }];
    const refs = J("bundle-verweise");
    const typeCount = (id) => { const m = buildModel(J(id)); return [...m.typeCounts].map(([t, n]) => `${t} ${n}`).join(", "); };
    const body = `
${crumbs([{ href: href(""), label: SHORT }, { label: "FHIR-Bundle anzeigen" }])}
<h1>FHIR-Bundle anzeigen und lesen</h1>
<p class="lead">Ein Bundle ist ein Container für mehrere Ressourcen. Wenn eine FHIR-Datei mit <code>"resourceType": "Bundle"</code> beginnt, steckt der eigentliche Inhalt in <code>entry</code>. Der Viewer zählt die Ressourcen je Typ, listet die Einträge und lässt Sie Referenzen von einem Eintrag zum nächsten anklicken.</p>
${viewerBlock({ def: "bundle-verweise", sampleButtons: [sampleBtn("bundle-verweise", "Bundle mit Referenzen"), sampleBtn("bundle-suche", "Suchergebnis"), sampleBtn("bundle-transaktion", "Transaktion")] })}
${sampleInfo("bundle-verweise")}

<section class="prose" aria-labelledby="was"><h2 id="was">Wofür es Bundles gibt</h2>
<p>Nach der Spezifikation fasst ein Bundle Ressourcen zusammen, zum Beispiel als Ergebnis einer Suche, als Versionsverlauf (history), als Nachricht, als Dokument oder als Transaktion, die mehrere Ressourcen auf einem Server in einem Schritt anlegt, ändert oder löscht. Welche Art vorliegt, steht in <code>Bundle.type</code>: ${code("document | message | transaction | transaction-response | batch | batch-response | history | searchset | collection")}. Das Feld ist ein Pflichtfeld (1..1); fehlt es, meldet der Viewer das.</p>
<p>Ein Bundle ist nicht dasselbe wie <code>contained</code>: Contained-Ressourcen existieren nur im Kontext ihrer Elternressource, Bundle-Einträge können dagegen eigenständig abrufbar sein.</p></section>

<section class="prose" aria-labelledby="lesen"><h2 id="lesen">So lesen Sie ein Bundle im Viewer</h2>
<ol>
<li><strong>Kopfzeile:</strong> Neben Format und Ressourcentyp stehen die Zahl der Einträge und <code>type</code>. Im Beispiel oben: ${refs.entry.length} Einträge, <code>type: ${esc(refs.type)}</code>. Die „Bundle-Übersicht“ darunter zählt je Ressourcentyp: ${esc(typeCount("bundle-verweise"))}.</li>
<li><strong>Typ-Filter und Suche:</strong> Ein Klick auf einen Typ blendet die Einträge der anderen Typen aus. Das Suchfeld filtert die Eintragsliste.</li>
<li><strong>Eintrag wählen:</strong> Karte, Baum und FHIRPath beziehen sich auf den gewählten Eintrag; im FHIRPath-Tab können Sie auch das ganze Bundle auswerten.</li>
<li><strong>Referenzen folgen:</strong> Ein Verweis führt zum Zieleintrag, mit „← Zurück“ kehren Sie um. Beim Ziel steht unter „Referenziert von“, welche Einträge auf ihn zeigen.</li>
<li><strong>Hinweise lesen:</strong> Die Liste „Plausibilitätshinweise“ nennt auffällige Stellen; ein Klick auf die Stelle springt zum betroffenen Eintrag.</li>
</ol></section>

<section class="prose" aria-labelledby="refs"><h2 id="refs">Wie Referenzen aufgelöst werden</h2>
<p>Eine Referenz wie <code>"reference": "Patient/example"</code> ist ein Verweis, kein Einbetten. Der Viewer sucht das Ziel in dieser Reihenfolge: zuerst einen Eintrag, dessen <code>fullUrl</code> passt (auch eine relative Referenz wird gegen die Basis der <code>fullUrl</code> aufgelöst), bei Versionsangaben passend zur <code>meta.versionId</code>; bei einer Referenz nur mit <code>identifier</code> einen Eintrag mit diesem Identifier; bei <code>#id</code> eine <code>contained</code>-Ressource. Findet er nichts über die <code>fullUrl</code>, versucht er Typ und <code>id</code> und markiert das als Info, weil die Spezifikation dafür nichts festlegt. Externe URLs löst die Seite nicht auf, weil sie keine Netzwerkanfragen stellt; sie erscheinen als Info.</p>
<p>Zur Einordnung der Referenzarten steht in der Spezifikation: ein Literalverweis (<code>reference</code>) und ein logischer Verweis (<code>identifier</code>) sind beide möglich.</p></section>

<section class="prose" aria-labelledby="regeln"><h2 id="regeln">Welche Bundle-Regeln der Viewer prüft</h2>
<div class="tablewrap"><table><thead><tr><th>Regel</th><th>Inhalt laut Spezifikation</th></tr></thead><tbody>
<tr><td>bdl-1</td><td><code>total</code> nur bei searchset oder history</td></tr>
<tr><td>bdl-3</td><td><code>entry.request</code> Pflicht bei batch, transaction und history, sonst nicht erlaubt</td></tr>
<tr><td>bdl-4</td><td><code>entry.response</code> Pflicht bei batch-response, transaction-response und history, sonst nicht erlaubt</td></tr>
<tr><td>bdl-7</td><td><code>fullUrl</code> eindeutig, oder die Einträge unterscheiden sich in <code>meta.versionId</code> (nicht bei history)</td></tr>
<tr><td>bdl-9, bdl-10</td><td>Ein Dokument braucht einen <code>identifier</code> mit system und value sowie einen <code>timestamp</code></td></tr>
<tr><td>bdl-11, bdl-12</td><td>Dokument: erste Ressource ist eine Composition; Nachricht: erste Ressource ist ein MessageHeader</td></tr>
</tbody></table></div>
<p>Nicht geprüft werden bdl-2, bdl-5 und bdl-8 sowie alle Regeln der enthaltenen Ressourcen. Zusätzlich gibt es eine Warnung, wenn <code>fullUrl</code> außerhalb von transaction und batch fehlt. Der Viewer bleibt damit eine Lesehilfe und ersetzt keine Validierung.</p></section>

<section class="prose" aria-labelledby="beispiele"><h2 id="beispiele">Die drei Bundle-Beispiele</h2>
<ul>
<li><strong>Bundle mit Referenzen</strong> (collection): ${esc(typeCount("bundle-verweise"))} (Anzahl der Einträge). Gut, um Klicks von einer Observation zum Patienten zu üben. Zwei Hinweise (Info): eine Referenz auf einen externen Server und eine, die nur über Typ und <code>id</code> gefunden wird.</li>
<li><strong>Suchergebnis</strong> (searchset): ${esc(typeCount("bundle-suche"))}. Eine MedicationRequest und das Arzneimittel, auf das sie über <code>medicationReference</code> verweist. Der Viewer meldet hier, dass der Patient <code>Patient/347</code> nicht im Bundle liegt: ein Suchergebnis enthält nicht automatisch alle referenzierten Ressourcen.</li>
<li><strong>Transaktion</strong> (transaction): ${esc(typeCount("bundle-transaktion"))}. Jeder Eintrag trägt <code>request</code> mit Methode und URL, etwa <code>POST Patient</code>, <code>PUT Patient/123</code> und <code>DELETE Patient/234</code>; Regel bdl-3 verlangt genau das.</li>
</ul>
${sampleCards(["bundle-verweise", "bundle-suche", "bundle-transaktion"])}</section>
<section class="prose"><h2>Passend dazu</h2><p>Mit dem <a href="${href("fhirpath-tester/")}">FHIRPath-Tester</a> zählen Sie zum Beispiel die Observations eines Bundles. Wie Ressourcen allgemein aufgebaut sind, steht unter <a href="${href("was-ist-fhir/")}">Was ist FHIR?</a>.</p></section>
<section class="box"><h2>Quellen dieser Seite</h2>${srcList(["bundle", "references", "resource"])}</section>
${others(path)}
`;
    pages.push({ path, title, desc, ld: webPageLD(path, title, desc, crumbItems), body, h1: "FHIR-Bundle anzeigen und lesen", lastmod: LASTMOD });
  }

  // ---------------- FHIRPath ----------------
  {
    const path = "fhirpath-tester/";
    const title = "FHIRPath-Tester online für FHIR-Ressourcen (mit Beispielen)";
    const desc = "FHIRPath-Ausdrücke direkt auf FHIR-JSON oder -XML auswerten: fünf Beispiele mit Ergebnissen, typische Stolperstellen und ein Tester im Browser.";
    const crumbItems = [{ label: SHORT, url: SITE }, { label: "FHIRPath-Tester", url: url(path) }];
    const ex = [
      { s: "patient", e: "name.where(use='official').given.first()", t: "Ein Element aus einer Liste herausfiltern", d: "Ein Patient kann mehrere <code>name</code>-Einträge haben, im Beispiel drei (<code>official</code>, <code>usual</code>, <code>maiden</code>). <code>where(use='official')</code> behält den passenden Eintrag, <code>given</code> nimmt dessen Vornamen, <code>first()</code> den ersten." },
      { s: "patient", e: "telecom.where(use='mobile').value", t: "Kontaktdaten nach Verwendung wählen", d: "<code>telecom</code> ist eine Liste von Kontaktpunkten. Der Filter auf <code>use</code> liefert die Mobilnummer; ein Eintrag ohne <code>value</code> trägt nichts zum Ergebnis bei." },
      { s: "observation", e: "code.coding.where(system='http://loinc.org').code", t: "Einen Code aus einem bestimmten Codesystem lesen", d: "Ein <code>CodeableConcept</code> kann mehrere Codierungen aus verschiedenen Systemen enthalten. Der Filter auf <code>system</code> lässt hier die zwei LOINC-Codes übrig – ein Ergebnis mit zwei Werten, kein einzelner Wert." },
      { s: "blutdruck", e: "component.value.ofType(Quantity).value", t: "Werte aus component lesen", d: "Der Blutdruck steht in zwei <code>component</code>-Einträgen. <code>value</code> ist ein Auswahlelement (<code>value[x]</code>); <code>ofType(Quantity)</code> wählt die Variante <code>valueQuantity</code>. Ergebnis: systolisch und diastolisch." },
      { s: "bundle-verweise", e: "entry.resource.ofType(Observation).count()", t: "Ressourcen in einem Bundle zählen", d: "Bei einem Bundle gilt der Ausdruck für die Wurzel. <code>entry.resource</code> sammelt alle eingebetteten Ressourcen, <code>ofType(Observation)</code> behält die Observations, <code>count()</code> zählt sie. Im Viewer wählen Sie dazu „Ganzes Bundle“.", scope: "bundle" },
    ];
    for (const x of ex) x.r = await fp(x.s, x.e);
    const pit1 = { s: "blutdruck", bad: "component.where(code.coding.code='8480-6').value.ofType(Quantity).value", good: "component.where(code.coding.where(code='8480-6').exists()).value.ofType(Quantity).value" };
    pit1.rb = await fp(pit1.s, pit1.bad); pit1.rg = await fp(pit1.s, pit1.good);
    assert.equal(pit1.rb.length, 0); assert.deepEqual(pit1.rg, [107]);
    const pit2 = { bad: "name.given = 'Peter'", good: "name.given.where($this = 'Peter').exists()" };
    pit2.rb = await fp("patient", pit2.bad); pit2.rg = await fp("patient", pit2.good);
    assert.deepEqual(pit2.rb, [false]); assert.deepEqual(pit2.rg, [true]);
    const pit3 = { bad: "name.family + ' ' + name.given.first()", good: "name.first().family + ' ' + name.first().given.first()" };
    pit3.eb = await fpError("patient", pit3.bad); pit3.rg = await fp("patient", pit3.good);
    const lenient = await fp("patient", "name.where(use='official')family");
    assert.equal(lenient.length, 1);
    const givenCount = (await fp("patient", "name.given.count()"))[0];
    const exHtml = ex.map((x, i) => `<article class="box"><h3>${i + 1}. ${esc(x.t)}</h3>
<p>${code(x.e)} auf dem Beispiel „${esc(S(x.s).title)}“ ergibt: ${code(clip(x.r, 120))}</p>
<p>${x.d}</p>
<button class="btn" type="button" data-fp-sample="${x.s}" data-fp-expr="${esc(x.e)}"${x.scope ? ` data-fp-scope="${x.scope}"` : ""}>Im Tester ausprobieren</button></article>`).join("\n");
    const body = `
${crumbs([{ href: href(""), label: SHORT }, { label: "FHIRPath-Tester" }])}
<h1>FHIRPath-Tester für FHIR-Ressourcen</h1>
<p class="lead">FHIRPath ist die Pfadsprache, mit der FHIR Elemente in Ressourcen auswählt: <code>name.where(use='official').given</code> etwa liefert die Vornamen des offiziellen Namens. Der Tester wertet Ausdrücke direkt auf Ihrem JSON oder XML aus – im Browser, ohne Upload.</p>
${viewerBlock({ def: "patient", tab: "fhirpath", sampleButtons: [sampleBtn("patient", "Patient"), sampleBtn("blutdruck", "Blutdruck"), sampleBtn("bundle-verweise", "Bundle")] })}
<section class="prose" aria-labelledby="wofuer"><h2 id="wofuer">Wofür FHIRPath in FHIR gebraucht wird</h2>
<p>Die Spezifikation nennt FHIRPath (für R4: Release 2) als Pfadsprache für unter anderem Invarianten in <code>ElementDefinition</code> (Regeln für das Zusammenspiel von Elementen), Slicing-Diskriminatoren und Suchparameter. FHIRPath arbeitet auf dem logischen Modell einer Ressource, nicht auf der JSON- oder XML-Syntax. Praktisch heißt das: Derselbe Ausdruck gilt für JSON und XML, und ein Ausdruck liefert immer eine <em>Liste</em> (Collection) von null, einem oder mehreren Werten.</p>
<p>Dieser Tester nutzt <code>evalFhirPath</code> aus <a href="https://github.com/medplum/medplum" rel="noopener">@medplum/core</a> (Apache-2.0), das erst beim ersten Auswerten nachgeladen wird. Die Bibliothek ist nachsichtig und nicht identisch mit anderen Implementierungen: Zum Beispiel liefert <code>name.where(use='official')family</code> (Punkt vergessen) kein Fehlersignal, sondern ${code(clip(lenient[0], 60))}. Verlassen Sie sich für Regelwerke daher nicht allein auf dieses Ergebnis. Der Tester prüft auch nicht, ob ein Pfad für den Ressourcentyp laut Spezifikation existiert.</p></section>

<section aria-labelledby="fuenf"><h2 id="fuenf">Fünf Beispiele</h2>
<p>Alle Ergebnisse wurden beim Erzeugen dieser Seite mit demselben Code berechnet, den der Tester im Browser nutzt.</p>
${exHtml}</section>

<section class="prose" aria-labelledby="stolper"><h2 id="stolper">Typische Stolperstellen</h2>
<h3>Leere Menge statt Treffer: mehrere Codierungen</h3>
<p>${code(pit1.bad)} liefert auf dem Blutdruck-Beispiel <strong>nichts</strong> (${code("[]")}), obwohl der systolische Wert vorhanden ist. Der <code>code</code> der Komponente hat zwei Codierungen (LOINC und ein lokales System), <code>code.coding.code</code> sind also zwei Werte, und der Vergleich mit <code>=</code> auf einer Liste mit zwei Elementen trifft nicht. Besser: ${code(pit1.good)} ergibt ${code(JSON.stringify(pit1.rg))}.</p>
<h3>Vergleich mit einer Liste</h3>
<p>Ein Patient hat im Beispiel ${givenCount} <code>given</code>-Werte über alle Namen. ${code(pit2.bad)} ergibt ${code(JSON.stringify(pit2.rb))}, weil die ganze Liste mit dem einen Text verglichen wird. ${code(pit2.good)} ergibt ${code(JSON.stringify(pit2.rg))}.</p>
<h3>Fehlermeldung „erwartet einen einzelnen Wert“</h3>
<p>${code(pit3.bad)} bricht auf dem Patienten ab, weil <code>name.family</code> zwei Werte liefert (der offizielle und der Mädchenname). Der Tester meldet: „${esc(pit3.eb)}“ Mit ${code(pit3.good)} wählen Sie zuerst einen Namen und erhalten ${code(JSON.stringify(pit3.rg[0]))}.</p>
<h3>XML</h3>
<p>Der Ausdruck läuft auf der aus XML umgewandelten Struktur. Ohne Schema erkennt der Viewer Listen nur bei mehrfach vorkommenden Elementen; ein einzelner Eintrag ist dann kein Array. Das kann bei <code>count()</code> oder Indizes zu anderen Ergebnissen führen als bei JSON.</p></section>
<section class="box"><h2>Quellen dieser Seite</h2>${srcList(["fhirpath", "json", "xml", "medplum"])}</section>
${others(path)}
`;
    pages.push({ path, title, desc, ld: webPageLD(path, title, desc, crumbItems), body, h1: "FHIRPath-Tester für FHIR-Ressourcen", lastmod: LASTMOD, exports: { ex, pit1, pit2, pit3 } });
  }

  // ---------------- Was ist FHIR ----------------
  {
    const path = "was-ist-fhir/";
    const title = "Was ist FHIR? Ressourcen, JSON/XML, Bundle und FHIR in Deutschland";
    const desc = "FHIR einfach erklärt: Ressourcen, JSON und XML, Referenzen, Bundles, REST und Versionen – mit Quellen zu FHIR in Deutschland (KBV, gematik, HL7 Deutschland).";
    const crumbItems = [{ label: SHORT, url: SITE }, { label: "Was ist FHIR?", url: url(path) }];
    const encFull = J("encounter"); const { text: _t, ...enc } = encFull;
    const xml = `<Encounter xmlns="http://hl7.org/fhir">
  <id value="example"/>
  <status value="in-progress"/>
  <class>
    <system value="http://terminology.hl7.org/CodeSystem/v3-ActCode"/>
    <code value="IMP"/>
    <display value="inpatient encounter"/>
  </class>
  <subject>
    <reference value="Patient/example"/>
  </subject>
</Encounter>`;
    const px = parseXml(xml); assert.ok(px.ok); assert.deepEqual(px.resource, enc, "XML- und JSON-Beispiel müssen übereinstimmen");
    const body = `
${crumbs([{ href: href(""), label: SHORT }, { label: "Was ist FHIR?" }])}
<h1>Was ist FHIR?</h1>
<p class="lead">${esc(DEFINITION)}</p>
<p>Diese Seite erklärt die Grundbegriffe so weit, wie man sie zum Lesen von FHIR-Dateien braucht. Jeder Abschnitt nennt seine Quelle; zu den deutschen Spezifikationen steht nur, was auf den verlinkten Seiten steht.</p>

<section class="prose" aria-labelledby="ressource"><h2 id="ressource">Die Ressource als Grundbaustein</h2>
<p>Nach der FHIR-Spezifikation ist die Ressource der grundlegende Baustein: Alle austauschbaren Inhalte sind als Ressource definiert. Beispiele sind <a href="${href("fhir-patient-beispiel/")}">Patient</a>, <a href="${href("fhir-observation-beispiel/")}">Observation</a> (Messwerte), <a href="${href("fhir-encounter-beispiel/")}">Encounter</a> (Behandlungsfall) und <a href="${href("fhir-condition-beispiel/")}">Condition</a> (Diagnose oder Problem). Jede Ressource hat einen Typ (<code>resourceType</code>) und eine <code>id</code>; ihre Elemente sind in der Spezifikation mit Datentyp und Kardinalität beschrieben, zum Beispiel <code>0..1</code> für „optional, höchstens einmal“ und <code>1..1</code> für „Pflicht“.</p></section>

<section class="prose" aria-labelledby="formate"><h2 id="formate">JSON und XML: dieselbe Ressource, zwei Schreibweisen</h2>
<p>FHIR definiert eine JSON- und eine XML-Darstellung (Medientypen <code>application/fhir+json</code> und <code>application/fhir+xml</code>). In JSON steht der Typ im Feld <code>resourceType</code>; in XML ist der Typ das Wurzelelement im Namensraum <code>http://hl7.org/fhir</code>, und Werte einfacher Typen stehen im Attribut <code>value</code>. Leere Arrays und <code>null</code>-Werte gibt es in FHIR-JSON nicht; Kommentare sind nicht erlaubt. Der folgende Encounter (aus dem <a href="${href("fhir-encounter-beispiel/")}">Encounter-Beispiel</a>, hier ohne das Narrativ <code>text</code>) ist beide Male derselbe:</p>
<div class="two">
<div><h3>JSON</h3><pre>${esc(JSON.stringify(enc, null, 2))}</pre></div>
<div><h3>XML</h3><pre>${esc(xml)}</pre></div>
</div>
<p>Beim Erzeugen dieser Seite wurde das XML mit dem Parser des Viewers gelesen und mit dem JSON verglichen; beide ergeben dieselbe Struktur.</p>
</section>
${viewerBlock({ def: "encounter", sampleButtons: [sampleBtn("encounter", "Encounter laden"), sampleBtn("patient", "Patient laden")] })}

<section class="prose" aria-labelledby="ref"><h2 id="ref">Referenzen: wie Ressourcen aufeinander zeigen</h2>
<p>Ressourcen enthalten sich meist nicht gegenseitig, sondern verweisen aufeinander, etwa <code>"subject": {"reference": "Patient/example"}</code> bei einem Encounter. Die Spezifikation kennt den Literalverweis (<code>reference</code>: relative oder absolute URL, bei <code>#…</code> eine contained-Ressource) und den logischen Verweis über einen <code>identifier</code>. Ob das Ziel in derselben Datei liegt, ist Sache des Bundles – mehr dazu unter <a href="${href("fhir-bundle-anzeigen/")}">FHIR-Bundle anzeigen</a>.</p></section>

<section class="prose" aria-labelledby="rest"><h2 id="rest">REST: wie Ressourcen übertragen werden</h2>
<p>Die Spezifikation beschreibt eine REST-Schnittstelle: eine Ressource lesen mit <code>GET [base]/[type]/[id]</code>, anlegen mit <code>POST [base]/[type]</code>, ändern mit <code>PUT [base]/[type]/[id]</code>, löschen mit <code>DELETE [base]/[type]/[id]</code> und suchen mit <code>GET [base]/[type]?…</code>. Das Ergebnis einer Suche kommt als <a href="${href("fhir-bundle-anzeigen/")}">Bundle</a>. Dieser Viewer greift auf keine solche Schnittstelle zu; Sie fügen Daten ein, die Sie bereits haben.</p></section>

<section class="prose" aria-labelledby="versionen"><h2 id="versionen">Versionen</h2>
<p>Dieser Viewer folgt FHIR R4 (4.0.1). Die R4-Seiten der Spezifikation weisen darauf hin, dass R5 (5.0.0) die Version ist, die R4 ablöst. Der ISiK-Leitfaden aus Deutschland (siehe unten) basiert auf FHIR 4.0.1. Daten aus R4B oder R5 zeigt der Viewer meist an; seine Hinweise sind aber auf R4 ausgelegt.</p></section>

<section class="prose" aria-labelledby="deutschland"><h2 id="deutschland">FHIR in Deutschland</h2>
<p>Die folgenden Aussagen stammen jeweils von der verlinkten Seite, abgerufen am ${LASTMOD.split("-").reverse().join(".")}.</p>
<ul>${DE_FACTS.map((f) => `<li>${esc(f.text)} Quelle: <a href="${SRC[f.src].url}" rel="noopener">${SRC[f.src].label}</a>.</li>`).join("")}</ul>
<p>Für den Alltag heißt das: Wer FHIR-Daten aus deutschen Systemen liest, trifft häufig auf Profile, die auf diesen Basisprofilen aufbauen. Diese Profile prüft der Viewer nicht; er zeigt die Struktur so, wie sie in der Datei steht.</p>
${EDITORIAL_LINK ? `<p>Wo Praxis- und Krankenhaussysteme an weitere Anwendungen angebunden werden, geht es um genau solche Schnittstellendaten. Ein Beispiel für einen Anbieter, der dafür eine Plattform beschreibt, ist <a href="${EDITORIAL.url}" rel="noopener">${EDITORIAL.name}</a>.</p>` : ""}</section>

<section class="prose" aria-labelledby="fp"><h2 id="fp">Pfade in FHIR-Daten: FHIRPath</h2>
<p>Zum Auswählen einzelner Elemente nutzt FHIR FHIRPath. Praktische Beispiele stehen im <a href="${href("fhirpath-tester/")}">FHIRPath-Tester</a>.</p></section>
<section class="box"><h2>Quellen dieser Seite</h2>${srcList(["overview", "resource", "json", "xml", "references", "http", "versions", "kbvBasis", "kbvMio", "isik", "hl7de"])}</section>
${others(path)}
`;
    pages.push({ path, title, desc, ld: webPageLD(path, title, desc, crumbItems), body, h1: "Was ist FHIR?", lastmod: LASTMOD, noViewer: false });
  }

  // ---------------- Ressourcen-Beispiele ----------------
  const LOINC_NOTE = `<section class="box" aria-labelledby="loinc"><h2 id="loinc">LOINC-Hinweis</h2>
<p lang="en">This material contains content from LOINC (<a href="https://loinc.org/" rel="noopener">http://loinc.org</a>). LOINC is copyright © Regenstrief Institute, Inc. and the Logical Observation Identifiers Names and Codes (LOINC) Committee and is available at no cost under the license at <a href="https://loinc.org/license/" rel="noopener">http://loinc.org/license</a>. LOINC® is a registered United States trademark of Regenstrief Institute, Inc.</p>
<p>Einige Beispiele enthalten LOINC-Codes mit Anzeigenamen aus der FHIR-Spezifikation. Die LOINC-Lizenz (Abschnitt 10) sieht diesen englischen Hinweis für Produkte vor, die LOINC-Inhalte enthalten.</p></section>`;
  const resPage = async (cfg) => {
    const crumbItems = [{ label: SHORT, url: SITE }, { label: cfg.crumb, url: url(cfg.path) }];
    const res = J(cfg.sample);
    const body = `
${crumbs([{ href: href(""), label: SHORT }, { label: cfg.crumb }])}
<h1>${cfg.h1}</h1>
<p class="lead">${cfg.lead}</p>
${viewerBlock({ def: cfg.sample, sampleButtons: cfg.buttons })}
${sampleInfo(cfg.sample)}
<section class="prose" aria-labelledby="felder"><h2 id="felder">Das Beispiel Feld für Feld</h2>
${cfg.intro}
${fieldTable(cfg.rows, res)}</section>
<section class="prose" aria-labelledby="spec"><h2 id="spec">Was die Spezifikation dazu sagt</h2>${cfg.spec}</section>
<section class="prose" aria-labelledby="probieren"><h2 id="probieren">Im Viewer ausprobieren</h2>
<p>Ändern Sie das Beispiel im Eingabefeld und klicken Sie auf „Anzeigen“. Beim Erzeugen dieser Seite wurden die folgenden Änderungen mit demselben Code geprüft:</p>
${experiments(cfg.experiments(viewerHints))}
<p>${cfg.fpHint ? cfg.fpHint : ""}</p></section>
<section class="box"><h2>Quellen dieser Seite</h2>${srcList([cfg.src, "json"])}</section>
${cfg.loinc ? LOINC_NOTE : ""}
<section class="box"><h2>Weitere Ressourcen-Beispiele</h2><ul class="cards">${cfg.more.map(([p, t, d]) => `<li><a href="${href(p)}">${esc(t)}</a><p>${esc(d)}</p></li>`).join("")}</ul></section>
${others("__")}
`;
    pages.push({ path: cfg.path, title: cfg.title, desc: cfg.desc, ld: webPageLD(cfg.path, cfg.title, cfg.desc, crumbItems), body, h1: cfg.h1plain, lastmod: LASTMOD });
  };

  const MORE = {
    p: ["fhir-patient-beispiel/", "Patient-Beispiel", "Namen, Adresse und Kontakt"],
    o: ["fhir-observation-beispiel/", "Observation-Beispiel", "Messwerte mit Code, Wert und Einheit"],
    e: ["fhir-encounter-beispiel/", "Encounter-Beispiel", "Behandlungsfall mit Status und Klasse"],
    c: ["fhir-condition-beispiel/", "Condition-Beispiel", "Diagnose mit Statusangaben"],
  };

  await resPage({
    path: "fhir-patient-beispiel/", sample: "patient", src: "patient", crumb: "FHIR-Patient-Beispiel",
    title: "FHIR Patient Beispiel (JSON) erklärt – Felder der Patient-Ressource",
    desc: "FHIR-Patient-Beispiel als JSON: name, identifier, birthDate, address und contact Feld für Feld erklärt, zum Öffnen im Viewer. Beispiel aus der Spezifikation (CC0).",
    h1: "FHIR-Patient-Beispiel: JSON lesen und verstehen", h1plain: "FHIR-Patient-Beispiel: JSON lesen und verstehen",
    lead: "Die Patient-Ressource enthält laut Spezifikation demografische und andere administrative Angaben zu einer Person oder einem Tier, das Gesundheitsleistungen oder andere gesundheitsbezogene Dienste erhält. Das Beispiel darunter stammt aus der Spezifikation und enthält bewusst viele Sonderfälle: mehrere Namen, eine Adresse, einen Kontakt und eine Erweiterung an der Geburtsangabe.",
    buttons: [sampleBtn("patient", "Patient laden"), sampleBtn("bundle-verweise", "Patienten im Bundle")],
    intro: "<p>Die Tabelle nennt Elemente des Beispiels. Die Werte stehen so in der Beispieldatei, nicht in einer Beispielrechnung.</p>",
    rows: [
      ["id", "Logische ID der Ressource. Sie ist Teil der Adresse, unter der ein Server sie bereitstellt: <code>[base]/Patient/[id]</code>."],
      ["identifier[0].value", "Eine Kennung des Patienten. <code>system</code> bestimmt den Namensraum der Nummer, <code>assigner</code> nennt die ausgebende Stelle, <code>type</code> die Art der Kennung (hier der Code <code>MR</code>)."],
      ["active", "Ob der Datensatz in Gebrauch ist (nach der Spezifikation: „in active use“). Es sagt nichts über den Gesundheitszustand aus."],
      ["name[0]", "Ein <code>HumanName</code>. <code>use</code> unterscheidet hier <code>official</code>, <code>usual</code> und <code>maiden</code>; <code>given</code> ist eine Liste, <code>family</code> ein Text."],
      ["name[2].period", "Der Mädchenname ist nur bis 2002 gültig. Einen Namen mit Gültigkeitszeitraum zu markieren, ist der Zweck von <code>period</code>."],
      ["telecom[1]", "Ein <code>ContactPoint</code> mit <code>system</code> (phone), <code>use</code> (work) und <code>rank</code> als Rangfolge."],
      ["gender", "Administratives Geschlecht für Verwaltungszwecke. Erlaubt sind <code>male</code>, <code>female</code>, <code>other</code> und <code>unknown</code>."],
      ["birthDate", "Ein <code>date</code>: <code>JJJJ</code>, <code>JJJJ-MM</code> oder <code>JJJJ-MM-TT</code>, nicht <code>TT.MM.JJJJ</code>."],
      ["_birthDate.extension[0].url", "Der Unterstrich-Name trägt Zusatzangaben eines einfachen Werts. Hier hängt eine Erweiterung (<code>patient-birthTime</code>) die Uhrzeit der Geburt an das Datum."],
      ["deceasedBoolean", "Auswahlelement <code>deceased[x]</code>: Der Name enthält den Datentyp. Hier <code>deceasedBoolean</code>; die Spezifikation nennt als Alternative <code>deceasedDateTime</code>."],
      ["address[0].line", "Straße und Hausnummer als Liste von Zeilen; daneben stehen <code>city</code>, <code>state</code>, <code>postalCode</code> und ein Freitext in <code>text</code>."],
      ["contact[0].name.family", "Eine Kontaktperson mit eigenem Namen, Telefon und Adresse (<code>Patient.contact</code>). Der Unterstrichwert <code>_family</code> trägt wieder eine Erweiterung."],
      ["managingOrganization.reference", "Ein Verweis auf eine andere Ressource. Als einzelne Datei lässt er sich nicht auflösen; in einem Bundle würde der Viewer zum Eintrag springen."],
    ],
    spec: `<p>Die Spezifikation führt Patient als normative Ressource (Maturity Level N). Sie beschreibt, dass ein Patient-Datensatz in der Regel von jeder Einrichtung gepflegt wird, die den Patienten behandelt; wird jemand in mehreren Einrichtungen behandelt, kann es daher mehrere Patient-Ressourcen geben. Nicht alle Konzepte sind in der Basisressource enthalten; die Spezifikation nennt als Beispiele Ethnie, Organspende-Status und Staatsangehörigkeit.</p>`,
    experiments: (vh) => [
      ["Setzen Sie <code>\"birthDate\": \"25.12.1974\"</code> statt <code>\"1974-12-25\"</code>.", vh((r) => { r.birthDate = "25.12.1974"; }, "patient", "warn")],
      ["Schreiben Sie <code>\"gender\": \"männlich\"</code>.", vh((r) => { r.gender = "männlich"; }, "patient", "warn")],
    ],
    fpHint: `Mit dem <a href="${href("fhirpath-tester/")}">FHIRPath-Tester</a> können Sie Namen und Telefonnummern gezielt auswählen, etwa ${code("name.where(use='official').given.first()")}.`,
    more: [MORE.o, MORE.e, MORE.c],
  });

  await resPage({
    path: "fhir-observation-beispiel/", loinc: true, sample: "observation", src: "observation", crumb: "FHIR-Observation-Beispiel",
    title: "FHIR Observation Beispiel: Gewicht und Blutdruck als JSON erklärt",
    desc: "FHIR-Observation-Beispiel als JSON: code, valueQuantity, Einheit und component an Gewicht und Blutdruck erklärt, mit Viewer. Beispiele: Spezifikation, CC0.",
    h1: "FHIR-Observation-Beispiel: Messwerte als JSON lesen", h1plain: "FHIR-Observation-Beispiel: Messwerte als JSON lesen",
    lead: "Observation ist die Ressource für Messungen und einfache Feststellungen zu einem Patienten oder Gerät, zum Beispiel Vitalwerte wie Körpergewicht und Blutdruck oder Laborwerte. Hier das Körpergewicht; den Blutdruck mit zwei Teilwerten laden Sie über die Schaltfläche „Blutdruck“.",
    buttons: [sampleBtn("observation", "Körpergewicht"), sampleBtn("blutdruck", "Blutdruck")],
    intro: "<p>Die Tabelle erklärt das Körpergewicht-Beispiel (darunter geladen). Zum Blutdruck-Beispiel gehört der Abschnitt „component“ weiter unten.</p>",
    rows: [
      ["status", "Pflichtfeld (<code>1..1</code>): Stand des Ergebnisses, hier <code>final</code>."],
      ["category[0].coding[0].code", "Einordnung der Observation. Im Beispiel <code>vital-signs</code> (Anzeigetext „Vital Signs“)."],
      ["code.coding[0].code", "Was gemessen wurde, ausgedrückt als Code aus einem Codesystem Das Beispiel nennt drei Codierungen: zwei aus LOINC (<code>system</code> <code>http://loinc.org</code>) und eine aus einem lokalen System (<code>acme.org</code>). Dasselbe Konzept darf mehrfach codiert sein. Das Element <code>code</code> ist Pflicht (<code>1..1</code>)."],
      ["subject.reference", "Verweis auf den Patienten, zu dem die Messung gehört; <code>encounter</code> verweist entsprechend auf den Kontakt."],
      ["effectiveDateTime", "Zeitpunkt der Messung (<code>effective[x]</code>). Bei Datumsangaben ohne Uhrzeit genügt <code>JJJJ-MM-TT</code>."],
      ["valueQuantity.value", "Der Messwert (<code>value[x]</code>) als Zahl; die Einheit steht daneben."],
      ["valueQuantity.unit", "Lesbare Einheit. Daneben steht <code>code</code> mit dem maschinenlesbaren UCUM-Code (<code>system</code> <code>http://unitsofmeasure.org</code>) – hier <code>[lb_av]</code> für Pfund. Das Beispiel ist also in Pfund angegeben; der Viewer rechnet nicht um."],
    ],
    spec: `<p>Observation ist laut Spezifikation eine normative Ressource (Maturity Level N). Die meisten Observations sind einfache Name/Wert-Paare mit Metadaten; manche fassen andere Observations logisch zusammen oder bestehen aus mehreren Komponenten (<strong>component</strong>). Jede Komponente hat einen eigenen <code>code</code> (<code>1..1</code>) und einen eigenen Wert (<code>value[x]</code>). Beim Blutdruck-Beispiel sind das ein systolischer und ein diastolischer Wert, die nur gemeinsam Sinn ergeben. Der Wert und ein <code>dataAbsentReason</code> (Grund für einen fehlenden Wert) dürfen nicht gleichzeitig vorkommen (Regel obs-6). Ein DiagnosticReport gibt nach der Spezifikation den klinischen oder Workflow-Kontext für eine Gruppe von Observations; er verweist auf sie, um Labor-, Bildgebungs- und andere Daten zu einem vollständigen Bericht zusammenzufügen.</p>`,
    experiments: (vh) => [
      ["Löschen Sie die Zeile <code>\"status\": \"final\"</code>.", vh((r) => { delete r.status; }, "observation", "warn")],
      ["Fügen Sie neben <code>valueQuantity</code> ein zweites Feld <code>\"valueString\": \"185\"</code> hinzu.", vh((r) => { r.valueString = "185"; }, "observation", "error")],
    ],
    fpHint: `Den Blutdruck lesen Sie im <a href="${href("fhirpath-tester/")}">FHIRPath-Tester</a> mit ${code("component.value.ofType(Quantity).value")}; dort steht auch, warum eine naheliegende Variante mit <code>code.coding.code</code> nichts findet.`,
    more: [MORE.p, MORE.e, MORE.c],
  });

  await resPage({
    path: "fhir-encounter-beispiel/", sample: "encounter", src: "encounter", crumb: "FHIR-Encounter-Beispiel",
    title: "FHIR Encounter Beispiel (JSON): Behandlungsfall erklärt",
    desc: "FHIR-Encounter-Beispiel als JSON: status, class und subject des kleinsten sinnvollen Behandlungsfalls erklärt, mit Viewer. Beispiel aus der Spezifikation (CC0).",
    h1: "FHIR-Encounter-Beispiel: Behandlungsfall als JSON", h1plain: "FHIR-Encounter-Beispiel: Behandlungsfall als JSON",
    lead: "Ein Encounter beschreibt nach der Spezifikation eine Interaktion zwischen Patient und Behandelnden, in der Gesundheitsleistungen erbracht oder der Gesundheitszustand beurteilt wird. Das Beispiel ist das kürzeste der Spezifikation: drei Elemente.",
    buttons: [sampleBtn("encounter", "Encounter laden")],
    intro: "<p>Alle drei Elemente des Beispiels:</p>",
    rows: [
      ["status", "Pflichtfeld (<code>1..1</code>). Die Spezifikation nennt die Stationen planned, arrived, triaged, in-progress, onleave, finished und cancelled. Hier läuft der Fall (<code>in-progress</code>)."],
      ["class.code", "Pflichtfeld in R4 (<code>class</code> ist <code>1..1</code>): die Art des Kontakts als <code>Coding</code>. Im Beispiel <code>IMP</code> mit dem Anzeigetext „inpatient encounter“ (stationär). Die Spezifikation nennt als Settings ambulatory, emergency, home health, inpatient und virtual."],
      ["subject.reference", "Der Patient (oder die Gruppe) des Kontakts. Das Element ist in R4 optional (<code>0..1</code>)."],
    ],
    spec: `<p>Encounter hat den Reifegrad „Trial Use“ (Maturity Level 2). Die Spezifikation fasst unter einem Encounter den Ablauf von der Voraufnahme über den eigentlichen Kontakt (ambulant) bis zu Aufnahme, Aufenthalt und Entlassung (stationär) zusammen. Angaben zur Aufnahme und Entlassung stehen deshalb in einem eigenen Unterelement (<code>hospitalization</code>). Welche Elemente relevant sind, hängt vom Setting ab; <code>class</code> unterscheidet diese Settings. Die Seite weist außerdem darauf hin, dass sich Abläufe je Organisation und Land stark unterscheiden.</p>`,
    experiments: (vh) => [
      ["Löschen Sie das Feld <code>class</code> samt Inhalt.", vh((r) => { delete r.class; }, "encounter")],
      ["Löschen Sie die Zeile <code>\"status\": \"in-progress\"</code>.", vh((r) => { delete r.status; }, "encounter", "warn")],
    ],
    fpHint: `Im <a href="${href("fhirpath-tester/")}">FHIRPath-Tester</a> liefert ${code("class.code")} den Wert ${code(JSON.stringify((await fp("encounter", "class.code"))[0]))}.`,
    more: [MORE.p, MORE.o, MORE.c],
  });

  await resPage({
    path: "fhir-condition-beispiel/", sample: "condition", src: "condition", crumb: "FHIR-Condition-Beispiel",
    title: "FHIR Condition Beispiel (JSON): Diagnose-Ressource erklärt",
    desc: "FHIR-Condition-Beispiel als JSON: clinicalStatus, verificationStatus, category, code, bodySite und onset erklärt. Beispiel: Spezifikation, CC0.",
    h1: "FHIR-Condition-Beispiel: Diagnose als JSON lesen", h1plain: "FHIR-Condition-Beispiel: Diagnose als JSON lesen",
    lead: "Condition beschreibt laut Spezifikation eine klinische Bedingung, ein Problem oder eine Diagnose, die so relevant geworden ist, dass sie festgehalten wird. Das Beispiel ist eine aktive, bestätigte Verbrennung am linken Ohr. Codierungen aus SNOMED CT wurden entfernt; der Freitext in <code>code.text</code> trägt die Aussage.",
    buttons: [sampleBtn("condition", "Condition laden")],
    intro: "<p>Die Tabelle zeigt die Elemente des Beispiels, wie sie in der hier verwendeten Fassung stehen:</p>",
    rows: [
      ["clinicalStatus.coding[0].code", "Klinischer Status, hier <code>active</code>. Der Wert stammt aus einer festen Liste (Bindung „required“)."],
      ["verificationStatus.coding[0].code", "Wie sicher die Diagnose ist; die Spezifikation nennt unconfirmed, provisional, differential, confirmed, refuted und entered-in-error. Hier <code>confirmed</code>."],
      ["category[0].coding[0].code", "Einordnung, hier <code>encounter-diagnosis</code>: eine Diagnose im Rahmen eines Kontakts (die Alternative ist ein Eintrag der Problemliste)."],
      ["code.text", "Freitext der Diagnose. Das Element <code>code</code> ist in R4 optional (<code>0..1</code>); normalerweise stünden hier Codierungen, im Beispiel nur Text."],
      ["bodySite[0].text", "Körperstelle als Liste (<code>0..*</code>)."],
      ["subject.reference", "Pflichtfeld (<code>1..1</code>): Wer hat die Diagnose?"],
      ["onsetDateTime", "Beginn (<code>onset[x]</code>): ein Datum, ein Datum mit Uhrzeit oder ein Alter."],
    ],
    spec: `<p>Condition hat den Reifegrad „Trial Use“ (Maturity Level 3) und ist laut Spezifikation eine Event-Ressource im FHIR-Workflow. Sie kann eine Diagnose im Rahmen eines Kontakts sein, ein Eintrag der Problemliste oder ein Anliegen, das nicht auf der Problemliste steht. Zwei Regeln der Spezifikation betreffen die Statusfelder: <code>clinicalStatus</code> darf nicht vorkommen, wenn <code>verificationStatus</code> den Wert <code>entered-in-error</code> hat, und soll vorhanden sein, wenn die Kategorie <code>problem-list-item</code> ist und der Verifizierungsstatus nicht <code>entered-in-error</code>.</p>`,
    experiments: (vh) => [
      ["Setzen Sie in <code>verificationStatus</code> den Code <code>confirmed</code> auf <code>entered-in-error</code>, lassen Sie <code>clinicalStatus</code> stehen.", vh((r) => { r.verificationStatus.coding[0].code = "entered-in-error"; }, "condition", "warn")],
      ["Löschen Sie das Feld <code>subject</code>.", vh((r) => { delete r.subject; }, "condition", "warn")],
    ],
    fpHint: `Im <a href="${href("fhirpath-tester/")}">FHIRPath-Tester</a> liefert ${code("clinicalStatus.coding.code")} den Wert ${code(JSON.stringify((await fp("condition", "clinicalStatus.coding.code"))[0]))}.`,
    more: [MORE.p, MORE.o, MORE.e],
  });

  // ---------------- Quellen ----------------
  {
    const path = "quellen/";
    const title = "Quellen und Lizenzen – Viewer für FHIR-Daten";
    const desc = "Herkunft und Lizenz der Beispiele (CC0, FHIR R4), Quellen der Fachtexte und Drittsoftware (@medplum/core, Apache-2.0) des Viewers für FHIR-Daten.";
    const crumbItems = [{ label: SHORT, url: SITE }, { label: "Quellen und Lizenzen", url: url(path) }];
    const body = `
${crumbs([{ href: href(""), label: SHORT }, { label: "Quellen und Lizenzen" }])}
<h1>Quellen und Lizenzen</h1>
<p class="lead">Woher die Beispiele und Aussagen dieser Seite stammen, und welche Fremdsoftware mitgeliefert wird.</p>
<section class="prose"><h2>Beispiele</h2>
<p>Alle Beispiele stammen aus der FHIR-Spezifikation R4 (4.0.1), die als „No Rights Reserved“ unter <a href="https://creativecommons.org/publicdomain/zero/1.0/" rel="noopener">CC0 1.0</a> steht (<a href="${SRC.license.url}" rel="noopener">Lizenzseite</a>). Änderungen: die Formatierung wurde vereinheitlicht; wo vermerkt, wurden SNOMED-CT-Codierungen und das Narrativ (<code>text</code>) entfernt. Alle Beispiele sind kleiner als 10 KB und enthalten keine echten Daten.</p>
<div class="tablewrap"><table><thead><tr><th>Beispiel</th><th>Größe</th><th>Original</th><th>Änderung</th></tr></thead><tbody>${SAMPLES.map((s) => `<tr><td>${esc(s.title)}</td><td>${s.bytes} Bytes</td><td><a href="${s.url}" rel="noopener">${esc(s.url.replace("https://", ""))}</a></td><td>${s.removedSnomed ? s.removedSnomed + " SNOMED-CT-Codierung(en) bzw. Narrativ entfernt" : "nur Formatierung"}</td></tr>`).join("")}</tbody></table></div></section>
<section class="prose"><h2>Fachquellen</h2><ul class="src">${Object.values(SRC).filter((s) => s !== SRC.medplum).map((s) => `<li><a href="${s.url}" rel="noopener">${s.label}</a></li>`).join("")}</ul>
<p>Die deutschen Quellen wurden am ${LASTMOD.split("-").reverse().join(".")} abgerufen. Ihr Stand kann sich seitdem geändert haben.</p></section>
${LOINC_NOTE}
<section class="prose"><h2>Mitgelieferte Software</h2>
<p><code>@medplum/core</code> (Version 5.2.9, <a href="https://www.apache.org/licenses/LICENSE-2.0" rel="noopener">Apache-2.0</a>, Medplum, hello@medplum.com) liefert <code>evalFhirPath</code> für den FHIRPath-Tester. Die Bibliothek wurde mit esbuild gebündelt; Lizenztext und Hinweise stehen in der Datei <a href="${href("THIRD-PARTY-LICENSES")}">THIRD-PARTY-LICENSES</a>. Weitere Laufzeitbausteine von Dritten gibt es nicht; es gibt keine CDN-Einbindung und keine externen Schriften.</p>
<p>Der Quellcode dieses Projekts liegt im <a href="https://github.com/freimoser/${SLUG}">GitHub-Repository</a> (dort auch die Datei <code>quellen.md</code>).</p></section>
<section class="prose"><h2>Marken</h2><p>${esc(DISCLAIMER_TM)}</p></section>
${others(path)}
`;
    pages.push({ path, title, desc, ld: webPageLD(path, title, desc, crumbItems), body, h1: "Quellen und Lizenzen", lastmod: LASTMOD, noViewer: true });
  }
  return pages;
}
