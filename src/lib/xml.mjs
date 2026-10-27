/**
 * Kleiner XML-Leser und Konverter FHIR-XML → FHIR-JSON-Struktur (nur zum Anzeigen).
 * - DOCTYPE und Entitätsdeklarationen werden abgelehnt (Sicherheit).
 * - Ohne Schema: Ein Element wird nur dann zum Array, wenn es mehrfach unter demselben Elternelement vorkommt.
 */
const ENT = { "&lt;": "<", "&gt;": ">", "&amp;": "&", "&quot;": '"', "&apos;": "'" };
function decode(s) {
  return s.replace(/&(#x[0-9a-fA-F]+|#\d+|lt|gt|amp|quot|apos);/g, (m, g) => {
    if (g[0] === "#") { const n = g[1] === "x" ? parseInt(g.slice(2), 16) : parseInt(g.slice(1), 10); try { return String.fromCodePoint(n); } catch { return m; } }
    return ENT[m] ?? m;
  });
}
function lineCol(text, pos) {
  let line = 1, col = 1;
  for (let i = 0; i < pos && i < text.length; i++) { if (text[i] === "\n") { line++; col = 1; } else col++; }
  return { line, column: col };
}
class XmlErr extends Error { constructor(msg, pos) { super(msg); this.pos = pos; } }

export function parseXmlTree(text) {
  let i = 0;
  const n = text.length;
  const root = { name: null, attrs: {}, children: [], text: "" };
  const stack = [root];
  if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw new XmlErr("DOCTYPE/ENTITY-Deklarationen werden aus Sicherheitsgründen nicht gelesen.", text.search(/<!DOCTYPE|<!ENTITY/i));
  while (i < n) {
    const lt = text.indexOf("<", i);
    if (lt < 0) { const t = text.slice(i); if (t.trim()) throw new XmlErr("Text außerhalb eines Elements.", i); break; }
    if (lt > i) { const t = text.slice(i, lt); stack[stack.length - 1].text += decode(t); }
    if (text.startsWith("<!--", lt)) { const e = text.indexOf("-->", lt + 4); if (e < 0) throw new XmlErr("Kommentar nicht geschlossen.", lt); i = e + 3; continue; }
    if (text.startsWith("<![CDATA[", lt)) { const e = text.indexOf("]]>", lt); if (e < 0) throw new XmlErr("CDATA nicht geschlossen.", lt); stack[stack.length - 1].text += text.slice(lt + 9, e); i = e + 3; continue; }
    if (text.startsWith("<?", lt)) { const e = text.indexOf("?>", lt); if (e < 0) throw new XmlErr("Verarbeitungsanweisung nicht geschlossen.", lt); i = e + 2; continue; }
    if (text.startsWith("</", lt)) {
      const e = text.indexOf(">", lt); if (e < 0) throw new XmlErr("Schließendes Tag ohne >.", lt);
      const name = text.slice(lt + 2, e).trim();
      const top = stack[stack.length - 1];
      if (stack.length === 1 || top.name !== name) throw new XmlErr(`Schließendes Tag </${name}> passt nicht zu ${stack.length > 1 ? "<" + top.name + ">" : "keinem offenen Element"}.`, lt);
      stack.pop(); i = e + 1; continue;
    }
    // Start-Tag
    let j = lt + 1;
    const nm = /^[A-Za-z_][\w:.-]*/.exec(text.slice(j, j + 200));
    if (!nm) throw new XmlErr("Ungültiger Elementname nach <.", lt);
    const name = nm[0]; j += name.length;
    const attrs = {};
    for (;;) {
      while (j < n && /\s/.test(text[j])) j++;
      if (j >= n) throw new XmlErr(`Start-Tag <${name}> nicht geschlossen.`, lt);
      if (text[j] === ">" || text.startsWith("/>", j)) break;
      const am = /^([A-Za-z_][\w:.-]*)\s*=\s*("([^"]*)"|'([^']*)')/.exec(text.slice(j, j + 100000));
      if (!am) throw new XmlErr(`Ungültiges Attribut in <${name}>.`, j);
      attrs[am[1]] = decode(am[3] ?? am[4]); j += am[0].length;
    }
    const el = { name, attrs, children: [], text: "", pos: lt };
    stack[stack.length - 1].children.push(el);
    if (text.startsWith("/>", j)) { i = j + 2; } else { stack.push(el); i = j + 1; }
  }
  if (stack.length > 1) throw new XmlErr(`Element <${stack[stack.length - 1].name}> wurde nicht geschlossen.`, text.length);
  if (root.children.length !== 1) throw new XmlErr(root.children.length ? "Mehrere Wurzelelemente." : "Kein Element gefunden.", 0);
  return root.children[0];
}

const WRAPPERS = new Set(["contained", "resource", "outcome"]);
function localName(nm) { return nm.includes(":") ? nm.split(":").pop() : nm; }

function convert(el, asResource, parentName = "") {
  const out = {};
  if (asResource) out.resourceType = localName(el.name);
  for (const [k, v] of Object.entries(el.attrs)) {
    if (k === "xmlns" || k.startsWith("xmlns:") || k === "value") continue;
    out[k] = v;
  }
  const groups = new Map();
  for (const c of el.children) {
    const nm = localName(c.name);
    if (!groups.has(nm)) groups.set(nm, []);
    groups.get(nm).push(c);
  }
  for (const [nm, list] of groups) {
    const vals = list.map((c) => {
      if (nm === "div") return xhtmlText(c);
      if (WRAPPERS.has(nm) && c.children.length === 1 && /^[A-Z]/.test(localName(c.children[0].name)) && !("value" in c.attrs)) return convert(c.children[0], true);
      if ("value" in c.attrs && c.children.length === 0 && Object.keys(c.attrs).every((a) => a === "value" || a === "xmlns")) return coercePrimitive(nm, c.attrs.value, localName(el.name));
      if ("value" in c.attrs) return coercePrimitive(nm, c.attrs.value, localName(el.name));
      return convert(c, false, localName(el.name));
    });
    if (vals.length === 1) out[nm] = vals[0]; else out[nm] = vals;
  }
  return out;
}
function xhtmlText(el) {
  let s = "";
  (function walk(e) { s += e.text; for (const c of e.children) walk(c); })(el);
  return s.replace(/\s+/g, " ").trim();
}
/**
 * Zahlen und Wahrheitswerte werden ohne Schema nur an Elementnamen erkannt:
 * Quantity-artige Elternelemente (value, comparator bleibt Text), *Integer/*Decimal-Auswahlelemente und Bundle.total.
 * Alles andere bleibt Text (zum Beispiel Identifier.value).
 */
const QUANTITY_PARENT = /(Quantity|^(low|high|numerator|denominator|quantity|count|age|duration|distance|simpleQuantity))$/i;
function coercePrimitive(name, v, parent = "") {
  if (v === "true" || v === "false") return v === "true";
  const numeric = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(v);
  if (numeric && ((name === "value" && QUANTITY_PARENT.test(parent)) || /(Integer|Decimal|PositiveInt|UnsignedInt)$/.test(name) || name === "total")) return Number(v);
  return v;
}

export function parseXml(text) {
  try {
    const tree = parseXmlTree(text);
    return { ok: true, resource: convert(tree, true) };
  } catch (e) {
    if (e instanceof XmlErr) {
      const p = lineCol(text, e.pos ?? 0);
      return { ok: false, error: { message: `Ungültiges XML (Zeile ${p.line}, Spalte ${p.column}): ${e.message}`, hint: "Prüfen Sie, ob alle Elemente geschlossen sind und die Datei vollständig kopiert wurde. FHIR-XML beginnt mit dem Ressourcennamen als Wurzelelement, zum Beispiel <Patient xmlns=\"http://hl7.org/fhir\">.", line: p.line, column: p.column } };
    }
    throw e;
  }
}
