/**
 * Eingabe lesen: JSON oder XML einer FHIR-Ressource.
 * Ergebnis: { ok, format, resource } oder { ok:false, error:{ message, hint, line, column } }
 * Kein Schema: Wiederholungen in XML erkennt der Konverter nur an mehrfach vorkommenden Elementen.
 */
import { parseXml } from "./xml.mjs";

function lineCol(text, pos) {
  let line = 1, col = 1;
  for (let i = 0; i < pos && i < text.length; i++) {
    if (text[i] === "\n") { line++; col = 1; } else col++;
  }
  return { line, column: col };
}

/** Browser und Node nennen die Position unterschiedlich; beide Formen werden ausgewertet. */
function jsonErrorPosition(err, text) {
  const msg = String(err && err.message || "");
  let m = msg.match(/line (\d+) column (\d+)/i);
  if (m) return { line: +m[1], column: +m[2] };
  m = msg.match(/position (\d+)/i);
  if (m) return { ...lineCol(text, +m[1]), offset: +m[1] };
  if (/end of (JSON|data)|Unterminated|Unexpected end/i.test(msg)) return lineCol(text, text.length);
  return null;
}

function jsonHint(msg, text, pos) {
  const m = String(msg);
  if (pos && pos.offset !== undefined && pos.offset >= text.trimEnd().length) return "Die Eingabe endet mitten im JSON. Meist fehlt eine schließende Klammer } oder ] oder ein Anführungszeichen. Wurde beim Kopieren etwas abgeschnitten?";
  const near = pos ? text.split("\n")[pos.line - 1] || "" : "";
  if (/Unexpected end|end of JSON|end of data/i.test(m)) return "Die Eingabe endet mitten im JSON. Meist fehlt eine schließende Klammer } oder ] oder ein Anführungszeichen. Wurde beim Kopieren etwas abgeschnitten?";
  if (/Expected double-quoted property name|Unexpected token '?\}/i.test(m) || /,\s*[}\]]/.test(near)) return "Wahrscheinlich steht ein Komma zu viel nach dem letzten Eintrag. JSON erlaubt kein Komma vor } oder ].";
  if (/Expected ',' or|after property value|after array element/i.test(m)) return "Zwischen zwei Einträgen fehlt ein Komma, oder ein Anführungszeichen wurde nicht geschlossen.";
  if (!/^\s*[{\[]/.test(text)) return "Die Eingabe beginnt weder mit { (JSON) noch mit < (XML). Fügen Sie den Inhalt einer FHIR-Datei ein, nicht den Dateinamen oder einen Hinweistext.";
  if (/Unexpected token '?'/i.test(m) || /'/.test(near)) return "JSON erlaubt nur doppelte Anführungszeichen (\"). Einfache Anführungszeichen (') sind ungültig.";
  if (/Unexpected token/i.test(m) && /^\s*</.test(text)) return "Das sieht nach XML oder HTML aus. XML-Ressourcen beginnen mit einem Element wie <Patient xmlns=\"http://hl7.org/fhir\">.";
  if (/Unexpected token|Unexpected character|not valid JSON/i.test(m)) return "An dieser Stelle steht ein Zeichen, das in JSON nicht erlaubt ist, etwa ein Kommentar, ein unquotierter Name oder ein Sonderzeichen vom Kopieren.";
  return "Die Eingabe ist kein gültiges JSON. Prüfen Sie Klammern, Kommas und Anführungszeichen an der angegebenen Stelle.";
}

export function parseInput(raw) {
  let text = String(raw ?? "");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: { message: "Keine Eingabe.", hint: "Fügen Sie JSON oder XML einer FHIR-Ressource ein, wählen Sie eine Datei oder laden Sie ein Beispiel." } };

  if (trimmed[0] === "<") {
    const r = parseXml(text);
    if (!r.ok) return { ok: false, format: "xml", error: r.error };
    const rootTag = (text.replace(/<\?[\s\S]*?\?>|<!--[\s\S]*?-->/g, "").match(/<[A-Za-z][^>]*>/) || [""])[0];
    const notes = /xmlns\s*=\s*["']http:\/\/hl7\.org\/fhir["']/.test(rootTag) ? [] : [{ level: "warn", where: "XML", msg: "Dem Wurzelelement fehlt der Namensraum xmlns=\"http://hl7.org/fhir\". Ohne ihn ist die Datei kein gültiges FHIR-XML, auch wenn sie hier angezeigt wird." }];
    return { ok: true, format: "xml", resource: r.resource, notes };
  }
  let value;
  try {
    value = JSON.parse(text);
  } catch (err) {
    const pos = jsonErrorPosition(err, text);
    return { ok: false, format: "json", error: { message: "Ungültiges JSON" + (pos ? ` (Zeile ${pos.line}, Spalte ${pos.column})` : "") + ": " + String(err.message).replace(/^JSON\.parse: /, ""), hint: jsonHint(err.message, text, pos), line: pos?.line, column: pos?.column } };
  }
  if (Array.isArray(value)) return { ok: false, format: "json", error: { message: "Auf oberster Ebene steht ein Array.", hint: "FHIR erwartet ein einzelnes Objekt mit \"resourceType\". Mehrere Ressourcen werden in einem Bundle zusammengefasst (\"resourceType\": \"Bundle\")." } };
  if (value === null || typeof value !== "object") return { ok: false, format: "json", error: { message: "Das JSON ist kein Objekt.", hint: "Eine FHIR-Ressource ist ein JSON-Objekt, das mit { beginnt." } };
  return { ok: true, format: "json", resource: value };
}
