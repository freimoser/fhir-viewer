import test from "node:test";
import assert from "node:assert/strict";
import { cardFields } from "../src/lib/cards.mjs";
import { labelOf, kindOf, plainText } from "../src/lib/format.mjs";
import { sample } from "./helpers.mjs";

const keys = (r) => cardFields(r).map((f) => f.key);
test("Patient-Karte", () => {
  const k = keys(sample("patient-example"));
  for (const x of ["identifier", "name", "gender", "birthDate", "address"]) assert.ok(k.includes(x), x);
  assert.equal(labelOf(sample("patient-example")), "Peter James Chalmers · * 1974-12-25 · male");
});
test("Observation-Karte mit value[x] und component", () => {
  assert.ok(keys(sample("observation-example")).includes("valueQuantity"));
  const bp = keys(sample("observation-example-bloodpressure"));
  assert.ok(bp.includes("component")); assert.ok(bp.includes("effectiveDateTime"));
  assert.equal(labelOf(sample("observation-example")), "Body Weight: 185 lbs");
  assert.equal(labelOf(sample("observation-example-bloodpressure")), "Blood pressure systolic & diastolic: 107 mmHg / 60 mmHg");
});
test("Encounter- und Condition-Karte", () => {
  assert.deepEqual(keys(sample("encounter-example")), ["status", "class", "subject"]);
  const c = keys(sample("condition-example"));
  assert.ok(c.includes("onsetDateTime") && c.includes("clinicalStatus") && c.includes("code"));
});
test("MedicationRequest und DiagnosticReport (synthetisch)", () => {
  const mr = { resourceType: "MedicationRequest", status: "active", intent: "order", medicationCodeableConcept: { text: "X" }, subject: { reference: "Patient/1" } };
  assert.ok(keys(mr).includes("medicationCodeableConcept")); assert.match(labelOf(mr), /X · active/);
  const dr = { resourceType: "DiagnosticReport", status: "final", code: { text: "Lipidprofil" }, subject: { reference: "Patient/1" }, effectiveDateTime: "2020-01-01", result: [{ reference: "Observation/1" }] };
  assert.deepEqual(keys(dr), ["status", "code", "subject", "effectiveDateTime", "result"]);
});
test("unbekannter Typ zeigt alle Elemente", () => {
  assert.deepEqual(keys({ resourceType: "Basic", id: "1", code: { text: "x" }, created: "2020-01-01" }), ["code", "created"]);
});
test("Datentypen werden erkannt", () => {
  assert.equal(kindOf({ reference: "Patient/1" }), "Reference");
  assert.equal(kindOf({ coding: [] }), "CodeableConcept");
  assert.equal(kindOf({ value: 1, unit: "kg" }), "Quantity");
  assert.equal(kindOf({ system: "phone", value: "1" }), "ContactPoint");
  assert.equal(kindOf({ system: "urn:oid:1", value: "1" }), "Identifier");
  assert.equal(kindOf({ start: "2020" }), "Period");
  assert.equal(kindOf({ family: "A" }), "HumanName");
  assert.equal(plainText({ value: 5, unit: "mg" }), "5 mg");
  assert.equal(plainText({ start: "2020-01-01" }), "2020-01-01 – offen");
});
