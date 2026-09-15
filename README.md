# OneDesk

**English** · [中文](README.zh-CN.md)

An all-in-one dashboard for Obsidian, built around a graduate student's day. One view brings together today's tasks, project progress, a punch clock, literature notes, writing practice and English speaking drills — all read from, and written back to, plain Markdown notes in your vault.

**To stay focused**, OneDesk gives every stray thought a place to land in one keystroke — a question, a someday idea, a timestamped life-log line — so you can get back to work. [See how →](#capture-and-daily-rhythm)

**For literature reviews**, OneDesk turns a Zotero collection into a research gap collection, a comparison matrix, a tag index and a related-work draft grouped by topic. [See how →](#literature-for-graduate-students)

> The interface is currently in Chinese. English UI is planned.

![OneDesk dashboard](docs/screenshots/01-dashboard.webp)

## Features

| Tab | What it does |
| --- | --- |
| **Dashboard** | Today's tasks, add tasks to today's daily note, project board, punch clock, countdowns, waiting-for and someday lists, quick links, activity heatmap |
| **Files** | Three-pane vault browser: folders, their notes, and an editable preview |
| **Projects** | For each project: next actions, completed tasks and life-log entries as one timeline; an all-project timeline for 7 days / 30 days / everything |
| **Literature** | Imports a Zotero collection into one note per paper, then collects research gaps, a comparison matrix, a tag index and a related-work draft across all papers |
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
Research gaps, a comparison matrix, a tag index and a related-work draft, all built from your Zotero highlights. See [Literature for graduate students](#literature-for-graduate-students).

![Literature · Gaps](docs/screenshots/04a-lit-gaps.webp)

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

## Capture and daily rhythm

### Why capture everything

A thought you haven't written down keeps coming back: *reply to that email, is this method right, look up that paper*. Each one pulls your attention away from the work in front of you.

OneDesk is built on a few well-known ideas about this:

- **Capture** from *Getting Things Done* (David Allen): anything unfinished that lives only in your head is an "open loop" that keeps asking for attention. Moving it into a system you trust lets the mind let go.
- **The Zeigarnik effect**: unfinished tasks come to mind more readily than finished ones. Masicampo and Baumeister (2011) found that making a concrete plan for an unfinished goal was enough to reduce those intrusive thoughts — the goal doesn't have to be done, only parked somewhere definite.
- **Interstitial journaling**: a one-line, timestamped note at each switch between tasks, which leaves a record of your day and makes restarting easier.

So the dashboard keeps the places to put a thought one click or one Enter away, and each place has a clear next step: answer it, turn it into a task, or leave it for later.

### Today

Your task list for the day, read from and written to your daily notes.

- **Add a task**: pick a context — a personal area (*Learning* or *Reflection*) or one of your projects — type, and press Enter. It is written into today's daily note under that area's heading as `- [ ] text #Learning [when:: 2026-01-15]`, with `[project:: id]` for a project task. Academic and Work tasks belong to a project.
- **Sections**: *Today*, *Overdue*, *Done today*, *Done yesterday*, and *Done · last 7 days*.
- **On each task**: tick it off (adds the completion time), edit the text in place, move it between *today → tomorrow → later*, switch its context, add a note, attach reference notes, open or create a detail note, cancel or delete it.
- A task is created once. When it slips, change its `[when::]` date instead of copying it into the next day's note.

### Capture

One input for whatever just crossed your mind. The button next to it switches between two kinds; press Enter to save and get back to work.

- **❓ Question** — something you want to understand or decide. Saved to `Scratch/Questions.md` with the time and an area, and logged under *❓ Questions* in today's daily note. Later you can:
  - **✍️ Answer** it; the answer is saved with the time, and today's daily note records that you answered it.
  - **→ Turn it into a task** for today, marking the question as converted.
  - Click its dot to change the area, or delete it. Open questions show how many days they have been waiting.
- **Someday** — something you'd like to do, read or learn, but not now. Saved to `Scratch/Later.md`. Add timestamped notes as your thinking develops, tick it off when done, or **promote** it to today's tasks.

### Waiting for and countdowns

- **Waiting for** (`Intake/Pending.md`) — things that depend on someone else: a reply, a review, a delivery. Add timestamped notes as you follow up; ticking one off records when it resolved.
- **Countdown** (`Console/Dates.md`) — deadlines and dates counting down, and milestones counting up.

### Quick open

Buttons for the notes you open every day:

| Button | Opens |
| --- | --- |
| **Daily Note** | Today's daily note, created from `Blueprints/Daily Note Template` if it doesn't exist yet |
| **Daily review** | Today's review note, `Intake/Review daily/<date> 复盘` |
| **Life Log** | Today's life log, created from `Blueprints/Life Log Template` |
| **Add to life log** | A prompt; the line is appended to today's life log as `- HH:mm · text` without leaving the dashboard |
| **Yesterday** | Yesterday's review |
| **Weekly review** | This week's review, `Intake/Review weekly/<year>-W<week>` |
| **Speech**, **Academic**, **Paper reading**, **Public writing** | A new note from the matching template, in the English, writing, literature or articles folder |
| **Archive old** | Moves daily notes, reviews and life logs from before this month into `YYYY-MM` subfolders, keeping links intact |

A review note that doesn't exist yet opens as a new blank note.

### Daily note, life log and reviews

- **Daily note** (`Intake/Days/<date>`) — the day's plan: tasks under *Academic*, *Work*, *Learning* and *Reflection*; today's punches embedded from the clock; questions and answers logged by the dashboard; a link to the day's life log. The sample template shows the layout.
- **Life log** (`Intake/Log/<date> life log`) — the running record of the day, one timestamped line at a time: what you just did, what you noticed, how you feel. Add a link to a project's overview and the line appears on that project's timeline; **Log progress** on the Projects tab writes such a line for you. In reading and live preview, life-log notes display as a timeline.
- **Daily review** — a few minutes in the evening: what got done, what didn't, the one thing that matters most tomorrow. **Yesterday** brings back last night's review when you plan the morning.
- **Weekly review** — look back over the week's tasks, time and life log, and choose next week's focus.

### A day with OneDesk

1. **Morning** — open OneDesk, glance at *Overdue* and yesterday's review, add today's tasks, press **Wake** and an activity on the punch clock.
2. **While working** — when a thought interrupts, drop it into *Capture* or *Add to life log* and return to the task. Switch the punch clock when you switch activities.
3. **Evening** — answer or convert a few questions, write the daily review, press **End**.
4. **Weekly** — weekly review; promote a *Someday* item or two; at the start of a month, **Archive old**.

## Literature for graduate students

Reading for a thesis means dozens of papers, and the questions that matter cut across all of them: *What gaps have others pointed out? How do the methods and datasets compare? What has been said about X? How do I turn this into a related-work section?*

OneDesk answers those from the highlights you already make in Zotero. Highlighting stays in Zotero; the collecting and writing happen in Obsidian.

### The workflow

1. **Read and highlight in Zotero.** Tag the sentence that states the problem `gap`, the method `method`, the data `dataset`, the main finding `result`. Add any other tags you like (`limitation`, `future work`, `baseline` …). Type your own thoughts into the annotation comment.
2. **Sync.** Press **Sync Zotero** on the Literature tab. Each paper becomes a note, and the four collection notes below are rebuilt.
3. **Write one paragraph per paper.** Under `## 综述段落` in a paper's note, write how you would describe it in your related work. Put its themes in the frontmatter, e.g. `topics: [graph neural networks, few-shot learning]`.
4. **Use the collections.** Gaps for your research questions and proposal, Matrix to compare approaches, Tags to see everything said about a theme, Synthesis as the first draft of your literature review.

### The collections

**Gap collection** — every sentence tagged as a gap, grouped by paper with the newest first, each with its translation, your notes, page and a link back to the PDF. Papers you have read but not tagged a gap in are listed underneath, so nothing slips through. `gap`, `research gap`, `问题` and `研究缺口` all count as the same tag.

![Gaps](docs/screenshots/04a-lit-gaps.webp)

**Comparison matrix** — one row per paper: problem, method, dataset and result side by side, from each note's 速览 table. Filter by any word, such as a dataset name or a year. Cells you type by hand in a note's table show up here too.

![Matrix](docs/screenshots/04b-lit-matrix.webp)

**Tag index** — all highlights across the collection, grouped by tag, with how many highlights and how many papers each tag covers. Synonyms are merged.

![Tags](docs/screenshots/04c-lit-tags.webp)

**Related-work draft** — every synthesis paragraph you have written, grouped by `topics` and ordered oldest paper first within each topic, each ending with an (Author, Year) citation. **Copy all** puts the whole draft, with topic headings, on the clipboard. Papers you have read but not written about are listed underneath.

![Synthesis](docs/screenshots/04d-lit-synthesis.webp)

### Collections as notes

Every sync, and the **更新合集** (update collections) button, writes the four collections as ordinary notes in `Sources/Reading/`: `Gap 合集`, `文献矩阵`, `标签合集` and `综述草稿`. They can be searched, linked from your proposal, read on your phone and synced like any note.

Each has a **我的整理** (my notes) section at the top for your own synthesis. Everything above the `%% OneDesk … %%` line is yours and is never rewritten; only what lies below it is regenerated.

![Gap collection note](docs/screenshots/04e-gap-note.webp)

Collections are rebuilt only when you sync or press the button, never just by opening a page, so several devices syncing the same vault don't fight over these files.

### Tag synonyms

Settings → OneDesk → *标签同义词* merges spellings into one tag, one group per line:

```text
gap: limitation of prior work, 局限
baseline: baselines, 对比方法
```

These are added to the built-in groups for `gap`, `method`, `dataset` and `result`.

### Setting up Zotero sync (desktop)

1. Use Zotero 6 or 7 with its default data folder, `~/Zotero`.
2. Make sure the `sqlite3` command-line tool is installed. It ships with macOS; on Linux install it from your package manager. Windows is not supported yet.
3. Put the papers into one collection and enter its **exact name** in Settings → OneDesk → *Zotero 合集*. Subcollections are not included.
4. Press **Sync Zotero**.

OneDesk reads a temporary copy of Zotero's database, so Zotero can stay open. Nothing is ever written back to Zotero. Every view and collection works on mobile from the synced notes.

### What a paper note contains

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

### All Literature views

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
- Literature views and collection notes work on every device.
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
