[← OneDesk](../../README.zh-CN.md) · [English](../en/getting-started.md) · **中文**

# 快速开始

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

## 试用示例笔记

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
- **文献**：标签同义词，详见 [研究生文献管理](literature.md#标签同义词)。
- **项目看板（高级）**：默认显示所有未归档、未完成的项目；需要固定顺序、颜色或别名时填写 JSON，详见 [项目](projects.md#看板设置可选)。

### 多设备同步设置

很多同步工具不会同步插件自己的 `data.json`。在设置里点 **创建配置文件**，设置会保存为 vault 里的 `onedesk.json`，像普通笔记一样同步；在一台设备上修改，其他设备会自动读取。

## 仅电脑端可用的部分

- 文献页的 **Zotero 同步** 通过 `sqlite3` 命令行工具读取 Zotero 数据库，会在 `/usr/bin`、`/opt/homebrew/bin`、`/usr/local/bin` 中查找（macOS、Linux）。同步生成的笔记和文献页的所有视图在任何设备上都能使用。
- 写作页的 **Research writing** 从设置中「写作素材合集」指定的 Zotero 合集提取术语与句式。填写之前不会读取 Zotero；素材建立后手机端也能使用。
- 文献页的所有视图和合集笔记在所有设备上都能使用。
- 其他功能在手机端都可以使用。

---

文档: **快速开始** · [首页：随手记录与每日节奏](dashboard.md) · [项目](projects.md) · [文件](files.md) · [研究生文献管理](literature.md) · [阅读](reading.md) · [英语](english.md) · [写作](writing.md) · [时间](time.md)
