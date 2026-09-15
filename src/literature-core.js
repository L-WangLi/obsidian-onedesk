// ── Literature core ── pure functions over the paper notes a Zotero sync writes: read the
// frontmatter, highlights, 速览 table and synthesis paragraph back out of a note, then group
// them into the gap, tag, matrix and synthesis collections and render those as notes.
// Nothing here touches Obsidian, so the Literature views, the generated collection notes,
// the sample vault and the tests all run the same code.

const LIT_ESSAY_HEAD = "## 综述段落";
const LIT_BRIEF_HEAD = "## 速览";

// 速览 rows, keyed by the canonical tag that fills them.
const LIT_BRIEF = [
  ["gap", "想解决的问题"],
  ["method", "方法"],
  ["dataset", "数据集"],
  ["result", "结果"],
];

// Canonical tag → other spellings that mean the same. The canonical name is what collections show.
const LIT_DEFAULT_TAG_ALIASES = {
  gap: ["research gap", "gaps", "问题", "研究缺口", "研究空白"],
  method: ["methods", "approach", "方法"],
  dataset: ["datasets", "data", "数据", "数据集"],
  result: ["results", "finding", "findings", "结果"],
};

// Placeholder text older notes put under 综述段落; it is not something you wrote.
const LIT_ESSAY_HINTS = [
  "一段自己的话，写 related work 时能直接改写进去。",
  "一段自己的话，写 related work 时能直接改写进去：这篇看到了什么缺口、怎么做的、还剩什么没解决。",
];

// Generated collection notes: everything above this line is yours and is never rewritten.
const LIT_GENERATED_MARK = "%% OneDesk：本行以下由「更新合集」生成，每次更新都会重写；本行以上是你的内容，不会被改动。 %%";

const LIT_COLLECTION_FILES = {
  gaps: "Gap 合集.md",
  matrix: "文献矩阵.md",
  tags: "标签合集.md",
  synthesis: "综述草稿.md",
};

const litNormTag = t => String(t || "").trim().toLowerCase().replace(/\s+/g, " ");

// Returns tag → canonical tag. `custom` adds spellings on top of the defaults, e.g.
// { gap: ["limitation of prior work"], baseline: ["baselines", "对比方法"] }.
function litTagCanon(custom) {
  const map = new Map();
  const groups = {};
  for (const src of [LIT_DEFAULT_TAG_ALIASES, custom || {}]) {
    for (const [canon, aliases] of Object.entries(src)) {
      const key = litNormTag(canon);
      if (!key) continue;
      groups[key] = (groups[key] || []).concat(Array.isArray(aliases) ? aliases : []);
    }
  }
  for (const [canon, aliases] of Object.entries(groups)) {
    map.set(canon, canon);
    for (const a of aliases) if (litNormTag(a)) map.set(litNormTag(a), canon);
  }
  return tag => map.get(litNormTag(tag)) || String(tag || "").trim();
}

// "gap: research gap, 问题" lines ⇄ alias object, for the settings textarea.
function litParseTagAliases(text) {
  const out = {};
  for (const line of String(text || "").split("\n")) {
    const m = line.match(/^\s*([^:：]+?)\s*[:：]\s*(.*)$/);
    if (!m) continue;
    out[m[1].trim()] = m[2].split(/[,，、]/).map(s => s.trim()).filter(Boolean);
  }
  return out;
}
function litFormatTagAliases(aliases) {
  return Object.entries(aliases || {}).map(([k, v]) => `${k}: ${(v || []).join(", ")}`).join("\n");
}

// The few frontmatter keys a synced paper note carries. Values are plain, JSON-quoted
// strings, inline lists ([a, b]) or block lists ("  - x").
function litFrontmatter(raw) {
  const m = String(raw || "").match(/^---\n([\s\S]*?)\n---/);
  const out = {};
  if (!m) return out;
  let listKey = null;
  for (const line of m[1].split("\n")) {
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && listKey) { out[listKey].push(litScalar(item[1])); continue; }
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (!kv) continue;
    listKey = null;
    const [, key, value] = kv;
    if (value === "") { out[key] = []; listKey = key; continue; }
    if (/^\[.*\]$/.test(value)) {
      out[key] = value.slice(1, -1).split(",").map(litScalar).filter(v => v !== "");
      continue;
    }
    out[key] = litScalar(value);
  }
  return out;
}
function litScalar(v) {
  const s = String(v).trim();
  if (/^".*"$/.test(s)) { try { return JSON.parse(s); } catch (_e) { return s.slice(1, -1); } }
  if (/^'.*'$/.test(s)) return s.slice(1, -1);
  return s;
}

// Highlights in the note body: a meta line (`tag` `tag`　**p.3**　[↗](link)) then a blockquote
// holding the sentence, an optional faint translation and **我：** notes.
function litQuotesFromNote(raw) {
  const out = [];
  let section = "", meta = "", block = null;
  const flush = () => {
    if (block && block.length && !block[0].trim().startsWith("[!")) {   // callouts are not highlights
      let text = "", zh = "";
      const mine = [];
      for (const l of block) {
        const t = l.trim();
        if (!t) continue;
        const small = t.match(/^<small[^>]*>([\s\S]*?)<\/small>$/);
        if (small) { zh = small[1].trim(); continue; }
        if (t.startsWith("**我：**")) { mine.push(t.replace("**我：**", "").trim()); continue; }
        if (!text) text = t;
      }
      if (text) out.push({
        section, text, zh, mine,
        page: (meta.match(/\*\*p\.([^*　]+)\*\*/) || [, ""])[1],
        tags: [...meta.matchAll(/`([^`]+)`/g)].map(x => x[1]),
        link: (meta.match(/\[↗\]\(([^)]+)\)/) || [, ""])[1],
      });
    }
    block = null;
  };
  for (const line of String(raw || "").split("\n")) {
    if (line.startsWith(">")) { (block = block || []).push(line.replace(/^>\s?/, "")); continue; }
    flush();
    if (line.startsWith("### ")) { section = line.replace(/^###\s*/, "").replace(/　?<small>.*/, "").trim(); meta = ""; continue; }
    if (line.startsWith("## ")) { section = ""; meta = ""; continue; }
    if (line.trim()) meta = line;
  }
  flush();
  return out;
}

// label → cell text of the 速览 table (hand-typed rows included).
function litBriefFromNote(raw) {
  const text = String(raw || "");
  const out = {};
  const i = text.indexOf(LIT_BRIEF_HEAD);
  if (i < 0) return out;
  for (const line of text.slice(i).split("\n")) {
    if (line.startsWith("## ") && !line.startsWith(LIT_BRIEF_HEAD)) break;
    const m = line.match(/^\|\s*\*\*(.+?)\*\*\s*\|(.*)\|\s*$/);
    if (m) out[m[1].trim()] = m[2].trim();
  }
  return out;
}

// The paragraph under 综述段落, with the placeholder hint dropped.
function litEssayFromNote(raw) {
  const text = String(raw || "");
  const i = text.indexOf(LIT_ESSAY_HEAD);
  if (i < 0) return "";
  let seg = text.slice(i + LIT_ESSAY_HEAD.length);
  const j = seg.indexOf("\n## ");
  if (j >= 0) seg = seg.slice(0, j);
  return seg.replace(/<small\b[^>]*>([\s\S]*?)<\/small>/g, (_, inner) => LIT_ESSAY_HINTS.includes(inner.trim()) ? "" : inner)
    .split("\n").filter(l => l.trim()).join("\n").trim();
}

// One paper, everything the collections need, from its note text.
function litPaperFromNote(raw, path) {
  const fm = litFrontmatter(raw);
  const topics = Array.isArray(fm.topics) ? fm.topics : String(fm.topics || "").split(/[,，]/);
  return {
    path,
    title: String(fm.title || String(path).split("/").pop().replace(/\.md$/, "")),
    authors: String(fm.authors || ""),
    year: String(fm.year || ""),
    venue: String(fm.venue || ""),
    status: String(fm.status || "unread"),
    highlights: Number(fm.highlights) || 0,
    lastRead: String(fm.last_read || ""),
    topics: topics.map(t => String(t).trim()).filter(Boolean),
    quotes: litQuotesFromNote(raw),
    brief: litBriefFromNote(raw),
    essay: litEssayFromNote(raw),
  };
}

// (Author, Year) from the "Last, Last, Last" list a sync writes.
function litCite(authors, year) {
  const names = String(authors || "").split(/\s*[,;，]\s*/).filter(Boolean);
  const y = year || "n.d.";
  if (!names.length) return String(y);
  if (names.length === 1) return `${names[0]}, ${y}`;
  if (names.length === 2) return `${names[0]} & ${names[1]}, ${y}`;
  return `${names[0]} et al., ${y}`;
}

const litByYearDesc = (a, b) => (b.year || "0").localeCompare(a.year || "0") || a.title.localeCompare(b.title);
const litByYearAsc = (a, b) => (a.year || "9999").localeCompare(b.year || "9999") || a.title.localeCompare(b.title);
const litRead = p => p.highlights > 0 || p.quotes.length > 0;

// ── collections ──────────────────────────────────────────────────
function litGapCollection(papers, canon) {
  const groups = [], missing = [];
  for (const p of papers) {
    const gaps = p.quotes.filter(q => q.tags.some(t => canon(t) === "gap"));
    const typed = p.brief[LIT_BRIEF[0][1]];
    if (gaps.length) groups.push({ paper: p, items: gaps });
    else if (typed) groups.push({ paper: p, items: [{ text: typed, zh: "", mine: [], section: "速览", page: "", tags: ["gap"], link: "", typed: true }] });
    else if (litRead(p)) missing.push(p);
  }
  groups.sort((a, b) => litByYearDesc(a.paper, b.paper));
  missing.sort(litByYearDesc);
  return { groups, missing, total: groups.reduce((n, g) => n + g.items.length, 0) };
}

function litTagCollection(papers, canon) {
  const byTag = new Map();
  const untagged = [];
  for (const p of papers) {
    for (const q of p.quotes) {
      const tags = [...new Set(q.tags.map(canon))];
      if (!tags.length) untagged.push({ ...q, tags, paper: p });
      for (const t of tags) {
        if (!byTag.has(t)) byTag.set(t, { tag: t, items: [], papers: new Set() });
        const g = byTag.get(t);
        g.items.push({ ...q, tags, paper: p });
        g.papers.add(p.path);
      }
    }
  }
  const tags = [...byTag.values()].map(g => ({ tag: g.tag, items: g.items, paperCount: g.papers.size }))
    .sort((a, b) => b.items.length - a.items.length || a.tag.localeCompare(b.tag));
  return { tags, untagged };
}

function litMatrixRows(papers) {
  return papers.filter(litRead).slice().sort(litByYearDesc).map(p => ({
    paper: p,
    cells: LIT_BRIEF.map(([, label]) => p.brief[label] || ""),
  }));
}

function litSynthesisGroups(papers) {
  const byTopic = new Map();
  const written = papers.filter(p => p.essay);
  for (const p of written) {
    for (const topic of p.topics.length ? p.topics : ["未分组"]) {
      if (!byTopic.has(topic)) byTopic.set(topic, []);
      byTopic.get(topic).push(p);
    }
  }
  const groups = [...byTopic.entries()]
    .map(([topic, list]) => ({ topic, papers: list.sort(litByYearAsc) }))
    .sort((a, b) => (a.topic === "未分组") - (b.topic === "未分组") || b.papers.length - a.papers.length || a.topic.localeCompare(b.topic));
  const notWritten = papers.filter(p => !p.essay && litRead(p)).sort(litByYearDesc);
  return { groups, written: written.length, notWritten };
}

// Copy-ready related-work draft: topic headings, paragraphs ending in (Author, Year).
function litSynthesisPlain(synthesis) {
  return synthesis.groups.map(g => [`## ${g.topic}`, ""]
    .concat(g.papers.map(p => `${p.essay}（${litCite(p.authors, p.year)}）\n`)).join("\n")).join("\n");
}

// ── collection notes ─────────────────────────────────────────────
const litLink = p => `[[${p.path.replace(/\.md$/, "")}|${p.title.replace(/[\[\]|]/g, " ").replace(/\s+/g, " ").trim()}]]`;
const litCell = s => String(s || "").replace(/\s*\n\s*/g, " ").replace(/\|/g, "\\|");
const litQuoteLines = (q, indent) => {
  const pad = " ".repeat(indent);
  const where = [q.page ? "p." + q.page : "", q.section && q.section !== "速览" ? q.section : "", q.link ? `[↗ PDF](${q.link})` : ""]
    .filter(Boolean).join(" · ");
  return [`${pad}- ${q.text}`]
    .concat(q.zh ? [`${pad}  - 译：${q.zh}`] : [])
    .concat(q.mine.map(m => `${pad}  - 我：${m}`))
    .concat(where ? [`${pad}  - ${where}`] : []);
};

// The filename is the note's title in Obsidian, so the head starts with the intro, not an H1.
function litCollectionHead(intro, mine) {
  return ["---", "type: onedesk-collection", "---", "", `> ${intro}`, "", "## 我的整理", "", mine, "", ""].join("\n");
}

// Rewrites only what lies below the marker; a file without one keeps all of its text above.
function litMergeCollection(existing, head, body) {
  const auto = `${LIT_GENERATED_MARK}\n\n${body.trim()}\n`;
  if (existing == null) return `${head}${auto}`;
  const i = existing.indexOf(LIT_GENERATED_MARK);
  const keep = i >= 0 ? existing.slice(0, i) : existing.replace(/\s*$/, "\n\n");
  return keep + auto;
}

function litCollectionDocs(papers, canon, stamp) {
  const summary = parts => `> ${parts.filter(Boolean).join(" · ")} · 共 ${papers.length} 篇论文 · 更新于 ${stamp}`;
  const gaps = litGapCollection(papers, canon);
  const tags = litTagCollection(papers, canon);
  const matrix = litMatrixRows(papers);
  const synthesis = litSynthesisGroups(papers);

  const gapBody = [summary([`${gaps.total} 条 gap`, `来自 ${gaps.groups.length} 篇`]), ""]
    .concat(gaps.groups.flatMap(g => [`## ${litLink(g.paper)}`, "", `${litCite(g.paper.authors, g.paper.year)}${g.paper.venue ? " · " + g.paper.venue : ""}`, ""]
      .concat(g.items.flatMap(q => litQuoteLines(q, 0)), [""])))
    .concat(gaps.missing.length ? [`## 已读但还没标 gap · ${gaps.missing.length} 篇`, ""]
      .concat(gaps.missing.map(p => `- ${litLink(p)} · ${litCite(p.authors, p.year)}`), [""]) : []);

  const matrixBody = [summary([`${matrix.length} 篇已读`]), "",
    "| 论文 | 年份 | " + LIT_BRIEF.map(([, l]) => l).join(" | ") + " |",
    "| --- | --- | " + LIT_BRIEF.map(() => "---").join(" | ") + " |"]
    .concat(matrix.map(r => `| ${litCell(litLink(r.paper))} | ${r.paper.year || "—"} | ${r.cells.map(c => litCell(c) || " ").join(" | ")} |`));

  const tagBody = [summary([`${tags.tags.length} 个标签`, tags.untagged.length ? `${tags.untagged.length} 条未加标签` : ""]), "",
    tags.tags.map(t => `\`${t.tag}\` ${t.items.length}`).join(" · "), ""]
    .concat(tags.tags.flatMap(t => [`## ${t.tag} · ${t.items.length} 条 · ${t.paperCount} 篇`, ""]
      .concat(t.items.flatMap(q => litQuoteLines({ ...q, text: `${q.text} — ${litLink(q.paper)}` }, 0)), [""])));

  const synthBody = [summary([`${synthesis.written} 段综述`, `${synthesis.groups.length} 个主题`]), "",
    "主题来自每篇论文 frontmatter 的 `topics`，没填的归入「未分组」。", ""]
    .concat(synthesis.groups.flatMap(g => [`## ${g.topic}`, ""]
      .concat(g.papers.flatMap(p => [`### ${litLink(p)}（${litCite(p.authors, p.year)}）`, "", p.essay, ""]))))
    .concat(synthesis.notWritten.length ? [`## 已读但还没写综述段落 · ${synthesis.notWritten.length} 篇`, ""]
      .concat(synthesis.notWritten.map(p => `- ${litLink(p)} · ${litCite(p.authors, p.year)}`), [""]) : []);

  return {
    gaps: {
      head: litCollectionHead("你标为 gap 的句子，按论文汇总，新论文在前。在 Zotero 里给句子加 gap 标签，同步后点「更新合集」。",
        "（在这里归纳：哪些 gap 已被后续工作解决？哪些和你的课题有关？可以写成开题报告里的研究问题。）"),
      body: gapBody.join("\n"),
    },
    matrix: {
      head: litCollectionHead("每篇论文一行，并排比较问题、方法、数据集与结果。内容来自各论文笔记的「速览」表。",
        "（在这里写对比结论：方法上的主流路线、常用数据集、结果上的共识与分歧。）"),
      body: matrixBody.join("\n"),
    },
    tags: {
      head: litCollectionHead("所有划线按标签汇总；同义标签已合并（可在设置中修改）。",
        "（在这里整理某个标签下的共同观点或反例。）"),
      body: tagBody.join("\n"),
    },
    synthesis: {
      head: litCollectionHead("每篇论文的「综述段落」按主题汇总，段末附引用，可直接改写成 related work。",
        "（在这里写各主题之间的过渡句和整体结构。）"),
      body: synthBody.join("\n"),
    },
  };
}
