import test from "node:test";
import assert from "node:assert/strict";
import { buildModel, checkModel, versionHint } from "../src/lib/model.mjs";
import { splitRestUrl } from "../src/lib/refs.mjs";
import { sample } from "./helpers.mjs";

test("splitRestUrl zerlegt RESTful-URLs", () => {
  assert.deepEqual(splitRestUrl("http://example.org/fhir/Patient/23"), { root: "http://example.org/fhir/", type: "Patient", id: "23", version: null });
  assert.equal(splitRestUrl("Patient/45/_history/2").version, "2");
  assert.equal(splitRestUrl("urn:uuid:04121321-4af5-424c-a0e1-ed3aab1c349d"), null);
});

const refsOf = (m, i) => m.entries[i].refs.map((r) => ({ path: r.path, status: r.status, index: r.index, method: r.method }));

test("Bundle mit Referenzen: relative Referenz über fullUrl-Root, absolute, urn:uuid, Version, Identifier", () => {
  const m = buildModel(sample("bundle-references"));
  assert.equal(m.isBundle, true); assert.equal(m.entries.length, 11);
  assert.deepEqual(m.typeCounts.get("Patient"), 4); assert.equal(m.typeCounts.get("Observation"), 7);
  assert.deepEqual(refsOf(m, 2), [{ path: "subject", status: "resolved", index: 0, method: "fullUrl" }]);
  assert.deepEqual(refsOf(m, 3), [{ path: "subject", status: "resolved", index: 0, method: "fullUrl" }]);
  assert.deepEqual(refsOf(m, 4), [{ path: "subject", status: "resolved", index: 1, method: "fullUrl" }]);
  assert.equal(refsOf(m, 5)[0].status, "unresolved");
  // Version 2 von Patient/45 ist Eintrag 8 (meta.versionId = 2)
  assert.deepEqual(refsOf(m, 9), [{ path: "subject", status: "resolved", index: 8, method: "versionId" }]);
  assert.equal(m.entries[8].resource.meta.versionId, "2");
  assert.deepEqual(refsOf(m, 10), [{ path: "subject", status: "resolved", index: 0, method: "identifier" }]);
});
test("Rückfall über Typ/id ist gekennzeichnet", () => {
  const m = buildModel(sample("bundle-references"));
  assert.equal(refsOf(m, 6)[0].method, "typ-id");
  const hints = checkModel(m);
  assert.ok(hints.some((h) => h.level === "info" && /nur über Typ und id/.test(h.msg)));
});
test("eingehende Referenzen werden gezählt", () => {
  const m = buildModel(sample("bundle-references"));
  assert.ok(m.entries[0].incoming.length >= 4);
});
test("kaputte Referenz im Bundle wird gemeldet", () => {
  const b = { resourceType: "Bundle", type: "collection", entry: [{ fullUrl: "http://x.org/fhir/Observation/1", resource: { resourceType: "Observation", id: "1", status: "final", code: { text: "a" }, subject: { reference: "Patient/999" } } }] };
  const hints = checkModel(buildModel(b));
  assert.ok(hints.some((h) => h.level === "warn" && /Patient\/999/.test(h.msg)));
});
test("contained-Referenzen", () => {
  const r = { resourceType: "Observation", id: "o", status: "final", code: { text: "x" }, contained: [{ resourceType: "Patient", id: "p1" }], subject: { reference: "#p1" }, performer: [{ reference: "#nope" }] };
  const m = buildModel(r);
  assert.equal(m.entries[0].refs.find((x) => x.path === "subject").status, "contained");
  assert.equal(m.entries[0].refs.find((x) => x.path.startsWith("performer")).status, "unresolved");
});
test("resourceType fehlt", () => {
  const h = checkModel(buildModel({ foo: 1 }));
  assert.equal(h[0].level, "error"); assert.match(h[0].msg, /resourceType/);
});
test("unbekannter Ressourcentyp", () => {
  const h = checkModel(buildModel({ resourceType: "Patent" }));
  assert.ok(h.some((x) => /Patent/.test(x.msg)));
});
test("Pflichtfelder und Datumsformat", () => {
  const h = checkModel(buildModel({ resourceType: "Observation", id: "a b", effectiveDateTime: "2020-01-01T10:00:00", birthDate: "x" }));
  const msgs = h.map((x) => x.msg).join("\n");
  assert.match(msgs, /Pflichtfeld "status"/); assert.match(msgs, /Pflichtfeld "code"/);
  assert.match(msgs, /id "a b" ist ungültig/); assert.match(msgs, /Zeitzone/);
});
test("mehrere value[x]", () => {
  const h = checkModel(buildModel({ resourceType: "Observation", status: "final", code: { text: "c" }, valueString: "a", valueBoolean: true }));
  assert.ok(h.some((x) => x.level === "error" && /value\[x\]/.test(x.msg)));
});
test("Bundle-Regeln: fehlende fullUrl, transaction ohne request, document", () => {
  const h1 = checkModel(buildModel({ resourceType: "Bundle", type: "collection", entry: [{ resource: { resourceType: "Patient", id: "1" } }] }));
  assert.ok(h1.some((x) => /fullUrl fehlt/.test(x.msg)));
  const h2 = checkModel(buildModel({ resourceType: "Bundle", type: "transaction", entry: [{ resource: { resourceType: "Patient", id: "1" } }] }));
  assert.ok(h2.some((x) => /entry\.request Pflicht/.test(x.msg))); assert.ok(!h2.some((x) => /fullUrl fehlt/.test(x.msg)));
  const h3 = checkModel(buildModel({ resourceType: "Bundle", type: "document", entry: [{ fullUrl: "urn:uuid:1", resource: { resourceType: "Patient" } }] }));
  assert.ok(h3.some((x) => /Composition/.test(x.msg)));
  const h4 = checkModel(buildModel({ resourceType: "Bundle" }));
  assert.ok(h4.some((x) => /Bundle\.type fehlt/.test(x.msg)));
});
test("leere Arrays und leere Texte", () => {
  const h = checkModel(buildModel({ resourceType: "Patient", name: [], gender: "" }));
  assert.ok(h.some((x) => /leeres Array/.test(x.msg))); assert.ok(h.some((x) => /leerer Text/.test(x.msg)));
});
test("Spezifikationsbeispiele erzeugen keine Warnungen oder Fehler (außer erwarteten)", () => {
  for (const f of ["patient-example", "observation-example", "observation-example-bloodpressure", "condition-example", "encounter-example", "bundle-transaction"]) {
    const h = checkModel(buildModel(sample(f))).filter((x) => x.level !== "info");
    assert.deepEqual(h.map((x) => x.msg), [], f);
  }
});
test("R5-Hinweis", () => {
  const m = buildModel({ resourceType: "Encounter", status: "completed", class: [{ coding: [{ code: "AMB" }] }], actualPeriod: { start: "2020-01-01" } });
  assert.equal(versionHint(m).length, 1);
  assert.equal(versionHint(buildModel(sample("encounter-example"))).length, 0);
});
