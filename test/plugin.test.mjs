import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { bundle, sampleFiles } from "../scripts/build.mjs";
import { loadMain, makeApp, notices } from "./obsidian-mock.mjs";

const source = bundle();
// Objects made inside the vm sandbox have foreign prototypes; compare their data.
const plain = o => JSON.parse(JSON.stringify(o));
const dashboardSource = readFileSync(new URL("../src/dashboard.js", import.meta.url), "utf8");

async function startPlugin(app, data) {
  const { Plugin } = loadMain(source);
  const plugin = new Plugin(app, { id: "onedesk" });
  plugin.data = data;
  await plugin.onload();
  for (const cb of app.layoutCallbacks) await cb();
  await plugin.ready;
  return plugin;
}

test("bundle compiles", () => {
  assert.doesNotThrow(() => new vm.Script(source));
});

test("manifest and versions agree", () => {
  const manifest = JSON.parse(readFileSync(new URL("../manifest.json", import.meta.url)));
  const versions = JSON.parse(readFileSync(new URL("../versions.json", import.meta.url)));
  assert.equal(versions[manifest.version], manifest.minAppVersion);
  assert.equal(manifest.id, "onedesk");
  assert.ok(!/obsidian/i.test(manifest.id + manifest.name));
});

test("onedesk.json in the vault overrides plugin data", async () => {
  const app = makeApp({
    "Config/onedesk.json": JSON.stringify({ me: { NAME: "Vault" }, vault: { INBOX: "Inbox" }, modules: { reading: false } }),
  });
  const plugin = await startPlugin(app, { me: { NAME: "Data" }, vault: { INBOX: "Old", PROJECTS: "P" } });
  assert.equal(plugin.configFile.path, "Config/onedesk.json");
  assert.equal(plugin.settings.me.NAME, "Vault");
  assert.deepEqual(plain(plugin.settings.vault), { INBOX: "Inbox", PROJECTS: "P" });
  assert.equal(plugin.settings.modules.reading, false);
  assert.equal(plugin.dashboardConfig().vault.INBOX, "Inbox");
});

test("invalid onedesk.json falls back to plugin data with a notice", async () => {
  const app = makeApp({ "onedesk.json": "{nope" });
  const plugin = await startPlugin(app, { me: { NAME: "Data" } });
  assert.equal(plugin.settings.me.NAME, "Data");
  assert.ok(notices.some(n => n.includes("不是有效的 JSON")));
});

test("saving settings writes back to onedesk.json when it exists", async () => {
  const app = makeApp({ "onedesk.json": "{}" });
  const plugin = await startPlugin(app);
  plugin.settings.me.NAME = "Saved";
  await plugin.saveSettings();
  assert.equal(JSON.parse(app.store.get("onedesk.json")).me.NAME, "Saved");
  assert.equal(plugin.saved.me.NAME, "Saved");
});

test("empty name is not passed to the dashboard, so its default greeting applies", async () => {
  const plugin = await startPlugin(makeApp());
  assert.deepEqual(plain(plugin.dashboardConfig().me), {});
});

test("view explains a missing Dataview instead of failing", async () => {
  const app = makeApp();
  const plugin = await startPlugin(app);
  const view = plugin.viewFactory({ app });
  await view.render();
  assert.match(view.contentEl.allText(), /需要 Dataview/);
});

test("a device with cached settings draws first, then redraws if onedesk.json differs", async () => {
  const app = makeApp({ "onedesk.json": JSON.stringify({ me: { NAME: "FromFile" } }) });
  const { Plugin } = loadMain(source);
  const plugin = new Plugin(app, { id: "onedesk" });
  plugin.data = { me: { NAME: "Cached" } };
  let redraws = 0;
  plugin.refreshViews = async () => { redraws++; };
  await plugin.onload();
  for (const cb of app.layoutCallbacks) cb();
  await plugin.ready;
  assert.equal(plugin.settings.me.NAME, "Cached");
  for (let i = 0; i < 10; i++) await new Promise(r => setImmediate(r));
  assert.equal(plugin.settings.me.NAME, "FromFile");
  assert.equal(redraws, 1);
  assert.equal(plugin.saved.me.NAME, "FromFile");
});

test("vault file events are only watched after layout is ready", async () => {
  const app = makeApp();
  const watched = [];
  app.vault.on = name => { watched.push(name); return {}; };
  const { Plugin } = loadMain(source);
  const plugin = new Plugin(app, { id: "onedesk" });
  await plugin.onload();
  assert.deepEqual(watched, []);
  for (const cb of app.layoutCallbacks) cb();
  assert.ok(watched.includes("create"));
});

test("index-dependent refresh runs once Dataview finishes indexing", async () => {
  const index = { initialized: false };
  const app = makeApp({}, { dataview: { index, pages: () => [], page: () => null } });
  const plugin = await startPlugin(app);
  let calls = 0;
  const owner = { registerEvent() {} };
  plugin.whenIndexed(owner, () => calls++);
  assert.equal(calls, 0);
  app.metadataCache.trigger("dataview:index-ready");
  app.metadataCache.trigger("dataview:index-ready");
  assert.equal(calls, 1);
  index.initialized = true;
  plugin.whenIndexed(owner, () => calls++);
  assert.equal(calls, 2);
});

test("disabled modules are flagged on the mount", async () => {
  const app = makeApp({ "onedesk.json": JSON.stringify({ modules: { literature: false } }) },
    { dataview: { index: { initialized: false } } });
  const plugin = await startPlugin(app);
  const view = plugin.viewFactory({ app });
  await view.render();
  const mount = view.contentEl.children[0];
  assert.ok(mount.classes.has("onedesk-off-literature"));
  assert.ok(!mount.classes.has("onedesk-off-reading"));
});

test("sample notes are created once and never overwrite", async () => {
  const app = makeApp({ "Console/Clock.md": "mine" });
  const plugin = await startPlugin(app);
  plugin.refreshViews = async () => {};
  await plugin.createSampleNotes();
  const total = Object.keys(sampleFiles()).length;
  assert.equal(app.store.get("Console/Clock.md"), "mine");
  assert.equal(app.store.size, total);
  assert.ok(notices.some(n => n.includes(`已创建 ${total - 1} 篇`) && n.includes("跳过 1 篇")));
});

// ── sample notes match what dashboard.js parses ──────────────────
// Regexes are read out of dashboard.js so a format change there fails here.
function regexFrom(anchor) {
  const at = dashboardSource.indexOf(anchor);
  assert.ok(at >= 0, "anchor not found: " + anchor);
  const m = dashboardSource.slice(at).match(/\/(\^(?:\\\/|[^/\n])+)\/([gimsuy]*)/);
  return new RegExp(m[1], m[2].replace("g", ""));
}

const files = sampleFiles(new Date(2026, 0, 15));

test("sample punches parse", () => {
  const re = regexFrom(".map(l => l.match(");
  const lines = files["Console/Clock.md"].split("\n").filter(l => l.startsWith("- "));
  assert.ok(lines.length > 20);
  for (const l of lines) assert.match(l, re);
  const cats = [...dashboardSource.matchAll(/\{ key: '(\w+)',\s+label:/g)].map(m => m[1]);
  for (const l of lines) {
    const [, , key, cat] = l.match(re);
    assert.ok(["wake", "in", "break"].includes(key), l);
    if (cat) assert.ok(cats.includes(cat), l);
  }
});

test("sample waiting and later lists parse", () => {
  const waiting = regexFrom("const WAITING_RE =");
  const note = regexFrom("const WAITING_NOTE_RE =");
  const wish = regexFrom("const WISH_RE =");
  const w = files["Intake/Pending.md"].split("\n");
  assert.equal(w.filter(l => waiting.test(l)).length, 3);
  assert.equal(w.filter(l => note.test(l)).length, 1);
  assert.equal(files["Scratch/Later.md"].split("\n").filter(l => wish.test(l)).length, 3);
});

test("sample countdowns and life logs parse", () => {
  const countdown = /^-\s+(\d{4}-\d{2}-\d{2})\s*·\s*(.+?)\s*$/;
  assert.ok(dashboardSource.includes(countdown.source));
  assert.equal(files["Console/Dates.md"].split("\n").filter(l => countdown.test(l)).length, 3);
  const logLine = /^\s*>?\s*-\s*(\d{2}:\d{2})\s*·\s*(.+)$/;
  assert.ok(dashboardSource.includes(logLine.source));
  const logs = Object.entries(files).filter(([p]) => p.startsWith("Intake/Log/"));
  assert.equal(logs.length, 4);
  const linked = logs.flatMap(([, t]) => t.split("\n")).filter(l => logLine.test(l) && l.includes("[[Workstreams/Thesis/Overview"));
  assert.ok(linked.length >= 3);
});

test("sample projects and tasks follow the dashboard conventions", () => {
  const overviews = Object.entries(files).filter(([p]) => /^Workstreams\/[^/]+\/Overview\.md$/.test(p));
  const ids = overviews.map(([, t]) => (t.match(/^project_id: (.+)$/m) || [])[1]).filter(Boolean);
  assert.deepEqual(ids.sort(), ["side-app", "thesis"]);
  const tasks = Object.entries(files).filter(([p]) => p.startsWith("Intake/Days/2026"))
    .flatMap(([, t]) => t.split("\n")).filter(l => /^- \[[ x]\]/.test(l));
  assert.ok(tasks.length >= 12);
  for (const t of tasks) {
    assert.match(t, /#(Academic|Work|Learning|Reflection) \[when:: \d{4}-\d{2}-\d{2}\]/);
    const project = t.match(/\[project:: ([\w-]+)\]/);
    if (project) assert.ok(ids.includes(project[1]), t);
    if (t.startsWith("- [x]")) assert.match(t, /\[completed_at:: \d{4}-\d{2}-\d{2} \d{2}:\d{2}\] ✅ \d{4}-\d{2}-\d{2}$/);
  }
});

test("sample reading notes and papers carry the fields the dashboard reads", () => {
  const books = Object.entries(files).filter(([p]) => p.startsWith("Shelf/"));
  assert.equal(books.length, 2);
  for (const [, t] of books) {
    assert.match(t, /^progress:\s*\d+/m);
    assert.match(t, /readingTime:\s*\d+小时\d+分钟/);
    assert.ok(t.includes("📌"));
  }
  const pair = /^>\s*📌((?:(?!📌)[\s\S])*?)\n\s*-\s*💭\s*(.+?)\s*\n\s*-\s*⏱\s*(\d{4}-\d{2}-\d{2} \d{2}:\d{2})/gm;
  assert.ok(dashboardSource.includes(pair.source));
  assert.equal([...books[0][1].matchAll(pair)].length, 1);
  const papers = Object.entries(files).filter(([p]) => p.startsWith("Sources/Reading/Zotero/"));
  assert.equal(papers.length, 6);
  for (const [, t] of papers) assert.match(t, /^type: paper$/m);
});

test("sample schedule rows parse", () => {
  const row = /^\|\s*\*{0,2}(\d{1,2}:\d{2})(?:\s*[-–]\s*(\d{1,2}:\d{2}))?\*{0,2}\s*\|\s*\*{0,2}(.+?)\*{0,2}\s*\|/;
  assert.ok(dashboardSource.includes(row.source));
  const rows = files["Intake/Days/Rhythm.md"].split("\n").map(l => l.match(row)).filter(m => m && m[2]);
  assert.equal(rows.length, 12);
});

test("sample dates are relative to the given day", () => {
  assert.ok(files["Intake/Days/2026-01-15.md"]);
  assert.ok(files["Intake/Days/2026-01-09.md"]);
  assert.match(files["Console/Clock.md"], /^## 2026-01-14$/m);
});

// ── fixes that keep vaults and devices apart ─────────────────────
test("dashboard reads localStorage only through the vault-scoped helpers", () => {
  const direct = dashboardSource.split("\n").filter(l => l.includes("localStorage."));
  assert.equal(direct.length, 2);
  for (const l of direct) assert.match(l, /LS_PREFIX \+ k/);
  assert.match(dashboardSource, /const LS_PREFIX = 'onedesk:' \+ \(app\.appId/);
});

test("heatmap follows the current year", () => {
  assert.ok(!dashboardSource.includes("new Date(2025, 11, 29)"));
  assert.ok(!dashboardSource.includes('<div class="hm-year">2026</div>'));
});

test("writing tab leaves Zotero alone until a collection is chosen", () => {
  assert.match(dashboardSource, /if \(nodeOK && zotChosen && !_wtBuilding\)/);
  assert.match(dashboardSource, /const zotChosen = !!\(CFG\.vault && CFG\.vault\.ZOT_ROOT\)/);
});

test("sample banner is a self-contained original SVG", () => {
  const svg = files["Media/banner.svg"];
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.ok(!/<image|href=|url\(http/i.test(svg));
  assert.ok(svg.length < 4000);
});

test("heatmap lays out one column per week", () => {
  const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
  assert.match(css, /\.heatmap-grid\{[^}]*grid-template-rows:repeat\(7,auto\);grid-auto-flow:column/);
});

test("files the dashboard creates on demand survive two renders racing", () => {
  assert.match(dashboardSource, /async function ensureVaultFile\(path, body, folder\)/);
  for (const fn of ["ensureQuestionPoolFile", "ensureWishFile", "ensureWaitingFile"]) {
    const body = dashboardSource.slice(dashboardSource.indexOf(`async function ${fn}(`)).split("\n}")[0];
    assert.match(body, /return ensureVaultFile\(/, fn);
  }
});

test("schedule blocks are classified from English labels too", () => {
  const line = dashboardSource.split("\n").find(l => l.includes("kind: /高强度"));
  const [, focusSrc, restSrc] = line.match(/kind: \/(.+?)\/i\.test\(label\) \? 'focus' : \/(.+?)\/i\.test/);
  const focus = new RegExp(focusSrc, "i"), rest = new RegExp(restSrc, "i");
  for (const label of ["深潜：高强度科研", "Deep work", "Focus block", "Writing"]) assert.ok(focus.test(label), label);
  for (const label of ["午休", "Lunch", "Nap", "Exercise", "Rest"]) assert.ok(rest.test(label), label);
  assert.ok(!rest.test("Interest reading"));
});

// iPadOS WebKit before 16.4 rejects regex lookbehind at parse time, and the plugin is one file:
// a single such literal means "failed to load plugin" on those iPads.
test("the bundle parses on older iPad WebKit: no regex lookbehind", () => {
  const hits = source.split("\n").filter(l => /\(\?<[=!]/.test(l));
  assert.deepEqual(hits, []);
});

test("sentence splitting and term folding match the former lookbehind versions", () => {
  const grab = name => {
    const line = dashboardSource.split("\n").find(l => l.startsWith(`const ${name} =`));
    const next = dashboardSource.split("\n")[dashboardSource.split("\n").indexOf(line) + 1];
    return vm.runInNewContext(`(${(line + (line.trim().endsWith(";") ? "" : next)).replace(/^const \w+ = /, "").replace(/;\s*$/, "")})`);
  };
  const wtNorm = grab("wtNorm"), wtSentences = grab("wtSentences");
  const oldNorm = s => String(s).toLowerCase().replace(/[-‐–]/g, " ").replace(/\s+/g, " ").trim().replace(/(\w{3,}?)(?<!s|i|u)s$/, "$1");
  for (const w of ["Operating-conditions", "networks", "analysis", "status", "focus", "bus", "gas", "class", "data sets", "LSTMs", "axis", "cats"])
    assert.equal(wtNorm(w), oldNorm(w), w);
  const text = "We use RUL (see [3]). The model works. Results improve by 5.2 percent. Fig. 2 shows it. e.g. Some text? Yes. End (2020). Next one.";
  assert.deepEqual([...wtSentences(text, "[a-z0-9)\\]]")], text.split(/(?<=[a-z0-9)\]][.])\s+(?=[A-Z])/));
  const abs = "First sentence. Second one here. Third? Fourth. v1.2 Stays. A.B. Cde.";
  assert.deepEqual([...wtSentences(abs, "")], abs.split(/(?<=[.])\s+(?=[A-Z])/));
});

test("plugin still loads on an Obsidian without AbstractInputSuggest", async () => {
  const { loadMain: load } = await import("./obsidian-mock.mjs");
  const mod = await import("./obsidian-mock.mjs");
  const app = mod.makeApp();
  // same bundle, with the suggest base class missing from the API
  const { Plugin } = load(source.replace('AbstractInputSuggest, Component,', 'Component,'), { AbstractInputSuggest: undefined });
  const plugin = new Plugin(app, { id: "onedesk" });
  await plugin.onload();
  for (const cb of app.layoutCallbacks) await cb();
  await plugin.ready;
  assert.ok(plugin.settings);
});

// ── punch clock across midnight ──────────────────────────────────
function extractFunctions(names) {
  return names.map(name => {
    const start = dashboardSource.indexOf(`function ${name}(`);
    assert.ok(start >= 0, name);
    let depth = 0, i = dashboardSource.indexOf("{", start);
    for (; i < dashboardSource.length; i++) {
      if (dashboardSource[i] === "{") depth++;
      else if (dashboardSource[i] === "}" && --depth === 0) break;
    }
    return dashboardSource.slice(start, i + 1);
  }).join("\n");
}
const punch = vm.runInNewContext(
  "const PUNCH_CARRY_MAX = 8 * 60; const pad = n => String(n).padStart(2, '0');" +
  "function dateKey(date = new Date()) { const d = new Date(date); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }" +
  extractFunctions(["hMins", "punchSpans", "hPastMidnight", "hShow", "dayBefore", "punchCarry", "punchCarriedRunning", "punchDaySpans", "punchTotals"]) +
  "; ({ punchCarry, punchCarriedRunning, punchDaySpans, punchTotals, hShow });");
const P = s => s.trim().split("\n").map(l => { const [at, key, cat] = l.trim().split(/\s+/); return { at, key, cat: cat || "" }; });
const minutes = spans => spans.reduce((a, [s, e]) => a + (+e.slice(0, 2) * 60 + +e.slice(3)) - (+s.slice(0, 2) * 60 + +s.slice(3)), 0);

test("a session past midnight is drawn on both days but counted wholly on the day it started", () => {
  // the log that showed the bug: Research from 22:10, then Research + End at 00:53
  const days = [
    { date: "2026-09-16", list: P("00:53 in research\n00:53 out") },
    { date: "2026-09-15", list: P("06:33 wake\n06:34 in research\n09:14 break\n11:44 in research\n11:57 break\n11:57 in work\n17:05 break\n18:04 in work\n19:08 break\n22:10 in research") },
  ];
  const d15 = punch.punchDaySpans(days, 1), d16 = punch.punchDaySpans(days, 0);
  // drawn like Toggl: each part on its own calendar day, labelled with the real range
  assert.deepEqual(plain(d15.spans.at(-1)), ["22:10", "24:00", "research", "22:10–00:53⁺¹"]);
  assert.deepEqual(plain(d16.spans), [["00:00", "00:53", "research", "22:10–00:53⁺¹ · 计入前一天"]]);
  // counted on the day it started
  assert.deepEqual(plain(d15.counted.at(-1)), ["22:10", "24:53", "research"]);
  assert.deepEqual(plain(d16.counted), []);
  assert.equal(minutes(d15.counted), 160 + 13 + 308 + 64 + 163);   // 22:10 → 00:53 is 2h43 on the 15th
  assert.equal(minutes(d16.counted), 0);
  assert.equal(punch.hShow("24:53"), "00:53⁺¹");
  assert.equal(punch.hShow("22:10"), "22:10");
});

test("an explicit End or Break after midnight still closes last night's session", () => {
  for (const close of ["01:10 out", "01:10 break"]) {
    const days = [{ date: "2026-09-16", list: P(close) }, { date: "2026-09-15", list: P("23:00 in work") }];
    assert.deepEqual(plain(punch.punchDaySpans(days, 1).counted), [["23:00", "25:10", "work"]]);
    assert.deepEqual(plain(punch.punchDaySpans(days, 0).counted), []);
    assert.deepEqual(plain(punch.punchDaySpans(days, 0).spans.map(sp => sp.slice(0, 3))), [["00:00", "01:10", "work"]]);
  }
});

test("a forgotten End overnight is still not billed to the night", () => {
  const withWake = [{ date: "2026-09-16", list: P("07:30 wake\n08:00 in research\n11:00 break") }, { date: "2026-09-15", list: P("22:10 in research") }];
  assert.deepEqual(plain(punch.punchDaySpans(withWake, 1).counted), []);
  assert.deepEqual(plain(punch.punchDaySpans(withWake, 1).spans), []);
  assert.deepEqual(plain(punch.punchDaySpans(withWake, 0).counted), [["08:00", "11:00", "research"]]);
  const tooLong = [{ date: "2026-09-16", list: P("09:00 in research\n10:00 break") }, { date: "2026-09-15", list: P("22:10 in research") }];
  assert.deepEqual(plain(punch.punchDaySpans(tooLong, 1).counted), []);
  const otherActivity = [{ date: "2026-09-16", list: P("00:30 in work\n01:00 break") }, { date: "2026-09-15", list: P("23:00 in research") }];
  assert.deepEqual(plain(punch.punchDaySpans(otherActivity, 0).counted), [["00:30", "01:00", "work"]]);
});

test("after midnight the dashboard shows last night's session as running until Wake or 8 hours", () => {
  const prev = P("22:10 in research");
  assert.equal(punch.punchCarriedRunning(prev, [], 53), "research");
  assert.equal(punch.punchCarriedRunning(prev, [], 6 * 60 + 10), "research"); // 22:10 → 06:10 is exactly 8h
  assert.equal(punch.punchCarriedRunning(prev, [], 6 * 60 + 30), "");       // 22:10 → 06:30 is over 8h
  assert.equal(punch.punchCarriedRunning(prev, P("00:20 wake"), 30), "");   // anything pressed today decides
  assert.equal(punch.punchCarriedRunning(P("22:10 in research\n23:00 out"), [], 30), "");
});

test("pressing buttons after midnight writes a closing line for last night's session", () => {
  const body = dashboardSource.slice(dashboardSource.indexOf("async function doPunch("), dashboardSource.indexOf("async function loadPunch("));
  assert.match(body, /const carried = punchCarriedRunning\(await punchLoad\(dayBefore\(date\)\), list, hMins\(at\)\);/);
  assert.match(body, /if \(runningCat && runningCat === cat\) \{\s*entry = \{ at, key: 'break', cat: '' \};/);
  assert.match(body, /if \(carried\) list\.push\(\{ at, key: 'break', cat: '' \}\);/);
});

test("later sessions the next day still count on the next day", () => {
  const days = [{ date: "2026-09-16", list: P("01:10 out\n09:00 in research\n10:30 break") }, { date: "2026-09-15", list: P("23:00 in work") }];
  assert.deepEqual(plain(punch.punchDaySpans(days, 1).counted), [["23:00", "25:10", "work"]]);
  assert.deepEqual(plain(punch.punchDaySpans(days, 0).counted), [["09:00", "10:30", "research"]]);
  assert.equal(punch.punchDaySpans(days, 0).spans.length, 2);   // the 00:00–01:10 part is still drawn
});

test("today's dashboard total leaves last night's session to yesterday", () => {
  assert.equal(punch.punchTotals(P("00:53 in research\n00:53 out"), "research").total, 0);
  assert.equal(punch.punchTotals([], "research").total, 0);                    // still running after midnight
  const later = punch.punchTotals(P("01:10 out\n09:00 in research\n10:30 break"), "work");
  assert.equal(later.total, 90);
  assert.equal(plain(later.byCat).work, undefined);
});

test("the Time tab counts from counted spans and draws from spans", () => {
  const health = dashboardSource.slice(dashboardSource.indexOf("async function healthDays("), dashboardSource.indexOf("function hzSetRange("));
  assert.match(health, /const worked = counted\.reduce/);
  const render = dashboardSource.slice(dashboardSource.indexOf("async function renderHealth("), dashboardSource.indexOf("// ─ Health · Daily check-ins"));
  for (const line of render.split("\n").filter(l => /hMins\(e2?\) - hMins\(s2?\)|DEEP\.includes|switches\+\+|lags =|pCat\[c2/.test(l))) {
    assert.ok(!/\bd\.spans\b|\btSpans\b/.test(line) || /catMins = spans/.test(line), line);
  }
  assert.match(render, /const tCats = catMins\(tCounted\)/);
  assert.match(dashboardSource, /const \{ counted \} = punchDaySpans\(_pd, i\);/);
});
