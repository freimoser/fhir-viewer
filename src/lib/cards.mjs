import { choice, SKIP, isObj } from "./format.mjs";

/** Felder je Ressourcentyp für die Kartenansicht (Reihenfolge = Anzeige). "x" hinter dem Namen steht für ein Auswahlelement value[x]. */
export const CARD_FIELDS = {
  Patient: ["identifier", "active", "name", "gender", "birthDate", "deceased[x]", "telecom", "address", "maritalStatus", "communication", "contact", "generalPractitioner", "managingOrganization"],
  Observation: ["status", "category", "code", "subject", "encounter", "effective[x]", "issued", "performer", "value[x]", "dataAbsentReason", "interpretation", "note", "bodySite", "method", "referenceRange", "component", "hasMember", "basedOn"],
  Encounter: ["identifier", "status", "class", "type", "serviceType", "priority", "subject", "participant", "period", "actualPeriod", "length", "reasonCode", "reasonReference", "diagnosis", "hospitalization", "location", "serviceProvider"],
  Condition: ["clinicalStatus", "verificationStatus", "category", "severity", "code", "bodySite", "subject", "encounter", "onset[x]", "abatement[x]", "recordedDate", "recorder", "asserter", "stage", "evidence", "note"],
  MedicationRequest: ["status", "intent", "category", "priority", "medication[x]", "subject", "encounter", "authoredOn", "requester", "reasonCode", "dosageInstruction", "dispenseRequest", "substitution", "note"],
  DiagnosticReport: ["status", "category", "code", "subject", "encounter", "effective[x]", "issued", "performer", "result", "conclusion", "conclusionCode", "presentedForm"],
  Medication: ["code", "status", "form", "amount", "ingredient", "manufacturer"],
  Practitioner: ["identifier", "active", "name", "telecom", "address", "gender", "birthDate", "qualification"],
  Organization: ["identifier", "active", "type", "name", "alias", "telecom", "address", "partOf"],
  Procedure: ["status", "category", "code", "subject", "encounter", "performed[x]", "performer", "reasonCode", "bodySite", "outcome", "note"],
  Immunization: ["status", "vaccineCode", "patient", "encounter", "occurrence[x]", "lotNumber", "performer", "note"],
  AllergyIntolerance: ["clinicalStatus", "verificationStatus", "type", "category", "criticality", "code", "patient", "onset[x]", "recordedDate", "reaction", "note"],
};

export function cardFields(res) {
  if (!isObj(res)) return [];
  const names = CARD_FIELDS[res.resourceType];
  const out = [];
  const used = new Set();
  const take = (label, key, value) => { out.push({ label, key, value }); used.add(key); };
  if (names) {
    for (const n of names) {
      if (n.endsWith("[x]")) {
        const base = n.slice(0, -3);
        const c = choice(res, base);
        if (c && c.value !== undefined) take(c.key, c.key, c.value);
      } else if (res[n] !== undefined) take(n, n, res[n]);
    }
  }
  // Übrige Elemente anhängen, damit nichts verschwindet
  for (const [k, v] of Object.entries(res)) {
    if (SKIP.has(k) || used.has(k) || k.startsWith("_")) continue;
    take(k, k, v);
  }
  return out;
}
