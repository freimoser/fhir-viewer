/** FHIRPath-Ausdruck gegen eine Ressource auswerten; Fehler in verständlichem Deutsch. */
let corePromise = null;
export function loadCore() {
  if (!corePromise) corePromise = import("./fhirpath-core.mjs");
  return corePromise;
}

export function translateError(err, expr, ctx) {
  const m = String((err && err.message) || err);
  let u = m.match(/Unrecognized function: (\S+)/);
  if (u) return `Die Funktion "${u[1]}" kennt die Bibliothek nicht. Prüfen Sie die Schreibweise (FHIRPath unterscheidet Groß- und Kleinschreibung).`;
  let a = m.match(/Expected (\d+) arguments?/i);
  if (a) {
    // Die Bibliothek meldet so auch Funktionen, die auf einer Liste mit mehreren Elementen aufgerufen werden (z. B. name.family.upper()).
    const on = m.match(/on "(.*)":/s);
    const call = on && on[1].match(/^(.*)\.([A-Za-z]+)\(.*\)$/s);
    if (call && ctx && ctx.count > 1) return `Die Funktion ${call[2]}() braucht genau ein Element, der Ausdruck davor (${call[1]}) liefert aber ${ctx.count} Elemente. Wählen Sie eines aus, zum Beispiel mit first() oder [0].`;
    if (call && ctx) return `Die Funktion ${call[2]}() wurde mit einer unpassenden Eingabe oder Argumentzahl aufgerufen (erwartet: ${a[1]}). Prüfen Sie die Klammern und Argumente.`;
    return `Die Funktion wurde mit einer unpassenden Eingabe oder Argumentzahl aufgerufen (erwartet: ${a[1]}). Funktionen wie upper() brauchen genau ein Element; wählen Sie bei Listen eines mit first() oder [0] aus.`;
  }
  if (/Cant consume unknown more tokens|Cannot consume unknown more tokens/i.test(m)) return "Der Ausdruck ist unvollständig oder enthält Zeichen, die FHIRPath nicht kennt. Prüfen Sie Klammern, Anführungszeichen (einfache: 'text') und Operatoren.";
  let pe = m.match(/Parse error at "([^"]*)" \(line (\d+), column (\d+)\)/);
  if (pe) return `Syntaxfehler bei "${pe[1]}" (Zeichen ${pe[3]}): An dieser Stelle fehlt ein Ausdruck, oder ein Zeichen steht doppelt.`;
  if (/expected `\)`|expected `\]`/i.test(m)) return "Eine schließende Klammer fehlt.";
  if (/Invalid DateTime literal/i.test(m)) return "Ungültiges Datums-Literal. Datum und Zeit beginnen mit @, zum Beispiel @1980-01-01.";
  if (/reading 'eval'/i.test(m)) return "Diese Funktion wird von der eingebauten FHIRPath-Bibliothek nicht unterstützt.";
  if (/Expected singleton, but found/i.test(m)) { const n = (m.match(/"path"/g) || []).length; return `Ein Operand ist eine Liste${n ? " mit " + n + " Elementen" : ""}, erwartet wird ein einzelner Wert. Wählen Sie mit first(), [0] oder where(…) ein Element aus.`; }
  if (/Unexpected end|Parse error|Expected|Unexpected token|Unknown token|Not implemented|not implemented/i.test(m)) return "Der Ausdruck konnte nicht gelesen werden. Prüfen Sie Klammern, Anführungszeichen (in FHIRPath einfache: 'text') und Funktionsnamen. Meldung der Bibliothek: " + m;
  return "Auswertung fehlgeschlagen. Meldung der Bibliothek: " + m;
}

export function describeType(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "Liste";
  if (typeof v === "object") return v.resourceType ? v.resourceType : "Objekt";
  if (typeof v === "number") return Number.isInteger(v) ? "Zahl (ganz)" : "Zahl";
  if (typeof v === "boolean") return "Boolean";
  return "Text";
}

export async function runFhirPath(expression, resource) {
  const expr = String(expression ?? "").trim();
  if (!expr) return { ok: false, error: "Bitte geben Sie einen FHIRPath-Ausdruck ein, zum Beispiel Patient.name.family." };
  if (expr.length > 2000) return { ok: false, error: "Der Ausdruck ist länger als 2000 Zeichen." };
  let core;
  try { core = await loadCore(); } catch (e) { return { ok: false, error: "Die FHIRPath-Bibliothek konnte nicht geladen werden: " + String(e.message || e) }; }
  try {
    const out = core.evalFhirPath(expr, resource);
    return { ok: true, results: out.map((value) => ({ value, type: describeType(value) })) };
  } catch (e) {
    let ctx;
    const call = String((e && e.message) || "").match(/on "(.*)":/s);
    const parts = call && call[1].match(/^(.*)\.([A-Za-z]+)\(.*\)$/s);
    if (parts) { try { ctx = { count: core.evalFhirPath(parts[1], resource).length }; } catch { ctx = undefined; } }
    return { ok: false, error: translateError(e, expr, ctx) };
  }
}
