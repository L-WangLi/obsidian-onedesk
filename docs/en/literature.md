[← OneDesk](../../README.md) · **English** · [中文](../zh-CN/literature.md)

# Literature for graduate students

Reading for a thesis means dozens of papers, and the questions that matter cut across all of them: *What gaps have others pointed out? How do the methods and datasets compare? What has been said about X? How do I turn this into a related-work section?*

OneDesk answers those from the highlights you already make in Zotero. Highlighting stays in Zotero; the collecting and writing happen in Obsidian.

## The workflow

1. **Read and highlight in Zotero.** Tag the sentence that states the problem `gap`, the method `method`, the data `dataset`, the main finding `result`. Add any other tags you like (`limitation`, `future work`, `baseline` …). Type your own thoughts into the annotation comment.
2. **Sync.** Press **Sync Zotero** on the Literature tab. Each paper becomes a note, and the four collection notes below are rebuilt.
3. **Write one paragraph per paper.** Under `## 综述段落` in a paper's note, write how you would describe it in your related work. Put its themes in the frontmatter, e.g. `topics: [graph neural networks, few-shot learning]`.
4. **Use the collections.** Gaps for your research questions and proposal, Matrix to compare approaches, Tags to see everything said about a theme, Synthesis as the first draft of your literature review.

## The collections

**Gap collection** — every sentence tagged as a gap, grouped by paper with the newest first, each with its translation, your notes, page and a link back to the PDF. Papers you have read but not tagged a gap in are listed underneath, so nothing slips through. `gap`, `research gap`, `问题` and `研究缺口` all count as the same tag.

![Gaps](../screenshots/04a-lit-gaps.webp)

**Comparison matrix** — one row per paper: problem, method, dataset and result side by side, from each note's 速览 table. Filter by any word, such as a dataset name or a year. Cells you type by hand in a note's table show up here too.

![Matrix](../screenshots/04b-lit-matrix.webp)

**Tag index** — all highlights across the collection, grouped by tag, with how many highlights and how many papers each tag covers. Synonyms are merged.

![Tags](../screenshots/04c-lit-tags.webp)

**Related-work draft** — every synthesis paragraph you have written, grouped by `topics` and ordered oldest paper first within each topic, each ending with an (Author, Year) citation. **Copy all** puts the whole draft, with topic headings, on the clipboard. Papers you have read but not written about are listed underneath.

![Synthesis](../screenshots/04d-lit-synthesis.webp)

## Collections as notes

Every sync, and the **更新合集** (update collections) button, writes the four collections as ordinary notes in `Sources/Reading/`: `Gap 合集`, `文献矩阵`, `标签合集` and `综述草稿`. They can be searched, linked from your proposal, read on your phone and synced like any note.

Each has a **我的整理** (my notes) section at the top for your own synthesis. Everything above the `%% OneDesk … %%` line is yours and is never rewritten; only what lies below it is regenerated.

![Gap collection note](../screenshots/04e-gap-note.webp)

Collections are rebuilt only when you sync or press the button, never just by opening a page, so several devices syncing the same vault don't fight over these files.

## Tag synonyms

Settings → OneDesk → *标签同义词* merges spellings into one tag, one group per line:

```text
gap: limitation of prior work, 局限
baseline: baselines, 对比方法
```

These are added to the built-in groups for `gap`, `method`, `dataset` and `result`.

## Setting up Zotero sync (desktop)

1. Use Zotero 6 or 7 with its default data folder, `~/Zotero`.
2. Make sure the `sqlite3` command-line tool is installed. It ships with macOS; on Linux install it from your package manager. Windows is not supported yet.
3. Put the papers into one collection and enter its **exact name** in Settings → OneDesk → *Zotero 合集*. Subcollections are not included.
4. Press **Sync Zotero**.

OneDesk reads a temporary copy of Zotero's database, so Zotero can stay open. Nothing is ever written back to Zotero. Every view and collection works on mobile from the synced notes.

## What a paper note contains

One note per paper in `Sources/Reading/Zotero/`, named after the title. The frontmatter holds `title`, `authors`, `year`, `venue`, `doi`, `zotero_key`, `status` (`unread`, `read`, or `deep` from 20 highlights up), counts of `highlights` and `figures`, `last_read`, `sessions` (one line per day you annotated) and `topics`.

| Section | Contents |
| --- | --- |
| Header | Authors · year · venue, with links to the item in Zotero and its DOI |
| **速览** (at a glance) | Problem, method, dataset, result, filled from highlights with those tags. A row you type yourself is kept until a tagged highlight fills it. |
| **图表** (figures) | Rectangles you drew over figures or tables, copied into `_figures/<zotero key>/`, captioned from the PDF text and grouped into method, experiments and results |
| **我划的句子** (highlights) | Highlights grouped under the paper's own sections (Abstract, Introduction, Method, Results …), each with tags, page and a link to that spot in the PDF; sticky notes in place among them |
| 素材 (raw material) | A collapsed list of the gap and method sentences and everything you wrote about the paper |
| **综述段落** (synthesis) and **我的话** (my words) | Yours |

- Short tags (up to 16 characters, with no comma, period or semicolon) are labels. Anything longer typed into the tag box is a note, shown as **我：** under the sentence, as is text in the annotation comment. A translation stored in the comment between `🔤` marks is shown as a faint translation line.
- **Your writing is never overwritten**: everything from `## 综述段落` to the end of a note is carried over on every sync. Notes are matched by `zotero_key`, so renaming a paper in Zotero keeps what you wrote.
- `Sources/Reading/Thoughts.md` collects everything you wrote in Zotero — sticky notes, comments and child notes — leaving out notes you didn't write (reading-time data, arXiv comments, TL;DRs, notes that only repeat highlights).
- If a figure shows *Zotero hasn't rendered this image yet*, open that annotation once in Zotero and sync again.

## All Literature views

| View | What it shows |
| --- | --- |
| **Papers** | Status (New / Read / Deep), authors, year, venue, highlights and last read date |
| **Gaps** | The gap collection |
| **Matrix** | The comparison matrix, with a filter |
| **Tags** | The tag index |
| **Synthesis** | The related-work draft by topic, with Copy all |
| **Timeline** | Each day you annotated each paper |
| **Notes** | `Thoughts.md` read back |

Other tabs use the same notes: on long-sentence days, **English** practises with sentences you highlighted that carry a translation; **Writing** builds its academic phrase index from the full text of papers in the collection set as *写作素材合集*.

---

Docs: [Getting started](getting-started.md) · [Dashboard: capture and daily rhythm](dashboard.md) · [Projects](projects.md) · [Files](files.md) · **Literature for graduate students** · [Reading](reading.md) · [English](english.md) · [Writing](writing.md) · [Time](time.md)
