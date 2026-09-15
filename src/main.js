// ── Plugin shell ── the workspace view, the settings tab and the synced config file.
// scripts/build.mjs puts src/lifelog-timeline.js, src/sample-vault.js and src/dashboard.js
// (wrapped as runDashboard) ahead of this file in the generated main.js.
const {
  AbstractInputSuggest, Component, ItemView, Modal, Notice, Plugin, PluginSettingTab,
  Setting, TFolder, normalizePath,
} = require("obsidian");

const VIEW_TYPE = "onedesk-view";

// A vault file with this name (anywhere) holds the settings. It syncs like a note, so every
// device gets the same layout — plugin data.json is often left behind by sync tools.
const CONFIG_FILE = "onedesk.json";

// Tabs in the top navigation, keyed by their data-view name in dashboard.js.
const MODULES = [
  ["knowledge", "文件 · Files", "三栏浏览 vault，右侧直接编辑"],
  ["projects", "项目 · Projects", "项目下一步与执行时间线"],
  ["literature", "文献 · Literature", "从 Zotero 同步文献与批注（同步仅限电脑端）"],
  ["reading", "阅读 · Reading", "读书笔记（📌 划线 / 💭 想法）统计"],
  ["english", "英语 · English", "口语日课与表达积累"],
  ["writing", "写作 · Writing", "学术写作练习与公开写作"],
  ["time", "时间 · Time", "打卡计时、作息与时间分布"],
];

// Folder settings. Empty means the default derived inside dashboard.js.
const FOLDERS = [
  ["PROJECTS", "项目", "Workstreams", "每个项目一个子文件夹；其中的概览笔记带 type: project 与 project_id"],
  ["HOME", "项目概览笔记名", "Overview", "项目文件夹里概览笔记的文件名（不含 .md）"],
  ["INBOX", "收件箱", "Intake", "日记、生活日志、复盘的上级文件夹"],
  ["DAILY", "日记", "Intake/Days", "启用了核心「日记」插件时，以它的文件夹设置为准"],
  ["LIFELOG", "生活日志", "Intake/Log", "每天一篇「YYYY-MM-DD life log」"],
  ["CONTROL", "控制台", "Console", "打卡记录 Clock.md、倒数日 Dates.md"],
  ["TEMPLATES", "模板", "Blueprints", "Daily Note Template 等模板"],
  ["CAPTURE", "速记", "Scratch", "问题池 Questions.md、想做清单 Later.md"],
  ["LIT", "文献笔记", "Sources/Reading", "文献想法 Thoughts.md 所在位置"],
  ["ZOT_OUT", "Zotero 导出", "Sources/Reading/Zotero", "从 Zotero 同步生成的文献笔记"],
  ["ZOT_COLL", "Zotero 合集", "My Collection", "Zotero 中要导入的合集名称（不是文件夹）"],
  ["ZOT_ROOT", "写作素材合集", "Thesis", "写作页从这个 Zotero 合集（含子合集）提取术语与句式"],
  ["PRACTICE", "练习", "Drills", "英语日课、术语表、写作日志"],
  ["WRITING", "写作", "Workstreams/Writing", "其中 Articles 子文件夹为公开写作"],
  ["WEREAD", "读书笔记", "Shelf", "导出的书籍笔记"],
  ["ATTACH", "附件", "Media", "banner.jpg 与界面状态文件"],
];

const DEFAULT_SETTINGS = {
  openOnStartup: true,
  modules: {},
  me: { NAME: "" },
  vault: {},
  projects: null,
  projectAliases: {},
  projectBoard: {},
};

// The keys that travel in onedesk.json, in the order they are written.
const SHARED_KEYS = ["openOnStartup", "modules", "me", "vault", "projects", "projectAliases", "projectBoard"];

// Life-log timeline styling reads this (see lifelog-timeline.js).
const LIFE_LOG_DIR_DEFAULT = "Intake/Log/";
let LIFE_LOG_DIR = LIFE_LOG_DIR_DEFAULT;

class OneDeskView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.renderChild = null;
  }

  getViewType() {
    return VIEW_TYPE;
  }

  getDisplayText() {
    return "OneDesk";
  }

  getIcon() {
    return "layout-dashboard";
  }

  async onOpen() {
    await this.render();
  }

  async render() {
    const plugin = this.plugin;
    const container = this.contentEl;
    container.empty();
    container.addClass("onedesk-host");
    const mount = container.createDiv({ cls: "onedesk-mount" });
    for (const [key] of MODULES) mount.toggleClass(`onedesk-off-${key}`, plugin.settings.modules[key] === false);

    // Tear down the previous render's intervals and listeners before rebuilding;
    // dashboard.js registers them on the component it is handed.
    if (this.renderChild) {
      this.removeChild(this.renderChild);
      this.renderChild = null;
    }

    await plugin.ready;
    const dataview = plugin.dataviewApi();
    if (!dataview) {
      renderMessage(mount, "OneDesk 需要 Dataview 插件",
        "请在「设置 → 第三方插件」中安装并启用 Dataview，然后运行命令「OneDesk: 刷新」。");
      return;
    }
    if (dataview.index && !dataview.index.initialized) {
      renderMessage(mount, "正在等待 Dataview 建立索引…", "索引完成后会自动显示。");
      plugin.refreshWhenIndexed();
      return;
    }

    const child = this.addChild(new Component());
    this.renderChild = child;
    const dv = {
      container: mount,
      component: child,
      pages: source => dataview.pages(source),
      page: path => dataview.page(path),
    };
    try {
      await runDashboard(dv, this.app, plugin.dashboardConfig(), Notice);
      plugin.leaveDisabledTab(mount);
    } catch (error) {
      console.error("[onedesk] render failed", error);
      mount.empty();
      renderMessage(mount, "OneDesk 加载失败", error?.message || String(error));
    }
  }
}

function renderMessage(el, title, body) {
  const box = el.createDiv({ cls: "onedesk-message" });
  box.createEl("h3", { text: title });
  box.createEl("p", { text: body });
}

module.exports = class OneDeskPlugin extends Plugin {
  async onload() {
    this.configFile = null;
    this.lastConfigWrite = "";
    await this.loadSettings();
    // The vault index (needed to find CONFIG_FILE) is only complete once layout is ready.
    this.ready = new Promise(resolve => {
      this.app.workspace.onLayoutReady(() => this.loadVaultConfig().finally(resolve));
    });

    this.registerView(VIEW_TYPE, leaf => new OneDeskView(leaf, this));

    // Reading view: restyle the rendered <ul> into a timeline.
    this.registerMarkdownPostProcessor((el, ctx) => {
      if (ctx.sourcePath.startsWith(LIFE_LOG_DIR)) styleLifeLogTimeline(el);
    });
    // Live Preview: same timeline via CM6 decorations (cursor line stays raw/editable).
    this.registerEditorExtension(buildLifeLogTimelineExtension());

    this.addRibbonIcon("layout-dashboard", "打开 OneDesk", () => this.openDashboard(false));

    this.addCommand({
      id: "open",
      name: "打开",
      callback: () => this.openDashboard(false),
    });

    this.addCommand({
      id: "refresh",
      name: "刷新",
      callback: async () => {
        await this.loadVaultConfig();
        if (!this.app.workspace.getLeavesOfType(VIEW_TYPE).length) return this.openDashboard(false);
        await this.refreshViews();
        new Notice("OneDesk 已刷新");
      },
    });

    this.addCommand({
      id: "create-sample-notes",
      name: "创建示例笔记",
      callback: () => new SampleNotesModal(this.app, this).open(),
    });

    this.addSettingTab(new OneDeskSettingTab(this.app, this));

    // Another device may rewrite onedesk.json through sync.
    const onConfigChange = file => {
      if (file.name === CONFIG_FILE) this.scheduleConfigReload();
    };
    this.registerEvent(this.app.vault.on("modify", onConfigChange));
    this.registerEvent(this.app.vault.on("create", onConfigChange));
    this.registerEvent(this.app.vault.on("delete", onConfigChange));
    this.registerEvent(this.app.vault.on("rename", onConfigChange));
    this.register(() => window.clearTimeout(this.configTimer));

    this.app.workspace.onLayoutReady(async () => {
      await this.ready;
      if (!this.settings.openOnStartup) return;
      const timer = window.setTimeout(() => this.openDashboard(true), 350);
      this.register(() => window.clearTimeout(timer));
    });
  }

  dataviewApi() {
    return this.app.plugins.getPlugin("dataview")?.api || null;
  }

  refreshWhenIndexed() {
    if (this.waitingForIndex) return;
    this.waitingForIndex = true;
    const ref = this.app.metadataCache.on("dataview:index-ready", () => {
      this.app.metadataCache.offref(ref);
      this.waitingForIndex = false;
      this.refreshViews();
    });
    this.registerEvent(ref);
  }

  // ── settings ─────────────────────────────────────────────────
  async loadSettings(fromVault) {
    const data = (await this.loadData()) || {};
    const s = Object.assign({}, DEFAULT_SETTINGS, data, fromVault || {});
    s.modules = Object.assign({}, data.modules, fromVault?.modules);
    s.me = Object.assign({}, DEFAULT_SETTINGS.me, data.me, fromVault?.me);
    s.vault = Object.assign({}, data.vault, fromVault?.vault);
    this.settings = s;
    const v = s.vault;
    const ll = v.LIFELOG || (v.INBOX || "Intake") + "/Log";
    LIFE_LOG_DIR = ll.endsWith("/") ? ll : ll + "/";
  }

  sharedSettings() {
    const out = {};
    for (const key of SHARED_KEYS) out[key] = this.settings[key];
    return out;
  }

  dashboardConfig() {
    const s = this.settings;
    return {
      vault: s.vault,
      me: s.me.NAME ? s.me : {},
      projects: s.projects,
      projectAliases: s.projectAliases,
      projectBoard: s.projectBoard,
    };
  }

  async saveSettings() {
    await this.saveData(this.sharedSettings());
    if (!this.configFile) return;
    const text = JSON.stringify(this.sharedSettings(), null, 2) + "\n";
    this.lastConfigWrite = text;
    await this.app.vault.modify(this.configFile, text);
  }

  async loadVaultConfig() {
    const file = this.app.vault.getFiles().find(f => f.name === CONFIG_FILE) || null;
    this.configFile = file;
    if (!file) {
      await this.loadSettings();
      return;
    }
    try {
      await this.loadSettings(JSON.parse(await this.app.vault.read(file)));
    } catch (error) {
      console.error(`[onedesk] could not read ${file.path}`, error);
      new Notice(`OneDesk：${file.path} 不是有效的 JSON，暂时沿用插件内的设置`);
      await this.loadSettings();
    }
  }

  async createVaultConfig() {
    if (this.configFile) return this.configFile;
    const text = JSON.stringify(this.sharedSettings(), null, 2) + "\n";
    this.lastConfigWrite = text;
    this.configFile = await this.app.vault.create(CONFIG_FILE, text);
    return this.configFile;
  }

  scheduleConfigReload() {
    window.clearTimeout(this.configTimer);
    this.configTimer = window.setTimeout(async () => {
      const file = this.app.vault.getFiles().find(f => f.name === CONFIG_FILE);
      if (file && (await this.app.vault.read(file)) === this.lastConfigWrite) {
        this.configFile = file;
        return;
      }
      await this.loadVaultConfig();
      await this.refreshViews();
    }, 800);
  }

  // Persist settings edited in the tab, then redraw with them.
  async applySettings() {
    await this.saveSettings();
    await this.loadSettings(this.sharedSettings());
    await this.refreshViews();
  }

  // ── views ────────────────────────────────────────────────────
  async refreshViews() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE);
    await Promise.all(leaves.map(leaf => leaf.view instanceof OneDeskView && leaf.view.render()));
  }

  // A tab switched off in settings may still be the one remembered from last time.
  leaveDisabledTab(mount) {
    window.setTimeout(() => {
      const active = mount.querySelector(".nav-item.active");
      if (active && this.settings.modules[active.dataset.view] === false) {
        mount.querySelector('.nav-item[data-view="dashboard"]')?.click();
      }
    }, 60);
  }

  async openDashboard(replaceActive) {
    const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (existing) {
      this.app.workspace.revealLeaf(existing);
      return existing;
    }
    const leaf = this.app.workspace.getLeaf(!replaceActive);
    await leaf.setViewState({ type: VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
    return leaf;
  }

  // ── sample notes ─────────────────────────────────────────────
  async createSampleNotes() {
    let created = 0, skipped = 0;
    for (const [path, content] of Object.entries(onedeskSampleFiles(new Date()))) {
      const target = normalizePath(path);
      if (this.app.vault.getAbstractFileByPath(target)) {
        skipped++;
        continue;
      }
      const dir = target.includes("/") ? target.slice(0, target.lastIndexOf("/")) : "";
      if (dir && !this.app.vault.getAbstractFileByPath(dir)) {
        try { await this.app.vault.createFolder(dir); } catch (_e) { /* created concurrently */ }
      }
      await this.app.vault.create(target, content);
      created++;
    }
    new Notice(`OneDesk：已创建 ${created} 篇示例笔记${skipped ? `，跳过 ${skipped} 篇已存在的` : ""}`);
    await this.refreshViews();
  }
};

class SampleNotesModal extends Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    const count = Object.keys(onedeskSampleFiles(new Date())).length;
    contentEl.createEl("h3", { text: "创建示例笔记？" });
    contentEl.createEl("p", {
      text: `将按默认文件夹结构（Workstreams、Intake、Console 等）创建 ${count} 篇虚构的示例笔记，` +
        "包括项目、日记任务、打卡记录、读书与文献笔记和模板。已存在的文件不会被覆盖。",
    });
    contentEl.createEl("p", { text: "建议在一个新的空 vault 中试用。", cls: "setting-item-description" });
    new Setting(contentEl)
      .addButton(b => b.setButtonText("取消").onClick(() => this.close()))
      .addButton(b => b.setButtonText("创建").setCta().onClick(async () => {
        this.close();
        await this.plugin.createSampleNotes();
      }));
  }

  onClose() {
    this.contentEl.empty();
  }
}

class FolderSuggest extends AbstractInputSuggest {
  constructor(app, inputEl) {
    super(app, inputEl);
    this.inputEl = inputEl;
  }

  getSuggestions(query) {
    const q = query.toLowerCase();
    return this.app.vault.getAllLoadedFiles()
      .filter(f => f instanceof TFolder && !f.isRoot() && f.path.toLowerCase().includes(q))
      .slice(0, 50);
  }

  renderSuggestion(folder, el) {
    el.setText(folder.path);
  }

  selectSuggestion(folder) {
    this.setValue(folder.path);
    this.inputEl.dispatchEvent(new Event("input"));
    this.close();
  }
}

class OneDeskSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  // Saving rewrites onedesk.json, so typing is debounced and views refresh once it settles.
  queueSave() {
    window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => {
      this.saveTimer = null;
      this.plugin.applySettings();
    }, 700);
  }

  display() {
    const { containerEl } = this;
    const plugin = this.plugin;
    const s = plugin.settings;
    containerEl.empty();

    if (!plugin.dataviewApi()) {
      containerEl.createDiv({
        cls: "onedesk-settings-warning",
        text: "⚠️ 未检测到 Dataview。OneDesk 依赖 Dataview 读取任务与笔记，请先安装并启用它。",
      });
    }

    new Setting(containerEl).setName("基本").setHeading();
    new Setting(containerEl)
      .setName("称呼")
      .setDesc("首页问候语中显示的名字")
      .addText(t => t.setPlaceholder("there").setValue(s.me.NAME || "").onChange(v => {
        s.me.NAME = v.trim();
        this.queueSave();
      }));
    new Setting(containerEl)
      .setName("启动时打开")
      .setDesc("打开 Obsidian 时自动显示 OneDesk")
      .addToggle(t => t.setValue(s.openOnStartup).onChange(v => {
        s.openOnStartup = v;
        this.queueSave();
      }));

    new Setting(containerEl).setName("模块").setHeading();
    for (const [key, name, desc] of MODULES) {
      new Setting(containerEl)
        .setName(name)
        .setDesc(desc)
        .addToggle(t => t.setValue(s.modules[key] !== false).onChange(v => {
          if (v) delete s.modules[key];
          else s.modules[key] = false;
          this.queueSave();
        }));
    }

    new Setting(containerEl).setName("文件夹").setHeading();
    containerEl.createEl("p", {
      cls: "setting-item-description",
      text: "留空使用默认值。只改上级文件夹（如「收件箱」）时，其下的日记、生活日志等会一起跟着移动。",
    });
    for (const [key, name, fallback, desc] of FOLDERS) {
      new Setting(containerEl)
        .setName(name)
        .setDesc(desc)
        .addText(t => {
          t.setPlaceholder(fallback).setValue(s.vault[key] || "").onChange(v => {
            const value = v.trim().replace(/\/+$/, "");
            if (value) s.vault[key] = value;
            else delete s.vault[key];
            this.queueSave();
          });
          if (!["HOME", "ZOT_COLL", "ZOT_ROOT"].includes(key)) new FolderSuggest(this.app, t.inputEl);
        });
    }

    new Setting(containerEl).setName("项目看板（高级）").setHeading();
    const board = { projects: s.projects, projectAliases: s.projectAliases, projectBoard: s.projectBoard };
    new Setting(containerEl)
      .setName("项目看板配置")
      .setDesc("留空时自动显示所有状态为进行中的项目笔记。需要固定顺序、颜色或别名时，在这里写 JSON，格式见 README。")
      .addTextArea(t => {
        t.inputEl.rows = 8;
        t.inputEl.addClass("onedesk-json-input");
        t.setValue(JSON.stringify(board, null, 2));
        t.inputEl.addEventListener("blur", () => {
          try {
            const parsed = JSON.parse(t.getValue() || "{}");
            s.projects = Array.isArray(parsed.projects) ? parsed.projects : null;
            s.projectAliases = parsed.projectAliases || {};
            s.projectBoard = parsed.projectBoard || {};
            this.queueSave();
          } catch (_e) {
            new Notice("项目看板配置不是有效的 JSON，未保存");
          }
        });
      });

    new Setting(containerEl).setName("多设备同步").setHeading();
    if (plugin.configFile) {
      new Setting(containerEl)
        .setName("配置文件")
        .setDesc(`设置保存在 ${plugin.configFile.path}，会像普通笔记一样同步到其他设备。`);
    } else {
      new Setting(containerEl)
        .setName("配置文件")
        .setDesc(`把设置存成 vault 里的 ${CONFIG_FILE}。很多同步工具不同步插件自己的数据，存进 vault 后手机和平板也能用上同样的设置。`)
        .addButton(b => b.setButtonText("创建配置文件").onClick(async () => {
          await plugin.createVaultConfig();
          new Notice(`已创建 ${CONFIG_FILE}`);
          this.display();
        }));
    }

    new Setting(containerEl).setName("示例").setHeading();
    new Setting(containerEl)
      .setName("创建示例笔记")
      .setDesc("生成一套虚构的项目、任务、打卡、阅读与文献笔记，用来快速看到完整效果。已存在的文件不会被覆盖。")
      .addButton(b => b.setButtonText("创建…").onClick(() => new SampleNotesModal(this.app, plugin).open()));
  }

  hide() {
    // Flush a pending save when the settings window closes.
    if (this.saveTimer) {
      window.clearTimeout(this.saveTimer);
      this.saveTimer = null;
      this.plugin.applySettings();
    }
  }
}
