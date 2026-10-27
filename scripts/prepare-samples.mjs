// Erzeugt src/data/samples.mjs aus den originalen FHIR-R4-Beispielen (samples/orig/*.json, CC0).
// Änderungen (im Viewer und in quellen.md sichtbar gemacht):
//  - Codierungen aus SNOMED CT (system http://snomed.info/sct) werden entfernt, weil SNOMED CT separat lizenziert ist.
//  - Bei Ressourcen mit entfernten SNOMED-Codierungen wird das Narrativ (text.div) entfernt.
//  - Formatierung: 2 Leerzeichen Einrückung.
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SNOMED = /snomed\.info\/sct/i;

export const SAMPLE_DEFS = [
  { id: "patient", file: "patient-example", title: "Patient", desc: "Eine Patientenressource mit Name, Adresse, Telefon und Kontakt.", resource: "Patient" },
  { id: "observation", file: "observation-example", title: "Observation (Körpergewicht)", desc: "Eine Messung mit LOINC-Code, Wert (valueQuantity) und Einheit.", resource: "Observation" },
  { id: "blutdruck", file: "observation-example-bloodpressure", title: "Observation (Blutdruck)", desc: "Eine Observation mit zwei component-Werten (systolisch, diastolisch), Interpretation und einer Referenz per Identifier.", resource: "Observation" },
  { id: "condition", file: "condition-example", title: "Condition", desc: "Eine Diagnose mit Freitext-Code, Status, Kategorie, Körperstelle und Beginn.", resource: "Condition" },
  { id: "encounter", file: "encounter-example", title: "Encounter", desc: "Ein sehr kurzer Behandlungsfall mit Status und Klasse.", resource: "Encounter" },
  { id: "bundle-verweise", file: "bundle-references", title: "Bundle mit Referenzen", desc: "Ein Bundle mit Patienten und Observations; zeigt aufgelöste Referenzen, Versionen und Identifier.", resource: "Bundle" },
  { id: "bundle-suche", file: "bundle-example", title: "Bundle (searchset)", desc: "Ein kleines Suchergebnis mit MedicationRequest und Medication.", resource: "Bundle" },
  { id: "bundle-transaktion", file: "bundle-transaction", title: "Bundle (transaction)", desc: "Eine Transaktion mit mehreren Patienten und request-Angaben.", resource: "Bundle" },
];

function stripSnomed(node, st) {
  if (Array.isArray(node)) return node.map((x) => stripSnomed(x, st)).filter((x) => x !== undefined);
  if (node && typeof node === "object") {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (k === "coding" && Array.isArray(v)) {
        const keep = v.filter((c) => !(c && typeof c.system === "string" && SNOMED.test(c.system)));
        st.removed += v.length - keep.length;
        if (keep.length) out.coding = keep;
        continue;
      }
      const r = stripSnomed(v, st);
      if (r !== undefined) out[k] = r;
    }
    if (Object.keys(out).length === 0 && Object.keys(node).length > 0) return undefined;
    return out;
  }
  return node;
}

export function prepare() {
  const samples = [];
  for (const d of SAMPLE_DEFS) {
    const orig = JSON.parse(fs.readFileSync(path.join(root, "samples/orig", d.file + ".json"), "utf8"));
    const st = { removed: 0 };
    let res = stripSnomed(orig, st);
    if (st.removed > 0) {
      if (res.text) delete res.text;
      if (Array.isArray(res.entry)) res.entry.forEach((e) => { if (e.resource && e.resource.text) delete e.resource.text; });
    }
    const json = JSON.stringify(res, null, 2);
    samples.push({ ...d, removedSnomed: st.removed, bytes: Buffer.byteLength(json), url: `https://hl7.org/fhir/R4/${d.file}.json.html`, json });
  }
  return samples;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const s = prepare();
  fs.mkdirSync(path.join(root, "src/data"), { recursive: true });
  fs.writeFileSync(path.join(root, "src/data/samples.mjs"), "// Automatisch erzeugt von scripts/prepare-samples.mjs. Nicht von Hand ändern.\nexport const SAMPLES = " + JSON.stringify(s, null, 1) + ";\n");
  for (const x of s) console.log(x.id.padEnd(20), x.bytes, "B", "SNOMED entfernt:", x.removedSnomed);
}
