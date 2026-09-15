import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { sampleFiles } from "../scripts/build.mjs";

// literature-core.js is plain script; evaluate it and pull its functions out.
const core = vm.createContext({});
vm.runInContext(readFileSync(new URL("../src/literature-core.js", import.meta.url), "utf8") +
  "\n;globalThis.api = { litTagCanon, litParseTagAliases, litFormatTagAliases, litFrontmatter, litQuotesFromNote, litBriefFromNote," +
  " litEssayFromNote, litPaperFromNote, litCite, litGapCollection, litTagCollection, litMatrixRows, litSynthesisGroups," +
  " litSynthesisPlain, litCollectionDocs, litMergeCollection, LIT_GENERATED_MARK, LIT_COLLECTION_FILES };", core);
const L = core.api;
const plain = o => JSON.parse(JSON.stringify(o));
const dashboardSource = readFileSync(new URL("../src/dashboard.js", import.meta.url), "utf8");

const files = sampleFiles(new Date(2026, 8, 15));
const papers = Object.entries(files).filter(([p]) => p.startsWith("Sources/Reading/Zotero/"))
  .map(([path, raw]) => L.litPaperFromNote(raw, path));
const byKey = key => papers.find(p => files[p.path].includes(`zotero_key: ${key}`));
const canon = L.litTagCanon({});

test("synonym tags collapse to one canonical tag, case- and space-insensitively", () => {
  for (const t of ["gap", "Research  Gap", "问题", "研究缺口", "GAPS"]) assert.equal(canon(t), "gap");
  assert.equal(canon("Results"), "result");
  assert.equal(canon("future work"), "future work");
  const custom = L.litTagCanon({ gap: ["limitation of prior work"], baseline: ["baselines", "对比方法"] });
  assert.equal(custom("Limitation of prior work"), "gap");
  assert.equal(custom("对比方法"), "baseline");
  assert.equal(custom("问题"), "gap");
});

test("tag alias settings round-trip", () => {
  const parsed = L.litParseTagAliases("gap: research gap, 问题\nbaseline：baselines，对比方法\n\nnot a line");
  assert.deepEqual(plain(parsed), { gap: ["research gap", "问题"], baseline: ["baselines", "对比方法"] });
  assert.deepEqual(plain(L.litParseTagAliases(L.litFormatTagAliases(parsed))), plain(parsed));
});

test("frontmatter of a synced note is read, including block and inline lists", () => {
  const fm = L.litFrontmatter(files[byKey("SMPL0001").path]);
  assert.equal(fm.type, "paper");
  assert.equal(fm.title, "Spaced Review of Research Notes Improves Long-Term Retention");
  assert.equal(fm.authors, "Example, Sample, Demo");
  assert.deepEqual(plain(fm.topics), ["复习与记忆"]);
  assert.equal(fm.sessions.length, 2);
  assert.match(fm.sessions[0], /^2026-09-12 · 2$/);
});

test("a synced note yields its highlights, 速览 and synthesis paragraph", () => {
  const p = byKey("SMPL0001");
  assert.equal(p.quotes.length, 5);
  const gap = p.quotes[0];
  assert.deepEqual(plain(gap.tags), ["gap"]);
  assert.equal(gap.page, "2");
  assert.equal(gap.section, "引言 · Introduction");
  assert.match(gap.zh, /长期价值/);
  assert.deepEqual(plain(gap.mine), ["我的课题正好可以补这一块：跨学期追踪。"]);
  assert.match(gap.link, /^zotero:\/\/open-pdf\//);
  assert.match(p.brief["方法"], /1、7、30 天/);
  assert.match(p.essay, /^Example 等人发现/);
  assert.equal(byKey("SMPL0004").essay, "");
  assert.equal(byKey("SMPL0006").quotes.length, 0);
});

test("the synthesis placeholder hint is not mistaken for your paragraph", () => {
  const raw = "## 综述段落\n\n<small>一段自己的话，写 related work 时能直接改写进去。</small>\n\n## 我的话\n";
  assert.equal(L.litEssayFromNote(raw), "");
  assert.equal(L.litEssayFromNote("## 综述段落\n\n<small>我写进提示里的话</small>\n"), "我写进提示里的话");
});

test("citations follow author count", () => {
  assert.equal(L.litCite("Demo", "2022"), "Demo, 2022");
  assert.equal(L.litCite("Placeholder, Mock", "2023"), "Placeholder & Mock, 2023");
  assert.equal(L.litCite("Example, Sample, Demo", "2024"), "Example et al., 2024");
  assert.equal(L.litCite("", ""), "n.d.");
});

test("gap collection gathers every gap spelling, newest paper first", () => {
  const g = L.litGapCollection(papers, canon);
  assert.equal(g.total, 5);
  assert.deepEqual(plain(g.groups.map(x => x.paper.year)), ["2025", "2024", "2023", "2022", "2021"]);
  assert.equal(g.missing.length, 0);   // the unread survey is not "missing a gap"
  const untaggedRead = { ...byKey("SMPL0005"), quotes: byKey("SMPL0005").quotes.map(q => ({ ...q, tags: [] })), brief: {} };
  assert.equal(L.litGapCollection([untaggedRead], canon).missing.length, 1);
  const typedOnly = { ...untaggedRead, brief: { 想解决的问题: "手写的问题" } };
  const typed = L.litGapCollection([typedOnly], canon);
  assert.equal(typed.groups[0].items[0].text, "手写的问题");
});

test("tag collection counts highlights and papers per canonical tag", () => {
  const { tags, untagged } = L.litTagCollection(papers, canon);
  const gap = tags.find(t => t.tag === "gap");
  assert.equal(gap.items.length, 5);
  assert.equal(gap.paperCount, 5);
  assert.equal(tags[0].tag, "gap");
  assert.ok(!tags.some(t => ["research gap", "问题", "results"].includes(t.tag)));
  assert.equal(untagged.length, 0);
});

test("matrix has one row per read paper with the four 速览 cells", () => {
  const rows = L.litMatrixRows(papers);
  assert.equal(rows.length, 5);
  const spaced = rows.find(r => r.paper.year === "2024");
  assert.equal(spaced.cells.length, 4);
  assert.ok(spaced.cells.every(Boolean));
});

test("synthesis groups by topic, lists a paper under each of its topics, ungrouped last", () => {
  const syn = L.litSynthesisGroups(papers);
  assert.equal(syn.written, 4);
  assert.deepEqual(plain(syn.groups.map(g => g.topic)).sort(), ["个人知识管理", "仪表盘设计", "复习与记忆", "研究生学习"].sort());
  assert.equal(syn.groups[0].topic, "个人知识管理");
  assert.deepEqual(plain(syn.groups[0].papers.map(p => p.year)), ["2022", "2023"]);
  assert.deepEqual(plain(syn.notWritten.map(p => p.year)), ["2025"]);
  const withLoose = L.litSynthesisGroups(papers.concat([{ ...byKey("SMPL0005"), path: "x.md", topics: [] }]));
  assert.equal(withLoose.groups.at(-1).topic, "未分组");
  const plainDraft = L.litSynthesisPlain(syn);
  assert.match(plainDraft, /^## 个人知识管理/);
  assert.match(plainDraft, /（Placeholder & Mock, 2023）/);
});

test("regenerating a collection keeps what you wrote above the marker", () => {
  const first = L.litMergeCollection(null, "# Gap 合集\n\n## 我的整理\n\n", "old body");
  assert.ok(first.includes(L.LIT_GENERATED_MARK) && first.endsWith("old body\n"));
  const edited = first.replace("## 我的整理\n\n", "## 我的整理\n\n我的归纳：A 和 B 其实是同一个问题。\n\n");
  const second = L.litMergeCollection(edited, "# ignored head", "new body");
  assert.match(second, /我的归纳：A 和 B 其实是同一个问题。/);
  assert.ok(!second.includes("old body") && second.endsWith("new body\n"));
  assert.ok(!second.includes("ignored head"));
  const noMarker = L.litMergeCollection("用户删掉了标记，只剩自己的字", "# head", "body");
  assert.match(noMarker, /^用户删掉了标记，只剩自己的字\n\n/);
});

test("collection notes link papers and escape table pipes", () => {
  const odd = { ...byKey("SMPL0001"), path: "Z/Odd.md", title: "Odd | Title", brief: { 方法: "A | B" } };
  const docs = L.litCollectionDocs([odd], canon, "2026-09-15 09:00");
  assert.match(docs.matrix.body, /\[\[Z\/Odd\\\|Odd Title\]\]/);
  assert.match(docs.matrix.body, /A \\\| B/);
  assert.match(docs.gaps.body, /- Most studies of note-taking/);
  assert.match(docs.gaps.body, /  - 我：我的课题正好可以补这一块/);
  for (const kind of Object.keys(L.LIT_COLLECTION_FILES)) assert.ok(docs[kind].head.includes("## 我的整理"), kind);
});

test("sample vault ships the four collection notes, built from its papers", () => {
  for (const name of Object.values(L.LIT_COLLECTION_FILES)) {
    const text = files[`Sources/Reading/${name}`];
    assert.ok(text, name);
    assert.ok(text.includes(L.LIT_GENERATED_MARK), name);
  }
  assert.match(files["Sources/Reading/Gap 合集.md"], /5 条 gap · 来自 5 篇/);
});

test("the English long-sentence drill finds sample highlights with translations", () => {
  const re = /^> ([A-Z][^\n]{70,190})\n> <small[^>]*>([^<]+)<\/small>/gm;
  assert.ok(dashboardSource.includes(re.source));
  const hits = papers.flatMap(p => [...files[p.path].matchAll(re)]);
  assert.ok(hits.length >= 10);
});

test("dashboard uses canonical tags for 速览 and 素材", () => {
  assert.match(dashboardSource, /const LIT_CANON = litTagCanon\(CFG\.tagAliases\)/);
  assert.match(dashboardSource, /hls\.find\(h => zotTags\(h\)\.some\(t => LIT_CANON\(t\) === key\)\)/);
  assert.ok(!dashboardSource.includes("ZOT_BRIEF["));
});
