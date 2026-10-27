import test from "node:test";
import assert from "node:assert/strict";
import { parseInput } from "../src/lib/parse.mjs";

test("JSON-Fehler sind deutsch und nennen die Stelle", () => {
  const faelle = [
    ['{"a":1,}', /Zeile 1, Spalte 8.*Erwartet wurde ein Name/],
    ['{"a":1 "b":2}', /Erwartet wurde ein Komma oder \}/],
    ['[1 2]', /Erwartet wurde ein Komma oder \]/],
    ['{"a":', /endet unerwartet/],
    ["{'a':1}", /Erwartet wurde ein Name in doppelten Anführungszeichen/],
    ['{"a":1} x', /Nach dem JSON-Wert folgt weiterer Text/],
  ];
  for (const [text, re] of faelle) {
    const r = parseInput(text);
    assert.equal(r.ok, false);
    assert.match(r.error.message, re);
    assert.doesNotMatch(r.error.message, /Unexpected|Expected|in JSON|JSON\.parse|is not valid/);
  }
});
