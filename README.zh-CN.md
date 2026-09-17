# OneDesk

[English](README.md) · **中文**

一站式的 Obsidian 工作台，围绕研究生的一天设计：任务与随手的念头、项目、文献、时间、写作和英语练习，都在一个视图里。所有内容都读写自 vault 里的普通 Markdown 笔记。

![OneDesk 首页](docs/screenshots/01-dashboard.webp)

## 有什么

- **首页**：今日任务；一个输入框，念头打断你时一键记下问题或「以后想做」的事；日记、碎碎念、复盘的快速入口；打卡和倒数日。[详细介绍 →](docs/zh-CN/dashboard.md)
- **文献**：把 Zotero 合集整理成研究缺口（Gap）合集、文献对比矩阵、标签合集和按主题分组的综述草稿。[详细介绍 →](docs/zh-CN/literature.md)
- **项目**：每个项目的下一步和进展时间线，以及所有项目合并的总时间线。[详细介绍 →](docs/zh-CN/projects.md)
- **时间**：一键打卡，计划与实际对比，黄金时段利用率等作息指标。[详细介绍 →](docs/zh-CN/time.md)
- **写作**：从你读的论文里提炼术语和句式，每天练一张卡片；公开写作的进度管理。[详细介绍 →](docs/zh-CN/writing.md)
- **英语**：用你昨天做过的事出题的每日口语练习。[详细介绍 →](docs/zh-CN/english.md)
- **阅读**：读书笔记的统计和最近的想法。[详细介绍 →](docs/zh-CN/reading.md)
- **文件**：三栏浏览、预览和编辑整个 vault。[详细介绍 →](docs/zh-CN/files.md)

<table>
  <tr>
    <td width="50%"><a href="docs/zh-CN/literature.md"><img src="docs/screenshots/04a-lit-gaps.webp" alt="Gap 合集"></a><br><sub>研究缺口（Gap）合集</sub></td>
    <td width="50%"><a href="docs/zh-CN/literature.md"><img src="docs/screenshots/04b-lit-matrix.webp" alt="文献对比矩阵"></a><br><sub>文献对比矩阵</sub></td>
  </tr>
  <tr>
    <td width="50%"><a href="docs/zh-CN/projects.md"><img src="docs/screenshots/02-projects.webp" alt="项目时间线"></a><br><sub>项目时间线</sub></td>
    <td width="50%"><a href="docs/zh-CN/time.md"><img src="docs/screenshots/08-time.webp" alt="时间与作息"></a><br><sub>时间与作息</sub></td>
  </tr>
</table>

## 安装

OneDesk 需要 [Dataview](https://github.com/blacksmithgu/obsidian-dataview) 插件（不需要开启「允许 JavaScript 查询」）。

**用 BRAT 安装**（自动更新）：在第三方插件市场安装 **BRAT**，运行命令「BRAT: Add a beta plugin for testing」，填入 `https://github.com/L-WangLi/obsidian-onedesk`，然后启用 **OneDesk**。

**手动安装**：从 [最新 Release](https://github.com/L-WangLi/obsidian-onedesk/releases/latest) 下载 `main.js`、`manifest.json`、`styles.css`，放进 `<vault>/.obsidian/plugins/onedesk/`，然后启用 **OneDesk**。

## 一分钟试用

1. 新建一个空 vault，装好 Dataview 和 OneDesk。
2. 在命令面板运行 **OneDesk: 创建示例笔记**。
3. 每个页面都会出现一周虚构的任务、项目、打卡、论文和读书记录。

## 文档

| | |
| --- | --- |
| [快速开始](docs/zh-CN/getting-started.md) | 安装、示例笔记、文件夹约定、设置、多设备同步 |
| [首页](docs/zh-CN/dashboard.md) | 为什么随手记录能帮你专注；今日任务、随手捕获、问题、快速入口、日记、碎碎念、复盘 |
| [文献](docs/zh-CN/literature.md) | 研究生文献管理：Gap 合集、对比矩阵、标签合集、综述草稿、Zotero 同步 |
| [项目](docs/zh-CN/projects.md) · [文件](docs/zh-CN/files.md) | 项目笔记与时间线；vault 浏览器 |
| [时间](docs/zh-CN/time.md) · [写作](docs/zh-CN/writing.md) · [英语](docs/zh-CN/english.md) · [阅读](docs/zh-CN/reading.md) | 打卡与作息；写作练习；口语日课；读书笔记 |

## 笔记始终属于你

OneDesk 没有数据库。每张卡片都是普通 Markdown 笔记的视图，它写下的内容和 vault 里其他笔记一样，可以阅读、修改、搜索和同步。电脑端和手机端都能用，手机上是单栏排版；只有 Zotero 同步这一步需要电脑端。

## 开发

没有任何依赖，构建只是一个 Node 脚本：

```bash
npm run build                                               # 生成 main.js
npm run dev -- "/path/to/vault/.obsidian/plugins/onedesk"   # 修改后自动构建到指定 vault
npm run example                                             # 生成装好插件的 example-vault/
npm test
```

源码在 `src/`。发布时修改 `manifest.json` 与 `versions.json` 中的版本号，推送同名 tag，GitHub Actions 会自动构建、测试并发布。

## 许可证

[MIT](LICENSE)
