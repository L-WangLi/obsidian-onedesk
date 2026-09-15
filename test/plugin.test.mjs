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

test("view waits for the Dataview index", async () => {
  const app = makeApp({}, { dataview: { index: { initialized: false }, pages: () => [], page: () => null } });
  const plugin = await startPlugin(app);
  const view = plugin.viewFactory({ app });
  await view.render();
  assert.match(view.contentEl.allText(), /等待 Dataview/);
  assert.equal(plugin.waitingForIndex, true);
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
  assert.equal(papers.length, 2);
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
