import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const read = p => readFileSync(new URL(p, import.meta.url), "utf8");
const plain = o => JSON.parse(JSON.stringify(o));
const ctx = vm.createContext({});
vm.runInContext(read("../src/english-patterns.js") +
  "\n;globalThis.api = { EN_PATTERNS, enPatternPlan, enPatternHead, enParsePatternHead, enPatternSentence, enParsePatternSentence, enPatternProgress };", ctx);
const E = ctx.api;
const doneLine = (i, n = 10) => E.enPatternHead(1, "句型", E.EN_PATTERNS[i].title, n, true);

test("every pattern has four variations and ten sentences that use all of them", () => {
  assert.equal(E.EN_PATTERNS.length, 20);
  const titles = new Set();
  for (const p of E.EN_PATTERNS) {
    assert.ok(!titles.has(p.title), p.title); titles.add(p.title);
    assert.equal(p.vars.length, 4, p.title);
    assert.equal(p.ex.length, 10, p.title);
    const used = new Set(p.ex.map(e => e[0]));
    assert.deepEqual([...used].sort(), [0, 1, 2, 3], p.title);
    for (const [, zh, en] of p.ex) {
      assert.ok(zh && !zh.includes(" → "), zh);
      assert.ok(en.split(" ").length >= 7, "too short to carry a thought: " + en);
    }
  }
});

test("the plan moves to the next unfinished pattern, and keeps today's finished one on screen", () => {
  // 2026-09-14 is a Monday
  assert.equal(E.enPatternPlan([], "2026-09-14").idx, 0);
  const days = [{ date: "2026-09-14", lines: [doneLine(0)] }];
  assert.equal(E.enPatternPlan(days, "2026-09-14").idx, 0);
  assert.equal(E.enPatternPlan(days, "2026-09-15").idx, 1);
  // a head line that is not finished does not count
  const partial = [{ date: "2026-09-14", lines: [E.enPatternHead(1, "句型", E.EN_PATTERNS[0].title, 4, false)] }];
  assert.equal(E.enPatternPlan(partial, "2026-09-15").idx, 0);
});

test("Saturday reviews ten sentences from the week, the same ones on every redraw; Sunday rests", () => {
  const days = [
    { date: "2026-09-16", lines: [doneLine(1)] },
    { date: "2026-09-14", lines: [doneLine(0)] },
  ];
  const sat = E.enPatternPlan(days, "2026-09-19");
  assert.equal(sat.mode, "review");
  assert.equal(sat.review.length, 10);
  assert.ok(sat.review.every(([i]) => i === 0 || i === 1));
  assert.deepEqual(plain(E.enPatternPlan(days, "2026-09-19").review), plain(sat.review));
  assert.equal(E.enPatternPlan(days, "2026-09-20").mode, "rest");
  // nothing finished this week: Saturday just carries on
  assert.equal(E.enPatternPlan([], "2026-09-19").mode, "new");
});

test("after all twenty, the second round starts from the one practised longest ago", () => {
  const days = E.EN_PATTERNS.map((_, i) => ({ date: "2026-08-" + String(31 - i).padStart(2, "0"), lines: [doneLine(i)] }));
  const plan = E.enPatternPlan(days, "2026-09-14");
  assert.equal(plan.round, 2);
  assert.equal(plan.idx, 19);
});

test("log lines round-trip", () => {
  const h = E.enPatternHead(3, "句型", "be going to / gonna", 4, true);
  assert.equal(h, "- Day 3 · 句型 · be going to / gonna · 4/10 · ✓");
  assert.deepEqual(plain(E.enParsePatternHead(h)), { tag: "句型", title: "be going to / gonna", count: 4, done: true });
  assert.equal(E.enParsePatternHead("- Day 3 · Part 1 · something · 5min"), null);
  const s = E.enPatternSentence("我今晚要看结果。", "I'm gonna check the results tonight → then decide.");
  assert.deepEqual(plain(E.enParsePatternSentence(s)), { zh: "我今晚要看结果。", en: "I'm gonna check the results tonight → then decide." });
});

test("the English tab writes sentences under the pattern's line and keeps the count", async () => {
  const src = read("../src/dashboard.js");
  const grab = name => {
    let start = src.indexOf(`function ${name}(`);
    if (src.slice(start - 6, start) === "async ") start -= 6;
    let i = src.indexOf("{", start + src.slice(start).search(/\)\s*\{/)), depth = 0;
    for (; i < src.length; i++) { if (src[i] === "{") depth++; else if (src[i] === "}" && --depth === 0) break; }
    return src.slice(start, i + 1);
  };
  let store = ["- Day 2 · Part 1 · 打卡记录 · 5min"];
  vm.runInContext(grab("enPatternWrite") + ";" + grab("enPatternSaved") +
    ";globalThis.w = { enPatternWrite, enPatternSaved };", ctx);
  Object.assign(ctx, {
    todayStr: () => "2026-09-17",
    enLoad: async () => [...store], enSave: async (_d, lines) => { store = lines; },
    enAllDays: async () => [{ date: "2026-09-16", lines: ["- x"] }], enDayNo: () => 2,
  });
  const T = "be going to / gonna";
  await ctx.w.enPatternWrite("句型", T, "甲", "A one", false);
  await ctx.w.enPatternWrite("句型", T, "乙", "B one", false);
  await ctx.w.enPatternWrite("句型", T, "甲", "A two", false);
  assert.deepEqual(store, ["- Day 2 · Part 1 · 打卡记录 · 5min", "- Day 2 · 句型 · be going to / gonna · 2/10", "  - 甲 → A two", "  - 乙 → B one"]);
  await ctx.w.enPatternWrite("句型", T, "乙", "", false);
  await ctx.w.enPatternWrite("句型", T, "", "", true);
  assert.deepEqual(store.slice(1), ["- Day 2 · 句型 · be going to / gonna · 1/10 · ✓", "  - 甲 → A two"]);
  const { head, saved } = ctx.w.enPatternSaved(store, "句型", T);
  assert.equal(head.done, true);
  assert.equal(saved.get("甲"), "A two");
});
