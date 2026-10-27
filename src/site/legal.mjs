import { AUTHOR, SHORT, SITE, LASTMOD, SLUG } from "./config.mjs";
import { href, url, crumbs, breadcrumbLD } from "./layout.mjs";

export function legalPages() {
  const ds = {
    path: "datenschutz/",
    title: "Datenschutz – Viewer für FHIR-Daten",
    desc: "Datenschutz des Viewers für FHIR-Daten: Eingaben bleiben im Browser, keine Cookies, keine Analyse, kein Upload, Hosting über GitHub Pages.",
    h1: "Datenschutz",
    lastmod: LASTMOD,
    noViewer: true,
    ld: [breadcrumbLD([{ label: SHORT, url: SITE }, { label: "Datenschutz", url: url("datenschutz/") }])],
    body: `
${crumbs([{ href: href(""), label: SHORT }, { label: "Datenschutz" }])}
<h1>Datenschutz</h1>
<p class="lead">Kurz gesagt: Die Seite wertet Ihre FHIR-Daten im Browser aus und überträgt sie nicht. Hier stehen die Details.</p>
<section class="prose"><h2>Verantwortlicher</h2>
<p>${AUTHOR.name}, München / Remote. Kontakt und vollständige Angaben im <a href="${AUTHOR.impressum}">Impressum</a>.</p></section>
<section class="prose"><h2>Ihre Eingaben und Dateien</h2>
<p>FHIR-Daten, die Sie einfügen oder als Datei öffnen, werden im Browser ausgewertet. Der Seitencode enthält keine Funktion, die sie versendet, und eine Content-Security-Policy (<code>connect-src 'none'</code>) verbietet dem Seitencode Netzwerkanfragen. Beim ersten Auswerten eines FHIRPath-Ausdrucks lädt die Seite einen weiteren Programmteil von derselben Adresse nach; Ihre Daten sind darin nicht enthalten. Der Download einer Ressource erzeugt die Datei lokal in Ihrem Browser.</p>
<p>Eingegebene Daten liegen bis zum Schließen oder Neuladen der Seite im Arbeitsspeicher Ihres Browsers. Die Seite speichert sie nicht in localStorage oder Cookies. Verwenden Sie bitte Testdaten oder anonymisierte Daten.</p></section>
<section class="prose"><h2>Hosting</h2>
<p>Diese Seite wird über GitHub Pages ausgeliefert. Beim Aufruf verarbeitet der Hoster technisch bedingt die IP-Adresse der Besucher. Wir erhalten diese Daten nicht und speichern keine personenbezogenen Daten von Ihnen. Näheres steht in der <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" rel="noopener">Datenschutzerklärung von GitHub</a>.</p></section>
<section class="prose"><h2>Keine externen Ressourcen</h2>
<p>Der Viewer selbst lädt keine externen Ressourcen: keine Reichweitenmessung, keine Schriften, Skripte oder Bilder von Dritten und keine Einbindung sozialer Netzwerke. Die Seite setzt keine Cookies. Links zu anderen Seiten (zum Beispiel zu den Quellen, zu freimoser.de, LinkedIn und GitHub) laden erst beim Anklicken; dann verbinden Sie sich mit dem jeweiligen Anbieter.</p></section>
<section class="prose"><h2>Google Search Console und Bing Webmaster Tools</h2>
<p>Die Seite enthält Bestätigungs-Meta-Tags für diese Dienste und eine Schlüsseldatei für IndexNow. Dabei werden keine Daten von Besucherinnen und Besuchern übertragen.</p></section>
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
