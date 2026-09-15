[← OneDesk](../../README.md) · **English** · [中文](../zh-CN/time.md)

# Time

Track where your time goes with a punch clock, and compare it with the schedule you planned.

![Time](../screenshots/08-time.webp)

## Punch clock (Dashboard)

A row of buttons on the Dashboard: **Wake**, **Research**, **Work**, **Social**, **Learning**, **End**.

- **Activity buttons are toggles**: press one to start, press another to switch straight over, press the lit one to pause. Switching takes one tap.
- **End** closes the day; **↩ Undo** removes the last press after a mis-tap.
- Punches are stored in `Console/Clock.md`, newest day first, one line per press — `- 08:30 in research`, `- 11:50 break`. It's an ordinary note you can edit by hand. Daily notes embed the day's section with `![[Clock#<date>]]` instead of copying it.
- **A session that runs past midnight belongs wholly to the day it started**: from 22:10 to 00:53 the next morning, all 2h43 count for the first day and none for the next. Charts keep their 0–24h axis, draw the session up to 24:00, and label its real end as 00:53⁺¹.
  - After midnight and before you press Wake, last night's unfinished activity **still shows as running**: press it again to stop, another activity to switch, or End to finish.
  - So a forgotten End isn't billed as an all-nighter, a session is treated as forgotten — and not counted — once you press **Wake** in the morning or it would run past **8 hours**.

## The Time tab

**Metrics**, over the last 14 days:

| Metric | Meaning |
| --- | --- |
| **Golden hours used** | Share of your schedule's focus blocks actually spent on Research or Work |
| **Avg / day** | Average tracked time on days with any tracking |
| **Avg wake** | Average wake-up time |
| **Wake spread** | How much the wake-up time varies (standard deviation) |
| **Wake → start** | Average time from waking to the first activity |
| **Switches / day** | Average activity changes per day |
| **Social jetlag** | Difference between average weekend and weekday wake-up times |

A small sparkline under each shows the day-by-day trend.

- **Today** — a donut of today's activities, and a bar of plan against actual.
- **This week** — a calendar grid with each session drawn at its real start and end.
- **Where the time went** — time and share per activity for today, this week or this month.
- **Daily log** — the last 14 days, one row each: the shape of the day, wake time, span, time worked and break time. Click a day to open and fix that day's punches.

## Your schedule

Write a table in `Intake/Days/Rhythm.md` whose first column is the time range:

```markdown
| Time | Activity | Notes |
| --- | --- | --- |
| **08:30 - 11:30** | **Deep work: research** | most focused hours |
| **12:00 - 13:00** | Lunch | |
| **16:00 - 17:30** | Writing | |
```

- Blocks whose activity contains *deep work*, *focus* or *writing* (or 高强度, 深潜, 写作) are **focus blocks**, used for Golden hours.
- Blocks with *lunch*, *nap*, *sleep*, *rest* or *exercise* (or 午休, 睡, 放松, 运动, 午餐) are rest blocks.

## Dashboard heatmap

The heatmap at the top of the Dashboard shows this year's effort per day: 1 point for each task completed and 0.5 for each hour tracked, shaded in four levels. Click a cell to adjust its level by hand.

---

Docs: [Getting started](getting-started.md) · [Dashboard: capture and daily rhythm](dashboard.md) · [Projects](projects.md) · [Files](files.md) · [Literature for graduate students](literature.md) · [Reading](reading.md) · [English](english.md) · [Writing](writing.md) · **Time**
