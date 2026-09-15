// ── Sample vault ── fictional notes laid out in the default folders, so a fresh vault shows
// every tab working without touching settings. Dates are relative to `now`. The same
// function writes notes from the "create sample notes" command and builds example-vault/.
function onedeskSampleFiles(now) {
  const pad = n => String(n).padStart(2, "0");
  const day = offset => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const T = day(0);
  const files = {};
  const add = (path, lines) => { files[path] = lines.join("\n") + "\n"; };

  const THESIS = "Workstreams/Thesis/Overview";
  const APP = "Workstreams/Side App/Overview";

  // ── start here ──
  add("OneDesk 示例说明.md", [
    "# OneDesk 示例说明",
    "",
    "这些笔记全部是虚构的，用来演示 OneDesk 各个页面读取的格式。",
    "",
    "- **项目**：`Workstreams/<项目>/Overview.md`，frontmatter 带 `type: project` 和 `project_id`",
    "- **任务**：写在日记 `Intake/Days/` 里，形如 `- [ ] 内容 #Academic [when:: 日期] [project:: thesis]`",
    "- **生活日志**：`Intake/Log/日期 life log.md`，每行 `- HH:mm · 内容`，带上项目链接就会进入项目时间线",
    "- **打卡**：`Console/Clock.md`，由首页打卡按钮写入",
    "- **倒数日**：`Console/Dates.md`；**等待清单**：`Intake/Pending.md`；**想做清单**：`Scratch/Later.md`",
    "- **阅读**：`Shelf/` 中的读书笔记（📌 划线、💭 想法）",
    "- **文献**：`Sources/Reading/Zotero/`，frontmatter 带 `type: paper`",
    "- **英语 / 写作练习**：`Drills/`；**公开写作**：`Workstreams/Writing/Articles/`",
    "",
    "看完可以整批删除，换成你自己的笔记。",
  ]);

  // ── templates ──
  add("Blueprints/Daily Note Template.md", [
    "---",
    'date: "{{date:YYYY-MM-DD}}"',
    "type: journal",
    'life_log: "[[{{date:YYYY-MM-DD}} life log]]"',
    "---",
    "",
    "# Daily Note · {{date:YYYY-MM-DD}}",
    "",
    "## ⏱ 今日时间",
    "",
    "![[Clock#{{date:YYYY-MM-DD}}]]",
    "",
    "## 🧡 Health & Life",
    "",
    "## 🎓 Academic",
    "",
    "## 💼 Work",
    "",
    "## 📚 Learning",
    "",
    "## 🪞 Reflection",
    "",
    "## ❓ Questions",
  ]);
  add("Blueprints/Life Log Template.md", [
    "---",
    "date: {{date:YYYY-MM-DD}}",
    "type: life_log",
    "---",
    "",
    "# Life Log · {{date:YYYY-MM-DD}}",
    "",
    "- {{time:HH:mm}} · ",
  ]);
  add("Blueprints/Paper Reading Template.md", [
    "---",
    "type: paper-reading",
    "title: \"{{Paper Title}}\"",
    "year: {{Year}}",
    "---",
    "",
    "# {{Paper Title}}",
    "",
    "## 问题",
    "",
    "## 方法",
    "",
    "## 结果",
    "",
    "## 我的想法",
  ]);
  add("Blueprints/Academic Writing Practice Template.md", [
    "---",
    "type: writing-practice",
    "created: {{Date}}",
    "---",
    "",
    "# {{Title}}",
    "",
    "## 今天模仿的句式",
    "",
    "## 我写的句子",
  ]);
  add("Blueprints/Public Writing Template.md", [
    "---",
    "status: idea",
    "created: {{Date}}",
    "published:",
    "---",
    "",
    "# {{Title}}",
    "",
  ]);
  add("Blueprints/Speech Practice Template.md", [
    "---",
    "type: speech-practice",
    "created: {{Date}}",
    "---",
    "",
    "# {{Title}}",
    "",
    "## 第一遍（不改）",
    "",
    "## 纠错后",
    "",
    "## 值得带走的表达",
  ]);

  // ── projects ──
  add("Workstreams/Index.md", [
    "# Project Index",
    "",
    `- [[${THESIS}|Thesis · 毕业论文]]`,
    `- [[${APP}|Side App · 记账小应用]]`,
  ]);
  add(`${THESIS}.md`, [
    "---",
    "type: project",
    "project_id: thesis",
    "project_name: 毕业论文",
    "note_label: Thesis",
    "area: Academic",
    "status: active",
    `start: ${day(-40)}`,
    "---",
    "",
    "# 毕业论文",
    "",
    "> 示例项目。任务写在日记里并带 `[project:: thesis]`，生活日志里链接到这篇笔记的行会出现在项目时间线上。",
    "",
    "## 当前目标",
    "",
    "- 完成第三章方法部分初稿",
    "- 整理两组对比实验",
  ]);
  add(`${APP}.md`, [
    "---",
    "type: project",
    "project_id: side-app",
    "project_name: 记账小应用",
    "note_label: Side App",
    "area: Work",
    "status: active",
    `start: ${day(-20)}`,
    "---",
    "",
    "# 记账小应用",
    "",
    "> 示例项目：一个周末做的小工具。",
    "",
    "## 当前目标",
    "",
    "- 上线第一个可用版本",
  ]);
  add("Workstreams/Writing/Overview.md", [
    "---",
    "type: writing-hub",
    "---",
    "",
    "# 写作",
    "",
    "公开写作放在 `Articles/`，用 frontmatter 的 `status`（idea / draft / published）表示进度。",
  ]);

  // ── daily notes with tasks ──
  const task = (done, text, area, when, extra, doneAt) => {
    let line = `- [${done ? "x" : " "}] ${text} #${area} [when:: ${when}]${extra ? " " + extra : ""}`;
    if (done) line += ` [completed_at:: ${doneAt}] ✅ ${doneAt.slice(0, 10)}`;
    return line;
  };
  const dailyTasks = {
    "-6": { Academic: [task(true, "读两篇相关论文并记要点", "Academic", day(-6), "[project:: thesis]", `${day(-6)} 11:20`)],
      Learning: [task(true, "学习 Dataview 基础查询", "Learning", day(-6), "", `${day(-6)} 21:05`)] },
    "-5": { Work: [task(true, "搭好应用的项目脚手架", "Work", day(-5), "[project:: side-app]", `${day(-5)} 16:40`)],
      Reflection: [task(true, "写十分钟日记", "Reflection", day(-5), "", `${day(-5)} 22:10`)] },
    "-4": { Academic: [task(true, "跑通数据预处理脚本", "Academic", day(-4), "[project:: thesis]", `${day(-4)} 10:15`),
      task(true, "和导师约定下周组会内容", "Academic", day(-4), "[project:: thesis]", `${day(-4)} 15:00`)] },
    "-3": { Work: [task(true, "完成记账页面的表单", "Work", day(-3), "[project:: side-app]", `${day(-3)} 17:30`)],
      Learning: [task(true, "读完《示例书》第二章", "Learning", day(-3), "", `${day(-3)} 21:40`)] },
    "-2": { Academic: [task(true, "画出方法部分的流程图", "Academic", day(-2), "[project:: thesis]", `${day(-2)} 11:50`)],
      Reflection: [task(true, "整理本周想做清单", "Reflection", day(-2), "", `${day(-2)} 20:30`)] },
    "-1": { Academic: [task(true, "写完实验设置小节", "Academic", day(-1), "[project:: thesis]", `${day(-1)} 16:10`)],
      Work: [task(true, "修复手机上的布局问题", "Work", day(-1), "[project:: side-app]", `${day(-1)} 19:25`)],
      Learning: [task(false, "整理英语日课里的表达", "Learning", day(-1), "")] },
    "0": { Academic: [task(false, "写第三章方法部分初稿", "Academic", T, "[project:: thesis]")],
      Work: [task(false, "给应用加上导出 CSV", "Work", T, "[project:: side-app]")],
      Learning: [task(false, "读完《示例书》第三章", "Learning", T, "")],
      Reflection: [task(false, "写本周复盘", "Reflection", T, "")] },
  };
  for (const [offset, sections] of Object.entries(dailyTasks)) {
    const d = day(Number(offset));
    const lines = ["---", `date: ${d}`, "type: journal", `life_log: "[[${d} life log]]"`, "---", "",
      `# Daily Note · ${d}`, "", "## ⏱ 今日时间", "", `![[Clock#${d}]]`, "", "## 🧡 Health & Life", ""];
    for (const area of ["Academic", "Work", "Learning", "Reflection"]) {
      lines.push(`## ${{ Academic: "🎓", Work: "💼", Learning: "📚", Reflection: "🪞" }[area]} ${area}`);
      lines.push(...(sections[area] || []), "");
    }
    lines.push("## ❓ Questions");
    add(`Intake/Days/${d}.md`, lines);
  }

  // ── life logs ──
  const logs = {
    "-4": ["08:05 · 早起散步二十分钟，头脑很清醒", `10:15 · 数据预处理脚本终于跑通了 [[${THESIS}|Thesis]]`, "21:30 · 晚上读书一小时"],
    "-3": [`14:20 · 表单校验逻辑比想象的复杂，先做最简单的版本 [[${APP}|Side App]]`, "22:00 · 今天有点累，早点睡"],
    "-2": [`11:50 · 流程图画完，思路清楚多了 [[${THESIS}|Thesis]]`, "18:30 · 跑步 5 公里"],
    "-1": [`16:10 · 实验设置小节写完，下一步是方法部分 [[${THESIS}|Thesis]]`, `19:25 · 手机布局问题原来是一个 CSS 单位写错了 [[${APP}|Side App]]`],
  };
  for (const [offset, entries] of Object.entries(logs)) {
    const d = day(Number(offset));
    add(`Intake/Log/${d} life log.md`, ["---", `date: ${d}`, "type: life_log", "---", "", `# Life Log · ${d}`, "",
      ...entries.map(e => `- ${e}`)]);
  }

  add(`Intake/Review daily/${day(-1)} 复盘.md`, [
    `# ${day(-1)} 复盘`,
    "",
    "- **做成了**：实验设置小节写完；应用布局问题修好",
    "- **没做成**：英语表达没整理",
    "- **明天最重要的一件事**：方法部分初稿",
  ]);

  // ── time ──
  const clock = ["# Clock", "", "> 由 OneDesk 首页的打卡按钮写入。每天一个小节，最新的在最上面。", ""];
  const punches = {
    "-1": ["07:20 wake", "08:30 in research", "11:50 break", "13:40 in research", "16:10 in work", "19:30 break", "20:30 in learning", "21:30 break"],
    "-2": ["07:45 wake", "09:00 in research", "12:00 break", "14:00 in social", "15:30 break", "16:00 in learning", "17:30 break"],
    "-3": ["07:10 wake", "08:20 in learning", "09:10 in work", "12:10 break", "13:30 in work", "17:30 break", "21:00 in learning", "21:40 break"],
    "-4": ["06:50 wake", "08:30 in research", "11:30 break", "14:00 in research", "15:00 in social", "16:00 break"],
    "-5": ["07:30 wake", "09:00 in work", "12:00 break", "13:00 in work", "16:40 break", "21:00 in learning", "22:00 break"],
    "-6": ["08:00 wake", "09:30 in research", "11:20 break", "14:00 in learning", "15:30 break", "20:00 in learning", "21:05 break"],
  };
  for (const offset of ["-1", "-2", "-3", "-4", "-5", "-6"]) {
    clock.push(`## ${day(Number(offset))}`, "", ...punches[offset].map(p => `- ${p}`), "");
  }
  add("Console/Clock.md", clock);
  add("Console/Dates.md", ["# Dates", "", `- ${day(21)} · 论文中期检查`, `- ${day(6)} · 应用第一版上线`, `- ${day(-60)} · 开始用 OneDesk`]);

  add("Intake/Days/Rhythm.md", [
    "# 作息计划",
    "",
    "| 时段 | 活动 | 说明 |",
    "| --- | --- | --- |",
    "| **07:00 - 07:30** | 起床 + 洗漱 | 固定起床时间 |",
    "| **07:30 - 08:00** | 户外散步 | 晒太阳，醒脑 |",
    "| **08:00 - 08:30** | 早餐 | 不看手机 |",
    "| **08:30 - 11:30** | **深潜：高强度科研** | 最专注的时段，不回消息 |",
    "| **12:00 - 13:00** | 午餐 | |",
    "| **13:00 - 13:30** | 午休 | |",
    "| **13:30 - 16:00** | 琐碎事务 | 邮件、整理、杂事 |",
    "| **16:00 - 17:30** | **高强度工作 / 写作** | |",
    "| **17:30 - 18:30** | 运动 | 跑步或健身 |",
    "| **19:00 - 21:00** | 放松与交流 | |",
    "| **21:00 - 22:30** | 阅读 | |",
    "| **23:00 - 23:30** | 入睡 | |",
  ]);

  // ── capture lists ──
  add("Intake/Pending.md", [
    "# Pending",
    "",
    "> 等待他人回复、交付或外部事件。",
    "",
    `- [ ] ${day(-3)} · 等导师对第二章的反馈`,
    `  - ✍️ ${day(-1)} 10:00 · 发邮件提醒了一次，说这周内回复`,
    `- [ ] ${day(-2)} · 等朋友试用应用后的意见`,
    `- [x] ${day(-9)} · 等实验室服务器账号开通 ✅ ${day(-6)} 14:20`,
  ]);
  add("Scratch/Later.md", [
    "# Later",
    "",
    "> 临时想做、想看或想学的事。",
    "",
    `- [ ] ${day(-6)} · 学一下 Obsidian Canvas`,
    `- [ ] ${day(-2)} · 周末去看一个展`,
    `- [x] ${day(-10)} · 换一把更舒服的椅子 ✅ ${day(-4)} 19:00`,
  ]);

  // ── reading ──
  add("Shelf/示例书：把想法写下来.md", [
    "---",
    "doc_type: book-notes",
    "author: 示例作者",
    "progress: 62",
    "readingTime: 5小时20分钟",
    `readingDate: ${day(-30)}`,
    "---",
    "# 元数据",
    "> - 书名： 示例书：把想法写下来",
    "> - 作者： 示例作者",
    "> - 分类： 个人成长-学习方法",
    "",
    "# 高亮划线",
    "",
    "## 第一章",
    "",
    "> 📌 写下来的想法才会被第二次思考。",
    `> ⏱ ${day(-12)} 21:10:05`,
    "",
    "## 第二章",
    "",
    "> 📌 笔记的价值不在于记了多少，而在于之后被用了多少次。",
    "- 💭 所以要让笔记容易被找到，而不是记得更全",
    `- ⏱ ${day(-3)} 21:35:40`,
    "",
    "> 📌 每天留十分钟整理，比周末花两小时更有效。",
    `> ⏱ ${day(-3)} 21:38:12`,
  ]);
  add("Shelf/示例书：专注的节奏.md", [
    "---",
    "doc_type: book-notes",
    "author: 示例作者",
    "progress: 100",
    "readingTime: 3小时5分钟",
    `readingDate: ${day(-50)}`,
    "---",
    "# 元数据",
    "> - 书名： 示例书：专注的节奏",
    "> - 分类： 个人成长-时间管理",
    "",
    "# 高亮划线",
    "",
    "> 📌 专注不是一直在线，而是知道什么时候该休息。",
    "- 💭 打卡里的 break 也是计划的一部分",
    `- ⏱ ${day(-20)} 22:02:11`,
  ]);

  // ── literature ──
  const paper = (name, meta, body) => add(`Sources/Reading/Zotero/${name}.md`, ["---", ...meta, "---", "", `# ${name}`, "", ...body]);
  paper("A Sample Study of Note-Taking Habits", [
    "type: paper",
    "authors: \"A. Example; B. Sample\"",
    "year: 2024",
    "venue: \"Journal of Imaginary Studies\"",
    "highlights: 3",
    `last_read: ${day(-2)}`,
    "status: reading",
    "sessions:",
    `  - "${day(-5)} · 2"`,
    `  - "${day(-2)} · 1"`,
    "zotero_key: SAMPLE01",
  ], ["> 虚构的示例论文，用来展示文献页的列表与阅读记录。", "", "## 我划的句子", "",
    "- Participants who reviewed their notes weekly recalled more of the material.", "",
    "## 综述段落", "", "这项研究说明定期回顾比记录本身更重要。"]);
  paper("Designing Calm Dashboards", [
    "type: paper",
    "authors: \"C. Placeholder\"",
    "year: 2023",
    "venue: \"Proceedings of the Sample Conference\"",
    "highlights: 1",
    `last_read: ${day(-8)}`,
    "status: read",
    "sessions:",
    `  - "${day(-8)} · 1"`,
    "zotero_key: SAMPLE02",
  ], ["> 虚构的示例论文。", "", "## 综述段落", "", "一个好的仪表盘应该让人少做决定。"]);
  add("Sources/Reading/Thoughts.md", [
    "# Thoughts",
    "",
    "> 文献页从 Zotero 同步时会重写这个文件；示例中是手写的。",
    "",
    "## A Sample Study of Note-Taking Habits",
    "",
    "- 可以在自己的笔记系统里验证一下：每周回顾一次，看能不能记得更牢。",
  ]);

  // ── practice ──
  add("Drills/Sessions.md", [
    "# Sessions",
    "",
    "> 由 OneDesk 的 English 页写入。每天一个小节，最新的在最上面。",
    "",
    `## ${day(-1)}`,
    "",
    "- Day 3 · Part 2 · 写完实验设置小节 · 2min",
    "  - 我终于理清了思路 :: I finally got my thoughts in order.",
    "",
    `## ${day(-2)}`,
    "",
    "- Day 2 · Part 1 · 画出方法部分的流程图 · 5min",
    "",
    `## ${day(-4)}`,
    "",
    "- Day 1 · Part 1 · 跑通数据预处理脚本 · 5min",
    "  - 比想象的顺利 :: It went more smoothly than I expected.",
  ]);
  add("Drills/Terms.md", [
    "# Terms",
    "",
    "> 一行一个术语，「·」后面写中文。",
    "",
    "## 在练",
    "",
    "- large language model (LLM) · 大语言模型",
    "- ablation study · 消融实验",
    "- baseline · 基线方法",
    "",
    "## 不练",
    "",
  ]);
  add("Drills/Writing log.md", [
    "# Writing log",
    "",
    `## ${day(-1)}`,
    "",
    "- 术语 · ablation study · 定义",
    "  > An ablation study removes one component at a time to measure how much it contributes.",
    "",
    `## ${day(-3)}`,
    "",
    "- 句式 · 指出不足 · gap",
    "  > However, few studies have examined how often notes are revisited after they are written.",
  ]);
  add("Drills/Writing/被动语态练习.md", ["---", "type: writing-practice", `created: ${day(-3)}`, "---", "", "# 被动语态练习", "",
    "## 我写的句子", "", "- The data were collected over two weeks."]);
  add(`Drills/Speaking/${day(-1)} Part 2 描述一次合作.md`, ["---", "type: speech-practice", `created: ${day(-1)}`, "---", "",
    `# ${day(-1)} Part 2 描述一次合作`, "", "## 值得带走的表达", "", "- We split the work based on what each of us was good at."]);

  // ── public writing ──
  add(`Workstreams/Writing/Articles/${day(-15)} 为什么开始写周记.md`, ["---", "status: published", `created: ${day(-15)}`, `published: ${day(-9)}`, "---", "",
    "# 为什么开始写周记", "", "示例文章。"]);
  add(`Workstreams/Writing/Articles/${day(-5)} 我的笔记系统.md`, ["---", "status: draft", `created: ${day(-5)}`, "published:", "---", "",
    "# 我的笔记系统", "", "示例草稿。"]);
  add(`Workstreams/Writing/Articles/${day(-1)} 关于专注的三个想法.md`, ["---", "status: idea", `created: ${day(-1)}`, "published:", "---", "",
    "# 关于专注的三个想法", ""]);

  return files;
}
