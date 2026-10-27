import { AUTHOR, SHORT, SITE, LASTMOD, SLUG } from "./config.mjs";
import { href, url, crumbs, breadcrumbLD } from "./layout.mjs";

export function legalPages() {
  const ds = {
    path: "datenschutz/",
    title: "Datenschutz – Viewer für FHIR-Daten",
    desc: "Datenschutzhinweise des Viewers für FHIR-Daten: Eingaben bleiben im Browser, keine Cookies, keine Analyse, Hosting über GitHub Pages.",
    h1: "Datenschutz",
    lastmod: LASTMOD,
    noViewer: true,
    ld: [breadcrumbLD([{ label: SHORT, url: SITE }, { label: "Datenschutz", url: url("datenschutz/") }])],
    body: `
${crumbs([{ href: href(""), label: SHORT }, { label: "Datenschutz" }])}
<h1>Datenschutz</h1>
<p class="lead">Kurz gesagt: Die Seite wertet Ihre FHIR-Daten im Browser aus und überträgt sie nicht. Hier stehen die Details.</p>
<section class="prose"><h2>Verantwortlicher</h2>
<p>${AUTHOR.name}, München / Remote. Kontakt: <a href="mailto:kontakt@freimoser.de">kontakt@freimoser.de</a>. Vollständige Angaben im <a href="${AUTHOR.impressum}">Impressum</a>.</p></section>
<section class="prose"><h2>Ihre Eingaben und Dateien</h2>
<p>FHIR-Daten, die Sie einfügen oder als Datei öffnen, werden im Browser ausgewertet. Der Seitencode enthält keine Funktion, die sie versendet, und eine Content-Security-Policy (<code>connect-src 'none'</code>) verbietet dem Seitencode Netzwerkanfragen. Beim ersten Auswerten eines FHIRPath-Ausdrucks lädt die Seite einen weiteren Programmteil von derselben Adresse nach; Ihre Daten sind darin nicht enthalten. Der Download einer Ressource erzeugt die Datei lokal in Ihrem Browser.</p>
<p>Eingegebene Daten liegen bis zum Schließen oder Neuladen der Seite im Arbeitsspeicher Ihres Browsers. Die Seite speichert sie nicht in localStorage oder Cookies. Verwenden Sie bitte Testdaten oder anonymisierte Daten.</p></section>
<section class="prose"><h2>Hosting</h2>
<p>Die Seite wird über GitHub Pages (GitHub Inc.) ausgeliefert. Beim Aufruf verarbeitet GitHub technisch notwendige Verbindungsdaten wie IP-Adresse, Zeitpunkt und angeforderte Datei, um die Seite bereitzustellen und abzusichern (Art. 6 Abs. 1 lit. f DSGVO). Details: <a href="https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement" rel="noopener">Datenschutzerklärung von GitHub</a>.</p></section>
<section class="prose"><h2>Cookies, Analyse, Schriften</h2>
<p>Die Seite setzt keine Cookies und nutzt keine Reichweitenmessung. Schriften, Skripte und Bilder kommen von derselben Adresse; es gibt keine Einbindung von Drittanbietern wie CDNs oder Schriftdiensten. Die Links zu Quellen und zu freimoser.de, LinkedIn und GitHub sind normale Verweise: Erst wenn Sie sie anklicken, verbinden Sie sich mit dem jeweiligen Anbieter.</p></section>
<section class="prose"><h2>Google Search Console und Bing Webmaster Tools</h2>
<p>Die Seite enthält Bestätigungs-Meta-Tags für diese Dienste und eine Schlüsseldatei für IndexNow. Dabei werden keine Daten von Besucherinnen und Besuchern übertragen.</p></section>
<section class="prose"><h2>Ihre Rechte</h2>
<p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.</p></section>
<p class="stand">Stand: ${LASTMOD.split("-").reverse().join(".")}</p>
`,
  };
  return [ds];
}

export function notFoundBody(tools) {
  return `
<h1>Seite nicht gefunden</h1>
<p class="lead">Diese Adresse gibt es nicht (mehr). Vielleicht hilft einer dieser Wege:</p>
<ul class="cards">
<li><a href="${href("")}">Viewer für FHIR-Daten</a><p>JSON oder XML einfügen und ansehen</p></li>
<li><a href="${href("fhir-bundle-anzeigen/")}">FHIR-Bundle anzeigen</a><p>Einträge und Referenzen lesen</p></li>
<li><a href="${href("fhirpath-tester/")}">FHIRPath-Tester</a><p>Pfadausdrücke ausprobieren</p></li>
<li><a href="${href("was-ist-fhir/")}">Was ist FHIR?</a><p>Grundbegriffe und Quellen</p></li>
</ul>`;
}
