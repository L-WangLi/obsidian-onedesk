# OneDesk

**English** · [中文](README.zh-CN.md)

An all-in-one dashboard for Obsidian. One view brings together today's tasks, project progress, a punch clock, reading and literature notes, writing practice and English speaking drills — all read from, and written back to, plain Markdown notes in your vault.

> The interface is currently in Chinese. English UI is planned.

![OneDesk dashboard](docs/screenshots/01-dashboard.webp)

## Features

| Tab | What it does |
| --- | --- |
| **Dashboard** | Today's tasks, add tasks to today's daily note, project board, punch clock, countdowns, waiting-for and someday lists, quick links, activity heatmap |
| **Files** | Three-pane vault browser: folders, their notes, and an editable preview |
| **Projects** | For each project: next actions, completed tasks and life-log entries as one timeline; an all-project timeline for 7 days / 30 days / everything |
| **Literature** | Imports a Zotero collection into one note per paper, with highlights placed under the paper's own section headings *(desktop only, see below)* |
| **Reading** | Stats and recent thoughts from exported book notes (`📌` highlights, `💭` thoughts) |
| **English** | A fixed speaking syllabus (short answers / 2-minute talk / discussion) built from what you actually did that day, plus a phrase bank |
| **Writing** | Academic phrase practice from your literature, and a public writing pipeline (idea → draft → published) |
| **Time** | Punch in and out by activity; today as a donut, the week as a calendar grid, where the time went, and plan vs. actual against your schedule |

Tabs you don't use can be switched off in settings.

## Screenshots

All screenshots use the fictional sample notes that ship with the plugin.

### Projects
Next actions, completed tasks and life-log entries per project, plus one timeline across all projects.

![Projects](docs/screenshots/02-projects.webp)

### Files
Browse folders and recent notes; the preview on the right is editable.

![Files](docs/screenshots/03-files.webp)

### Literature
Papers imported from a Zotero collection, with highlights, reading sessions and status. See [Literature in detail](#literature-in-detail).

![Literature](docs/screenshots/04-literature.webp)

### Reading
Books, hours, highlights and your latest thoughts from exported book notes.

![Reading](docs/screenshots/05-reading.webp)

### English
Today's speaking prompt built from what you did yesterday, the weekly plan, the log and the phrases worth keeping.

![English](docs/screenshots/06-english.webp)

### Writing
Research writing practice (from your Zotero collection) and the public writing pipeline.

![Writing](docs/screenshots/07-writing.webp)

### Time
Rhythm metrics, today against your schedule, the week as a calendar, where the time went, and a 14-day log.

![Time](docs/screenshots/08-time.webp)

## Requirements

- Obsidian 1.4.10 or later (desktop or mobile)
- The [Dataview](https://github.com/blacksmithgu/obsidian-dataview) plugin, installed and enabled. JavaScript queries do **not** need to be enabled.

## Installation

### With BRAT (recommended, gets updates automatically)

1. Install and enable **BRAT** from Community plugins.
2. Run the command **BRAT: Add a beta plugin for testing**.
3. Enter `https://github.com/L-WangLi/obsidian-onedesk`.
4. Enable **OneDesk** under Settings → Community plugins.

### Manually

1. Download `main.js`, `manifest.json` and `styles.css` from the [latest release](https://github.com/L-WangLi/obsidian-onedesk/releases/latest).
2. Put them in `<your vault>/.obsidian/plugins/onedesk/`.
3. Reload Obsidian and enable **OneDesk** under Settings → Community plugins.

## Quick start

1. Open a new, empty vault and install Dataview and OneDesk.
2. Run **OneDesk: 创建示例笔记** (create sample notes) from the command palette.
3. OneDesk opens with a fictional week of projects, tasks, punches, books and papers in every tab.

Read `OneDesk 示例说明.md` in the sample to see which note feeds which card, then replace the samples with your own notes.

## How your notes are read

OneDesk has no database. Every card is a view over ordinary notes, using these conventions (folder names are defaults and can be changed):

| What | Where | Format |
| --- | --- | --- |
| Project | `Workstreams/<project>/Overview.md` | frontmatter `type: project`, `project_id`, `note_label`, `area`, `status` |
| Task | daily notes in `Intake/Days/` | `- [ ] text #Academic [when:: 2026-01-15] [project:: thesis]` |
| Life log | `Intake/Log/2026-01-15 life log.md` | `- 09:30 · text` — link a project overview to put the line on its timeline |
| Punch clock | `Console/Clock.md` | `## 2026-01-15` then `- 08:30 in research`, `- 11:50 break` |
| Countdown | `Console/Dates.md` | `- 2026-02-01 · label` |
| Waiting for / Someday | `Intake/Pending.md`, `Scratch/Later.md` | `- [ ] 2026-01-15 · text` |
| Schedule | `Intake/Days/Rhythm.md` | a table: `\| 08:30 - 11:30 \| deep work \| … \|` |
| Book notes | `Shelf/` | `> 📌 highlight`, `- 💭 thought`, `- ⏱ 2026-01-15 21:30` |
| Papers | `Sources/Reading/Zotero/` | frontmatter `type: paper` (written by the Zotero sync) |
| Templates | `Blueprints/` | `Daily Note Template`, `Life Log Template`, … |

If the core **Daily notes** plugin is enabled, its folder and date format decide where daily notes live.

## Literature in detail

Highlighting stays in Zotero; thinking happens in Obsidian. The Literature tab turns one Zotero collection into reading notes you can scan, search by tag, and grow into a related-work draft.

### Setting it up (desktop)

1. Use Zotero 6 or 7 with its default data folder, `~/Zotero`.
2. Make sure the `sqlite3` command-line tool is installed. It ships with macOS; on Linux install it from your package manager. Windows is not supported yet.
3. Put the papers you are reading into one collection, and enter its **exact name** in Settings → OneDesk → *Zotero 合集*. Subcollections are not included.
4. Press **Sync Zotero** on the Literature tab.

OneDesk reads a temporary copy of Zotero's database, so Zotero can stay open. Nothing is ever written back to Zotero.

### What a sync writes

**One note per paper** in `Sources/Reading/Zotero/`, named after the title. The frontmatter holds `title`, `authors`, `year`, `venue`, `doi`, `zotero_key`, a `status` (`unread`, `read`, or `deep` from 20 highlights up), counts of `highlights` and `figures`, `last_read`, and `sessions` — one line per day you annotated the paper. The body, top to bottom:

| Section | Contents |
| --- | --- |
| Header | Authors · year · venue, with links to open the item in Zotero and to its DOI |
| **速览** (at a glance) | A four-row table — problem, method, dataset, result — filled from highlights tagged `gap` / `research gap`, `method`, `dataset`, `result` (Chinese equivalents work too). A row you typed yourself is kept until a tagged highlight fills it. |
| **图表** (figures) | Every rectangle you drew over a figure or table, copied into `_figures/<zotero key>/` and captioned from the PDF text (`Fig. 2. …`). Grouped into method, experiments and results by caption keywords. |
| **我划的句子** (highlights) | Your highlights grouped under the paper's own sections — Abstract, Introduction, Related work, Method, Experiments, Results, Discussion, Conclusion — detected from Zotero's full-text cache. Each shows its tags, page, and a link that jumps to that exact spot in the PDF. Sticky notes appear in place among them. |
| 素材 (raw material) | A collapsed callout listing the gap and method sentences and everything you wrote about the paper |
| **综述段落** (synthesis) and **我的话** (my words) | Yours. Write a paragraph for your related-work section here. |

On highlights:

- Short tags (up to 16 characters, with no comma, period or semicolon) are treated as labels. Anything longer typed into the tag box is treated as a note and shown as **我：** under the sentence.
- Text you type in an annotation's comment also appears as **我：**. If a translation plugin stores its translation in the comment between `🔤` marks, that part is shown as a faint translation line instead.

**Your writing is never overwritten.** Everything from `## 综述段落` to the end of a note is carried over unchanged on every sync. Notes are matched by `zotero_key`, so renaming a paper in Zotero renames its note without losing what you wrote. Deleting an image annotation in Zotero removes its picture from the vault.

**`Sources/Reading/Thoughts.md`** collects everything *you* wrote in Zotero — sticky notes, your own words in annotation comments, and child notes — grouped by paper, most recently written first. Notes you didn't write (reading-time plugin data, arXiv comments, TL;DRs, notes generated from annotations that only repeat the highlights) are left out. This file is rewritten on each sync, so edit those notes in Zotero.

If a figure shows *Zotero hasn't rendered this image yet*, open that annotation once in Zotero and sync again.

### The five views

| View | What it shows |
| --- | --- |
| **Papers** | Every paper with its status (New / Read / Deep), authors, year, venue, highlight count and last read date |
| **Timeline** | Each day you annotated each paper, and how many highlights you made |
| **Tags** | All highlights across the collection, grouped by tag, plus an *Untagged* group. Each shows the paper, section, page, translation and your notes, with links to the note and to the spot in the PDF. |
| **Synthesis** | Every *综述段落* you have written, oldest paper first — a related-work draft you can copy in one click — followed by the papers you have highlighted but not yet written about |
| **Notes** | `Thoughts.md` read back |

### Used by other tabs

- **English** — on long-sentence days, the prompt uses English sentences you highlighted that carry a translation.
- **Writing** — *Research writing* builds its term and phrase index from the full text of papers in the collection set as *写作素材合集* (subcollections included). It reads Zotero only after that setting is filled in.

A tagging habit that makes every view useful: while reading, tag the sentence stating the problem `gap`, the method `method`, the data `dataset`, and the main finding `result`.

## Settings

- **Name, open on startup**
- **Modules** — hide tabs you don't use
- **Folders** — change any default. Changing a parent (e.g. the inbox) moves everything derived from it.
- **Project board (advanced)** — by default the board shows every project that isn't archived or done. For a fixed order, colors or aliases, provide JSON:

  ```json
  {
    "projectBoard": {
      "ids": ["thesis", "side-app"],
      "colors": { "thesis": "var(--blue)" },
      "shortLabels": { "side-app": "App" }
    },
    "projectAliases": { "old-id": "thesis" }
  }
  ```

### Syncing settings across devices

Many sync tools don't carry a plugin's own `data.json`. Click **创建配置文件** in settings to store the settings as `onedesk.json` in your vault instead. It syncs like any note, and edits made on one device are picked up by the others.

## Desktop-only parts

- **Zotero sync** on the Literature tab reads Zotero's database through the `sqlite3` command-line tool, found in `/usr/bin`, `/opt/homebrew/bin` or `/usr/local/bin` (macOS and Linux). The notes it creates, and every Literature view, work on any device.
- **Research writing** on the Writing tab builds its phrase index from the Zotero collection set in settings (写作素材合集). Zotero is not read until that is set, and the index, once built, can be used on mobile.
- Everything else works on mobile.

## Development

No dependencies — the build is a single Node script.

```bash
npm run build                                          # writes main.js
npm run dev -- "/path/to/vault/.obsidian/plugins/onedesk"   # rebuild into a vault on every change
npm run example                                        # writes example-vault/ with the plugin installed
npm test
```

Sources live in `src/`: `main.js` is the plugin shell (view, settings, config file), `dashboard.js` is the dashboard itself, `sample-vault.js` generates the sample notes, and `lifelog-timeline.js` styles life-log notes as a timeline.

To release, bump `version` in `manifest.json` and `versions.json`, then push a tag with the same version. GitHub Actions builds, tests and attaches `main.js`, `manifest.json` and `styles.css` to the release.

## License

[MIT](LICENSE)
