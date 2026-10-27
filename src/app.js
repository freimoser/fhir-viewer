// Client-seitige Logik des Viewers. Keine Netzwerkzugriffe (CSP connect-src 'none').
import { parseInput } from "./lib/parse.mjs";
import { buildModel, checkModel, versionHint } from "./lib/model.mjs";
import { cardFields } from "./lib/cards.mjs";
import { kindOf, codeableParts, plainText, humanName, shortSystem, isObj } from "./lib/format.mjs";
import { SAMPLES } from "./data/samples.mjs";
import { runFhirPath } from "./lib/fhirpath.mjs";

const $ = (s, r = document) => r.querySelector(s);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const MAX_BYTES = 20 * 1024 * 1024;
const PAGE = 200;

const root = $("[data-viewer]");
if (root) init(root);

function init(root) {
  const ta = $("#fv-input", root);
  const status = $("#fv-status", root);
  const out = $("#fv-out", root);
  const fileInput = $("#fv-file", root);
  const state = { model: null, format: null, sel: 0, stack: [], tab: root.dataset.tab || "karte", filter: "", typeFilter: null, shown: PAGE, fp: { scope: "sel", expr: "" } };

  const rerenderSoon = () => render();

  function show(raw, opts = {}) {
    status.replaceChildren(); status.className = "status";
    out.hidden = true; out.replaceChildren();
    if (raw.length > MAX_BYTES) { return fail({ message: "Die Eingabe ist größer als 20 MB.", hint: "Für so große Dateien ist der Browser-Viewer nicht gedacht. Kürzen Sie die Datei oder nutzen Sie ein Kommandozeilenwerkzeug." }); }
    const r = parseInput(raw);
    if (!r.ok) return fail(r.error, raw, opts);
    state.format = r.format;
    state.model = buildModel(r.resource);
    state.hints = (r.notes || []).concat(checkModel(state.model));
    state.versionNote = versionHint(state.model);
    state.sel = 0; state.stack = []; state.filter = ""; state.typeFilter = null; state.shown = PAGE;
    render();
  }

  function fail(err, raw, opts = {}) {
    state.model = null;
    out.hidden = true; out.replaceChildren(); status.replaceChildren();
    status.className = "status error"; status.setAttribute("role", "alert");
    status.append(el("strong", "", "Eingabe konnte nicht gelesen werden"), el("p", "", err.message));
    if (err.hint) status.append(el("p", "hint", err.hint));
    if (err.line && raw) {
      const lines = raw.split("\n");
      const from = Math.max(1, err.line - 1), to = Math.min(lines.length, err.line + 1);
      const pre = el("pre", "excerpt");
      for (let i = from; i <= to; i++) {
        const t = lines[i - 1].length > 160 ? lines[i - 1].slice(0, 160) + "…" : lines[i - 1];
        pre.append(el("span", i === err.line ? "ln bad" : "ln", String(i).padStart(4) + "  " + t + "\n"));
        if (i === err.line && err.column) pre.append(el("span", "ln caret", " ".repeat(6 + Math.min(err.column - 1, 160)) + "^\n"));
      }
      status.append(pre);
      if (opts.focus) { let off = 0; for (let i = 0; i < err.line - 1; i++) off += lines[i].length + 1; off += Math.max(0, (err.column || 1) - 1); ta.focus(); try { ta.setSelectionRange(off, Math.min(off + 1, ta.value.length)); } catch (e) { /* ignorieren */ } }
    }
  }

  // ---------- Darstellung ----------
  function render() {
    const m = state.model; if (!m) return;
    out.hidden = false; out.replaceChildren();
    status.replaceChildren(); status.className = "status";
    const rt = m.resource.resourceType || "(ohne resourceType)";
    const sum = el("div", "summary");
    const chip = (t, c) => sum.append(el("span", "chip" + (c ? " " + c : ""), t));
    chip(state.format === "xml" ? "XML (in JSON-Struktur umgewandelt)" : "JSON");
    chip(rt);
    if (m.isBundle) { chip(`${m.entries.length} Einträge`); if (m.resource.type) chip("type: " + m.resource.type); }
    const errs = state.hints.filter((h) => h.level === "error").length, warns = state.hints.filter((h) => h.level === "warn").length, infos = state.hints.filter((h) => h.level === "info").length;
    chip(errs + warns === 0 ? "keine Auffälligkeiten gefunden" : `${errs} Fehler, ${warns} Warnungen`, errs ? "bad" : warns ? "warn" : "ok");
    out.append(sum);
    status.setAttribute("role", "status");

    // Hinweise
    const hd = el("details", "hints"); if (errs + warns > 0) hd.open = true;
    hd.append(el("summary", "", `Plausibilitätshinweise (${state.hints.length}${infos ? ", davon " + infos + " Info" : ""})`));
    if (!state.hints.length) hd.append(el("p", "muted", "Keine Hinweise. Das heißt nur: die hier geprüften Regeln sind erfüllt. Es ist keine Validierung gegen Profile oder Terminologien."));
    const ul = el("ul", "hint-list");
    for (const h of state.hints.slice(0, 300)) {
      const li = el("li", "h-" + h.level);
      li.append(el("span", "lvl", h.level === "error" ? "Fehler" : h.level === "warn" ? "Warnung" : "Info"));
      if (h.entry !== undefined) { const b = el("button", "linkish", h.where); b.type = "button"; b.addEventListener("click", () => select(h.entry)); li.append(b); } else li.append(el("strong", "", h.where));
      li.append(el("span", "", " – " + h.msg)); ul.append(li);
    }
    if (state.hints.length > 300) ul.append(el("li", "muted", `… und ${state.hints.length - 300} weitere.`));
    hd.append(ul);
    if (state.versionNote.length) hd.append(el("p", "note", "Hinweis zur Version: Die Eingabe enthält Formen, die auf R5 hindeuten (" + state.versionNote.join("; ") + "). Der Viewer liest sie, die Hinweise und Pflichtfeld-Prüfungen gehen aber von R4 aus."));
    out.append(hd);

    if (m.isBundle) out.append(renderBundle());
    const detail = el("div", "detail"); detail.id = "fv-detail";
    out.append(detail);
    renderDetail(detail);
  }

  function renderBundle() {
    const m = state.model;
    const box = el("section", "bundle");
    box.append(el("h3", "", "Bundle-Übersicht"));
    const types = el("div", "types");
    const all = el("button", "chip btn-chip" + (state.typeFilter === null ? " on" : ""), `alle (${m.entries.length})`); all.type = "button";
    all.addEventListener("click", () => { state.typeFilter = null; state.shown = PAGE; refreshList(); });
    types.append(all);
    for (const [t, n] of [...m.typeCounts.entries()].sort((a, b) => b[1] - a[1])) {
      const b = el("button", "chip btn-chip" + (state.typeFilter === t ? " on" : ""), `${t} (${n})`); b.type = "button"; b.dataset.type = t;
      b.addEventListener("click", () => { state.typeFilter = state.typeFilter === t ? null : t; state.shown = PAGE; refreshList(); });
      types.append(b);
    }
    box.append(types);
    const f = el("input"); f.type = "search"; f.placeholder = "Einträge filtern (Typ, id, Text, fullUrl)"; f.setAttribute("aria-label", "Einträge filtern"); f.value = state.filter; f.id = "fv-entry-filter";
    f.addEventListener("input", () => { state.filter = f.value; state.shown = PAGE; refreshList(); });
    box.append(f);
    const list = el("ul", "entries"); list.id = "fv-entries"; box.append(list);
    const more = el("button", "btn", "Weitere Einträge anzeigen"); more.type = "button"; more.id = "fv-more"; more.hidden = true;
    more.addEventListener("click", () => { state.shown += PAGE; refreshList(); });
    box.append(more);
    queueMicrotask(refreshList);
    return box;
  }

  function refreshList() {
    const m = state.model, list = $("#fv-entries"); if (!list) return;
    const q = state.filter.trim().toLowerCase();
    const items = m.entries.filter((e) => (state.typeFilter === null || e.typeKey === state.typeFilter) && (!q || [e.typeKey, e.id, e.label, e.fullUrl].filter(Boolean).join(" ").toLowerCase().includes(q)));
    list.replaceChildren();
    for (const e of items.slice(0, state.shown)) {
      const li = el("li"); const b = el("button", "entry" + (e.index === state.sel ? " sel" : "")); b.type = "button"; b.dataset.index = e.index;
      b.append(el("span", "no", String(e.index + 1)), el("span", "badge", e.typeKey), el("span", "lbl", e.label || e.fullUrl || ""));
      const bad = e.refs.filter((r) => r.status === "unresolved" || r.status === "ambiguous").length;
      const ok = e.refs.filter((r) => r.status === "resolved" || r.status === "contained").length;
      if (e.refs.length) b.append(el("span", "refcount" + (bad ? " bad" : ""), `${ok}/${e.refs.length} Ref.`));
      b.addEventListener("click", () => select(e.index));
      li.append(b); list.append(li);
    }
    if (!items.length) list.append(el("li", "muted", "Kein Eintrag passt zum Filter."));
    const more = $("#fv-more"); if (more) { more.hidden = items.length <= state.shown; more.textContent = `Weitere Einträge anzeigen (${items.length - state.shown} übrig)`; }
    const tb = document.querySelectorAll("#fv-out .types .btn-chip");
    tb.forEach((b) => b.classList.toggle("on", b.dataset.type ? b.dataset.type === state.typeFilter : state.typeFilter === null));
  }

  function select(i, fromRef) {
    if (fromRef) state.stack.push(state.sel);
    state.sel = i;
    const d = $("#fv-detail"); if (d) { renderDetail(d); d.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
    document.querySelectorAll("#fv-entries .entry").forEach((b) => b.classList.toggle("sel", +b.dataset.index === i));
  }

  function renderDetail(box) {
    const m = state.model; const e = m.entries[state.sel]; box.replaceChildren();
    const head = el("div", "d-head");
    const title = el("h3", "", e.resource ? `${e.resourceType || "?"}${e.id ? "/" + e.id : ""}` : `Eintrag ${e.index + 1}`);
    head.append(title);
    const act = el("div", "d-actions");
    if (state.stack.length) { const b = el("button", "btn", "← Zurück"); b.type = "button"; b.id = "fv-back"; b.addEventListener("click", () => { const p = state.stack.pop(); state.sel = p; renderDetail(box); document.querySelectorAll("#fv-entries .entry").forEach((x) => x.classList.toggle("sel", +x.dataset.index === p)); }); act.append(b); }
    const data = e.resource || e.raw;
    const dl = el("button", "btn", "Als JSON speichern"); dl.type = "button"; dl.id = "fv-download";
    dl.addEventListener("click", () => download(data, (e.resourceType || "eintrag") + (e.id ? "-" + e.id : "") + ".json"));
    const cp = el("button", "btn", "Kopieren"); cp.type = "button"; cp.id = "fv-copy";
    cp.addEventListener("click", () => copy(JSON.stringify(data, null, 2), cp));
    act.append(dl, cp);
    if (m.isBundle) { const all = el("button", "btn", "Ganzes Bundle speichern"); all.type = "button"; all.addEventListener("click", () => download(m.resource, "bundle" + (m.resource.id ? "-" + m.resource.id : "") + ".json")); act.append(all); }
    head.append(act); box.append(head);
    if (m.isBundle && e.fullUrl) box.append(el("p", "muted small", "fullUrl: " + e.fullUrl));
    if (state.format === "xml") box.append(el("p", "muted small", "Die Anzeige beruht auf einer Umwandlung des XML in die JSON-Struktur; der Download ist JSON. Ohne Schema erkennt der Viewer Listen nur, wenn ein Element mehrfach vorkommt."));

    const tabs = el("div", "tabs"); tabs.setAttribute("role", "tablist");
    const panels = {};
    const defs = [["karte", "Karte"], ["baum", "Baum"], ["fhirpath", "FHIRPath"]];
    for (const [id, name] of defs) {
      const b = el("button", "tab" + (state.tab === id ? " on" : ""), name); b.type = "button"; b.setAttribute("role", "tab"); b.setAttribute("aria-selected", String(state.tab === id)); b.dataset.tab = id;
      b.addEventListener("click", () => { state.tab = id; for (const t of tabs.children) { t.classList.toggle("on", t.dataset.tab === id); t.setAttribute("aria-selected", String(t.dataset.tab === id)); } for (const k in panels) panels[k].hidden = k !== id; ensure(id); });
      tabs.append(b);
      const p = el("div", "panel"); p.id = "fv-panel-" + id; p.setAttribute("role", "tabpanel"); p.hidden = state.tab !== id; panels[id] = p;
    }
    box.append(tabs, panels.karte, panels.baum, panels.fhirpath);
    const built = {};
    function ensure(id) { if (built[id]) return; built[id] = true; if (id === "karte") buildCard(panels.karte, e); if (id === "baum") buildTree(panels.baum, e); if (id === "fhirpath") buildFp(panels.fhirpath, e); }
    ensure(state.tab);
  }

  // ---------- Karte ----------
  function refNode(r, e, refInfo) {
    if (refInfo && (refInfo.status === "resolved" || refInfo.status === "contained") && refInfo.index !== undefined && (refInfo.status === "resolved" || state.model.isBundle)) {
      if (refInfo.status === "contained") return el("span", "ref ok", `${r.reference} (contained)`);
      const b = el("button", "ref ok", `${r.display ? r.display + " · " : ""}${r.reference || "per Identifier"} → Eintrag ${refInfo.index + 1}`); b.type = "button"; b.dataset.ref = refInfo.index;
      b.title = refInfo.method === "typ-id" ? "Nur über Typ und id gefunden, nicht über die fullUrl" : "Zum referenzierten Eintrag springen";
      b.addEventListener("click", () => select(refInfo.index, true)); return b;
    }
    if (refInfo && refInfo.status === "ambiguous") return el("span", "ref bad", `${r.reference || "Identifier"} (mehrdeutig)`);
    if (refInfo && refInfo.status === "unresolved") { const s = el("span", "ref bad", `${r.reference || "per Identifier"} (${refInfo.reason || "nicht auflösbar"})`); return s; }
    const s = el("span", "ref", `${r.display ? r.display + " · " : ""}${r.reference || "Identifier"}`); if (!state.model.isBundle) s.title = "Ohne Bundle und ohne Netzwerkzugriff nicht auflösbar"; return s;
  }

  function valueNode(v, ctx, depth = 0, path = "") {
    const k = kindOf(v);
    const wrap = el("span", "val");
    const refFor = (p) => ctx.entry.refs.find((x) => x.path === p);
    switch (k) {
      case "primitive": { wrap.append(el("span", typeof v === "string" ? "v-s" : "v-n", String(v))); return wrap; }
      case "null": wrap.append(el("span", "muted", "null")); return wrap;
      case "CodeableConcept": { const p = codeableParts(v); wrap.append(el("span", "", p.head || "(ohne Text)")); if (p.codes.length) wrap.append(el("small", "codes", p.codes.join(" · "))); return wrap; }
      case "Reference": return refNode(v, ctx.entry, refFor(path));
      case "HumanName": { wrap.append(el("span", "", humanName(v))); if (v.use) wrap.append(el("small", "codes", v.use)); return wrap; }
      case "Coding": { const t = plainText(v); wrap.append(el("span", "", t)); if (v.system) wrap.append(el("small", "codes", shortSystem(v.system) + (v.code ? " " + v.code : ""))); return wrap; }
      case "array": {
        const ul = el("ul", "vlist");
        v.forEach((x, i) => { const li = el("li"); li.append(valueNode(x, ctx, depth, path + "[" + i + "]")); ul.append(li); });
        return ul;
      }
      case "object": {
        if (depth >= 3) { wrap.append(el("code", "", JSON.stringify(v))); return wrap; }
        const dl = el("dl", "card-dl nested");
        for (const [kk, vv] of Object.entries(v)) { if (kk === "id" || kk === "extension") continue; const dt = el("dt", "", kk), dd = el("dd"); dd.append(valueNode(vv, ctx, depth + 1, path ? path + "." + kk : kk)); dl.append(dt, dd); }
        return dl;
      }
      default: { // Quantity, Period, Identifier, ...
        wrap.append(el("span", "", plainText(v))); if (k !== "object") wrap.append(el("small", "codes", k)); return wrap;
      }
    }
  }

  function buildCard(box, e) {
    box.replaceChildren();
    if (!e.resource) { box.append(el("p", "muted", "Dieser Eintrag enthält keine Ressource. Siehe Baum für request/response.")); return; }
    const res = e.resource;
    if (!res.resourceType) { box.append(el("p", "muted", "Ohne resourceType gibt es keine Karte. Nutzen Sie den Baum.")); return; }
    const card = el("div", "card");
    const known = ["Patient", "Observation", "Encounter", "Condition", "MedicationRequest", "DiagnosticReport"].includes(res.resourceType);
    card.append(el("p", "card-h", res.resourceType + (known ? "" : " (allgemeine Karte)")));
    const dl = el("dl", "card-dl");
    for (const f of cardFields(res)) { dl.append(el("dt", "", f.label)); const dd = el("dd"); dd.append(valueNode(f.value, { entry: e }, 0, f.key)); dl.append(dd); }
    if (!dl.children.length) dl.append(el("dt", "", "–"), el("dd", "muted", "Keine Elemente außer id/meta/text."));
    card.append(dl);
    if (res.meta && (res.meta.profile || res.meta.versionId || res.meta.lastUpdated)) {
      const mm = el("p", "muted small"); mm.textContent = "meta: " + [res.meta.versionId ? "versionId " + res.meta.versionId : "", res.meta.lastUpdated ? "lastUpdated " + res.meta.lastUpdated : "", res.meta.profile ? "profile " + [].concat(res.meta.profile).join(", ") : ""].filter(Boolean).join(" · "); card.append(mm);
    }
    if (typeof res.text?.div === "string") { const d = el("details", "narr"); d.append(el("summary", "", "Narrativ (text.div, nur als Text)")); const t = document.createElement("textarea"); t.innerHTML = res.text.div.replace(/<[^>]*>/g, " "); d.append(el("p", "", t.value.replace(/\s+/g, " ").trim())); card.append(d); }
    if (e.incoming && e.incoming.length) {
      const inc = el("div", "incoming"); inc.append(el("strong", "", "Referenziert von: "));
      const seen = new Set();
      for (const x of e.incoming) { if (seen.has(x.from)) continue; seen.add(x.from); const o = state.model.entries[x.from]; const b = el("button", "ref ok", `${o.typeKey} ${x.from + 1}`); b.type = "button"; b.title = `${x.path}`; b.addEventListener("click", () => select(x.from, true)); inc.append(b); }
      card.append(inc);
    }
    box.append(card);
    if (e.refs.length) {
      const rl = el("details", "reflist"); rl.append(el("summary", "", `Referenzen dieser Ressource (${e.refs.length})`));
      const ul = el("ul");
      for (const r of e.refs) { const li = el("li"); li.append(el("code", "", r.path), document.createTextNode(" → ")); li.append(refNode(r.ref ? { reference: r.ref } : { reference: undefined }, e, r)); if (r.method) li.append(el("small", "codes", " " + ({ fullUrl: "fullUrl", versionId: "fullUrl + meta.versionId", identifier: "Identifier", "typ-id": "nur Typ/id (nicht spezifikationskonform)", contained: "contained" }[r.method] || r.method))); ul.append(li); }
      rl.append(ul); box.append(rl);
    }
  }

  // ---------- Baum ----------
  function buildTree(box, e) {
    box.replaceChildren();
    const data = e.resource || e.raw;
    const bar = el("div", "tree-bar");
    const q = el("input"); q.type = "search"; q.placeholder = "Im Baum suchen (Name oder Wert)"; q.setAttribute("aria-label", "Im Baum suchen"); q.id = "fv-tree-search";
    const ex = el("button", "btn", "Alle aufklappen"); ex.type = "button";
    const co = el("button", "btn", "Alle zuklappen"); co.type = "button";
    bar.append(q, ex, co); box.append(bar);
    const info = el("p", "muted small"); info.setAttribute("aria-live", "polite"); box.append(info);
    const tree = el("div", "tree"); box.append(tree);
    const refMap = new Map(e.refs.map((r) => [r.path, r]));
    let count = 0;
    function node(key, val, path, depth) {
      if (val !== null && typeof val === "object") {
        const isArr = Array.isArray(val);
        const d = el("details", "t-node"); if (depth < 2) d.open = true;
        const s = el("summary"); s.append(el("span", "k", key), el("span", "meta", isArr ? `[${val.length}]` : `{${Object.keys(val).length}}`));
        if (!isArr) { const lab = val.resourceType ? val.resourceType : null; if (lab) s.append(el("span", "badge", lab)); }
        d.dataset.text = key.toLowerCase();
        d.append(s);
        if (++count > 6000) { d.append(el("div", "muted small", "… Baum gekürzt (zu viele Knoten). Nutzen Sie Karte oder FHIRPath.")); return d; }
        if (isArr) val.forEach((x, i) => d.append(node(String(i), x, path + "[" + i + "]", depth + 1)));
        else for (const [k, v] of Object.entries(val)) d.append(node(k, v, path ? path + "." + k : k, depth + 1));
        return d;
      }
      const row = el("div", "t-row"); row.dataset.text = (key + " " + String(val)).toLowerCase();
      row.append(el("span", "k", key));
      const refInfo = key === "reference" ? refMap.get(path.replace(/\.reference$/, "")) : null;
      if (refInfo && (refInfo.status === "resolved") && refInfo.index !== undefined) { const b = el("button", "ref ok", `${val} → Eintrag ${refInfo.index + 1}`); b.type = "button"; b.addEventListener("click", () => select(refInfo.index, true)); row.append(b); }
      else row.append(el("span", typeof val === "string" ? "v-s" : typeof val === "number" ? "v-n" : "v-b", typeof val === "string" ? JSON.stringify(val) : String(val)));
      if (refInfo && refInfo.status === "unresolved") row.append(el("small", "ref bad", refInfo.reason || "nicht auflösbar"));
      return row;
    }
    if (data && typeof data === "object") for (const [k, v] of Object.entries(data)) tree.append(node(k, v, k, 0));
    ex.addEventListener("click", () => tree.querySelectorAll("details").forEach((d) => (d.open = true)));
    co.addEventListener("click", () => tree.querySelectorAll("details").forEach((d) => (d.open = false)));
    q.addEventListener("input", () => {
      const s = q.value.trim().toLowerCase();
      const rows = tree.querySelectorAll(".t-row"), nodes = tree.querySelectorAll("details");
      if (!s) { rows.forEach((r) => (r.hidden = false)); nodes.forEach((n) => (n.hidden = false)); info.textContent = ""; return; }
      let n = 0;
      rows.forEach((r) => { const hit = r.dataset.text.includes(s); r.hidden = !hit; if (hit) n++; });
      for (const d of [...nodes].reverse()) { const selfHit = d.dataset.text.includes(s); const inner = d.querySelector(".t-row:not([hidden]), details:not([hidden])"); d.hidden = !(selfHit || inner); if (selfHit) { d.querySelectorAll(".t-row, details").forEach((x) => (x.hidden = false)); n++; } d.open = true; }
      info.textContent = n ? `${n} Treffer` : "Keine Treffer.";
    });
  }

  // ---------- FHIRPath ----------
  const FP_EXAMPLES = {
    Patient: ["Patient.name.family", "Patient.name.where(use='official').given.first()", "Patient.telecom.where(system='phone').value", "Patient.birthDate"],
    Observation: ["Observation.code.coding.code", "Observation.value.ofType(Quantity).value", "Observation.component.value.ofType(Quantity).value", "Observation.subject.reference"],
    Condition: ["Condition.code.text", "Condition.clinicalStatus.coding.code", "Condition.onset"],
    Encounter: ["Encounter.status", "Encounter.class.code"],
    Bundle: ["Bundle.entry.count()", "Bundle.entry.resource.ofType(Patient).count()", "Bundle.entry.resource.ofType(Observation).subject.reference", "Bundle.entry.fullUrl"],
  };
  function buildFp(box, e) {
    box.replaceChildren();
    const m = state.model;
    const row = el("div", "fp-row");
    const lab = el("label", "", "FHIRPath-Ausdruck"); lab.htmlFor = "fv-fp-expr";
    const inp = el("input", "mono"); inp.type = "text"; inp.id = "fv-fp-expr"; inp.autocomplete = "off"; inp.spellcheck = false; inp.setAttribute("autocapitalize", "off");
    inp.value = state.fp.expr || (e.resourceType && FP_EXAMPLES[e.resourceType] ? FP_EXAMPLES[e.resourceType][0] : "");
    const go = el("button", "btn primary", "Auswerten"); go.type = "button"; go.id = "fv-fp-run";
    row.append(lab, inp, go); box.append(row);
    let scope = state.fp.scope;
    if (m.isBundle) {
      const sel = el("select"); sel.id = "fv-fp-scope"; sel.setAttribute("aria-label", "Auswertungsbereich");
      const o1 = el("option", "", "Gewählte Ressource"); o1.value = "sel"; const o2 = el("option", "", "Ganzes Bundle"); o2.value = "bundle"; sel.append(o1, o2); sel.value = scope;
      sel.addEventListener("change", () => { scope = state.fp.scope = sel.value; });
      box.append(sel);
    }
    const ex = el("div", "fp-ex");
    const list = (m.isBundle && scope === "bundle") ? FP_EXAMPLES.Bundle : FP_EXAMPLES[e.resourceType] || [];
    const all = [...new Set([...(e.resourceType && FP_EXAMPLES[e.resourceType] || []), ...(m.isBundle ? FP_EXAMPLES.Bundle : [])])];
    for (const x of all) { const b = el("button", "chip btn-chip", x); b.type = "button"; b.addEventListener("click", () => { inp.value = x; if (m.isBundle && FP_EXAMPLES.Bundle.includes(x)) { scope = state.fp.scope = "bundle"; const s = $("#fv-fp-scope"); if (s) s.value = "bundle"; } else if (m.isBundle) { scope = state.fp.scope = "sel"; const s = $("#fv-fp-scope"); if (s) s.value = "sel"; } run(); }); ex.append(b); }
    void list;
    if (all.length) { box.append(el("p", "muted small", "Beispiel-Ausdrücke zum Anklicken:"), ex); }
    const res = el("div", "fp-res"); res.id = "fv-fp-result"; res.setAttribute("aria-live", "polite"); box.append(res);
    box.append(el("p", "muted small", "Ausgewertet wird mit evalFhirPath aus @medplum/core (Apache-2.0), das beim ersten Auswerten nachgeladen wird. Abweichungen zu anderen FHIRPath-Implementierungen sind möglich. Der Tester prüft nicht, ob ein Pfad für den Ressourcentyp gültig ist."));
    async function run() {
      state.fp.expr = inp.value;
      res.replaceChildren(el("p", "muted", "Wird ausgewertet …"));
      const target = (m.isBundle && scope === "bundle") ? m.resource : (e.resource || null);
      if (!target) { res.replaceChildren(el("p", "status error", "Dieser Eintrag enthält keine Ressource.")); return; }
      
      const r = await runFhirPath(inp.value, target);
      res.replaceChildren();
      if (!r.ok) { const p = el("p", "status error", r.error); p.setAttribute("role", "alert"); res.append(p); return; }
      res.append(el("p", "fp-count", r.results.length === 0 ? "Leere Menge (kein Ergebnis). Der Pfad existiert in dieser Ressource nicht, oder ein Filter hat nichts getroffen." : `${r.results.length} Ergebnis${r.results.length === 1 ? "" : "se"}`));
      const ol = el("ol", "fp-list");
      r.results.slice(0, 200).forEach((x) => { const li = el("li"); li.append(el("span", "badge", x.type)); const pre = el("pre", "", typeof x.value === "object" ? JSON.stringify(x.value, null, 2) : JSON.stringify(x.value)); li.append(pre); ol.append(li); });
      if (r.results.length > 200) ol.append(el("li", "muted", `… ${r.results.length - 200} weitere nicht angezeigt.`));
      res.append(ol);
    }
    go.addEventListener("click", run);
    inp.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { ev.preventDefault(); run(); } });
  }

  // ---------- Export ----------
  function download(obj, name) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/fhir+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = name.replace(/[^\w.\-]+/g, "_"); document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  async function copy(text, btn) {
    const old = btn.textContent;
    try { await navigator.clipboard.writeText(text); btn.textContent = "Kopiert"; } catch { btn.textContent = "Kopieren nicht möglich"; }
    setTimeout(() => (btn.textContent = old), 1500);
  }

  // ---------- Eingabe ----------
  function loadSample(id) {
    const s = SAMPLES.find((x) => x.id === id); if (!s) return false;
    ta.value = s.json;
    const note = $("#fv-sample-note", root);
    if (note) { note.hidden = false; note.replaceChildren(document.createTextNode(`Beispiel „${s.title}“ aus der FHIR-Spezifikation R4 (CC0), ${s.removedSnomed ? "um SNOMED-CT-Codierungen und das Narrativ gekürzt. " : "unverändert bis auf die Formatierung. "}`), Object.assign(el("a", "", "Original ansehen"), { href: s.url, rel: "noopener" })); }
    show(s.json); return true;
  }
  root.dataset.ready = "1";
  $("#fv-show", root).addEventListener("click", () => show(ta.value, { focus: true }));
  $("#fv-clear", root).addEventListener("click", () => { ta.value = ""; out.hidden = true; out.replaceChildren(); status.replaceChildren(); status.className = "status"; state.model = null; const n = $("#fv-sample-note", root); if (n) n.hidden = true; ta.focus(); });
  ta.addEventListener("paste", () => setTimeout(() => show(ta.value), 0));
  ta.addEventListener("keydown", (ev) => { if ((ev.ctrlKey || ev.metaKey) && ev.key === "Enter") { ev.preventDefault(); show(ta.value, { focus: true }); } });
  fileInput.addEventListener("change", async () => { const f = fileInput.files[0]; if (!f) return; if (f.size > MAX_BYTES) return fail({ message: `Die Datei ist ${(f.size / 1048576).toFixed(1)} MB groß (Grenze 20 MB).` }); ta.value = await f.text(); show(ta.value); fileInput.value = ""; });
  ["dragover", "drop"].forEach((t) => ta.addEventListener(t, async (ev) => { ev.preventDefault(); if (t === "drop") { const f = ev.dataTransfer.files[0]; if (f) { if (f.size > MAX_BYTES) return fail({ message: "Die Datei ist größer als 20 MB." }); ta.value = await f.text(); show(ta.value); } } }));
  document.querySelectorAll("[data-sample]").forEach((b) => b.addEventListener("click", () => { loadSample(b.dataset.sample); const v = $("#viewer"); if (v) v.scrollIntoView({ behavior: "smooth", block: "start" }); }));
  document.querySelectorAll("[data-fp-sample]").forEach((b) => b.addEventListener("click", () => {
    if (!loadSample(b.dataset.fpSample)) return;
    state.tab = "fhirpath"; state.fp.expr = b.dataset.fpExpr || ""; state.fp.scope = b.dataset.fpScope === "bundle" ? "bundle" : "sel";
    render();
    const run = $("#fv-fp-run", root); if (run) run.click();
    const v = $("#viewer"); if (v) v.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
  const qp = new URLSearchParams(location.search).get("beispiel");
  if (qp && SAMPLES.some((s) => s.id === qp)) loadSample(qp);
  else if (root.dataset.default) loadSample(root.dataset.default);
}
