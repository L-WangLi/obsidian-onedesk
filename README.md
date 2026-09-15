# OneDesk

**English** · [中文](README.zh-CN.md)

An all-in-one dashboard for Obsidian. One view brings together today's tasks, project progress, a punch clock, reading and literature notes, writing practice and English speaking drills — all read from, and written back to, plain Markdown notes in your vault.

> The interface is currently in Chinese. English UI is planned.

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

- **Zotero sync** on the Literature tab reads Zotero's database through the `sqlite3` command-line tool, found in `/usr/bin`, `/opt/homebrew/bin` or `/usr/local/bin` (macOS and Linux). Notes it creates can be read on any device.
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
