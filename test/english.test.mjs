import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const read = p => readFileSync(new URL(p, import.meta.url), "utf8");
const plain = o => JSON.parse(JSON.stringify(o));
const ctx = vm.createContext({});
vm.runInContext(read("../src/english-patterns.js") +
  "\n;globalThis.api = { EN_PATTERNS, enPatternPlan, enPatternHead, enParsePatternHead, enPatternSentence, enParsePatternSentence, enPatternProgress, enMistakeQueue, EN_MISTAKE_STEPS };", ctx);
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
  assert.deepEqual(plain(E.enParsePatternHead(h)), { tag: "句型", title: "be going to / gonna", count: 4, total: 10, done: true });
  assert.equal(E.enParsePatternHead("- Day 5 · 错句复习 · 到期 · 3/12").total, 12);
  assert.equal(E.enParsePatternHead("- Day 3 · Part 1 · something · 5min"), null);
  const s = E.enPatternSentence("我今晚要看结果。", "I'm gonna check the results tonight → then decide.");
  assert.deepEqual(plain(E.enParsePatternSentence(s)), { zh: "我今晚要看结果。", en: "I'm gonna check the results tonight → then decide.", mark: "" });
  assert.deepEqual(plain(E.enParsePatternSentence(E.enPatternSentence("甲", "A one", "✗"))), { zh: "甲", en: "A one", mark: "✗" });
  // said aloud, not typed
  assert.equal(E.enPatternSentence("甲", "", "✓"), "  - 甲 → — · ✓");
  assert.deepEqual(plain(E.enParsePatternSentence("  - 甲 → — · ✓")), { zh: "甲", en: "", mark: "✓" });
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
  const findHead = src.slice(src.indexOf("const enFindHead ="), src.indexOf(";\n", src.indexOf("const enFindHead =")) + 1);
  vm.runInContext(findHead + grab("enPatternWrite") + ";" + grab("enPatternSaved") +
    ";globalThis.w = { enPatternWrite, enPatternSaved };", ctx);
  Object.assign(ctx, {
    todayStr: () => "2026-09-17",
    enLoad: async () => [...store], enSave: async (_d, lines) => { store = lines; },
    enAllDays: async () => [{ date: "2026-09-16", lines: ["- x"] }], enDayNo: () => 2,
  });
  const T = "be going to / gonna";
  await ctx.w.enPatternWrite("句型", T, "甲", { en: "A one" });
  await ctx.w.enPatternWrite("句型", T, "乙", { en: "B one" });
  await ctx.w.enPatternWrite("句型", T, "甲", { en: "A two" });
  assert.deepEqual(store, ["- Day 2 · Part 1 · 打卡记录 · 5min", "- Day 2 · 句型 · be going to / gonna · 2/10", "  - 甲 → A two", "  - 乙 → B one"]);
  // marking keeps the text; text changes keep the mark
  await ctx.w.enPatternWrite("句型", T, "甲", { mark: "✗" });
  await ctx.w.enPatternWrite("句型", T, "甲", { en: "A three" });
  // a sentence only said aloud can still be marked, and does not count as written
  await ctx.w.enPatternWrite("句型", T, "丙", { en: "", mark: "✓" });
  await ctx.w.enPatternWrite("句型", T, "乙", { en: "" });
  await ctx.w.enPatternWrite("句型", T, "", {}, { finish: true });
  assert.deepEqual(store.slice(1), ["- Day 2 · 句型 · be going to / gonna · 1/10 · ✓", "  - 甲 → A three · ✗", "  - 丙 → — · ✓"]);
  const { head, saved } = ctx.w.enPatternSaved(store, "句型", T);
  assert.equal(head.done, true);
  assert.deepEqual(plain(saved.get("甲")), { en: "A three", mark: "✗" });
});

test("a wrong sentence comes back after 1, 3, 7 and 14 days, and a new mistake starts it over", () => {
  const [, zh] = E.EN_PATTERNS[0].ex[3];
  const line = mark => E.enPatternSentence(zh, "x", mark);
  const dueOn = (days, date) => plain(E.enMistakeQueue(days, date).due.map(d => d.zh));
  let days = [{ date: "2026-09-01", lines: [line("✗")] }];
  assert.deepEqual(dueOn(days, "2026-09-01"), []);           // not the same day
  assert.deepEqual(dueOn(days, "2026-09-02"), [zh]);         // +1
  days = [{ date: "2026-09-02", lines: [line("✓")] }, ...days];
  // answered today: still listed today, so the row keeps its answer on screen
  assert.deepEqual(dueOn(days, "2026-09-02"), [zh]);
  assert.deepEqual(dueOn(days, "2026-09-04"), []);
  assert.deepEqual(dueOn(days, "2026-09-05"), [zh]);         // +3
  days = [{ date: "2026-09-05", lines: [line("✓")] }, ...days];
  assert.deepEqual(dueOn(days, "2026-09-11"), []);
  assert.deepEqual(dueOn(days, "2026-09-12"), [zh]);         // +7
  days = [{ date: "2026-09-12", lines: [line("✗")] }, ...days];
  assert.deepEqual(dueOn(days, "2026-09-13"), [zh]);         // wrong again: back to +1
  let q = E.enMistakeQueue(days, "2026-09-13");
  assert.equal(q.waiting, 1); assert.equal(q.mastered, 0);
  for (const [i, date] of ["2026-09-13", "2026-09-16", "2026-09-23", "2026-10-07"].entries()) {
    assert.deepEqual(dueOn(days, date), [zh], "step " + i);
    days = [{ date, lines: [line("✓")] }, ...days];
  }
  q = E.enMistakeQueue(days, "2026-12-01");
  assert.deepEqual(q.due.length, 0);
  assert.equal(q.mastered, 1);
  // sentences never marked wrong are not mistakes
  assert.equal(E.enMistakeQueue([{ date: "2026-09-01", lines: [E.enPatternSentence(E.EN_PATTERNS[1].ex[0][1], "y", "✓")] }], "2026-09-10").waiting, 0);
});

test("every Chinese prompt is unique, so a mark in the log finds its sentence", () => {
  const all = E.EN_PATTERNS.flatMap(p => p.ex.map(e => e[1]));
  assert.equal(new Set(all).size, all.length);
});

test("the mistake card lists what is due, with each sentence's answer and mark", () => {
  const src = read("../src/dashboard.js");
  const grab = name => {
    let start = src.indexOf(`function ${name}(`);
    let i = src.indexOf("{", start + src.slice(start).search(/\)\s*\{/)), depth = 0;
    for (; i < src.length; i++) { if (src[i] === "{") depth++; else if (src[i] === "}" && --depth === 0) break; }
    return src.slice(start, i + 1);
  };
  const findHead = src.slice(src.indexOf("const enFindHead ="), src.indexOf(";\n", src.indexOf("const enFindHead =")) + 1);
  const c = vm.createContext({ esc: x => String(x), _enPatRefs: false });
  vm.runInContext(read("../src/english-patterns.js") + findHead +
    ["enPatternSaved", "enPatternRows", "enMistakeCardHtml", "enPatternCardHtml"].map(grab).join("\n") +
    ";globalThis.r = { enMistakeCardHtml, enPatternCardHtml, enMistakeQueue };", c);
  Object.assign(c, { todayStr: () => "2026-09-17", _enPatView: null });
  const [, zh0] = E.EN_PATTERNS[0].ex[0], [, zh1] = E.EN_PATTERNS[0].ex[3];
  const days = [
    { date: "2026-09-17", lines: ["- Day 2 · 错句复习 · 到期 · 1/2", "  - " + zh0 + " → I'm gonna check it · ✓"] },
    { date: "2026-09-16", lines: ["- Day 1 · 句型 · be going to / gonna · 1/10 · ✓", "  - " + zh0 + " → I going check · ✗", "  - " + zh1 + " → — · ✗"] },
  ];
  const q = c.r.enMistakeQueue(days, "2026-09-17");
  const html = c.r.enMistakeCardHtml(q, days[0].lines);
  assert.equal((html.match(/class="ep-row[ "]/g) || []).length, 2);
  assert.match(html, /今天 2 句 · 还剩 <b class="ep-left">1<\/b>/);
  assert.match(html, /ep-row ep-has ep-ok/);
  assert.match(html, /value="I'm gonna check it"/);
  assert.equal(c.r.enMistakeCardHtml({ due: [], waiting: 0, mastered: 0 }, []), "");
  const card = c.r.enPatternCardHtml(days, days[0].lines, q);
  assert.match(card, /错句本 · 待掌握 2 · 已掌握 0/);
});
