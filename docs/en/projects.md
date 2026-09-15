[← OneDesk](../../README.md) · **English** · [中文](../zh-CN/projects.md)

# Projects

Each project's next actions, completed tasks and progress records on one timeline, plus a timeline that merges every project.

![Projects](../screenshots/02-projects.webp)

## Project notes

A project is a folder under `Workstreams/` holding an overview note (`Overview.md` by default) whose frontmatter includes at least:

```yaml
---
type: project
project_id: thesis        # unique; tasks and life-log lines link by it
note_label: Thesis        # short name shown on cards (optional)
project_name: My thesis   # full name (optional)
area: Academic            # default area for its tasks: Academic / Work / Learning / Reflection
status: active            # active, waiting, planned …
---
```

- Projects whose `status` is `archived`, `done`, `completed`, `dropped` or `cancelled` are left off the board.
- **Projects can be nested**: a research-program folder holding three papers, each with its own overview note and `project_id`, gives three independent projects.

## What feeds a project

- **Tasks** in daily notes carrying `[project:: thesis]`. Open ones are the project's next actions; completed ones join the timeline with their completion time.
- **Progress records**: life-log lines that link the project's overview note, e.g. `- 16:10 · finished the setup section [[Workstreams/Thesis/Overview|Thesis]]`.
- **Detail notes** created from a task go to the project's `Detail/` folder as `<date> · <task>`; for tasks without a project, to `Workstreams/Shared/`.

## The Projects tab

- **Left**: every project in play, with its status, number of next actions and last activity date.
- **Right**, for the selected project:
  - **Next actions** — open project tasks you can tick off, reschedule or edit;
  - **Add task** puts a task for this project into today's daily note; **Log progress** appends a timestamped line linking the project to today's life log;
  - **Timeline** by day, each entry a completed task or a progress record, with links to open the source, create or open a detail note, add a note, or delete.
- On narrow screens and phones, the project list becomes a horizontal strip above the timeline.

## All-project timeline

Below, progress from every project in one place:

- Switch between the **last 7 days, 30 days, or everything**; the choice is remembered.
- A summary of the period: projects, progress records, completed tasks and execution logs.
- Each entry carries the project's color and time, and links back to its source note.

The **Project activity** card on the Dashboard shows the latest day's activity across projects; **Full timeline** opens the Projects tab.

## Board settings (optional)

By default the board lists every project that isn't archived or done, by name, with nothing to configure. For a fixed order, colors, short labels, or to keep an old `project_id` working, add JSON in Settings → OneDesk → *项目看板* (project board):

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

---

Docs: [Getting started](getting-started.md) · [Dashboard: capture and daily rhythm](dashboard.md) · **Projects** · [Files](files.md) · [Literature for graduate students](literature.md) · [Reading](reading.md) · [English](english.md) · [Writing](writing.md) · [Time](time.md)
