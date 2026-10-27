import test from "node:test";
import assert from "node:assert/strict";
import { runFhirPath, translateError } from "../src/lib/fhirpath.mjs";
import { sample } from "./helpers.mjs";

const p = sample("patient-example");
test("einfacher Pfad", async () => {
  const r = await runFhirPath("Patient.birthDate", p);
  assert.deepEqual(r.results.map((x) => x.value), ["1974-12-25"]);
});
test("where und first", async () => {
  const r = await runFhirPath("Patient.name.where(use='official').family", p);
  assert.deepEqual(r.results.map((x) => x.value), ["Chalmers"]);
  const g = await runFhirPath("Patient.name.where(use='official').given.first()", p);
  assert.deepEqual(g.results.map((x) => x.value), ["Peter"]);
});
test("Bundle: ofType und count", async () => {
  const b = sample("bundle-references");
  assert.equal((await runFhirPath("Bundle.entry.resource.ofType(Observation).count()", b)).results[0].value, 7);
  assert.equal((await runFhirPath("Bundle.entry.resource.ofType(Patient).count()", b)).results[0].value, 4);
});
test("Blutdruck: component filtern", async () => {
  const o = sample("observation-example-bloodpressure");
  const r = await runFhirPath("Observation.component.where(code.coding.where(code='8480-6').exists()).value.value", o);
  assert.ok(r.ok, r.error);
  assert.equal(r.results.length, 1); assert.equal(typeof r.results[0].value, "number");
});
test("leerer Ausdruck und Syntaxfehler liefern verständliche Meldungen", async () => {
  assert.match((await runFhirPath("  ", p)).error, /Bitte geben Sie/);
  const e = await runFhirPath("Patient.name.where(use='official'", p);
  assert.equal(e.ok, false); assert.match(e.error, /Ausdruck|Klammer/);
  const f = await runFhirPath("Patient.name.nofunc()", p);
  assert.match(f.error, /nofunc/); 
});
test("translateError", () => {
  assert.match(translateError(new Error("Parse error at \".\" (line 1, column 13). No matching prefix parselet.")), /Syntaxfehler bei "\." \(Zeichen 13\)/);
});
