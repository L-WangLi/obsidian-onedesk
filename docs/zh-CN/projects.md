[← OneDesk](../../README.zh-CN.md) · [English](../en/projects.md) · **中文**

# 项目

每个项目的下一步、已完成的任务和执行记录，汇成一条时间线；另有一条合并所有项目的总时间线。

![Projects](../screenshots/02-projects.webp)

## 项目笔记

一个项目就是 `Workstreams/` 下的一个文件夹，里面有一篇概览笔记（默认叫 `Overview.md`），frontmatter 至少包含：

```yaml
---
type: project
project_id: thesis        # 唯一，任务和生活日志靠它关联
note_label: Thesis        # 卡片上显示的短名称（可选）
project_name: 毕业论文     # 完整名称（可选）
area: Academic            # 这个项目任务的默认领域：Academic / Work / Learning / Reflection
status: active            # active、waiting、planned……
---
```

- `status` 为 `archived`、`done`、`completed`、`dropped` 或 `cancelled` 的项目不会出现在看板上。
- **项目可以嵌套**：比如一个课题文件夹下有三篇论文，每篇有自己的概览笔记和 `project_id`，它们就是三个独立的项目。

## 什么会进入项目

- **任务**：日记里带 `[project:: thesis]` 的任务。未完成的是「下一步」，完成的会带着完成时间进入时间线。
- **执行记录**：生活日志里链接了项目概览笔记的行，比如 `- 16:10 · 写完实验设置小节 [[Workstreams/Thesis/Overview|Thesis]]`。
- **详情笔记**：从任务上新建的详情笔记放在项目的 `Detail/` 文件夹，文件名为 `日期 · 任务名`；不属于项目的任务放在 `Workstreams/Shared/`。

## 项目页

- **左栏**：所有进行中的项目，显示状态、下一步数量和最近活动日期。
- **右栏**：选中项目的
  - **下一步**：未完成的项目任务，可以勾选、改期、编辑；
  - **输入框**：**Add task** 把任务加进今天的日记并关联项目；**Log progress** 在今天的生活日志里追加一行带时间、带项目链接的执行记录；
  - **时间线**：按天分组，每条是「完成任务」或「执行记录」，可以打开来源、新建或打开详情笔记、加备注、删除。
- 窄屏或手机上，项目列表会变成顶部的横向选择条。

## 全部项目时间线

项目页下方合并所有项目的进展：

- 可切换**最近 7 天 / 30 天 / 全部**，选择会被记住；
- 顶部显示所选时段的项目数、进展记录数、完成任务数和执行记录数；
- 每条记录带项目颜色和时间，可跳回来源笔记。

首页的 **Project activity** 卡片显示所有项目最近一天的动态，点 **Full timeline** 进入项目页。

## 看板设置（可选）

默认情况下，看板按名称显示所有未归档、未完成的项目，不需要配置。想固定顺序、指定颜色、使用短名称，或让旧的 `project_id` 继续生效，在「设置 → OneDesk → 项目看板」里填 JSON：

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

文档: [快速开始](getting-started.md) · [首页：随手记录与每日节奏](dashboard.md) · **项目** · [文件](files.md) · [研究生文献管理](literature.md) · [阅读](reading.md) · [英语](english.md) · [写作](writing.md) · [时间](time.md)
