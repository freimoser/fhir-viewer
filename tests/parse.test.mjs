import test from "node:test";
import assert from "node:assert/strict";
import { parseInput } from "../src/lib/parse.mjs";
import { sample } from "./helpers.mjs";

test("gültiges JSON wird erkannt", () => {
  const r = parseInput(JSON.stringify(sample("patient-example")));
  assert.equal(r.ok, true); assert.equal(r.format, "json"); assert.equal(r.resource.resourceType, "Patient");
});
test("BOM wird ignoriert", () => {
  const r = parseInput("\ufeff{\"resourceType\":\"Patient\"}");
  assert.equal(r.ok, true);
});
test("leere Eingabe", () => { assert.equal(parseInput("  ").ok, false); });
test("ungültiges JSON meldet Zeile und Spalte", () => {
  const r = parseInput('{\n  "resourceType": "Patient",\n  "id": "x",\n}');
  assert.equal(r.ok, false);
  assert.equal(r.error.line, 4);
  assert.ok(r.error.column >= 1);
  assert.match(r.error.message, /Zeile 4/);
  assert.match(r.error.hint, /Komma/);
});
test("abgeschnittenes JSON", () => {
  const r = parseInput('{"resourceType":"Patient","name":[{"family":"A"');
  assert.equal(r.ok, false); assert.match(r.error.hint, /endet|schließende/);
});
test("Array auf oberster Ebene", () => {
  const r = parseInput('[{"resourceType":"Patient"}]');
  assert.equal(r.ok, false); assert.match(r.error.message, /Array/);
});
test("Zahl ist kein Objekt", () => { assert.equal(parseInput("42").ok, false); });
test("einfache Anführungszeichen", () => {
  const r = parseInput("{'resourceType':'Patient'}");
  assert.equal(r.ok, false); assert.match(r.error.hint, /Anführungszeichen/);
});

const XML = `<?xml version="1.0" encoding="UTF-8"?>
<Patient xmlns="http://hl7.org/fhir">
  <id value="xml-1"/>
  <identifier><system value="http://example.org/mrn"/><value value="123"/></identifier>
  <active value="true"/>
  <name><use value="official"/><family value="Muster"/><given value="Max"/><given value="Karl"/></name>
  <name><family value="Zweit"/></name>
  <birthDate value="1980-02-03"/>
  <contained><Organization><id value="o1"/><name value="A &amp; B"/></Organization></contained>
  <extension url="http://example.org/ext"><valueInteger value="5"/></extension>
</Patient>`;
test("XML wird in JSON-Struktur gewandelt", () => {
  const r = parseInput(XML);
  assert.equal(r.ok, true); assert.equal(r.format, "xml");
  const p = r.resource;
  assert.equal(p.resourceType, "Patient"); assert.equal(p.id, "xml-1"); assert.equal(p.active, true);
  assert.equal(p.identifier.value, "123"); // Identifier.value bleibt Text
  assert.equal(typeof p.identifier.value, "string");
  assert.equal(p.name.length, 2); assert.deepEqual(p.name[0].given, ["Max", "Karl"]);
  assert.equal(p.contained.resourceType, "Organization"); assert.equal(p.contained.name, "A & B");
  assert.equal(p.extension.url, "http://example.org/ext"); assert.equal(p.extension.valueInteger, 5);
});
test("XML: Quantity.value wird Zahl", () => {
  const r = parseInput(`<Observation xmlns="http://hl7.org/fhir"><valueQuantity><value value="185.5"/><unit value="lbs"/></valueQuantity></Observation>`);
  assert.equal(r.resource.valueQuantity.value, 185.5);
});
test("XML: Bundle mit resource-Wrappern", () => {
  const r = parseInput(`<Bundle xmlns="http://hl7.org/fhir"><type value="collection"/><entry><fullUrl value="urn:uuid:1"/><resource><Patient><id value="a"/></Patient></resource></entry></Bundle>`);
  assert.equal(r.resource.entry.resource.resourceType, "Patient");
  assert.equal(r.resource.entry.fullUrl, "urn:uuid:1");
});
test("XML-Fehler mit Zeile", () => {
  const r = parseInput("<Patient xmlns=\"http://hl7.org/fhir\">\n  <id value=\"1\"/>\n  <name>\n</Patient>");
  assert.equal(r.ok, false); assert.match(r.error.message, /Zeile \d+/);
});
test("XML: DOCTYPE wird abgelehnt", () => {
  const r = parseInput('<!DOCTYPE x [<!ENTITY a "b">]><Patient/>');
  assert.equal(r.ok, false); assert.match(r.error.message, /DOCTYPE/);
});
test("XML: zwei Wurzelelemente", () => { assert.equal(parseInput("<a/><b/>").ok, false); });

test("XML ohne FHIR-Namensraum liefert einen Hinweis, mit Namensraum nicht", () => {
  const a = parseInput('<Patient><id value="x"/></Patient>');
  assert.equal(a.ok, true);
  assert.equal(a.notes.length, 1);
  const b = parseInput('<?xml version="1.0"?><Patient xmlns="http://hl7.org/fhir"><id value="x"/></Patient>');
  assert.equal(b.notes.length, 0);
});

test("Text ohne { oder < bekommt einen passenden Hinweis", () => {
  const r = parseInput("Hallo Welt");
  assert.equal(r.ok, false);
  assert.match(r.error.hint, /weder mit \{/);
});
