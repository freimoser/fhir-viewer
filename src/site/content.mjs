// Quellen, die auf den Seiten verlinkt werden. Alle wurden für diese Seite geöffnet und gelesen.
const R4 = "https://hl7.org/fhir/R4/";
export const SRC = {
  overview: { label: "FHIR R4: Overview", url: R4 + "overview.html" },
  resource: { label: "FHIR R4: Resource", url: R4 + "resource.html" },
  json: { label: "FHIR R4: JSON-Format", url: R4 + "json.html" },
  xml: { label: "FHIR R4: XML-Format", url: R4 + "xml.html" },
  bundle: { label: "FHIR R4: Bundle", url: R4 + "bundle.html" },
  references: { label: "FHIR R4: References", url: R4 + "references.html" },
  http: { label: "FHIR R4: RESTful API", url: R4 + "http.html" },
  fhirpath: { label: "FHIR R4: FHIRPath", url: R4 + "fhirpath.html" },
  versions: { label: "FHIR R4: Versions", url: R4 + "versions.html" },
  license: { label: "FHIR: License und Marken", url: "https://hl7.org/fhir/license.html" },
  patient: { label: "FHIR R4: Patient", url: R4 + "patient.html" },
  observation: { label: "FHIR R4: Observation", url: R4 + "observation.html" },
  encounter: { label: "FHIR R4: Encounter", url: R4 + "encounter.html" },
  condition: { label: "FHIR R4: Condition", url: R4 + "condition.html" },
  kbvBasis: { label: "KBV: Basis-Profile", url: "https://hub.kbv.de/spaces/BASE1X0/pages/29098086/KBV-Basis-Profile" },
  kbvMio: { label: "KBV: Medizinische Informationsobjekte (MIO)", url: "https://hub.kbv.de/site/mio" },
  isik: { label: "gematik: ISiK Basis 6.0.0", url: "https://gemspec.gematik.de/ig/fhir/isik/basis/6.0.0/index.html" },
  hl7de: { label: "HL7 Deutschland: Technisches Komitee FHIR", url: "https://www.hl7.de/technische-komitees/fhir/" },
  loinc: { label: "LOINC-Lizenz (Regenstrief Institute)", url: "https://loinc.org/license/" },
  medplum: { label: "Medplum (Apache-2.0)", url: "https://github.com/medplum/medplum" },
};

export const srcList = (keys) => `<ul class="src">${keys.map((k) => `<li><a href="${SRC[k].url}" rel="noopener">${SRC[k].label}</a></li>`).join("")}</ul>`;

/** Deutsche Quellen: nur das, was auf den Seiten belegt ist. */
export const DE_FACTS = [
  { src: "kbvBasis", text: "Die KBV nutzt FHIR für MIOs und weitere Schnittstellen (genannt werden eRezept, eAU und Wechselschnittstellen). Die KBV-Basis-Profile werden in mehreren MIOs wiederverwendet; Ziel ist, dass gleiche Information an gleicher Stelle zu finden ist. Sie bauen auf den Basisprofilen von HL7 Deutschland auf, abgestimmt mit der Medizininformatik-Initiative (MII)." },
  { src: "kbvMio", text: "Nach der KBV sind MIOs digitale Informationsbausteine; die ePA speichert die Daten, die MIOs legen deren Struktur fest. Zu den Basisprofilen zählen unter anderem Patient, Körperkenngrößen und Diagnose. Zu jedem MIO gibt es ein Validierungspaket, das den HL7-Validator einschließt." },
  { src: "isik", text: "Der Implementierungsleitfaden ISiK Basis (gematik) liegt in Version 6.0.0 vor und gilt für den Bereich Deutschland. Er basiert auf FHIR 4.0.1, nutzt eine REST-API und ist ab 2026-07-01 aktiv. Der Leitfaden verweist für das Bestätigungsverfahren der gematik auf § 373 SGB V. Für Implementierung und Betrieb ist laut Leitfaden eine SNOMED-CT-Lizenz erforderlich." },
  { src: "hl7de", text: "Das Technische Komitee FHIR von HL7 Deutschland fördert und verbreitet FHIR und veröffentlicht deutsche Profile und ValueSets." },
];

/** FAQ: Klartext, wird unverändert für die sichtbare Liste und für das FAQPage-JSON-LD verwendet. */
export const FAQ = [
  ["Was ist ein FHIR-Viewer?", "Ein FHIR-Viewer macht FHIR-Daten lesbar. Dieser Viewer liest JSON oder XML einer Ressource oder eines Bundles, zeigt sie als Karte und als aufklappbaren Baum, listet bei Bundles die Einträge und löst Referenzen innerhalb des Bundles auf. Er dient zum Lesen und Nachvollziehen, nicht zum Bearbeiten oder Senden."],
  ["Werden meine Daten hochgeladen?", "Nein. Eingaben und Dateien werden im Browser ausgewertet. Die Seite lädt keine Skripte, Schriften oder Tracker von Dritten und setzt keine Cookies. Eine Content-Security-Policy mit connect-src 'none' verbietet dem Seitencode Netzwerkanfragen; der Quellcode ist öffentlich einsehbar. Das ist ein technischer Schutz, aber keine Zusicherung für Ihre rechtliche Situation."],
  ["Was prüft der Viewer, und was nicht?", "Er prüft die JSON- bzw. XML-Syntax, ob der resourceType in der R4-Liste steht, wenige Pflichtfelder (Observation: status und code; Condition: subject; Encounter: status; MedicationRequest; DiagnosticReport; Bundle: type), die Bundle-Regeln bdl-1, bdl-3, bdl-4, bdl-7 und bdl-9 bis bdl-12, die Regeln obs-6 und con-5, das Format von id und Datumswerten, einzelne Wertelisten (Patient.gender, Bundle.type, Observation.status), mehrere value[x] in einer Ressource, leere Arrays und Texte, null-Werte sowie Referenzen innerhalb eines Bundles. Nicht geprüft werden Profile, Terminologien und ValueSets, allgemeine Kardinalitäten und alle übrigen Invarianten. Er ist deshalb kein Validator und ersetzt weder den offiziellen FHIR-Validator noch eine Profilprüfung."],
  ["Welche FHIR-Versionen werden unterstützt?", "Die Hinweise beruhen auf R4 (4.0.1): Ressourcenliste, Pflichtfelder und Bundle-Regeln. Karte und Baum hängen nicht von einem Schema ab, daher können auch Ressourcen aus R4B oder R5 angezeigt werden. Die Hinweise können bei solchen Daten aber falsch anschlagen. Zwei R5-Formen (Encounter mit actualPeriod oder class als Liste, MedicationRequest.medication als CodeableReference) erkennt der Viewer als Heuristik und weist darauf hin; geprüft wird R5 nicht."],
  ["Kann der Viewer JSON und XML?", "Ja, beides. XML wird in dieselbe Struktur wie JSON umgewandelt, die Werte stammen aus den value-Attributen. Ohne Schema erkennt der Viewer Listen in XML nur, wenn ein Element mehrfach vorkommt; ein einzelner Listeneintrag erscheint deshalb als Einzelwert. FHIRPath wird auf der umgewandelten Struktur ausgewertet, und der Download einer Ressource ist immer JSON."],
  ["Was ist ein FHIR-Bundle?", "Laut Spezifikation ist ein Bundle ein Container für eine Sammlung von Ressourcen, zum Beispiel ein Suchergebnis, ein Dokument, eine Nachricht oder eine Transaktion. Die Art steht in Bundle.type. Der Viewer zeigt die Anzahl je Ressourcentyp und die Liste der Einträge und macht Referenzen anklickbar."],
  ["Kann ich MIO-Dateien der KBV öffnen?", "Der Viewer liest FHIR-JSON und FHIR-XML und kann deshalb Ressourcen anzeigen, die in dieser Form vorliegen. Er wurde nicht mit echten MIO-Dateien getestet und prüft nichts gegen die MIO-Profile. Für die Profilprüfung nennt die KBV Validierungspakete mit dem HL7-Validator."],
  ["Darf ich echte Patientendaten einfügen?", "Besser nicht: Verwenden Sie Testdaten oder anonymisierte Daten. Auch wenn der Seitencode nichts versendet, liegen eingefügte Daten im Arbeitsspeicher Ihres Browsers. Ob Sie echte Patientendaten in einem Browserwerkzeug verarbeiten dürfen, richtet sich nach den Vorgaben Ihrer Einrichtung und nicht nach dieser Seite."],
];
