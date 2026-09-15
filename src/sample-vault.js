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
    "- **首页横幅**：`Media/banner.svg`（附件文件夹里任意 banner.jpg / png / svg 都可以）",
    "- **倒数日**：`Console/Dates.md`；**等待清单**：`Intake/Pending.md`；**想做清单**：`Scratch/Later.md`",
    "- **阅读**：`Shelf/` 中的读书笔记（📌 划线、💭 想法）",
    "- **文献**：`Sources/Reading/Zotero/` 里 6 篇虚构论文（格式与 Zotero 同步生成的一致），带 gap / method / dataset / result 标签、译文和批注",
    "- **文献合集**：`Sources/Reading/` 下的「Gap 合集」「文献矩阵」「标签合集」「综述草稿」；在文献页点「更新合集」会重新生成",
    "- **英语 / 写作练习**：`Drills/`；**公开写作**：`Workstreams/Writing/Articles/`",
    "",
    "看完可以整批删除，换成你自己的笔记。",
  ]);

  // An original banner, drawn for the sample (the hero picks up any banner.* in the attachments folder).
  add("Media/banner.svg", [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 640" preserveAspectRatio="xMidYMid slice">',
    "  <defs>",
    '    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">',
    '      <stop offset="0" stop-color="#efe2d0"/><stop offset="0.6" stop-color="#e2c9ab"/><stop offset="1" stop-color="#cfae8b"/>',
    "    </linearGradient>",
    '    <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">',
    '      <stop offset="0" stop-color="#fbf1e3"/><stop offset="0.7" stop-color="#f3dcc0"/><stop offset="1" stop-color="#f3dcc0" stop-opacity="0"/>',
    "    </radialGradient>",
    "  </defs>",
    '  <rect width="1600" height="640" fill="url(#sky)"/>',
    '  <circle cx="1120" cy="250" r="190" fill="url(#sun)"/>',
    '  <circle cx="1120" cy="250" r="96" fill="#f8eadb" opacity="0.9"/>',
    '  <g fill="none" stroke="#b08a66" stroke-opacity="0.35" stroke-width="1.2">',
    '    <path d="M0 150 C 260 120 520 175 800 140 S 1340 110 1600 150"/>',
    '    <path d="M0 190 C 300 160 560 215 820 180 S 1360 150 1600 192"/>',
    '    <path d="M0 230 C 280 205 600 250 860 222 S 1380 196 1600 234"/>',
    "  </g>",
    '  <path d="M0 400 C 180 330 330 300 470 340 C 610 380 720 290 880 260 C 1040 230 1180 330 1330 320 C 1450 312 1530 280 1600 290 L1600 640 L0 640 Z" fill="#c29a74" opacity="0.55"/>',
    '  <path d="M0 460 C 150 420 300 380 440 410 C 600 445 700 370 860 360 C 1030 350 1130 430 1290 420 C 1420 412 1520 380 1600 390 L1600 640 L0 640 Z" fill="#a67c58" opacity="0.7"/>',
    '  <path d="M0 530 C 200 490 360 470 520 500 C 700 535 820 470 1000 468 C 1180 466 1300 520 1460 510 C 1530 506 1570 498 1600 500 L1600 640 L0 640 Z" fill="#7f5a3d" opacity="0.85"/>',
    '  <path d="M0 600 C 240 570 470 560 700 585 C 930 610 1150 572 1380 578 C 1480 581 1550 590 1600 592 L1600 640 L0 640 Z" fill="#5b3f2b"/>',
    '  <g fill="#fbf1e3" opacity="0.55">',
    '    <circle cx="240" cy="110" r="2"/><circle cx="420" cy="70" r="1.5"/><circle cx="610" cy="120" r="1.8"/><circle cx="1400" cy="90" r="1.6"/><circle cx="1510" cy="160" r="2"/>',
    "  </g>",
    "</svg>",
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
  // Older weeks follow a steady pattern so the heatmap and weekly charts have some history.
  const pattern = [
    ["07:30 wake", "09:00 in research", "12:00 break", "14:00 in work", "17:30 break"],
    ["07:10 wake", "08:30 in research", "11:40 break", "13:30 in learning", "15:00 break", "20:30 in learning", "21:30 break"],
    ["08:00 wake", "09:30 in work", "12:30 break", "14:00 in social", "15:30 break"],
    ["07:20 wake", "08:40 in research", "12:10 break", "13:40 in research", "16:30 in work", "18:00 break"],
    ["09:00 wake", "10:30 in learning", "11:30 break"],
  ];
  for (let i = 7; i <= 27; i++) punches[String(-i)] = i % 7 === 6 ? null : pattern[i % pattern.length];
  for (let i = 1; i <= 27; i++) {
    const list = punches[String(-i)];
    if (list) clock.push(`## ${day(-i)}`, "", ...list.map(p => `- ${p}`), "");
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
  // Six fictional papers written exactly the way a Zotero sync writes them, so every
  // Literature view and the four collection notes have something to show.
  const LIT_DIR = "Sources/Reading";
  const ZOT_DIR = `${LIT_DIR}/Zotero`;
  const faint = s => `<small style="color:var(--text-faint)">${s}</small>`;
  const paperNote = p => {
    const quotes = Object.values(p.sections || {}).flat();
    const cite = (tag) => quotes.find(q => q.tags.includes(tag) || (tag === "gap" && q.tags.some(t => ["research gap", "问题"].includes(t))));
    const brief = [["gap", "想解决的问题"], ["method", "方法"], ["dataset", "数据集"], ["result", "结果"]].map(([tag, label]) => {
      const q = cite(tag) || (tag === "result" && quotes.find(x => x.tags.includes("results")));
      return `| **${label}** | ${q ? (q.zh || q.text) : ""} |`;
    });
    const fm = ["---", "type: paper", "collection: My Collection", `zotero_key: ${p.key}`, `title: ${JSON.stringify(p.title)}`,
      `authors: ${JSON.stringify(p.authors)}`, `year: ${p.year}`, `venue: ${JSON.stringify(p.venue)}`, 'doi: ""',
      `status: ${quotes.length ? "read" : "unread"}`, `highlights: ${quotes.length}`, "figures: 0",
      `last_read: ${p.sessions.length ? day(p.sessions[0][0]) : '""'}`, `added: ${day(-45)}`,
      p.sessions.length ? "sessions:\n" + p.sessions.map(([d, n]) => `  - "${day(d)} · ${n}"`).join("\n") : "sessions: []",
      `topics: [${p.topics.join(", ")}]`, "related_concepts: []", "---"];
    const head = ["", `# ${p.title}`, "", `${p.authors} · ${p.year} · ${p.venue}　[在 Zotero 中打开](zotero://select/library/items/${p.key})`];
    let body;
    if (!quotes.length) {
      body = ["", "## 摘要", "", p.abstract, "", "> [!info] 还没读", "> 这篇在 My Collection 里，但一条划线都没有。", ""];
    } else {
      body = ["", "## 速览", "", "| | |", "|---|---|", ...brief, "", `## 我划的句子 · ${quotes.length} 条`];
      let n = 0;
      for (const [section, list] of Object.entries(p.sections)) {
        body.push("", `### ${section}　<small>${list.length}</small>`, "");
        for (const q of list) {
          n++;
          const link = `zotero://open-pdf/library/items/${p.key}A?annotation=${p.key}${String(n).padStart(2, "0")}`;
          body.push([q.tags.map(t => "`" + t + "`").join(" "), `**p.${q.page}**`, `[↗](${link})`].filter(Boolean).join("　"));
          body.push("> " + q.text);
          if (q.zh) body.push("> " + faint(q.zh));
          for (const m of q.mine || []) body.push("> **我：** " + m);
          body.push("");
        }
      }
    }
    const tail = ["## 综述段落", "", p.essay || "", "", "## 我的话", "", "- 和我自己的工作是什么关系？", "- 存疑 / 不同意的地方？", "- 想到的下一步？", ""];
    return [...fm, ...head, ...body, "", ...tail].join("\n");
  };

  const papers = [
    {
      key: "SMPL0001", year: 2024, topics: ["复习与记忆"], sessions: [[-3, 2], [-9, 3]],
      title: "Spaced Review of Research Notes Improves Long-Term Retention",
      authors: "Example, Sample, Demo", venue: "Journal of Imaginary Learning Studies",
      sections: {
        "引言 · Introduction": [
          { tags: ["gap"], page: 2, text: "Most studies of note-taking measure recall within a week, leaving the long-term value of revisiting research notes largely unexamined.",
            zh: "多数笔记研究只测一周内的回忆，重读研究笔记的长期价值基本没有被考察。", mine: ["我的课题正好可以补这一块：跨学期追踪。"] },
        ],
        "方法 · Method": [
          { tags: ["method"], page: 4, text: "We asked 120 graduate students to review their reading notes on an expanding schedule of one, seven and thirty days.",
            zh: "我们让 120 名研究生按 1、7、30 天的递增间隔复习阅读笔记。" },
          { tags: ["dataset"], page: 5, text: "Participants came from six departments, and each contributed at least forty annotated papers over one semester.",
            zh: "参与者来自六个院系，每人一学期内至少标注了四十篇论文。" },
        ],
        "结果 · Results": [
          { tags: ["result"], page: 8, text: "Students on the spaced schedule recalled twice as many key claims after three months as those who reread only before deadlines.",
            zh: "三个月后，按间隔复习的学生能回忆起的关键论点是只在截止前重读者的两倍。" },
          { tags: ["limitation"], page: 10, text: "Our sample was limited to a single university, so the size of the effect may depend on the local research culture.",
            zh: "样本只来自一所大学，效果大小可能受当地科研文化影响。", mine: ["可以作为研究设计里要控制的变量。"] },
        ],
      },
      essay: "Example 等人发现，按递增间隔复习阅读笔记能显著提升三个月后的关键论点回忆，但样本局限于单一院校，也没有考察笔记本身的质量。",
    },
    {
      key: "SMPL0002", year: 2023, topics: ["个人知识管理"], sessions: [[-12, 4]],
      title: "Linking Notes: A Field Study of Personal Knowledge Graphs",
      authors: "Placeholder, Mock", venue: "Proceedings of the Sample Conference on Knowledge Work",
      sections: {
        "引言 · Introduction": [
          { tags: ["research gap"], page: 1, text: "Although linking tools are widely adopted, little is known about whether links created while reading are ever followed again.",
            zh: "尽管链接工具被广泛使用，但阅读时建立的链接是否会被再次访问，几乎没有研究。" },
        ],
        "方法 · Method": [
          { tags: ["method"], page: 3, text: "We logged the link activity of 48 researchers for six months and interviewed them about the notes they went back to.",
            zh: "我们记录了 48 名研究者六个月的链接行为，并访谈了他们重访过的笔记。" },
        ],
        "结果 · Results": [
          { tags: ["results"], page: 7, text: "Only a fifth of links were ever followed, yet notes with three or more backlinks were reopened far more often than the rest.",
            zh: "只有五分之一的链接被再次点开，但拥有三个以上反向链接的笔记被重新打开的次数明显更多。", mine: ["说明「被引用得多」比「链接得多」更重要。"] },
        ],
        "讨论 · Discussion": [
          { tags: ["future work"], page: 9, text: "Future tools could surface notes that have many backlinks but have not been opened for several weeks.",
            zh: "未来的工具可以主动推送反向链接多、但几周未打开的笔记。" },
        ],
      },
      essay: "Placeholder 与 Mock 的六个月追踪显示，大部分阅读时建立的链接从未被再次点开，但反向链接较多的笔记更常被重访，提示知识管理工具应关注笔记被引用的程度，而非链接的数量。",
    },
    {
      key: "SMPL0003", year: 2022, topics: ["个人知识管理", "研究生学习"], sessions: [[-20, 3]],
      title: "Why Graduate Students Abandon Reading Logs",
      authors: "Demo", venue: "Fictional Review of Higher Education",
      sections: {
        "引言 · Introduction": [
          { tags: ["问题"], page: 2, text: "Reading logs are recommended in most research methods courses, yet few students keep them going beyond their first term.",
            zh: "多数研究方法课程都推荐写阅读日志，但很少有学生能坚持到第一学期之后。" },
        ],
        "结果 · Results": [
          { tags: ["result"], page: 6, text: "The most common reason for stopping was that entries were never read again, so writing them felt like wasted effort.",
            zh: "停止记录最常见的原因是写下的内容从不被再读，因此觉得是白费力气。", mine: ["和 Placeholder & Mock 2023 的结论互相印证。"] },
        ],
        "结论 · Conclusion": [
          { tags: ["implication"], page: 8, text: "Logs that fed directly into a thesis chapter were kept far longer than logs that were written only for their own sake.",
            zh: "能直接用进论文章节的日志，比单纯为记录而写的日志坚持得久得多。" },
        ],
      },
      essay: "Demo 的访谈指出，研究生放弃阅读日志的主要原因是记录从未被再次使用；与学位论文写作直接挂钩的日志则能长期保持。",
    },
    {
      key: "SMPL0004", year: 2025, topics: ["复习与记忆"], sessions: [[-2, 3]],
      title: "Annotation Density and the Later Reuse of Highlights",
      authors: "Sample, Example", venue: "Imaginary Transactions on Reading",
      sections: {
        "引言 · Introduction": [
          { tags: ["gap"], page: 1, text: "Prior work treats every highlight as equal, without asking which highlights are later quoted in the reader's own writing.",
            zh: "以往研究把所有划线视为同等，没有追问哪些划线后来被读者引用进自己的写作。" },
        ],
        "方法 · Method": [
          { tags: ["method"], page: 3, text: "We matched 9,000 highlights against the drafts their authors later wrote, using sentence embeddings to detect reuse.",
            zh: "我们用句向量把 9000 条划线与作者之后写的草稿匹配，以识别复用。" },
          { tags: ["dataset"], page: 4, text: "The corpus combines highlights and drafts from 85 master's theses that were written between 2019 and 2023.",
            zh: "语料由 2019 至 2023 年间 85 篇硕士论文的划线与草稿组成。" },
        ],
      },
      essay: "",
    },
    {
      key: "SMPL0005", year: 2021, topics: ["仪表盘设计"], sessions: [[-30, 2]],
      title: "Calm Dashboards for Personal Self-Tracking",
      authors: "Placeholder", venue: "Sample Journal of Interaction Design",
      sections: {
        "引言 · Introduction": [
          { tags: ["gap"], page: 2, text: "Self-tracking dashboards often maximise the number of metrics on screen, even though users report feeling judged by them.",
            zh: "个人追踪仪表盘往往尽量多地展示指标，尽管用户表示会因此感到被评判。" },
        ],
        "结果 · Results": [
          { tags: ["result"], page: 6, text: "Participants preferred a view that showed fewer numbers and more recent activity, and they opened it more often.",
            zh: "参与者更喜欢数字更少、近期活动更多的视图，而且打开得更频繁。" },
        ],
      },
      essay: "Placeholder 比较了不同信息密度的自我追踪界面，发现数字更少、强调近期活动的「平静」界面更受欢迎，使用频率也更高。",
    },
    {
      key: "SMPL0006", year: 2020, topics: [], sessions: [],
      title: "A Survey of Literature Management Tools",
      authors: "Mock, Demo, Example", venue: "Imaginary Computing Surveys",
      abstract: "This fictional survey compares reference managers by how they support reading, annotating and writing.",
      essay: "",
    },
  ];
  for (const p of papers) add(`${ZOT_DIR}/${p.title}.md`, [paperNote(p)]);

  add(`${LIT_DIR}/Thoughts.md`, [
    "# Thoughts",
    "",
    "> Zotero 同步生成：你在 Zotero 里写的便签、批注和笔记，按论文归档，最近写过的排在前面。",
    "> 这里每次同步都会整篇重写 —— 要改请在 Zotero 里改。",
    "",
    `## ${papers[0].title}`,
    "",
    `[[${ZOT_DIR}/${papers[0].title}|文献笔记]] · 2024 · 2 条 · 最近 ${day(-3)}`,
    "",
    `### p.2 · 划线批注 · ${day(-9).slice(5)}　[↗](zotero://open-pdf/library/items/SMPL0001A?annotation=SMPL000101)`,
    "",
    "> Most studies of note-taking measure recall within a week, leaving the long-term value of revisiting research notes largely unexamined.",
    "",
    "我的课题正好可以补这一块：跨学期追踪。",
    "",
    `### p.10 · 划线批注 · ${day(-3).slice(5)}　[↗](zotero://open-pdf/library/items/SMPL0001A?annotation=SMPL000105)`,
    "",
    "可以作为研究设计里要控制的变量。",
    "",
    `## ${papers[1].title}`,
    "",
    `[[${ZOT_DIR}/${papers[1].title}|文献笔记]] · 2023 · 1 条 · 最近 ${day(-12)}`,
    "",
    `### p.7 · 便签 · ${day(-12).slice(5)}　[↗](zotero://open-pdf/library/items/SMPL0002A?annotation=SMPL000203)`,
    "",
    "说明「被引用得多」比「链接得多」更重要。",
  ]);

  // The four collection notes, built the same way the Literature tab's 更新合集 builds them.
  if (typeof litCollectionDocs === "function") {
    const parsed = Object.entries(files).filter(([path]) => path.startsWith(ZOT_DIR + "/")).map(([path, raw]) => litPaperFromNote(raw, path));
    const docs = litCollectionDocs(parsed, litTagCanon({}), `${T} 09:00`);
    for (const [kind, doc] of Object.entries(docs)) {
      files[`${LIT_DIR}/${LIT_COLLECTION_FILES[kind]}`] = litMergeCollection(null, doc.head, doc.body);
    }
  }

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
