# OneDesk

[English](README.md) · **中文**

一站式的 Obsidian 工作台。在一个视图里集中今天的任务、项目进展、打卡计时、读书与文献笔记、写作练习和英语口语日课——所有内容都读写自 vault 里的普通 Markdown 笔记。

## 功能

| 页面 | 作用 |
| --- | --- |
| **Dashboard** | 今日任务、添加任务到当天日记、项目看板、打卡、倒数日、等待清单与想做清单、快速入口、活跃度热力图 |
| **Files** | 三栏浏览 vault：文件夹、笔记列表、可直接编辑的预览 |
| **Projects** | 每个项目的下一步、已完成任务和生活日志合成一条时间线；另有全部项目的 7 天 / 30 天 / 全部时间线 |
| **Literature** | 把 Zotero 合集导入为每篇论文一篇笔记，划线自动归到论文自己的章节下（仅电脑端，见下文） |
| **Reading** | 读书笔记（`📌` 划线、`💭` 想法）的统计与最近想法 |
| **English** | 固定题型的口语日课（短问答 / 2 分钟独白 / 抽象展开），题目内容来自你当天做过的事，并积累表达 |
| **Writing** | 从文献中提取学术句式做练习；公开写作按 idea → draft → published 管理 |
| **Time** | 按活动打卡；今日环形图、本周日历、时间去向，以及与作息计划的对比 |

不用的页面可以在设置里关闭。

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

## 设置

- **称呼、启动时打开**
- **模块**：隐藏不用的页面
- **文件夹**：修改任意默认位置。改上级文件夹（如「收件箱」）时，由它推导出的位置会一起变。
- **项目看板（高级）**：默认显示所有未归档、未完成的项目。需要固定顺序、颜色或别名时填写 JSON，示例见英文 README。

### 多设备同步设置

很多同步工具不会同步插件自己的 `data.json`。在设置里点 **创建配置文件**，设置会保存为 vault 里的 `onedesk.json`，像普通笔记一样同步；在一台设备上修改，其他设备会自动读取。

## 仅电脑端可用的部分

- 文献页的 **Zotero 同步** 通过 `sqlite3` 命令行工具读取 Zotero 数据库，会在 `/usr/bin`、`/opt/homebrew/bin`、`/usr/local/bin` 中查找（macOS、Linux）。生成的笔记在任何设备上都能查看。
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
