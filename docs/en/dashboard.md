[← OneDesk](../../README.md) · **English** · [中文](../zh-CN/dashboard.md)

# Dashboard: capture and daily rhythm

## Why capture everything

A thought you haven't written down keeps coming back: *reply to that email, is this method right, look up that paper*. Each one pulls your attention away from the work in front of you.

OneDesk is built on a few well-known ideas about this:

- **Capture** from *Getting Things Done* (David Allen): anything unfinished that lives only in your head is an "open loop" that keeps asking for attention. Moving it into a system you trust lets the mind let go.
- **The Zeigarnik effect**: unfinished tasks come to mind more readily than finished ones. Masicampo and Baumeister (2011) found that making a concrete plan for an unfinished goal was enough to reduce those intrusive thoughts — the goal doesn't have to be done, only parked somewhere definite.
- **Interstitial journaling**: a one-line, timestamped note at each switch between tasks, which leaves a record of your day and makes restarting easier.

So the dashboard keeps the places to put a thought one click or one Enter away, and each place has a clear next step: answer it, turn it into a task, or leave it for later.

## Today

Your task list for the day, read from and written to your daily notes.

- **Add a task**: pick a context — a personal area (*Learning* or *Reflection*) or one of your projects — type, and press Enter. It is written into today's daily note under that area's heading as `- [ ] text #Learning [when:: 2026-01-15]`, with `[project:: id]` for a project task. Academic and Work tasks belong to a project.
- **Sections**: *Today*, *Overdue*, *Done today*, *Done yesterday*, and *Done · last 7 days*.
- **On each task**: tick it off (adds the completion time), edit the text in place, move it between *today → tomorrow → later*, switch its context, add a note, attach reference notes, open or create a detail note, cancel or delete it.
- A task is created once. When it slips, change its `[when::]` date instead of copying it into the next day's note.

## Capture

One input for whatever just crossed your mind. The button next to it switches between two kinds; press Enter to save and get back to work.

- **❓ Question** — something you want to understand or decide. Saved to `Scratch/Questions.md` with the time and an area, and logged under *❓ Questions* in today's daily note. Later you can:
  - **✍️ Answer** it; the answer is saved with the time, and today's daily note records that you answered it.
  - **→ Turn it into a task** for today, marking the question as converted.
  - Click its dot to change the area, or delete it. Open questions show how many days they have been waiting.
- **Someday** — something you'd like to do, read or learn, but not now. Saved to `Scratch/Later.md`. Add timestamped notes as your thinking develops, tick it off when done, or **promote** it to today's tasks.

## Waiting for and countdowns

- **Waiting for** (`Intake/Pending.md`) — things that depend on someone else: a reply, a review, a delivery. Add timestamped notes as you follow up; ticking one off records when it resolved.
- **Countdown** (`Console/Dates.md`) — deadlines and dates counting down, and milestones counting up.

## Quick open

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

## Daily note, life log and reviews

- **Daily note** (`Intake/Days/<date>`) — the day's plan: tasks under *Academic*, *Work*, *Learning* and *Reflection*; today's punches embedded from the clock; questions and answers logged by the dashboard; a link to the day's life log. The sample template shows the layout.
- **Life log** (`Intake/Log/<date> life log`) — the running record of the day, one timestamped line at a time: what you just did, what you noticed, how you feel. Add a link to a project's overview and the line appears on that project's timeline; **Log progress** on the Projects tab writes such a line for you. In reading and live preview, life-log notes display as a timeline.
- **Daily review** — a few minutes in the evening: what got done, what didn't, the one thing that matters most tomorrow. **Yesterday** brings back last night's review when you plan the morning.
- **Weekly review** — look back over the week's tasks, time and life log, and choose next week's focus.

## A day with OneDesk

1. **Morning** — open OneDesk, glance at *Overdue* and yesterday's review, add today's tasks, press **Wake** and an activity on the punch clock.
2. **While working** — when a thought interrupts, drop it into *Capture* or *Add to life log* and return to the task. Switch the punch clock when you switch activities.
3. **Evening** — answer or convert a few questions, write the daily review, press **End**.
4. **Weekly** — weekly review; promote a *Someday* item or two; at the start of a month, **Archive old**.

---

Docs: [Getting started](getting-started.md) · **Dashboard: capture and daily rhythm** · [Projects](projects.md) · [Files](files.md) · [Literature for graduate students](literature.md) · [Reading](reading.md) · [English](english.md) · [Writing](writing.md) · [Time](time.md)
