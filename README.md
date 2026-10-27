# Viewer für FHIR-Daten

Kostenloser Viewer für FHIR-Daten im Browser: JSON und XML einer Ressource oder eines Bundles einfügen, als Karte oder Baum ansehen, Bundle-Einträge und Referenzen durchsuchen, FHIRPath-Ausdrücke testen. Alles läuft lokal im Browser, es wird nichts hochgeladen, es gibt keine Cookies und keine Drittanbieter-Einbindungen.

Live: https://freimoser.github.io/fhir-viewer/

**Grenzen:** Kein Validator (keine Profil- und Terminologieprüfung), Grundlage ist FHIR R4 (4.0.1), kein Medizinprodukt, nur zur Ansicht.

## Aufbau
- `src/lib/` – Parser (JSON, XML), Modell und Plausibilitätshinweise, Referenzauflösung, Kartenansichten, FHIRPath-Anbindung (`@medplum/core`, lazy geladen)
- `src/site/` – Seiteninhalte und Layout (`config.mjs` enthält Name, Slug, Schalter)
- `scripts/build.mjs` – erzeugt die komplette Seite im Wurzelverzeichnis (GitHub Pages liefert aus `main:/`, das Build-Ergebnis ist eingecheckt)
- `scripts/check.mjs`, `scripts/e2e.mjs` – statische Prüfungen und Browser-Test (Chrome + puppeteer-core)
- `samples/orig/` – Original-Beispiele aus der FHIR-Spezifikation R4 (CC0)

## Entwickeln
```
npm ci
npm test
npm run build
npm run check
npm run e2e
```
Optional: `EDITORIAL_LINK=1 npm run build` schaltet den redaktionellen Verweis auf der Seite „Was ist FHIR?“ ein (standardmäßig aus).

## Lizenz
MIT (eigener Code), siehe `LICENSE`. Drittanbieter: `THIRD-PARTY-LICENSES` (`@medplum/core`, Apache-2.0). Beispieldaten: CC0 1.0 (FHIR-Spezifikation). Quellen: `quellen.md`.

HL7® und FHIR® sind eingetragene Marken von Health Level Seven International. Dieses Werkzeug ist ein unabhängiges Projekt und wird von HL7 International weder bereitgestellt noch empfohlen.
