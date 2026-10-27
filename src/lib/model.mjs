import { labelOf, isObj } from "./format.mjs";
import { buildIndex, resolveReference, resolveIdentifier, collectReferences } from "./refs.mjs";
import { R4_RESOURCE_TYPES } from "./resource-types.mjs";

export const BUNDLE_TYPES = ["document", "message", "transaction", "transaction-response", "batch", "batch-response", "history", "searchset", "collection"];

/** Eingabe (geparste Ressource) in eine anzeigbare Struktur überführen. */
export function buildModel(resource) {
  const isBundle = resource.resourceType === "Bundle";
  const entries = [];
  if (isBundle) {
    (Array.isArray(resource.entry) ? resource.entry : []).forEach((e, i) => {
      const res = isObj(e) && isObj(e.resource) ? e.resource : null;
      entries.push({ index: i, fullUrl: isObj(e) && typeof e.fullUrl === "string" ? e.fullUrl : null, resource: res, raw: e, resourceType: res ? res.resourceType || null : null, id: res ? res.id || null : null });
    });
  } else {
    entries.push({ index: 0, fullUrl: null, resource, raw: null, resourceType: resource.resourceType || null, id: resource.id || null });
  }
  const index = isBundle ? buildIndex(entries) : null;
  const typeCounts = new Map();
  for (const e of entries) {
    const t = e.resourceType || (e.raw && e.raw.request ? "(nur request)" : e.raw && e.raw.response ? "(nur response)" : "(ohne resource)");
    typeCounts.set(t, (typeCounts.get(t) || 0) + 1);
    e.typeKey = t;
    e.label = e.resource ? labelOf(e.resource) || (e.resourceType || "?") + (e.id ? "/" + e.id : "") : e.raw && e.raw.request ? `${e.raw.request.method || ""} ${e.raw.request.url || ""}`.trim() : e.raw && e.raw.response ? String(e.raw.response.status || "") : "";
  }
  for (const e of entries) {
    e.refs = [];
    if (!e.resource) continue;
    for (const r of collectReferences(e.resource)) {
      const res = r.identifier ? resolveIdentifier(r.identifier, index) : resolveReference(r.ref, { entry: e, index, resource: e.resource });
      e.refs.push({ path: r.path, ref: r.ref, identifier: r.identifier, ...res });
    }
  }
  // eingehende Referenzen
  for (const e of entries) e.incoming = [];
  for (const e of entries) for (const r of e.refs) {
    const targets = r.status === "resolved" || r.status === "contained" ? [r.index] : r.status === "ambiguous" ? r.indexes : [];
    for (const t of targets) if (t !== e.index && entries[t]) entries[t].incoming.push({ from: e.index, path: r.path });
  }
  return { isBundle, resource, entries, index, typeCounts };
}

const DATE_RE = /^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1]))?)?$/;
const DATETIME_RE = /^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1])(T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00)))?)?)?$/;
const INSTANT_RE = /^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00))$/;
const ID_RE = /^[A-Za-z0-9\-.]{1,64}$/;
const DATE_FIELDS = { birthDate: DATE_RE };
const DATETIME_SUFFIX = /(DateTime|dateTime)$|^(recordedDate|authoredOn|date)$/;
const INSTANT_FIELDS = new Set(["issued", "lastUpdated", "instant"]);
const REQUIRED = {
  Observation: ["status", "code"],
  Condition: ["subject"],
  Encounter: ["status"],
  MedicationRequest: ["status", "intent", "subject"],
  DiagnosticReport: ["status", "code"],
  Bundle: ["type"],
};
const CODE_SETS = {
  "Patient.gender": ["male", "female", "other", "unknown"],
  "Bundle.type": BUNDLE_TYPES,
  "Observation.status": ["registered", "preliminary", "final", "amended", "corrected", "cancelled", "entered-in-error", "unknown"],
};

/** Plausibilitätshinweise. Keine Validierung gegen StructureDefinitions, Profile oder Terminologien. */
export function checkModel(model) {
  const hints = [];
  const add = (level, where, msg, extra = {}) => hints.push({ level, where, msg, ...extra });
  const root = model.resource;
  if (!root.resourceType) {
    add("error", "Wurzel", "Das Objekt hat kein Feld \"resourceType\". Ohne dieses Feld ist es keine FHIR-Ressource. Erwartet wird zum Beispiel \"resourceType\": \"Patient\".");
    return hints;
  }
  if (typeof root.resourceType !== "string") { add("error", "Wurzel", "\"resourceType\" muss ein Text sein."); return hints; }
  const checkType = (res, where) => {
    if (!R4_RESOURCE_TYPES.has(res.resourceType)) add("warn", where, `Der Ressourcentyp "${res.resourceType}" steht nicht in der Liste von R4 (4.0.1). Das kann ein Tippfehler sein (Groß-/Kleinschreibung zählt) oder ein Typ aus einer neueren Version.`);
  };
  checkType(root, root.resourceType);

  if (model.isBundle) {
    const type = root.type;
    if (!type) add("warn", "Bundle.type", "Bundle.type fehlt. Das Feld ist in R4 ein Pflichtfeld (1..1).");
    else if (!BUNDLE_TYPES.includes(type)) add("warn", "Bundle.type", `"${type}" ist kein Wert aus der Liste der Bundle-Typen (${BUNDLE_TYPES.join(", ")}).`);
    if (root.entry !== undefined && !Array.isArray(root.entry)) add("error", "Bundle.entry", "Bundle.entry muss ein Array sein.");
    if (root.total !== undefined && type && !["searchset", "history"].includes(type)) add("warn", "Bundle.total", "Bundle.total darf laut Regel bdl-1 nur bei Bundles vom Typ searchset oder history stehen.");
    const noUrlOk = type === "transaction" || type === "batch";
    const seen = new Map();
    model.entries.forEach((e, i) => {
      const w = `Bundle.entry[${i}]`;
      if (!e.raw || typeof e.raw !== "object") { add("error", w, "Der Eintrag ist kein Objekt."); return; }
      if (!e.fullUrl && !noUrlOk && type) add("warn", w, "fullUrl fehlt. Außer bei transaction und batch braucht jeder Eintrag eine fullUrl (Bundle, Abschnitt \"Resource URL & Uniqueness rules\").", { entry: i });
      if (e.fullUrl && type !== "history") {
        const k = e.fullUrl + "|" + (e.resource?.meta?.versionId || "");
        if (seen.has(k)) add("warn", w, `fullUrl ${e.fullUrl} kommt mehrfach vor (Regel bdl-7: nur erlaubt, wenn sich meta.versionId unterscheidet).`, { entry: i });
        seen.set(k, i);
      }
      if (e.resource) checkType(e.resource, `${w}.resource`);
      else if (!e.raw.request && !e.raw.response) add("warn", w, "Der Eintrag enthält weder resource noch request noch response.", { entry: i });
      const needReq = ["batch", "transaction", "history"].includes(type);
      const needRes = ["batch-response", "transaction-response", "history"].includes(type);
      if (needReq && !e.raw.request) add("warn", w, `Bei Bundle.type "${type}" ist entry.request Pflicht (Regel bdl-3).`, { entry: i });
      if (!needReq && e.raw.request && type) add("warn", w, `Bei Bundle.type "${type}" darf entry.request nicht vorkommen (Regel bdl-3).`, { entry: i });
      if (needRes && !e.raw.response) add("warn", w, `Bei Bundle.type "${type}" ist entry.response Pflicht (Regel bdl-4).`, { entry: i });
      if (!needRes && e.raw.response && type) add("warn", w, `Bei Bundle.type "${type}" darf entry.response nicht vorkommen (Regel bdl-4).`, { entry: i });
    });
    if (type === "document") {
      const first = model.entries[0]?.resource;
      if (!first || first.resourceType !== "Composition") add("warn", "Bundle (document)", "Ein Dokument-Bundle muss als erste Ressource eine Composition enthalten (Regel bdl-11).");
      if (!root.identifier || !root.identifier.system || !root.identifier.value) add("warn", "Bundle (document)", "Ein Dokument-Bundle braucht einen identifier mit system und value (Regel bdl-9).");
      if (!root.timestamp) add("warn", "Bundle (document)", "Ein Dokument-Bundle braucht einen timestamp (Regel bdl-10).");
    }
    if (type === "message") {
      const first = model.entries[0]?.resource;
      if (!first || first.resourceType !== "MessageHeader") add("warn", "Bundle (message)", "Ein Message-Bundle muss als erste Ressource einen MessageHeader enthalten (Regel bdl-12).");
    }
  }

  // Ressourcenweise
  model.entries.forEach((e) => {
    if (!e.resource) return;
    const res = e.resource;
    const where = model.isBundle ? `Eintrag ${e.index + 1} (${res.resourceType || "?"}${res.id ? "/" + res.id : ""})` : res.resourceType;
    if (!res.resourceType) { add("error", where, "Der Eintrag hat kein \"resourceType\".", { entry: e.index }); return; }
    if (res.id !== undefined && (typeof res.id !== "string" || !ID_RE.test(res.id))) add("warn", where, `id "${res.id}" ist ungültig: erlaubt sind Buchstaben, Ziffern, "-" und ".", höchstens 64 Zeichen.`, { entry: e.index });
    for (const f of REQUIRED[res.resourceType] || []) {
      const has = res[f] !== undefined || Object.keys(res).some((k) => k.startsWith(f) && /[A-Z]/.test(k[f.length] || ""));
      if (!has) add("warn", where, `Pflichtfeld "${f}" fehlt (in R4 mit Kardinalität 1..1).`, { entry: e.index });
    }
    if (res.resourceType === "MedicationRequest" && !Object.keys(res).some((k) => k.startsWith("medication"))) add("warn", where, "medication[x] fehlt (in R4 Pflicht: medicationCodeableConcept oder medicationReference; Daten aus anderen FHIR-Versionen benennen das Feld womöglich anders).", { entry: e.index });
    if (res.resourceType === "Encounter" && res.class === undefined) add("info", where, "Encounter.class fehlt. In R4 ist das Feld Pflicht (1..1); bei Daten aus anderen FHIR-Versionen kann die Anforderung abweichen.", { entry: e.index });
    for (const [path, set] of Object.entries(CODE_SETS)) {
      const [t, f] = path.split(".");
      if (res.resourceType === t && f !== "type" && typeof res[f] === "string" && !set.includes(res[f])) add("warn", where, `${path}: "${res[f]}" steht nicht in der Werteliste (${set.join(", ")}).`, { entry: e.index });
    }
    if (res.resourceType === "Observation") {
      const vs = Object.keys(res).filter((k) => /^value[A-Z]/.test(k));
      if (vs.length > 1) add("error", where, `Mehrere value[x]-Felder gleichzeitig (${vs.join(", ")}). Es darf nur eines vorkommen.`, { entry: e.index });
      if (res.dataAbsentReason && vs.length) add("warn", where, "dataAbsentReason und ein Wert stehen gleichzeitig. Laut Regel obs-6 darf dataAbsentReason nur ohne value[x] vorkommen.", { entry: e.index });
    }
    if (res.resourceType === "Condition" && res.clinicalStatus && res.verificationStatus) {
      const ver = JSON.stringify(res.verificationStatus);
      if (/entered-in-error/.test(ver)) add("warn", where, "clinicalStatus darf bei verificationStatus \"entered-in-error\" nicht vorkommen (Regel con-5).", { entry: e.index });
    }
    walkValues(res, (key, val, p) => {
      if (Array.isArray(val) && val.length === 0) add("warn", where, `${p}: leeres Array. In FHIR-JSON werden leere Arrays weggelassen.`, { entry: e.index });
      else if (val === "") add("warn", where, `${p}: leerer Text. In FHIR-JSON dürfen Texte nicht leer sein.`, { entry: e.index });
      else if (val === null) add("warn", where, `${p}: null. In FHIR-JSON gibt es keine null-Werte (außer in Platzhalter-Arrays für Primitive mit Erweiterung).`, { entry: e.index });
      else if (typeof val === "string") {
        if (DATE_FIELDS[key] && !DATE_FIELDS[key].test(val)) add("warn", where, `${p}: "${val}" ist kein gültiges FHIR-date (erwartet JJJJ, JJJJ-MM oder JJJJ-MM-TT).`, { entry: e.index });
        else if (DATETIME_SUFFIX.test(key) && !DATETIME_RE.test(val)) add("warn", where, `${p}: "${val}" ist kein gültiges FHIR-dateTime (erwartet z. B. 2016-03-28 oder 2016-03-28T10:15:00+01:00; bei Uhrzeit ist eine Zeitzone Pflicht).`, { entry: e.index });
        else if (INSTANT_FIELDS.has(key) && !INSTANT_RE.test(val)) add("warn", where, `${p}: "${val}" ist kein gültiger FHIR-instant (erwartet Datum, Uhrzeit mit Sekunden und Zeitzone).`, { entry: e.index });
      }
    });
    for (const r of e.refs) {
      if (r.status === "unresolved") {
        if (model.isBundle) {
          const external = r.external ? " Externe Server-URLs lassen sich ohne Netzwerkzugriff nicht prüfen." : "";
          add(r.external ? "info" : "warn", where, `Referenz ${r.path}${r.ref ? ' = "' + r.ref + '"' : " (per Identifier)"}: ${r.reason || "nicht auflösbar"}.${external}`, { entry: e.index });
        } else if (r.ref && r.ref[0] === "#") add("warn", where, `Referenz ${r.path} = "${r.ref}": ${r.reason}.`, { entry: e.index });
      } else if (r.status === "ambiguous") add("warn", where, `Referenz ${r.path} = "${r.ref || "Identifier"}" ist mehrdeutig: mehrere Einträge passen.`, { entry: e.index });
      else if (r.method === "typ-id") add("info", where, `Referenz ${r.path} = "${r.ref}" wurde nur über Typ und id gefunden, nicht über die fullUrl. Nach der Spezifikation ist die Auflösung hier nicht definiert.`, { entry: e.index });
    }
  });
  return hints;
}

function walkValues(node, fn, path = "", key = "") {
  if (Array.isArray(node)) { node.forEach((x, i) => { if (x === null && key.startsWith("_")) return; walkValues(x, fn, path + "[" + i + "]", key); }); return; }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if (k === "text" && path === "" ) continue;
      const p = path ? path + "." + k : k;
      if (Array.isArray(v) || v === "" || v === null || typeof v === "string") fn(k, v, p);
      if (v && typeof v === "object") walkValues(v, fn, p, k);
    }
  }
}

/** Hinweis auf R5, wenn typische R5-Formen auftauchen. Reine Heuristik. */
export function versionHint(model) {
  const r5 = [];
  for (const e of model.entries) {
    const r = e.resource; if (!r) continue;
    if (r.resourceType === "Encounter" && (r.actualPeriod || Array.isArray(r.class))) r5.push("Encounter mit actualPeriod bzw. class als Liste");
    if (r.resourceType === "MedicationRequest" && r.medication && typeof r.medication === "object" && (r.medication.concept || r.medication.reference)) r5.push("MedicationRequest.medication als CodeableReference");
  }
  return [...new Set(r5)];
}
