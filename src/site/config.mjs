// Zentrale Konstanten. NAME/SLUG lassen sich hier ändern (z. B. bei einer Umbenennung).
export const NAME = "Viewer für FHIR-Daten";
export const SHORT = "FHIR-Viewer";
export const SLUG = "fhir-viewer";
export const ORIGIN = "https://freimoser.github.io";
export const BASE = `/${SLUG}/`;
export const SITE = ORIGIN + BASE;
export const REPO = `https://github.com/freimoser/${SLUG}`;
export const LASTMOD = process.env.BUILD_DATE || new Date().toISOString().slice(0, 10);
export const GSC_TOKEN = "6pYvtFCnU7UFcQFajtMSkQ7tYMy3Z_Bt7teKiT5yKNg";
export const BING_TOKEN = "E1F30DEB311AAF5458907DB431B481AC";
export const INDEXNOW_KEY = "c67e9b3d19be863e1c5ec56c3a89f916";
export const AUTHOR = { name: "Thomas Freimoser", site: "https://freimoser.de/", linkedin: "https://www.linkedin.com/in/thomas-freimoser/", impressum: "https://freimoser.de/impressum/" };
export const EDITORIAL = { name: "FleXChange Medical", url: "https://flexchange-medical.de/" };

// Schwesterprojekte. Optionale Einträge werden nur gerendert, wenn die Seite beim Build mit HTTP 200 antwortet.
export const TOOLS = [
  { id: "ldt-bdt-viewer", name: "LDT & BDT Viewer", desc: "LDT- und BDT-Dateien (Labor- und Praxisdaten) im Browser lesen", url: "https://freimoser.github.io/ldt-bdt-viewer/" },
  { id: "gdt-viewer", name: "GDT Viewer", desc: "GDT-Dateien im Browser lesen und Testdaten erzeugen", url: "https://freimoser.github.io/gdt-viewer/" },
  { id: "dicom-viewer", name: "DICOM Viewer", desc: "Röntgen-, CT- und MRT-Bilder im Browser ansehen", url: "https://freimoser.github.io/dicom-viewer/" },
  { id: "hl7v2-viewer", name: "HL7 v2 Viewer", desc: "HL7-v2-Nachrichten im Browser lesen", url: "https://freimoser.github.io/hl7v2-viewer/", optional: true },
  { id: "cda-viewer", name: "CDA Viewer", desc: "Klinische Dokumente im Browser lesen", url: "https://freimoser.github.io/cda-viewer/", optional: true },
];

export const NAV = [
  { href: "", label: "Viewer" },
  { href: "fhir-bundle-anzeigen/", label: "Bundle anzeigen" },
  { href: "fhirpath-tester/", label: "FHIRPath-Tester" },
  { href: "was-ist-fhir/", label: "Was ist FHIR?" },
];

export const DISCLAIMER_TM = "HL7®, HEALTH LEVEL SEVEN® und FHIR® sind eingetragene Marken von Health Level Seven International. Dieses Werkzeug ist ein unabhängiges Projekt und wird von HL7 International weder bereitgestellt noch empfohlen.";
export const DEFINITION = "FHIR (Fast Healthcare Interoperability Resources) ist ein Standard von HL7 International, der Gesundheitsdaten als Ressourcen wie Patient, Observation oder Encounter beschreibt; sie lassen sich als JSON oder XML über REST-Schnittstellen austauschen.";

// Redaktioneller Verweis auf den Anbieter: standardmäßig AUS, bis die Formulierung freigegeben ist.
// Einschalten (genau ein Link im Fließtext von /was-ist-fhir/): EDITORIAL_LINK=1 node scripts/build.mjs
export const EDITORIAL_LINK = process.env.EDITORIAL_LINK === "1";
