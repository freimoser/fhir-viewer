import { NAME, SHORT, SLUG, ORIGIN, BASE, SITE, LASTMOD, GSC_TOKEN, BING_TOKEN, AUTHOR, NAV, TOOLS, DISCLAIMER_TM } from "./config.mjs";

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const url = (path = "") => SITE + path;
export const href = (path = "") => BASE + path;

const CSP = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'none'; connect-src 'none'; media-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'";

const LOGO = `<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><rect width="32" height="32" rx="7" fill="#fff" fill-opacity=".14"/><path d="M9 9h14M9 16h9M9 23h12" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="23" r="2.4" fill="#ffb454"/></svg>`;

export function head({ title, desc, path, jsonld = [], type = "website", noindex = false, assets }) {
  const canon = url(path);
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${esc(CSP)}">
<script src="${href("assets/menu.js")}?v=${assets.menuV}"></script>
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="google-site-verification" content="${GSC_TOKEN}">
<meta name="msvalidate.01" content="${BING_TOKEN}">
${noindex ? '<meta name="robots" content="noindex">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
<meta name="author" content="${AUTHOR.name}">
<meta name="theme-color" content="#0f3a5f">
<link rel="canonical" href="${canon}">
<link rel="icon" href="${href("favicon.ico")}" sizes="48x48">
<link rel="icon" type="image/png" sizes="32x32" href="${href("favicon-32.png")}">
<link rel="icon" type="image/svg+xml" href="${href("favicon.svg")}">
<link rel="apple-touch-icon" href="${href("apple-touch-icon.png")}">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="${esc(SHORT)}">
<meta property="og:locale" content="de_DE">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canon}">
<meta property="og:image" content="${SITE}og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(NAME)}: FHIR-Ressourcen und Bundles im Browser lesen">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${SITE}og-image.png">
<link rel="stylesheet" href="${href("assets/styles.css")}?v=${assets.cssV}">
${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, "\\u003c")}</script>`).join("\n")}
</head>
<body>
<a class="skip" href="#main">Zum Inhalt</a>
`;
}

export function header(path) {
  const items = NAV.map((n) => {
    const cur = n.href === path ? ' aria-current="page"' : "";
    return `<li><a href="${href(n.href)}"${cur}>${esc(n.label)}</a></li>`;
  }).join("");
  return `<header class="site-head"><div class="wrap">
<a class="brand" href="${href()}">${LOGO}<span>${esc(SHORT)}</span></a>
<button class="menu-btn" id="menu-btn" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Menü öffnen"><span class="bar"></span><span class="bar"></span><span class="bar"></span></button>
<nav class="nav" id="site-nav" aria-label="Hauptmenü"><ul>${items}</ul></nav>
</div></header>
`;
}

const SISTER = {
  home: {
    intro: "Dieselben Grundsätze (läuft im Browser, kein Upload) gelten für weitere Viewer desselben Entwicklers. Zu FHIR gehören vor allem zwei Nachbarformate:",
    "cda-viewer": ["CDA-Arztbriefe lesen", "Klinische Dokumente (CDA) im Browser lesen"],
    "hl7v2-viewer": ["HL7-v2-Nachrichten ansehen", "HL7-v2-Nachrichten im Browser lesen"],
  },
  was: {
    intro: "FHIR steht neben anderen Formaten des Gesundheitswesens. Zwei davon lassen sich ebenfalls im Browser ansehen:",
    "cda-viewer": ["CDA-Dokumente im Browser öffnen", "Klinische Dokumente im Format CDA lesen"],
    "hl7v2-viewer": ["Nachrichten im Format HL7 v2 lesen", "HL7-v2-Nachrichten im Browser lesen"],
  },
  path: {
    intro: "Auch für andere Formate aus dem Gesundheitswesen gibt es Viewer, die im Browser laufen:",
    "cda-viewer": ["Klinische CDA-Dokumente anzeigen", "Klinische Dokumente im Browser lesen"],
    "hl7v2-viewer": ["HL7-v2-Nachrichten im Browser prüfen", "HL7-v2-Nachrichten im Browser lesen"],
  },
};

// Höchstens ein Block pro Seite; variant wählt Einleitung und Linktexte (home | was | path).
export function toolsBlock(tools, variant = "home") {
  const v = SISTER[variant];
  const sisters = ["cda-viewer", "hl7v2-viewer"].map((id) => tools.find((t) => t.id === id)).filter(Boolean);
  const rest = variant === "home" ? tools.filter((t) => !["cda-viewer", "hl7v2-viewer"].includes(t.id)) : [];
  const li = (t, name, desc) => `<li><a href="${t.url}">${esc(name)}</a><p>${esc(desc)}</p></li>`;
  const items = sisters.map((t) => li(t, v[t.id][0], v[t.id][1])).concat(rest.map((t) => li(t, t.name, t.desc))).join("");
  return `<section class="box" aria-labelledby="weitere"><h2 id="weitere">Weitere Werkzeuge</h2>
<p>${esc(v.intro)}</p>
<ul class="cards">${items}</ul></section>
`;
}

export function aboutBlock() {
  return `<section class="box about" aria-labelledby="ueber"><div><h2 id="ueber">Über dieses Projekt</h2>
<p>Entwickelt von <strong>${AUTHOR.name}</strong>, München / Remote – <a href="${AUTHOR.site}">freimoser.de</a> · <a href="${AUTHOR.linkedin}" rel="me noopener">LinkedIn</a>. Kostenlos, ohne Konto, Quellcode im <a href="https://github.com/freimoser/${SLUG}">GitHub-Repository</a>.</p></div></section>
`;
}

export function footer(tools) {
  return `<footer class="site-foot"><div class="wrap">
<p class="stand">Zuletzt aktualisiert: <time datetime="${LASTMOD}">${LASTMOD.split("-").reverse().join(".")}</time></p>
<ul>
<li><a href="${AUTHOR.impressum}">Impressum</a></li>
<li><a href="${href("datenschutz/")}">Datenschutz</a></li>
<li><a href="${href("quellen/")}">Quellen und Lizenzen</a></li>
<li><a href="${AUTHOR.site}">freimoser.de</a></li>
<li><a href="${AUTHOR.linkedin}" rel="me noopener">LinkedIn</a></li>
</ul>
<p class="disclaimer"><strong>Nur zur Ansicht, kein Medizinprodukt.</strong> Dieser Viewer ist kein Validator und ersetzt weder den offiziellen FHIR-Validator noch eine Profilprüfung. Nicht für Diagnose, Therapie oder Abrechnung verwenden.</p>
<p class="disclaimer">${esc(DISCLAIMER_TM)}</p>
<p class="disclaimer">Open-Source-Baustein: <code>@medplum/core</code> (Apache-2.0, Autor: Medplum) für den FHIRPath-Tester, lokal mitgeliefert. <a href="${href("quellen/")}">Lizenzen</a>. Gebaut in München / Remote.</p>
</div></footer>
<script type="module" src="__APP__"></script>
</body>
</html>
`;
}

export function page({ path, title, desc, jsonld, assets, body, type, viewerScript = true }) {
  const f = footer();
  const foot = viewerScript ? f.replace("__APP__", `${href("assets/app.js")}?v=${assets.appV}`) : f.replace(/<script type="module" src="__APP__"><\/script>\n/, "");
  return head({ title, desc, path, jsonld, type, assets }) + header(path) + `<main id="main" class="wrap">\n${body}\n</main>\n` + foot;
}

export function crumbs(items) {
  return `<p class="crumbs">${items.map((i, k) => (k < items.length - 1 ? `<a href="${i.href}">${esc(i.label)}</a> › ` : esc(i.label))).join("")}</p>`;
}

export function breadcrumbLD(items) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((i, k) => ({ "@type": "ListItem", position: k + 1, name: i.label, item: i.url })) };
}

export const PERSON_LD = { "@type": "Person", name: AUTHOR.name, url: AUTHOR.site, sameAs: [AUTHOR.linkedin], address: { "@type": "PostalAddress", addressLocality: "München" } };

/** Der Viewer-Block, auf jeder Inhaltsseite eingebettet. */
export function viewerBlock({ def, tab = "karte", intro = "", sampleButtons = [] }) {
  return `<section class="box viewer" id="viewer" data-viewer data-default="${def}" data-tab="${tab}" aria-label="FHIR-Viewer">
${intro}
<label for="fv-input"><strong>FHIR-Daten einfügen</strong> (JSON oder XML, eine Ressource oder ein Bundle)</label>
<textarea id="fv-input" rows="8" spellcheck="false" autocomplete="off" placeholder='{ "resourceType": "Patient", … }'></textarea>
<div class="row">
<button class="btn primary" id="fv-show" type="button">Anzeigen</button>
<label class="btn" for="fv-file">Datei wählen</label><input type="file" id="fv-file" accept=".json,.xml,.fhir,application/json,application/fhir+json,application/xml,text/xml" class="visually-hidden">
<button class="btn" id="fv-clear" type="button">Leeren</button>
${sampleButtons.map((s) => `<button class="btn" type="button" data-sample="${s.id}">${esc(s.label)}</button>`).join("")}
</div>
<p class="stand" id="fv-sample-note" hidden></p>
<div id="fv-status" class="status" role="status" aria-live="polite"></div>
<div id="fv-out" hidden></div>
<p class="stand">Die Daten bleiben in Ihrem Browser: Es wird nichts hochgeladen. Nur zur Ansicht, kein Validator, kein Medizinprodukt.</p>
</section>`;
}
