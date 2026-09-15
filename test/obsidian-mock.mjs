// Just enough of the Obsidian API to load main.js in Node and drive the plugin shell.
import vm from "node:vm";

export const notices = [];

function el() {
  const node = {
    children: [], classes: new Set(), text: null, tag: "div", dataset: {},
    empty() { this.children = []; },
    addClass(c) { this.classes.add(c); },
    toggleClass(c, on) { on ? this.classes.add(c) : this.classes.delete(c); },
    createDiv(o) { return this.createEl("div", o); },
    createEl(tag, o = {}) {
      const c = el();
      c.tag = tag;
      c.text = o.text ?? null;
      if (o.cls) c.classes.add(o.cls);
      this.children.push(c);
      return c;
    },
    querySelector() { return null; },
    allText() { return [this.text, ...this.children.map(c => c.allText())].filter(Boolean).join(" | "); },
  };
  return node;
}

class Component {
  constructor() { this._children = []; this._cleanups = []; }
  addChild(c) { this._children.push(c); return c; }
  removeChild(c) { this._children = this._children.filter(x => x !== c); }
  register(fn) { this._cleanups.push(fn); }
  registerEvent() {}
  registerInterval(id) { return id; }
}

class ItemView extends Component {
  constructor(leaf) { super(); this.leaf = leaf; this.app = leaf.app; this.contentEl = el(); }
}

class Plugin extends Component {
  constructor(app, manifest) { super(); this.app = app; this.manifest = manifest; this.commands = {}; this.saved = undefined; }
  async loadData() { return this.data ?? null; }
  async saveData(d) { this.saved = JSON.parse(JSON.stringify(d)); }
  registerView(type, factory) { this.viewType = type; this.viewFactory = factory; }
  registerMarkdownPostProcessor() {}
  registerEditorExtension() {}
  addRibbonIcon() {}
  addCommand(c) { this.commands[c.id] = c; }
  addSettingTab(t) { this.settingTab = t; }
}

class TAbstractFile {
  constructor(path) { this.path = path; this.name = path.split("/").pop(); }
}
class TFile extends TAbstractFile {}
class TFolder extends TAbstractFile { isRoot() { return this.path === "/"; } }

const obsidian = {
  AbstractInputSuggest: class {}, Component, ItemView, Plugin, PluginSettingTab: class {}, Setting: class {},
  Modal: class { constructor(app) { this.app = app; } }, TFile, TFolder,
  Notice: class { constructor(m) { notices.push(m); } },
  normalizePath: p => String(p).replace(/\/+/g, "/").replace(/^\/|\/$/g, ""),
};

// An in-memory vault: path → content.
export function makeApp(files = {}, { dataview = null } = {}) {
  const store = new Map(Object.entries(files));
  const layoutCallbacks = [];
  const fileObj = path => new TFile(path);
  const app = {
    layoutCallbacks,
    store,
    vault: {
      getFiles: () => [...store.keys()].map(fileObj),
      getAbstractFileByPath: p => (store.has(p) ? fileObj(p) : [...store.keys()].some(k => k.startsWith(p + "/")) ? new TFolder(p) : null),
      read: async f => store.get(f.path),
      modify: async (f, text) => { store.set(f.path, text); },
      create: async (p, text) => { if (store.has(p)) throw new Error("exists " + p); store.set(p, text); return fileObj(p); },
      createFolder: async () => {},
      on: () => ({}),
    },
    workspace: { onLayoutReady: cb => layoutCallbacks.push(cb), getLeavesOfType: () => [] },
    metadataCache: { on: () => ({}), offref() {} },
    plugins: { getPlugin: id => (id === "dataview" && dataview ? { api: dataview } : null) },
  };
  return app;
}

// Evaluates the built main.js as CommonJS with the mock API; returns the plugin class
// and a handle on the functions defined at top level.
export function loadMain(source, extraGlobals = {}) {
  const module = { exports: {} };
  const requireMock = id => {
    if (id === "obsidian") return obsidian;
    if (id === "@codemirror/view") {
      return { ViewPlugin: { fromClass: () => ({}) }, Decoration: { line: () => ({}), mark: () => ({}), replace: () => ({}), none: null, set: () => null } };
    }
    throw new Error("unexpected require " + id);
  };
  const context = vm.createContext({
    module, exports: module.exports, require: requireMock, console, Event: class {},
    window: { setTimeout: () => 0, clearTimeout() {} },
    ...extraGlobals,
  });
  vm.runInContext(source + "\n;globalThis.__runDashboard = runDashboard; globalThis.__sample = onedeskSampleFiles;", context);
  return { Plugin: module.exports, context };
}
