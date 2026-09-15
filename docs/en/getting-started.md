[← OneDesk](../../README.md) · **English** · [中文](../zh-CN/getting-started.md)

# Getting started

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

## Try the sample notes

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
- **Literature** — tag synonyms; see [Literature](literature.md#tag-synonyms).
- **Project board (advanced)** — by default the board shows every project that isn't archived or done. For a fixed order, colors or aliases, provide JSON; see [Projects](projects.md#board-settings-optional).

### Syncing settings across devices

Many sync tools don't carry a plugin's own `data.json`. Click **创建配置文件** in settings to store the settings as `onedesk.json` in your vault instead. It syncs like any note, and edits made on one device are picked up by the others.

## Desktop-only parts

- **Zotero sync** on the Literature tab reads Zotero's database through the `sqlite3` command-line tool, found in `/usr/bin`, `/opt/homebrew/bin` or `/usr/local/bin` (macOS and Linux). The notes it creates, and every Literature view, work on any device.
- **Research writing** on the Writing tab builds its phrase index from the Zotero collection set in settings (写作素材合集). Zotero is not read until that is set, and the index, once built, can be used on mobile.
- Literature views and collection notes work on every device.
- Everything else works on mobile.

---

Docs: **Getting started** · [Dashboard: capture and daily rhythm](dashboard.md) · [Projects](projects.md) · [Files](files.md) · [Literature for graduate students](literature.md) · [Reading](reading.md) · [English](english.md) · [Writing](writing.md) · [Time](time.md)
