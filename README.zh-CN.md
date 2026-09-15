# OneDesk

[English](README.md) · **中文**

一站式的 Obsidian 工作台，围绕研究生的一天设计。在一个视图里集中今天的任务、项目进展、打卡计时、文献笔记、写作练习和英语口语日课——所有内容都读写自 vault 里的普通 Markdown 笔记。

**做文献综述时**，OneDesk 能把一个 Zotero 合集整理成：研究缺口（Gap）合集、文献对比矩阵、标签合集，以及按主题分组的综述草稿。[看看怎么用 →](#研究生文献管理)

![OneDesk 首页](docs/screenshots/01-dashboard.webp)

## 功能

| 页面 | 作用 |
| --- | --- |
| **Dashboard** | 今日任务、添加任务到当天日记、项目看板、打卡、倒数日、等待清单与想做清单、快速入口、活跃度热力图 |
| **Files** | 三栏浏览 vault：文件夹、笔记列表、可直接编辑的预览 |
| **Projects** | 每个项目的下一步、已完成任务和生活日志合成一条时间线；另有全部项目的 7 天 / 30 天 / 全部时间线 |
| **Literature** | 把 Zotero 合集导入为每篇论文一篇笔记，并跨论文汇总研究缺口、对比矩阵、标签合集和综述草稿 |
| **Reading** | 读书笔记（`📌` 划线、`💭` 想法）的统计与最近想法 |
| **English** | 固定题型的口语日课（短问答 / 2 分钟独白 / 抽象展开），题目内容来自你当天做过的事，并积累表达 |
| **Writing** | 从文献中提取学术句式做练习；公开写作按 idea → draft → published 管理 |
| **Time** | 按活动打卡；今日环形图、本周日历、时间去向，以及与作息计划的对比 |

不用的页面可以在设置里关闭。

## 截图

所有截图使用插件自带的虚构示例笔记。

### Projects · 项目
每个项目的下一步、已完成任务和生活日志，以及所有项目合并的时间线。

![Projects](docs/screenshots/02-projects.webp)

### Files · 文件
浏览文件夹与最近修改的笔记，右侧预览可直接编辑。

![Files](docs/screenshots/03-files.webp)

### Literature · 文献
研究缺口、对比矩阵、标签合集与综述草稿，全部由你在 Zotero 里的划线生成。详见 [研究生文献管理](#研究生文献管理)。

![Literature · Gaps](docs/screenshots/04a-lit-gaps.webp)

### Reading · 阅读
书籍数、阅读时长、划线与最近的想法。

![Reading](docs/screenshots/05-reading.webp)

### English · 英语
根据你前一天做过的事生成今天的口语题，附一周计划、练习记录和积累的表达。

![English](docs/screenshots/06-english.webp)

### Writing · 写作
来自 Zotero 合集的学术写作练习，以及公开写作的进度。

![Writing](docs/screenshots/07-writing.webp)

### Time · 时间
作息指标、今日计划与实际对比、本周日历、时间去向，以及最近 14 天的记录。

![Time](docs/screenshots/08-time.webp)

## 需要

- Obsidian 1.4.10 或更高版本（电脑端或手机端）
- 安装并启用 [Dataview](https://github.com/blacksmithgu/obsidian-dataview) 插件。**不需要**开启「允许 JavaScript 查询」。

## 安装

### 用 BRAT 安装（推荐，自动更新）

1. 在第三方插件市场安装并启用 **BRAT**。
2. 运行命令 **BRAT: Add a beta plugin for testing**。
3. 填入 `https://github.com/L-WangLi/obsidian-onedesk`。
4. 在「设置 → 第三方插件」中启用 **OneDesk**。

### 手动安装

1. 从 [最新 Release](https://github.com/L-WangLi/obsidian-onedesk/releases/latest) 下载 `main.js`、`manifest.json`、`styles.css`。
2. 放到 `<你的 vault>/.obsidian/plugins/onedesk/`。
3. 重新加载 Obsidian，在「设置 → 第三方插件」中启用 **OneDesk**。

## 快速开始

1. 新建一个空 vault，装好 Dataview 和 OneDesk。
2. 在命令面板运行 **OneDesk: 创建示例笔记**。
3. OneDesk 会显示一周虚构的项目、任务、打卡、读书和文献记录，每个页面都有内容。

示例里的 `OneDesk 示例说明.md` 说明了哪篇笔记对应哪张卡片。看懂之后删掉示例，换成你自己的笔记即可。

## 笔记约定

OneDesk 没有数据库，每张卡片都是普通笔记的视图。约定如下（文件夹名是默认值，可以修改）：

| 内容 | 位置 | 格式 |
| --- | --- | --- |
| 项目 | `Workstreams/<项目>/Overview.md` | frontmatter：`type: project`、`project_id`、`note_label`、`area`、`status` |
| 任务 | 日记 `Intake/Days/` | `- [ ] 内容 #Academic [when:: 2026-01-15] [project:: thesis]` |
| 生活日志 | `Intake/Log/2026-01-15 life log.md` | `- 09:30 · 内容`；带上项目概览的链接，就会进入该项目时间线 |
| 打卡 | `Console/Clock.md` | `## 2026-01-15` 下写 `- 08:30 in research`、`- 11:50 break` |
| 倒数日 | `Console/Dates.md` | `- 2026-02-01 · 名称` |
| 等待 / 想做 | `Intake/Pending.md`、`Scratch/Later.md` | `- [ ] 2026-01-15 · 内容` |
| 作息计划 | `Intake/Days/Rhythm.md` | 表格：`\| 08:30 - 11:30 \| 深度工作 \| … \|` |
| 读书笔记 | `Shelf/` | `> 📌 划线`、`- 💭 想法`、`- ⏱ 2026-01-15 21:30` |
| 文献 | `Sources/Reading/Zotero/` | frontmatter `type: paper`（由 Zotero 同步生成） |
| 模板 | `Blueprints/` | `Daily Note Template`、`Life Log Template` 等 |

如果启用了核心「日记」插件，日记的位置和日期格式以它的设置为准。

## 研究生文献管理

写学位论文要读几十篇文献，真正要回答的问题都是跨论文的：*别人指出过哪些研究缺口？各篇的方法和数据集怎么比？关于某个主题大家都说了什么？怎么把这些写成 related work？*

OneDesk 用你本来就会在 Zotero 里做的划线来回答这些问题：划线留在 Zotero，汇总和写作放在 Obsidian。

### 使用流程

1. **在 Zotero 里读和划线。**给指出问题的句子打 `gap` 标签，方法打 `method`，数据打 `dataset`，主要结论打 `result`；也可以加任何其他标签（`limitation`、`future work`、`baseline`……）。自己的想法写在批注评论里。
2. **同步。**在文献页点 **Sync Zotero**：每篇论文生成一篇笔记，下面四个合集也会一起重建。
3. **每篇写一段话。**在论文笔记的 `## 综述段落` 下，写你在 related work 里会怎么介绍它；在 frontmatter 里填主题，如 `topics: [图神经网络, 小样本学习]`。
4. **用合集。**Gap 合集用来提炼研究问题、写开题报告；矩阵用来比较方法；标签合集用来查看某个主题下的所有观点；综述草稿就是文献综述的初稿。

### 四个合集

**Gap 合集**：所有标为 gap 的句子，按论文汇总、新论文在前，附译文、你的批注、页码和跳回 PDF 的链接。已读但还没标 gap 的论文列在下方，避免遗漏。`gap`、`research gap`、`问题`、`研究缺口` 都算同一个标签。

![Gaps](docs/screenshots/04a-lit-gaps.webp)

**文献对比矩阵**：每篇论文一行，并排比较想解决的问题、方法、数据集和结果，内容来自每篇笔记的「速览」表。可以按任意关键词筛选，比如数据集名称或年份；你在笔记表格里手填的内容也会显示在这里。

![Matrix](docs/screenshots/04b-lit-matrix.webp)

**标签合集**：整个合集的划线按标签归组，显示每个标签有多少条划线、涉及几篇论文；同义标签自动合并。

![Tags](docs/screenshots/04c-lit-tags.webp)

**综述草稿**：你写过的所有「综述段落」，按 `topics` 分组，组内按论文年份从早到晚排列，每段末尾附（作者, 年份）引用。**Copy all** 会把带主题标题的整份草稿复制到剪贴板；已读但还没写的论文列在下方。

![Synthesis](docs/screenshots/04d-lit-synthesis.webp)

### 合集会生成普通笔记

每次同步，或点文献页的 **更新合集**，四个合集都会写成 `Sources/Reading/` 下的普通笔记：`Gap 合集`、`文献矩阵`、`标签合集`、`综述草稿`。可以搜索、在开题报告里链接、在手机上查看，也会像普通笔记一样同步。

每篇顶部都有 **我的整理** 区域，用来写你自己的归纳。`%% OneDesk … %%` 这一行以上的内容属于你，永远不会被改写；每次只重新生成这一行以下的部分。

![Gap 合集笔记](docs/screenshots/04e-gap-note.webp)

合集只在同步或点按钮时重建，打开页面不会自动改写文件，所以多台设备同步同一个 vault 时不会互相冲突。

### 标签同义词

在「设置 → OneDesk → 标签同义词」里，把多种写法合并成一个标签，每行一组：

```text
gap: limitation of prior work, 局限
baseline: baselines, 对比方法
```

这些会追加到内置的 `gap`、`method`、`dataset`、`result` 同义词里。

### 设置 Zotero 同步（电脑端）

1. 使用 Zotero 6 或 7，数据目录保持默认的 `~/Zotero`。
2. 确认装有 `sqlite3` 命令行工具：macOS 自带；Linux 用包管理器安装；暂不支持 Windows。
3. 把论文放进一个合集，在「设置 → OneDesk → Zotero 合集」里填写它的**完整名称**（不含子合集）。
4. 点 **Sync Zotero**。

OneDesk 读取的是 Zotero 数据库的临时副本，Zotero 可以保持打开；不会往 Zotero 写任何东西。所有视图和合集在手机上都能基于已同步的笔记使用。

### 论文笔记包含什么

每篇论文一篇笔记，放在 `Sources/Reading/Zotero/`，以标题命名。frontmatter 包括 `title`、`authors`、`year`、`venue`、`doi`、`zotero_key`、`status`（`unread`、`read`，划线达到 20 条为 `deep`）、`highlights` 与 `figures` 数量、`last_read`、`sessions`（每个做过批注的日子一行）和 `topics`。

| 部分 | 内容 |
| --- | --- |
| 标题行 | 作者 · 年份 · 来源，附「在 Zotero 中打开」和 DOI 链接 |
| **速览** | 想解决的问题、方法、数据集、结果，取自带对应标签的划线；手填的行会保留，直到有带标签的划线填上它 |
| **图表** | 你在 PDF 里框选的图表，复制到 `_figures/<zotero key>/`，从 PDF 正文取图注，按方法、实验设置、结果分组 |
| **我划的句子** | 按论文自身章节（摘要、引言、方法、结果……）归组，每条有标签、页码和跳回 PDF 的链接；便签按位置插在其间 |
| 素材 | 折叠的列表：gap 与方法句子，以及你写过的所有内容 |
| **综述段落**、**我的话** | 属于你 |

- 16 个字符以内、且不含逗号、句号、分号的标签视为分类标签；在标签框里输入的更长句子会被当作笔记，和批注评论里的话一起显示为 **我：**。评论里 `🔤` 标记之间的内容显示为浅色译文。
- **你写的内容永远不会被覆盖**：每次同步，从 `## 综述段落` 到文末原样保留。笔记通过 `zotero_key` 对应论文，Zotero 里改标题不会丢失内容。
- `Sources/Reading/Thoughts.md` 汇总你在 Zotero 里写的便签、批注评论和子笔记，排除不是你写的笔记（阅读时长数据、arXiv 备注、TL;DR、只重复划线的笔记）。
- 图表处提示「Zotero 还没渲染这张图」时，在 Zotero 里点开一次该批注再同步。

### 文献页的全部视图

| 视图 | 内容 |
| --- | --- |
| **Papers** | 状态（New / Read / Deep）、作者、年份、来源、划线数、最近阅读 |
| **Gaps** | Gap 合集 |
| **Matrix** | 文献对比矩阵，可筛选 |
| **Tags** | 标签合集 |
| **Synthesis** | 按主题分组的综述草稿，可一键复制 |
| **Timeline** | 每天读了哪篇、划了多少 |
| **Notes** | `Thoughts.md` 的内容 |

其他页面也用这些笔记：长难句那天，**English** 用你划过、带译文的英文句子出题；**Writing** 从「写作素材合集」指定合集的论文全文里提取学术句式。

## 设置

- **称呼、启动时打开**
- **模块**：隐藏不用的页面
- **文件夹**：修改任意默认位置。改上级文件夹（如「收件箱」）时，由它推导出的位置会一起变。
- **项目看板（高级）**：默认显示所有未归档、未完成的项目。需要固定顺序、颜色或别名时填写 JSON，示例见英文 README。

### 多设备同步设置

很多同步工具不会同步插件自己的 `data.json`。在设置里点 **创建配置文件**，设置会保存为 vault 里的 `onedesk.json`，像普通笔记一样同步；在一台设备上修改，其他设备会自动读取。

## 仅电脑端可用的部分

- 文献页的 **Zotero 同步** 通过 `sqlite3` 命令行工具读取 Zotero 数据库，会在 `/usr/bin`、`/opt/homebrew/bin`、`/usr/local/bin` 中查找（macOS、Linux）。同步生成的笔记和文献页的所有视图在任何设备上都能使用。
- 写作页的 **Research writing** 从设置中「写作素材合集」指定的 Zotero 合集提取术语与句式。填写之前不会读取 Zotero；素材建立后手机端也能使用。
- 文献页的所有视图和合集笔记在所有设备上都能使用。
- 其他功能在手机端都可以使用。

## 开发

没有任何依赖，构建只是一个 Node 脚本：

```bash
npm run build                                               # 生成 main.js
npm run dev -- "/path/to/vault/.obsidian/plugins/onedesk"   # 修改后自动构建到指定 vault
npm run example                                             # 生成装好插件的 example-vault/
npm test
```

发布：修改 `manifest.json` 与 `versions.json` 中的版本号，推送同名 tag，GitHub Actions 会自动构建、测试，并把 `main.js`、`manifest.json`、`styles.css` 附到 Release。

## 许可证

[MIT](LICENSE)
