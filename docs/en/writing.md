[← OneDesk](../../README.md) · **English** · [中文](../zh-CN/writing.md)

# Writing

Two separate writing tracks: research writing is practice, public writing is output.

![Writing](../screenshots/07-writing.webp)

## Research writing

Writing material for your field, distilled from the papers you read, practised one card a day.

**Where it comes from**: the full text of every paper in the Zotero collection set as *写作素材合集* (writing collection) in settings, subcollections included. Three kinds of material come out:

- **Terms** — the field's vocabulary, with example sentences sorted by use: first mention, definition, why it matters, in a gap, in a method, in a result. A term is kept only if it has at least 4 clean examples covering at least 3 uses.
- **Moves** — what papers do again and again: state a research gap, describe a method, report a result, list contributions, admit limitations. Words carrying the structure are shown in bold.
- **Stock phrases** — *superior performance*, *verify the effectiveness* and the like.

The material is saved as `Drills/Writing index.json`, rebuilt on the desktop when Zotero changes, and usable on mobile. Zotero is not read until the writing collection is set.

**The week**:

| Mon | Tue | Wed | Thu | Fri | Sat | Sun |
| --- | --- | --- | --- | --- | --- | --- |
| Term | Term | Move | Term | Move | Review | Rest |

- **Term card** — write a sentence of your own using the term one particular way; the more you've practised it, the further the use rotates. Reveal the examples afterwards to compare.
- **Move card** — follow the bold structure to write that move for your own research: a gap, a method, a result, a contribution, a limitation.
- **Saturday review** — rewrite one of this week's cards from memory, **before** looking at the examples.
- Skip a card or pick a different one whenever you like.

**Two notes you can edit by hand**:

- `Drills/Terms.md` — your glossary. Terms under `## 在练` (practising) rotate through the cards; terms under `## 不练` (not practising) are dropped from suggestions. One per line: `- long form (ACRONYM) · translation`. Press **＋ 练** on a suggested term to add it.
- `Drills/Writing log.md` — what you wrote, by day, e.g. `- 术语 · ablation study · 定义` with your sentence indented below.

## Public writing

- Articles live in `Workstreams/Writing/Articles/` with a `status` in the frontmatter — `idea`, `draft` or `published` — plus `created` and `published` dates.
- The page counts articles in each status and lists recent ones.
- **＋ 新文章** (new article) creates `<date> <title>` from `Blueprints/Public Writing Template`.

The **Academic** quick-open button on the Dashboard creates a writing practice note in `Drills/Writing/`.

---

Docs: [Getting started](getting-started.md) · [Dashboard: capture and daily rhythm](dashboard.md) · [Projects](projects.md) · [Files](files.md) · [Literature for graduate students](literature.md) · [Reading](reading.md) · [English](english.md) · **Writing** · [Time](time.md)
