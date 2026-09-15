const LL_TIME_RE = /^\s*(\d{1,2}:\d{2})\s*[·｜|]\s*/;

// Reading view: rebuild each "HH:mm · …" list item as <span.ll-time> + <div.ll-body>
// so CSS can lay it out as a timeline row.
function styleLifeLogTimeline(el) {
  el.querySelectorAll("ul").forEach((list) => {
    const items = Array.from(list.children).filter((li) => li.tagName === "LI");
    if (!items.some((li) => LL_TIME_RE.test(li.textContent))) return;
    list.classList.add("life-log-note-timeline");
    items.forEach((li) => {
      if (li.dataset.llDone === "1") return;
      const m = li.textContent.match(LL_TIME_RE);
      if (!m) return;
      li.classList.add("life-log-note-entry");
      li.dataset.llDone = "1";
      // strip the leading "HH:mm · " (plain text at the start of the item)
      let removed = 0;
      const need = m[0].length;
      for (const node of Array.from(li.childNodes)) {
        if (removed >= need) break;
        if (node.nodeType !== Node.TEXT_NODE) break;
        const take = Math.min(need - removed, node.textContent.length);
        node.textContent = node.textContent.slice(take);
        removed += take;
      }
      const body = document.createElement("div");
      body.className = "ll-body";
      while (li.firstChild) body.appendChild(li.firstChild);
      const chip = document.createElement("span");
      chip.className = "ll-time";
      chip.textContent = m[1];
      li.append(chip, body);
    });
  });
}

// Live Preview: give the rows a timeline layout via CM6 decorations. The cursor line is
// left untouched so "- HH:mm · text" stays editable. Bullet lines with no timestamp that
// follow an entry are treated as continuation of the same minute — rail keeps going, no dot.
const LL_CM_RE = /^(\s*)([-*+]\s+)(\d{1,2}:\d{2})(\s*[·｜|]\s*)\S/;
const LL_CONT_RE = /^(\s*)([-*+]\s+)\S/;
const LL_BREAK_RE = /^\s*(#{1,6}\s|>|-{3,}\s*$|_{3,}\s*$)/;

function buildLifeLogTimelineExtension() {
  let ViewPlugin, Decoration, editorInfoField;
  try {
    ({ ViewPlugin, Decoration } = require("@codemirror/view"));
    ({ editorInfoField } = require("obsidian"));
  } catch (e) {
    console.error("[onedesk] life-log CM extension unavailable", e);
    return [];
  }
  const lineDeco = Decoration.line({ class: "ll-tl" });
  const contDeco = Decoration.line({ class: "ll-tl ll-tl-cont" });
  const timeDeco = Decoration.mark({ class: "ll-tl-time" });
  const hideDeco = Decoration.replace({});

  const inLifeLog = (view) => {
    try {
      const info = view.state.field(editorInfoField, false);
      return !!(info && info.file && info.file.path.startsWith(LIFE_LOG_DIR));
    } catch (_e) {
      return false;
    }
  };

  const build = (view) => {
    if (!inLifeLog(view)) return Decoration.none;
    const doc = view.state.doc;
    const cursorLines = new Set();
    for (const r of view.state.selection.ranges) {
      for (let n = doc.lineAt(r.from).number; n <= doc.lineAt(r.to).number; n++) cursorLines.add(n);
    }
    const decos = [];
    for (const { from, to } of view.visibleRanges) {
      // a visible range can start mid-entry — look back to know if we're inside a run
      let inRun = false;
      const start = doc.lineAt(from).number;
      for (let n = start - 1; n >= Math.max(1, start - 25); n--) {
        const t = doc.line(n).text;
        if (t.trim() === "" || LL_BREAK_RE.test(t)) break;
        if (LL_CM_RE.test(t)) { inRun = true; break; }
        if (!LL_CONT_RE.test(t)) break;
      }
      let pos = from;
      while (pos <= to) {
        const line = doc.lineAt(pos);
        pos = line.to + 1;
        const t = line.text;
        if (t.trim() === "" || LL_BREAK_RE.test(t)) { inRun = false; continue; }
        const m = LL_CM_RE.exec(t);
        if (m) {
          inRun = true;
          if (cursorLines.has(line.number)) continue;
          const bStart = line.from + m[1].length;
          const bEnd = bStart + m[2].length;
          const tEnd = bEnd + m[3].length;
          const sEnd = tEnd + m[4].length;
          decos.push(lineDeco.range(line.from));
          decos.push(hideDeco.range(bStart, bEnd));
          decos.push(timeDeco.range(bEnd, tEnd));
          decos.push(hideDeco.range(tEnd, sEnd));
        } else if (inRun && LL_CONT_RE.test(t)) {
          if (cursorLines.has(line.number)) continue;
          const cm = LL_CONT_RE.exec(t);
          decos.push(contDeco.range(line.from));
          decos.push(hideDeco.range(line.from + cm[1].length, line.from + cm[1].length + cm[2].length));
        } else {
          inRun = false;
        }
      }
    }
    return Decoration.set(decos);
  };

  return ViewPlugin.fromClass(
    class {
      constructor(view) {
        this.decorations = build(view);
      }
      update(u) {
        if (u.docChanged || u.viewportChanged || u.selectionSet) {
          this.decorations = build(u.view);
        }
      }
    },
    { decorations: (v) => v.decorations }
  );
}
