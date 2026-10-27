/**
 * Referenzen innerhalb eines Bundles auflösen, nach https://hl7.org/fhir/R4/bundle.html#bundle-unique
 * ("Resolving references in Bundles"). Ergebnis je Referenz:
 *   { status: "resolved"|"contained"|"unresolved"|"ambiguous"|"external", index, method }
 * method: "fullUrl" (spezifikationskonform), "versionId", "identifier", "typ-id" (Rückfall, nicht spezifikationskonform), "contained"
 */
const REST_URL = /^(.*?)([A-Z][A-Za-z]+)\/([A-Za-z0-9\-.]{1,64})(\/_history\/([A-Za-z0-9\-.]{1,64}))?$/;
const ABS = /^[A-Za-z][A-Za-z0-9+.-]*:/;

export function splitRestUrl(u) {
  const m = REST_URL.exec(u || "");
  if (!m) return null;
  return { root: m[1], type: m[2], id: m[3], version: m[5] || null };
}

export function buildIndex(entries) {
  const byUrl = new Map();
  const byTypeId = new Map();
  for (const e of entries) {
    if (e.fullUrl) { const base = (splitRestUrl(e.fullUrl)?.version ? e.fullUrl.replace(/\/_history\/[^/]+$/, "") : e.fullUrl); if (!byUrl.has(base)) byUrl.set(base, []); byUrl.get(base).push(e); }
    if (e.resource && e.resource.resourceType && e.resource.id) { const k = e.resource.resourceType + "/" + e.resource.id; if (!byTypeId.has(k)) byTypeId.set(k, []); byTypeId.get(k).push(e); }
  }
  return { byUrl, byTypeId, entries };
}

function pickVersion(cands, version) {
  if (!version) return cands;
  const m = cands.filter((c) => c.resource?.meta?.versionId === version);
  return m;
}

export function resolveReference(ref, ctx) {
  // ctx: { entry (enthaltender Eintrag oder null), index (buildIndex oder null), resource (enthaltende Ressource) }
  const { entry, index, resource } = ctx;
  if (typeof ref === "string" && ref[0] === "#") {
    if (ref === "#") return { status: "contained", index: entry ? entry.index : 0, method: "contained" };
    const id = ref.slice(1);
    const has = Array.isArray(resource?.contained) && resource.contained.some((c) => c && c.id === id);
    return has ? { status: "contained", index: entry ? entry.index : 0, method: "contained", containedId: id } : { status: "unresolved", reason: `contained-Ressource mit id "${id}" fehlt` };
  }
  if (!index) return { status: "external" };
  const finish = (cands, method, version) => {
    let c = cands;
    if (version) { c = pickVersion(cands, version); if (!c.length) return { status: "unresolved", reason: `Version ${version} nicht im Bundle` }; method = "versionId"; }
    if (c.length === 1) return { status: "resolved", index: c[0].index, method };
    if (c.length > 1) return { status: "ambiguous", indexes: c.map((x) => x.index), method };
    return null;
  };
  const rest = splitRestUrl(ref);
  let absolute = null;
  if (ABS.test(ref)) absolute = ref;
  else if (rest && !rest.root) {
    const base = entry && splitRestUrl(entry.fullUrl);
    if (base) absolute = base.root + ref;
  }
  if (absolute) {
    const abs = absolute.replace(/\/_history\/[^/]+$/, "");
    const ver = splitRestUrl(absolute)?.version || null;
    const cands = index.byUrl.get(abs);
    if (cands) { const r = finish(cands, "fullUrl", ver); if (r) return r; }
  }
  // Rückfall: eindeutig über Typ/id (nicht spezifikationskonform, daher gekennzeichnet)
  if (rest) {
    const cands = index.byTypeId.get(rest.type + "/" + rest.id);
    if (cands) { const r = finish(cands, "typ-id", rest.version); if (r && r.status === "resolved") return r; }
  }
  if (ABS.test(ref) && /^https?:/i.test(ref)) return { status: "unresolved", external: true, reason: "nicht im Bundle (externe URL)" };
  return { status: "unresolved", reason: "nicht im Bundle" };
}

export function resolveIdentifier(idf, index) {
  if (!index || !idf || !idf.value) return { status: "unresolved", reason: "Identifier ohne Wert" };
  const c = index.entries.filter((e) => Array.isArray(e.resource?.identifier) && e.resource.identifier.some((i) => i.value === idf.value && (i.system || "") === (idf.system || "")));
  if (c.length === 1) return { status: "resolved", index: c[0].index, method: "identifier" };
  if (c.length > 1) return { status: "ambiguous", indexes: c.map((x) => x.index), method: "identifier" };
  return { status: "unresolved", reason: "kein Eintrag mit diesem Identifier" };
}

const REF_KEYS = new Set(["subject", "patient", "encounter", "performer", "author", "requester", "recorder", "asserter", "basedOn", "partOf", "managingOrganization", "serviceProvider", "generalPractitioner", "result", "specimen", "device", "location", "individual", "medicationReference", "reasonReference", "focus", "target", "source", "sender", "recipient", "owner", "informationSource", "participant", "resultsInterpreter", "custodian", "supportingInfo", "insurer", "provider", "payor", "link", "other", "evidence", "detail", "entered", "enterer", "agent", "who", "onBehalfOf", "context", "hasMember", "derivedFrom", "prescription", "request", "episodeOfCare", "diagnosis", "condition", "orderer", "manufacturer", "operator", "member", "entity", "referrer"]);

/** Alle Referenzen einer Ressource einsammeln (Pfad, Wert). */
export function collectReferences(resource) {
  const out = [];
  (function walk(node, path, key) {
    if (Array.isArray(node)) { node.forEach((x, i) => walk(x, path + "[" + i + "]", key)); return; }
    if (!node || typeof node !== "object") return;
    if (typeof node.reference === "string") out.push({ path, ref: node.reference, node });
    else if (node.identifier && typeof node.identifier === "object" && !Array.isArray(node.identifier) && key && REF_KEYS.has(key) && !node.value) out.push({ path, identifier: node.identifier, node });
    for (const [k, v] of Object.entries(node)) {
      if (k === "contained" && path === "") continue;
      if (k === "text" && v && typeof v === "object") continue;
      walk(v, path ? path + "." + k : k, k);
    }
  })(resource, "", "");
  return out;
}
