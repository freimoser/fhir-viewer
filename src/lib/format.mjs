/** Datentypen ohne Schema an ihrer Form erkennen und als Text darstellen. */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

export function shortSystem(sys) {
  if (!sys) return "";
  if (/loinc\.org/.test(sys)) return "LOINC";
  if (/snomed\.info/.test(sys)) return "SNOMED CT";
  if (/unitsofmeasure\.org/.test(sys)) return "UCUM";
  if (/rxnav\.nlm\.nih\.gov/.test(sys)) return "RxNorm";
  if (/terminology\.hl7\.org\/CodeSystem\//.test(sys)) return sys.split("/").pop();
  const last = String(sys).replace(/\/+$/, "").split(/[\/#:]/).pop();
  return last || sys;
}

export function kindOf(v) {
  if (v === null || v === undefined) return "null";
  if (Array.isArray(v)) return "array";
  if (typeof v !== "object") return "primitive";
  const k = Object.keys(v);
  const has = (x) => k.includes(x);
  if (has("reference") && typeof v.reference === "string") return "Reference";
  if (has("coding") && Array.isArray(v.coding)) return "CodeableConcept";
  if (typeof v.text === "string" && k.every((x) => ["text", "id", "extension"].includes(x))) return "CodeableConcept";
  if ((has("system") || has("code") || has("display")) && !has("value") && !has("unit")) return "Coding";
  if (has("value") && typeof v.value === "number" && (has("unit") || has("code") || has("system") || k.length === 1)) return "Quantity";
  if (has("value") && has("system") && ["phone", "fax", "email", "pager", "url", "sms", "other"].includes(v.system)) return "ContactPoint";
  if (has("value") && (has("system") || has("use") || has("type") || k.length <= 2) && typeof v.value === "string") return "Identifier";
  if (k.length && k.every((x) => ["start", "end", "id", "extension"].includes(x)) && (has("start") || has("end"))) return "Period";
  if (has("family") || has("given")) return "HumanName";
  if (has("line") || has("city") || has("postalCode") || has("country")) return "Address";
  if (has("low") || has("high")) return "Range";
  if (has("numerator") || has("denominator")) return "Ratio";
  if (has("text") && (has("time") || has("authorString") || has("authorReference")) ) return "Annotation";
  if (has("contentType") || has("url") && has("title")) return "Attachment";
  return "object";
}

export function codingText(c) {
  const head = c.display || c.code || "";
  const sys = shortSystem(c.system);
  return { head, code: [sys, c.code].filter(Boolean).join(" ") };
}

export function codeableParts(cc) {
  const codings = Array.isArray(cc.coding) ? cc.coding : [];
  const first = codings[0] ? codingText(codings[0]) : { head: "", code: "" };
  const head = cc.text || first.head || "";
  const codes = codings.map((c) => [shortSystem(c.system), c.code].filter(Boolean).join(" ")).filter(Boolean);
  return { head, codes };
}

export function humanName(n) {
  if (n.text) return n.text;
  const given = Array.isArray(n.given) ? n.given.join(" ") : n.given || "";
  const pre = Array.isArray(n.prefix) ? n.prefix.join(" ") : "";
  const suf = Array.isArray(n.suffix) ? n.suffix.join(" ") : "";
  return [pre, given, n.family, suf].filter(Boolean).join(" ");
}

export function plainText(v) {
  switch (kindOf(v)) {
    case "primitive": return String(v);
    case "CodeableConcept": { const p = codeableParts(v); return p.head || p.codes[0] || ""; }
    case "Coding": { const c = codingText(v); return c.head || c.code; }
    case "Quantity": return `${v.comparator || ""}${v.value}${v.unit || v.code ? " " + (v.unit || v.code) : ""}`;
    case "Period": return `${v.start || "?"} – ${v.end || "offen"}`;
    case "HumanName": return humanName(v);
    case "Address": return [Array.isArray(v.line) ? v.line.join(", ") : v.line, [v.postalCode, v.city].filter(Boolean).join(" "), v.country].filter(Boolean).join(", ") || v.text || "";
    case "ContactPoint": return `${v.system}: ${v.value}${v.use ? " (" + v.use + ")" : ""}`;
    case "Identifier": return `${v.value}${v.system ? " (" + shortSystem(v.system) + ")" : ""}`;
    case "Range": return `${v.low ? plainText(v.low) : "?"} – ${v.high ? plainText(v.high) : "?"}`;
    case "Ratio": return `${v.numerator ? plainText(v.numerator) : "?"} / ${v.denominator ? plainText(v.denominator) : "?"}`;
    case "Annotation": return v.text;
    case "Attachment": return [v.title, v.contentType].filter(Boolean).join(" · ") || "Anhang";
    case "Reference": return v.display || v.reference;
    case "array": return v.map(plainText).join("; ");
    case "null": return "";
    default: return JSON.stringify(v);
  }
}

/** Auswahlelement value[x] auflösen: liefert { key, value } oder null. */
export function choice(res, base) {
  if (!isObj(res)) return null;
  for (const k of Object.keys(res)) {
    if (k.length > base.length && k.startsWith(base) && /[A-Z]/.test(k[base.length])) return { key: k, value: res[k] };
  }
  return res[base] !== undefined ? { key: base, value: res[base] } : null;
}

const SKIP = new Set(["resourceType", "id", "meta", "text", "contained", "extension", "modifierExtension", "implicitRules", "language"]);

/** Beschriftung einer Ressource für Listen. */
export function labelOf(res) {
  if (!isObj(res)) return "";
  const t = res.resourceType;
  const pick = (...names) => { for (const n of names) { const c = choice(res, n); if (c && c.value !== undefined && c.value !== null) return c.value; } return undefined; };
  if (t === "Patient" || t === "Practitioner" || t === "RelatedPerson" || t === "Person") {
    const n = Array.isArray(res.name) ? res.name[0] : res.name;
    const parts = [n ? humanName(n) : "", res.birthDate ? "* " + res.birthDate : "", res.gender || ""].filter(Boolean);
    if (parts.length) return parts.join(" · ");
    const idf = Array.isArray(res.identifier) ? res.identifier[0] : res.identifier;
    return idf ? "ID " + plainText(idf) : t + (res.id ? " " + res.id : "") + " (ohne Namen)";
  }
  if (t === "Observation") {
    const code = res.code ? plainText(res.code) : "";
    const v = choice(res, "value");
    let val = "";
    if (v && v.value !== undefined) val = plainText(v.value);
    else if (Array.isArray(res.component) && res.component.length) val = res.component.map((c) => { const cv = choice(c, "value"); return cv ? plainText(cv.value) : ""; }).filter(Boolean).join(" / ");
    return [code, val].filter(Boolean).join(": ") || "(ohne Code)";
  }
  if (t === "Encounter") {
    const cls = res.class ? plainText(res.class) : "";
    return [cls, res.status].filter(Boolean).join(" · ") || "Encounter";
  }
  if (t === "Condition") return [res.code ? plainText(res.code) : "", res.clinicalStatus ? plainText(res.clinicalStatus) : ""].filter(Boolean).join(" · ") || "Condition";
  if (t === "MedicationRequest" || t === "MedicationStatement" || t === "MedicationAdministration") {
    const m = pick("medication");
    return [m ? plainText(m.concept || m) : "", res.status].filter(Boolean).join(" · ") || t;
  }
  if (t === "Organization" || t === "Location" || t === "Device") return res.name || (Array.isArray(res.identifier) && res.identifier[0] ? plainText(res.identifier[0]) : "") || t;
  const guess = res.code || res.type || res.vaccineCode || res.medicationCodeableConcept || res.title || res.name;
  if (guess) return plainText(guess);
  return res.status ? String(res.status) : "";
}

export { SKIP, isObj };
