[← OneDesk](../../README.zh-CN.md) · [English](../en/writing.md) · **中文**

# 写作

两条互不干扰的写作线：学术写作是练习，公开写作是产出。

![Writing](../screenshots/07-writing.webp)

## Research writing · 学术写作练习

从你读的论文里提炼这个领域的写作素材，每天练一张卡片。

**素材从哪来**：设置里「写作素材合集」指定的 Zotero 合集（含子合集）里所有论文的全文。提取三类内容：

- **术语**：领域词汇，例句按用法分组——首次引出、定义、为什么重要、指出不足、方法里、结果里。只有至少 4 个干净例句、覆盖至少 3 种用法的术语才会保留。
- **句式**：论文里反复出现的动作——指出研究空白、描述方法、报告结果、列出贡献、承认局限与展望。例句中起结构作用的词会加粗。
- **常用搭配**：如 superior performance、verify the effectiveness。

素材保存在 `Drills/Writing index.json`。Zotero 有变化时自动在电脑端重建，手机上也能直接用。填写「写作素材合集」之前，不会读取 Zotero。

**一周安排**：

| 一 | 二 | 三 | 四 | 五 | 六 | 日 |
| --- | --- | --- | --- | --- | --- | --- |
| 术语 | 术语 | 句式 | 术语 | 句式 | 回顾 | 休息 |

- **术语卡**：仿照某一种用法写一句自己的话；练过越多次，要求的用法越进阶。写完再展开例句对照。
- **句式卡**：仿照加粗的结构，给你的研究方向写一句，比如 gap、方法、结果、贡献或局限。
- **周六回顾**：挑本周练过的一张，**先不看例句**凭记忆重写。
- 想换一张，可以跳过或手动挑选。

**两篇可以手动编辑的笔记**：

- `Drills/Terms.md`：术语表。`## 在练` 下的术语会轮流出现；`## 不练` 下的不再出现在候选里。一行一个，写法 `- 全称 (缩写) · 中文`。页面上的候选术语点 **＋ 练** 即可加入。
- `Drills/Writing log.md`：你写过的句子，按天记录，如 `- 术语 · ablation study · 定义`，下一行缩进写句子。

## Public writing · 公开写作

- 文章放在 `Workstreams/Writing/Articles/`，用 frontmatter 标记进度：`status: idea`（想法）、`draft`（草稿）、`published`（已发布），以及 `created` 和 `published` 日期。
- 页面统计三个状态各有几篇，列出最近的文章。
- **＋ 新文章** 用 `Blueprints/Public Writing Template` 新建一篇 `日期 标题` 的笔记。

首页快速入口的 **Academic** 按钮会新建一篇学术写作练习笔记，放在 `Drills/Writing/`。

---

文档: [快速开始](getting-started.md) · [首页：随手记录与每日节奏](dashboard.md) · [项目](projects.md) · [文件](files.md) · [研究生文献管理](literature.md) · [阅读](reading.md) · [英语](english.md) · **写作** · [时间](time.md)
