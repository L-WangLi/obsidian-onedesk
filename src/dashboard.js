// ═══════════════════════════════════════════════════════════════
//  DASHBOARD 2026  ·  Route B  ·  event-delegation edition
// ═══════════════════════════════════════════════════════════════

// ── Vault layout ────────────────────────────────────────────────
// Defaults are deliberately arbitrary — they describe no real vault, and are
// chosen so that none of them is a substring of any name in a real one. Your
// own folder names belong in this
// plugin's data.json (which is git-ignored), under "vault" / "me" / "projects";
// main.js hands them in as DB26_CONFIG. That way the code in this repository
// stays shareable and your layout never travels with it.
//
// Overrides work at two levels: name a root (PROJECTS, INBOX, …) and everything
// derived from it moves too, or name a leaf (DAILY, PUNCH, …) to place just that
// one somewhere unrelated.
const CFG = (typeof DB26_CONFIG !== 'undefined' && DB26_CONFIG) || {};

const V = (() => {
  const O = CFG.vault || {};
  const g = (k, d) => (typeof O[k] === 'string' && O[k] ? O[k] : d);

  const PROJECTS  = g('PROJECTS',  'Workstreams');
  const INBOX     = g('INBOX',     'Intake');
  const CONTROL   = g('CONTROL',   'Console');
  const BACKLOG   = g('BACKLOG',   'Parked');
  const TEMPLATES = g('TEMPLATES', 'Blueprints');
  const PHD       = g('PHD',       'Study');
  const RESEARCH  = g('RESEARCH',  'Sources');
  const WORK      = g('WORK',      'Job');
  const PRACTICE  = g('PRACTICE',  'Drills');
  const LANG      = g('LANG',      'Idioms');
  const JOURNAL   = g('JOURNAL',   'Diary');
  const CORPUS    = g('CORPUS',    'Snippets');
  const LIFE      = g('LIFE',      'Habits');
  const CAPTURE   = g('CAPTURE',   'Scratch');
  const ATTACH    = g('ATTACH',    'Media');
  const WEREAD    = g('WEREAD',    'Shelf');
  const CLIPPINGS = g('CLIPPINGS', 'Web clips');
  const LIT       = g('LIT',       RESEARCH + '/Reading');
  const WRITING   = g('WRITING',   PROJECTS + '/Writing');
  const HOME      = g('HOME',      'Overview');   // overview note in each project folder

  const base = {
    PROJECTS, INBOX, CONTROL, BACKLOG, TEMPLATES, PHD, RESEARCH, WORK, PRACTICE,
    LANG, JOURNAL, CORPUS, LIFE, CAPTURE, ATTACH, WEREAD, CLIPPINGS, LIT, WRITING,
    HOME, HOME_MD: HOME + '.md',

    PROG:       'Progress.md',      // inside each project folder
    LOG:        'Activity.md',      //     ditto
    TASKDOCS:   'Detail',           //     ditto — task detail notes
    LEGACYDOCS: 'Archive',          // pre-existing task notes, searched as a fallback

    DAILY:      INBOX + '/Days',
    LIFELOG:    INBOX + '/Log',
    RNOTES:     INBOX + '/Jots',
    REVIEW_D:   INBOX + '/Review daily',
    REVIEW_W:   INBOX + '/Review weekly',
    WAITING:    INBOX + '/Pending.md',
    SCHEDULE:   INBOX + '/Days/Rhythm.md',

    PUNCH:      CONTROL + '/Clock.md',
    COUNTDOWN:  CONTROL + '/Dates.md',

    HUB:        PROJECTS + '/Index.md',
    DOCS:       PROJECTS + '/Shared',
    WRITE_PUB:  WRITING + '/Articles',
    WRITE_HOME: WRITING + '/' + HOME + '.md',

    SPEAKING:   PRACTICE + '/Speaking',
    ENLOG:      PRACTICE + '/Sessions.md',   // one document, one line per day
    WTTERMS:    PRACTICE + '/Terms.md',          // glossary you practise, editable by hand
    WTLOG:      PRACTICE + '/Writing log.md',    // what you wrote, by day
    WTINDEX:    PRACTICE + '/Writing index.json', // derived from Zotero, rebuilt when it changes
    ACADEMIC:   PRACTICE + '/Writing',

    ZOT_COLL:   'My Collection',    // Zotero collection to import
    ZOT_ROOT:   'Thesis',           // collection tree the writing drill reads, subcollections included
    ZOT_OUT:    LIT + '/Zotero',
    ZOT_THOUGHTS: LIT + '/Thoughts.md',   // what you wrote in Zotero, kept apart from the paper notes
    PHD_PAPER:  PHD + '/Drafts',

    QUESTION:   CAPTURE + '/Questions.md',
    SOMEDAY:    CAPTURE + '/Later.md',

    STATE:      ATTACH + '/.dashboard-state.json',
    BANNER:     ATTACH + '/banner.jpg',
  };
  // A leaf named directly in data.json wins over the derived value.
  for (const k in O) if (typeof O[k] === 'string' && O[k]) base[k] = O[k];
  return base;
})();

// The only personal string that is not a path.
const ME = { NAME: (CFG.me && CFG.me.NAME) || 'there' };

// Used only until a project note carrying a project_id turns up in the vault.
// Folder names are relative to V.PROJECTS.
const FALLBACK_PROJECT_NOTE_TARGETS = (CFG.projects || [
  ['alpha', 'Alpha', 'Alpha', 'active'],
  ['beta',  'Beta',  'Beta',  'planned'],
]).map(([id, label, dir, status]) => ({
  id, label, status,
  root: V.PROJECTS + '/' + dir,
  home: V.PROJECTS + '/' + dir + '/' + V.HOME,
}));

const vBase = p => String(p).split('/').pop().replace(/\.md$/, '');
const vEsc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const V_PROJ_HOME = new RegExp('^' + vEsc(V.PROJECTS) + '/.+/' + vEsc(V.HOME_MD) + '$');
const V_HOME_TAIL = new RegExp('/' + vEsc(V.HOME_MD) + '$');

// ── Banner image ───────────────────────────────────────────────
// V.BANNER, or else any banner.<image> in the attachments folder.
const _bannerFile = app.vault.getAbstractFileByPath(V.BANNER)
  || ['jpg', 'jpeg', 'png', 'webp', 'svg'].map(ext => app.vault.getAbstractFileByPath(V.ATTACH + '/banner.' + ext)).find(Boolean);
const _bannerSrc = _bannerFile
  ? app.vault.adapter.getResourcePath(_bannerFile.path) : '';

// ── Vault heatmap data ─────────────────────────────────────────
// Effort = tasks you actually finished + half a point per hour clocked.
// Thresholds come from the real spread of the last few months (median 3
// completions on an active day, 90th percentile 7):
//   0 · nothing   1 · <2   2 · <4   3 · <7   4 · 7+
// The previous scoring counted manuscript_words / papers_read / exercise /
// speech_practice, which were non-zero on 6 / 3 / 4 / 12 days out of 76 — the
// map was blank almost everywhere.
const _punchMins = {};
try {
  const _pd = await punchAllDays();
  _pd.forEach((d, i) => {
    const { spans } = punchDaySpans(_pd, i);
    _punchMins[d.date] = spans.reduce((a, sp) => a + Math.max(0, hMins(sp[1]) - hMins(sp[0])), 0);
  });
} catch (e) { console.error('punch mins', e); }

const _vaultHM = {};
try {
  const all = dv.pages('"' + V.DAILY + '"');
  const rawTasks = all && all.file && all.file.tasks;
  const donePerDay = {};
  for (const t of (rawTasks ? Array.from(rawTasks.values ?? rawTasks) : [])) {
    if (!t.completed) continue;
    const txt = String(t.text || '');
    const stamp = txt.match(/(?:✅|completed_at::)\s*(\d{4}-\d{2}-\d{2})/);
    const day = stamp ? stamp[1] : (String(t.path || '').match(/(\d{4}-\d{2}-\d{2})/) || [])[1];
    if (day) donePerDay[day] = (donePerDay[day] || 0) + 1;
  }
  for (const p of all) {
    const ds = p.file.name;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ds)) continue;
    const done = donePerDay[ds] || 0;
    const effort = done + ((_punchMins[ds] || 0) / 60) * 0.5;
    const sc = effort >= 7 ? 4 : effort >= 4 ? 3 : effort >= 2 ? 2 : effort >= 0.5 ? 1 : 0;
    if (sc > 0) _vaultHM[ds] = sc;
  }
} catch (e) { console.error('heatmap', e); }

window._db26_vaultHM = _vaultHM;

// Keep long-running timers tied to the Dataview/Obsidian component lifecycle.
const _setManagedInterval = (fn, delay) => {
  const intervalId = window.setInterval(fn, delay);
  try { dv.component?.registerInterval(intervalId); } catch (_e) {}
  return intervalId;
};

// Styles are loaded automatically from view.css by Dataview.

// ── HTML ────────────────────────────────────────────────────────
dv.container.innerHTML = `<div id="db26">

<div class="hero">
  <img class="hero-img" id="hero-img" src="${_bannerSrc}" alt="">
  <div class="hero-overlay">
    <div class="greeting" id="greeting"></div>
    <div class="date-line" id="date-line">Loading...</div>
    <div class="hero-quote" id="daily-quote"></div>
  </div>
</div>

<div class="heatmap-strip">
  <div class="hm-inner">
    <div class="hm-year">${new Date().getFullYear()}</div>
    <div class="heatmap-grid" id="hmap"></div>
  </div>
  <div class="hm-months"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span></div>
</div>

<div class="nav">
  <div class="nav-item active" data-action="nav" data-view="dashboard">Dashboard</div>
  <div class="nav-item" data-action="nav" data-view="knowledge">Files</div>
  <div class="nav-item" data-action="nav" data-view="projects">Projects</div>
  <div class="nav-item" data-action="nav" data-view="literature">Literature</div>
  <div class="nav-item" data-action="nav" data-view="reading">Reading</div>
  <div class="nav-item" data-action="nav" data-view="english">English</div>
  <div class="nav-item" data-action="nav" data-view="writing">Writing</div>
  <div class="nav-item" data-action="nav" data-view="time">Time</div>
</div>

<div id="view-dashboard" class="view active">
  <div class="layout">
    <div class="main">
      <div class="punch-row" id="punch-row"></div>
      <div class="two-col">
        <div class="card" style="padding:8px 12px">
          <div class="card-title" style="margin-bottom:6px">Today</div>
          <div class="task-add-row">
            <button id="task-context-dot" type="button" data-action="cycle-add-context" class="task-area-dot" title="Switch area or project" aria-label="Switch area or project"></button>
            <select id="task-context-select" class="task-context-select" aria-label="Pick area or project"></select>
            <input id="task-add-input" class="task-add-input" placeholder="">
          </div>
          <div id="task-list-single"></div>
        </div>
        <div class="card" id="pool-card" style="padding:8px 12px">
          <div class="card-title" style="margin-bottom:6px">Capture</div>
          <div class="task-add-row">
            <div id="pool-kind-toggle" data-action="cycle-pool-kind" class="kpi-tab" style="cursor:pointer;white-space:nowrap;min-width:96px;text-align:center" title="Switch: question / someday"></div>
            <input id="pool-add-input" class="task-add-input" placeholder="">
          </div>
          <div id="pool-list"></div>
        </div>
      </div>
      <div class="card" id="home-project-card" style="padding:8px 12px;margin-top:10px">
        <div class="card-title" style="margin-bottom:6px;display:flex;align-items:baseline;gap:8px;font-size:13px">
          <span>Project activity</span>
          <span class="card-sub" id="home-project-summary"></span>
          <span class="card-sub" data-action="nav" data-view="projects" style="margin-left:auto;cursor:pointer;color:var(--blue)">Full timeline →</span>
        </div>
        <div id="home-project-timeline" class="project-rollup-timeline"></div>
      </div>
    </div>
    <div class="sidebar">
      <div class="card">
        <div class="card-title">Countdown <span class="card-sub" data-action="add-countdown" style="cursor:pointer;color:var(--blue)">+ Add</span></div>
        <div id="countdown-list"></div>
      </div>
      <div class="card" id="waiting-card">
        <div class="card-title">Waiting for <span class="card-sub" data-action="open-vault" data-path="${V.WAITING}" style="cursor:pointer;color:var(--blue)">Open →</span></div>
        <div class="task-add-row">
          <input id="waiting-add-input" class="task-add-input" placeholder="">
        </div>
        <div id="waiting-list"></div>
      </div>
      <div class="card">
        <div class="card-title">Quick open</div>
        <div class="quick-links" id="quick-links"></div>
      </div>
    </div>
  </div>
</div>

<div id="view-knowledge" class="view"><div id="knowledge-map-mount"></div></div>

<div id="view-literature" class="view">
  <div class="portfolio-wrap">
    <div class="portfolio-head">
      <div class="back-btn" data-action="nav" data-view="dashboard" style="padding:0">← Dashboard</div>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="card-sub" id="lit-synced"></span>
        <button type="button" class="act-btn" data-action="lit-build" id="lit-build-btn" title="重新生成 Gap 合集、文献矩阵、标签合集与综述草稿笔记">更新合集</button>
        <button type="button" class="act-btn" data-action="zot-sync" id="lit-sync-btn">Sync Zotero</button>
      </div>
    </div>

    <div class="card rp-card">
      <div class="card-title">${esc(V.ZOT_COLL)} <span class="card-sub" id="lit-sub">Zotero collection</span></div>
      <div id="lit-stats" class="rp-stats"></div>
    </div>

    <div class="card rp-card">
      <div class="card-title" id="lit-view-title">Papers</div>
      <div id="lit-table" class="lit-table"></div>
    </div>
  </div>
</div>

<div id="view-reading" class="view">
  <div class="portfolio-wrap">
    <div class="portfolio-head">
      <div class="back-btn" data-action="nav" data-view="dashboard" style="padding:0">← Dashboard</div>
      <div class="act-btn" data-action="open-vault" data-path="${V.WEREAD}">Open library →</div>
    </div>

    <div class="card rp-card">
      <div class="card-title">Reading <span class="card-sub" id="rp-source">WeChat Reading</span></div>
      <div id="rp-stats" class="rp-stats"></div>
    </div>

    <div class="card rp-card">
      <div class="card-title">Recent
        <span class="card-sub">
          <span class="kpi-tab rp-ntab" data-action="rp-books" data-n="5">5</span>
          <span class="kpi-tab rp-ntab" data-action="rp-books" data-n="10">10</span>
        </span>
      </div>
      <div id="rp-recent" class="rp-recent"></div>
    </div>





  </div>
</div>

<div id="view-english" class="view">
  <div class="portfolio-wrap">
    <div class="portfolio-head">
      <div class="back-btn" data-action="nav" data-view="dashboard" style="padding:0">← Dashboard</div>
      <div class="act-btn" data-action="open-vault" data-path="${V.ENLOG}">Open log →</div>
    </div>
    <div id="english-body"></div>
  </div>
</div>

<div id="view-writing" class="view">
  <div class="portfolio-wrap">
    <div class="portfolio-head">
      <div class="back-btn" data-action="nav" data-view="dashboard" style="padding:0">← Dashboard</div>
    </div>
    <div id="writing-body"></div>
  </div>
</div>

<div id="view-time" class="view">
  <div class="portfolio-wrap">
    <div class="portfolio-head">
      <div class="back-btn" data-action="nav" data-view="dashboard" style="padding:0">← Dashboard</div>
      <div class="act-btn" data-action="open-vault" data-path="${V.SCHEDULE}">Schedule →</div>
    </div>
    <div id="health-body"></div>
  </div>
</div>

<div id="view-projects" class="view">
  <div class="portfolio-wrap">
    <div class="portfolio-head">
      <div class="back-btn" data-action="nav" data-view="dashboard" style="padding:0">← Dashboard</div>
      <div class="act-btn" data-action="open-vault" data-path="${V.HUB}">Open Project Hub →</div>
    </div>
    <div class="card project-activity-card">
      <div class="card-title">Project activity <span class="card-sub">tasks · notes · timeline</span></div>
      <div class="project-activity-layout">
        <div id="project-activity-projects" class="project-activity-projects"></div>
        <div class="project-activity-detail">
          <div id="project-activity-head" class="project-activity-head"></div>
          <div class="project-activity-capture">
            <input id="project-activity-input" class="task-add-input" placeholder="">
            <button class="project-activity-add secondary" data-action="project-activity-add-task" type="button" title="writes to today's Daily Note">Add task</button>
            <button class="project-activity-add" data-action="project-activity-add" type="button" title="writes to today's Life Log">Log progress</button>
          </div>
          <div id="project-activity-next" class="project-activity-next"></div>
          <div id="project-activity-events" class="project-activity-events"></div>
        </div>
      </div>
    </div>
    <div class="card project-rollup-card">
      <div class="project-rollup-head">
        <div class="card-title" style="margin:0">All-project timeline <span class="card-sub">all projects merged</span></div>
        <div id="project-rollup-periods" class="project-rollup-periods"></div>
      </div>
      <div id="project-rollup-summary" class="project-rollup-summary"></div>
      <div id="project-rollup-timeline" class="project-rollup-timeline"></div>
    </div>
  </div>
</div>
</div>`;

// ── JS ──────────────────────────────────────────────────────────
const VAULT = (app.vault.getName && app.vault.getName()) || '';
// ─ Cross-device synced state (persists to vault file, carried by any sync tool) ─
const STATE_PATH = V.STATE;
const STATE_KEYS = ['writing_baselines','daily_reviews','daily_notes','heatmap_2026','add_task_area','add_task_context','project_activity_selected','project_rollup_period','pool_mode','zot_synced_at','lit_mode','lit_tag','rp_books','hz_period','en_src','wt_pick','wt_tab','wt_ack'];
// localStorage is shared by every vault Obsidian opens, so keys carry this vault's id.
const LS_PREFIX = 'onedesk:' + (app.appId || VAULT) + ':';
const lsGet = k => localStorage.getItem(LS_PREFIX + k);
const lsSet = (k, v) => localStorage.setItem(LS_PREFIX + k, v);
let _stateCache = null;
let _stateDirty = false;
let _stateSaveTimer = null;

async function loadStateFromVault() {
  if (_stateCache) return _stateCache;
  try {
    if (await app.vault.adapter.exists(STATE_PATH)) {
      _stateCache = JSON.parse(await app.vault.adapter.read(STATE_PATH));
      return _stateCache;
    }
  } catch(e) { console.error('[db26] loadState', e); }
  // first time: bootstrap from this device's localStorage (whitelisted keys)
  _stateCache = {};
  for (const k of STATE_KEYS) {
    try {
      const v = lsGet(k);
      if (v != null) _stateCache[k] = JSON.parse(v);
    } catch(_e){}
  }
  _stateDirty = true;
  saveStateToVault();
  return _stateCache;
}
async function saveStateToVault() {
  if (!_stateDirty || !_stateCache) return;
  _stateDirty = false;
  try {
    try { await app.vault.adapter.mkdir(V.ATTACH); } catch(_e){}
    await app.vault.adapter.write(STATE_PATH, JSON.stringify(_stateCache));
  } catch(e) { console.error('[db26] saveState', e); _stateDirty = true; }
}

const LS  = (k,d) => {
  if (_stateCache != null) {
    return _stateCache[k] != null ? _stateCache[k] : d;
  }
  try { return JSON.parse(lsGet(k)) ?? d; } catch { return d; }
};
const LSS = (k,v) => {
  // Only whitelisted keys sync to the shared vault state file; everything else
  // stays device-local so the synced JSON doesn't accumulate stray keys.
  if (_stateCache != null && STATE_KEYS.includes(k)) {
    _stateCache[k] = v;
    _stateDirty = true;
    if (_stateSaveTimer) clearTimeout(_stateSaveTimer);
    _stateSaveTimer = setTimeout(saveStateToVault, 500);
  }
  // also write to localStorage as warm cache (fast read before vault load)
  try { lsSet(k, JSON.stringify(v)); } catch(_e){}
};
function dateKey(date = new Date()) {
  const d = new Date(date);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function addDays(date, delta) {
  const d = new Date(date);
  d.setDate(d.getDate() + delta);
  return d;
}
function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[ch]));
}
function safePct(v) {
  const n = Number(v) || 0;
  return Math.max(0, Math.min(100, n));
}

// ── Daily-note paths ────────────────────────────────────────────
// Obsidian's own Daily notes setting is the single source of truth: its date
// format doubles as a path, so `YYYY-MM/YYYY-MM-DD` files straight into a
// month folder. Reading it here means the dashboard can never disagree with
// the core plugin about where today's note lives.
function dailyOpts() {
  try {
    const inst = app.internalPlugins?.getPluginById?.('daily-notes')?.instance;
    const o = inst?.options || {};
    return { folder: (o.folder || V.DAILY).replace(/\/+$/, ''), format: o.format || 'YYYY-MM-DD' };
  } catch (_e) { return { folder: V.DAILY, format: 'YYYY-MM-DD' }; }
}

// Only the tokens a date-as-path can contain; anything else is left alone.
function fmtDate(dateStr, format) {
  const [y, m, d] = dateStr.split('-');
  return format
    .replace(/YYYY/g, y).replace(/MM/g, m).replace(/DD/g, d)
    .replace(/YY(?!YY)/g, y.slice(2));
}

// The folder part of the daily format, e.g. 'YYYY/MM' -> '2026/09/'. Empty when flat.
function datedSubfolder(dateStr) {
  const parts = dailyOpts().format.split('/');
  if (parts.length < 2) return '';
  return fmtDate(dateStr, parts.slice(0, -1).join('/')) + '/';
}

// Where a new note for this date should be written.
function dailyNotePath(dateStr) {
  const { folder, format } = dailyOpts();
  return folder + '/' + fmtDate(dateStr, format) + '.md';
}

// Where the note for this date actually is — the configured spot, or the flat
// fallback for notes written before the format changed.
function findDailyNote(dateStr) {
  const { folder } = dailyOpts();
  for (const p of [dailyNotePath(dateStr),
                   folder + '/' + dateStr + '.md',
                   folder + '/' + dateStr.slice(0, 7) + '/' + dateStr + '.md',
                   folder + '/' + dateStr.slice(0, 4) + '/' + dateStr.slice(5, 7) + '/' + dateStr + '.md']) {
    const f = app.vault.getAbstractFileByPath(p);
    if (f) return f;
  }
  return null;
}

// Files the dashboard only opens (reviews, research notes) live under the same
// dated subfolder, but may still be flat until 'Archive old' sweeps them.
function datedPath(folder, dateStr, suffix) {
  return folder + '/' + datedSubfolder(dateStr) + dateStr + suffix + '.md';
}
function findDated(folder, dateStr, suffix) {
  const cands = [datedPath(folder, dateStr, suffix),
    folder + '/' + dateStr + suffix + '.md',
    folder + '/' + dateStr.slice(0, 7) + '/' + dateStr + suffix + '.md'];
  for (const p of cands) if (app.vault.getAbstractFileByPath(p)) return p;
  return cands[0];   // does not exist yet — point at where it should go
}

// Life log follows whatever shape the daily notes use, so the two stay in step.
function lifeLogPath(dateStr) {
  return V.LIFELOG + '/' + datedSubfolder(dateStr) + dateStr + ' life log.md';
}
function findLifeLog(dateStr) {
  for (const p of [lifeLogPath(dateStr),
                   V.LIFELOG + '/' + dateStr + ' life log.md',
                   V.LIFELOG + '/' + dateStr.slice(0, 7) + '/' + dateStr + ' life log.md',
                   V.LIFELOG + '/' + dateStr.slice(0, 4) + '/' + dateStr.slice(5, 7) + '/' + dateStr + ' life log.md']) {
    const f = app.vault.getAbstractFileByPath(p);
    if (f) return f;
  }
  return null;
}
function todayStr(){ return dateKey(); }

// Daily Notes are kept at the root while active, then moved into YYYY-MM subfolders,
// so the lookup falls back to a cached scan of the folder rather than a fixed path.
let _dailyFileList = null;
function invalidateDailyPages(){ _dailyFileList = null; }
function dailyFile(dateStr) {
  const active = findDailyNote(dateStr);
  if (active) return active;
  if (!_dailyFileList) {
    _dailyFileList = app.vault.getMarkdownFiles().filter(f => f.path.startsWith(V.DAILY + '/'));
  }
  return _dailyFileList.find(f => f.basename === dateStr) || null;
}


// Create a note unless it exists. Two renders can reach here for the same file at once;
// the one that loses the race gets the winner's file instead of "File already exists".
async function ensureVaultFile(path, body, folder) {
  const found = app.vault.getAbstractFileByPath(path);
  if (found) return found;
  if (folder) { try { await app.vault.createFolder(folder); } catch (_e) {} }
  try { return await app.vault.create(path, body); }
  catch (e) {
    const existing = app.vault.getAbstractFileByPath(path);
    if (existing) return existing;
    throw e;
  }
}

// Read a template's body (returns string), strip the YAML front-matter? — keep it, since
// new notes often want the same fields. Caller can decide.
async function readTemplate(name) {
  const f = app.vault.getAbstractFileByPath(V.TEMPLATES + '/' + name + '.md');
  if (!f) { new Notice('Template not found: ' + name); return null; }
  return await app.vault.read(f);
}

// Ensure today's Daily Note exists; if not, create from template. Returns TFile.
async function ensureTodayDaily() {
  const today = todayStr();
  const path = dailyNotePath(today);
  let f = findDailyNote(today);
  if (f) return f;
  let body = await readTemplate('Daily Note Template');
  if (body == null) {
    if (typeof Notice !== 'undefined') new Notice('⚠️ Daily Note 模板读取失败，请检查模板文件是否存在，或同步是否已完成。');
    return null;
  }
  // substitute all {{date:YYYY-MM-DD}} placeholders (frontmatter + wikilinks + body)
  body = body.replace(/\{\{\s*date:YYYY-MM-DD\s*\}\}/g, today);
  const dir = path.slice(0, path.lastIndexOf('/'));
  try { await app.vault.createFolder(dir); } catch (_e) {}
  return await app.vault.create(path, body);
}

// Append a `- HH:mm · …` line to the end of a life log file.
async function appendLifeLogLine(file, entryLine) {
  const txt = await app.vault.read(file);
  await app.vault.modify(file, txt.replace(/\s*$/, '') + '\n' + entryLine + '\n');
}

// Prompt for one short life log entry, append `- HH:mm · text` to today's life log.
async function appendLifeLogEntry() {
  const text = await db26Prompt('Add a life log line (timestamped):');
  if (!text || !text.trim()) return;
  const f = await ensureTodayFile('life-log');
  const now = new Date();
  const stamp = pad(now.getHours()) + ':' + pad(now.getMinutes());
  await appendLifeLogLine(f, `- ${stamp} · ${text.trim()}`);
  new Notice('已追加：' + stamp);
}

// Ensure today's life-log or daily-review file exists; create from template if not.
async function ensureTodayFile(kind) {
  const today = todayStr();
  let path, tplName;
  if (kind === 'life-log') {
    path = lifeLogPath(today);
    tplName = 'Life Log Template';
  } else {
    throw new Error('ensureTodayFile: unknown kind ' + kind);
  }
  let f = (kind === 'life-log') ? findLifeLog(today) : app.vault.getAbstractFileByPath(path);
  if (f) return f;
  let body = await readTemplate(tplName);
  if (body == null) body = '# ' + today + '\n';
  // substitute Obsidian core date placeholders (Templater syntax `{{date:fmt}}`)
  const hh = pad(new Date().getHours()), mm = pad(new Date().getMinutes());
  body = body.replace(/\{\{\s*date:YYYY-MM-DD\s*\}\}/g, today);
  body = body.replace(/\{\{\s*time:HH:mm\s*\}\}/g, hh + ':' + mm);
  // ensure folder
  const folder = path.substring(0, path.lastIndexOf('/'));
  try { await app.vault.createFolder(folder); } catch(_e){}
  return await app.vault.create(path, body);
}

// Create note from template, prompt user for name.
async function createFromTemplate(tplName, folder, promptLabel, opener) {
  const name = await db26Prompt(promptLabel || 'Note name:');
  if (!name) return;
  const safeName = name.replace(/[\\/:*?"<>|]/g,'_').trim();
  const path = folder + '/' + safeName + '.md';
  const existing = app.vault.getAbstractFileByPath(path);
  if (existing) { app.workspace.openLinkText(path,'',false); return; }
  const body = (await readTemplate(tplName)) || ('# ' + safeName + '\n');
  // simple {{Paper Title}} / {{Year}} substitution
  const year = new Date().getFullYear();
  const filled = body.replace(/\{\{\s*Paper Title\s*\}\}/g, safeName)
                     .replace(/\{\{\s*Title\s*\}\}/g, safeName)
                     .replace(/\{\{\s*Year\s*\}\}/g, year)
                     .replace(/\{\{\s*Date\s*\}\}/g, todayStr());
  // Ensure target folder exists (Obsidian auto-creates parent folder on create() if vault adapter does)
  try { await app.vault.createFolder(folder); } catch(_e){}
  await app.vault.create(path, filled);
  app.workspace.openLinkText(path, '', false);
}

// Append a single bullet line into the named ## section of `file`.
// Creates the section at the end if missing.
async function appendToSection(file, headingText, line) {
  const txt = await app.vault.read(file);
  const heading = '## ' + headingText;
  const lines = txt.split('\n');
  const startIdx = lines.findIndex(l => l.trim() === heading);
  if (startIdx === -1) {
    const sep = txt.endsWith('\n') ? '' : '\n';
    await app.vault.modify(file, txt + sep + '\n' + heading + '\n' + line + '\n');
    return;
  }
  let endIdx = lines.length;
  for (let i = startIdx+1; i < lines.length; i++) {
    if (/^#{1,6}\s/.test(lines[i])) { endIdx = i; break; }
  }
  let insertAt = endIdx;
  while (insertAt > startIdx+1 && lines[insertAt-1].trim() === '') insertAt--;
  lines.splice(insertAt, 0, line);
  await app.vault.modify(file, lines.join('\n'));
}


const pad = n => String(n).padStart(2,'0');
// Scope element lookup to this dashboard instance. Hidden legacy tabs may contain
// the same IDs, so querying the whole document can update the wrong dashboard.
const $ = id => dv.container.querySelector(`#${CSS.escape(id)}`);
const WEEKDAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS   = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const QUOTES   = [
  'The secret of getting ahead is getting started.',
  'Focus is saying no to a thousand things.',
  'Small consistent steps beat occasional heroic efforts.',
  'Write the paper. Run the experiment. Ship the code.',
  'Progress is not always visible — but it accumulates.',
];

function getISOWeekInfo(d) {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  x.setUTCDate(x.getUTCDate() + 4 - (x.getUTCDay()||7));
  return {
    year: x.getUTCFullYear(),
    week: Math.ceil((((x - new Date(Date.UTC(x.getUTCFullYear(),0,1)))/86400000)+1)/7),
  };
}
function getWeek(d) { return getISOWeekInfo(d).week; }
function getWeekYear(d) { return getISOWeekInfo(d).year; }

// ─ Hero ─────────────────────────────────────────────────────────
function initHero() {
  const now = new Date(), h = now.getHours();
  const greet = h<5?'Good night':h<12?'Good morning':h<18?'Good afternoon':'Good evening';
  if ($('greeting')) $('greeting').textContent = greet + ', ' + ME.NAME + ' ☀️';
  const day = Math.floor((now - new Date(now.getFullYear(),0,0)) / 86400000);
  const total = new Date(now.getFullYear(), 1, 29).getMonth() === 1 ? 366 : 365;
  const getDateTxt = () => WEEKDAYS[new Date().getDay()] + ', ' + MONTHS[new Date().getMonth()] + ' ' + new Date().getDate() + ', ' + new Date().getFullYear()
    + '   ·   Week ' + getWeek(new Date()) + '   ·   Day ' + day + ' of ' + total
    + '   ·   ' + pad(new Date().getHours()) + ':' + pad(new Date().getMinutes());
  if ($('date-line'))   $('date-line').textContent = getDateTxt();
  if ($('daily-quote')) $('daily-quote').textContent = '"' + QUOTES[day % QUOTES.length] + '"';
  _setManagedInterval(() => { if ($('date-line')) $('date-line').textContent = getDateTxt(); }, 10000);
}

// ─ Heatmap ──────────────────────────────────────────────────────
function buildHeatmap() {
  const hmap = $('hmap'); if (!hmap) return;
  // Dataview can schedule several refreshes close together. Make rendering
  // idempotent instead of appending another full year on every refresh.
  hmap.replaceChildren();
  const stored  = LS('heatmap_2026', {});
  const vaultHM = window._db26_vaultHM || {};
  const merged  = Object.assign({}, stored);
  for (const [k,v] of Object.entries(vaultHM)) merged[k] = Math.max(merged[k]||0, v);
  // The Monday on or before 1 January of this year.
  const jan1 = new Date(new Date().getFullYear(), 0, 1);
  const start = new Date(jan1); start.setDate(1 - (jan1.getDay() + 6) % 7);
  for (let i = 0; i < 364; i++) {
    const d   = new Date(start); d.setDate(d.getDate()+i);
    const key = dateKey(d);
    const v   = merged[key]||0;
    const cell = document.createElement('div');
    cell.className = 'hm-cell' + (v>0?' hm-l'+Math.min(v,4):'');
    cell.title = key + (v?' · level '+v:'');
    cell.addEventListener('click', e => {
      e.stopPropagation();
      const cur = stored[key]||0; stored[key]=(cur+1)%5; LSS('heatmap_2026',stored);
      cell.className = 'hm-cell'+(stored[key]>0?' hm-l'+Math.min(stored[key],4):'');
    });
    hmap.appendChild(cell);
  }
}

// ─ Custom modal helpers (replaces window.prompt/confirm which Obsidian blocks)
function db26Prompt(label, defaultVal) {
  return new Promise(resolve => {
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:Inter,-apple-system,"PingFang SC",sans-serif';
    ov.innerHTML = `<div style="background:#fff;border-radius:8px;padding:20px;min-width:360px;box-shadow:0 6px 24px rgba(0,0,0,.25)">
      <div style="font-size:15px;color:#333;margin-bottom:10px;white-space:pre-wrap">${String(label).replace(/[&<>]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]))}</div>
      <input type="text" value="${esc(defaultVal||'')}" style="width:100%;padding:7px 10px;border:1px solid #ccc;border-radius:5px;font-size:15px;outline:none;box-sizing:border-box">
      <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end">
        <button data-act="c" style="padding:6px 14px;border-radius:5px;border:1px solid #ccc;background:#fff;cursor:pointer;font-size:14px">Cancel</button>
        <button data-act="o" style="padding:6px 14px;border-radius:5px;border:none;background:#1a1a1a;color:#fff;cursor:pointer;font-size:14px">OK</button>
      </div></div>`;
    document.body.appendChild(ov);
    const inp = ov.querySelector('input');
    setTimeout(()=>{ inp.focus(); inp.select(); }, 0);
    const close = (v) => { ov.remove(); resolve(v); };
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); close(inp.value); }
      if (e.key === 'Escape') { e.preventDefault(); close(null); }
    });
    ov.querySelector('[data-act="o"]').addEventListener('click', () => close(inp.value));
    ov.querySelector('[data-act="c"]').addEventListener('click', () => close(null));
    ov.addEventListener('click', e => { if (e.target === ov) close(null); });
  });
}
function db26Confirm(message, okLabel) {
  return new Promise(resolve => {
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:Inter,-apple-system,"PingFang SC",sans-serif';
    ov.innerHTML = `<div style="background:#fff;border-radius:8px;padding:20px;min-width:360px;max-width:480px;box-shadow:0 6px 24px rgba(0,0,0,.25)">
      <div style="font-size:15px;color:#333;margin-bottom:14px;white-space:pre-wrap;line-height:1.55">${String(message).replace(/[&<>]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]))}</div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button data-act="c" style="padding:6px 14px;border-radius:5px;border:1px solid #ccc;background:#fff;cursor:pointer;font-size:14px">Cancel</button>
        <button data-act="o" style="padding:6px 14px;border-radius:5px;border:none;background:#e53935;color:#fff;cursor:pointer;font-size:14px">${okLabel||'OK'}</button>
      </div></div>`;
    document.body.appendChild(ov);
    const close = (v) => { ov.remove(); resolve(v); };
    ov.querySelector('[data-act="o"]').addEventListener('click', () => close(true));
    ov.querySelector('[data-act="c"]').addEventListener('click', () => close(false));
    ov.addEventListener('click', e => { if (e.target === ov) close(false); });
  });
}
function db26PickVaultFile(){
  return new Promise(resolve=>{
    const files=app.vault.getFiles()
      .filter(file=>['md','pdf','canvas'].includes(String(file.extension||'').toLowerCase()))
      .sort((a,b)=>(b.stat?.mtime||0)-(a.stat?.mtime||0));
    const ov=document.createElement('div');
    ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:Inter,-apple-system,\"PingFang SC\",sans-serif';
    ov.innerHTML=`<div style="background:var(--background-primary,#fff);color:var(--text-normal,#222);border:1px solid var(--background-modifier-border,#ddd);border-radius:10px;padding:16px;width:min(620px,calc(100vw - 32px));box-shadow:0 8px 32px rgba(0,0,0,.3)">
      <div style="font-size:15px;font-weight:600;margin-bottom:9px">Link a paper or doc</div>
      <input type="text" placeholder="Search by title or path…" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid var(--background-modifier-border,#ccc);border-radius:6px;background:var(--background-secondary,#f7f7f7);color:inherit;font-size:14px;outline:none">
      <div data-results style="height:320px;overflow:auto;margin-top:8px;border-top:1px solid var(--background-modifier-border,#ddd)"></div>
      <div style="display:flex;justify-content:flex-end;margin-top:10px"><button data-cancel style="padding:5px 12px">Cancel</button></div>
    </div>`;
    document.body.appendChild(ov);
    const input=ov.querySelector('input'),results=ov.querySelector('[data-results]');
    const close=value=>{ov.remove();resolve(value);};
    const render=()=>{
      const q=input.value.trim().toLowerCase();
      const matched=files.filter(file=>!q||file.path.toLowerCase().includes(q))
        .sort((a,b)=>{
          if(!q) return (b.stat?.mtime||0)-(a.stat?.mtime||0);
          const an=a.basename.toLowerCase().startsWith(q)?0:1,bn=b.basename.toLowerCase().startsWith(q)?0:1;
          return an-bn||a.path.length-b.path.length;
        }).slice(0,60);
      results.innerHTML=matched.length?matched.map(file=>`<div data-file="${esc(file.path)}" style="padding:7px 5px;border-bottom:1px solid var(--background-modifier-border,#eee);cursor:pointer">
        <div style="font-size:13px;color:var(--text-normal,#222);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${file.extension==='pdf'?'📄':'📝'} ${esc(file.basename)}</div>
        <div style="font-size:10px;color:var(--text-muted,#888);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px">${esc(file.path)}</div>
      </div>`).join(''):'<div style="font-size:12px;color:var(--text-muted,#888);padding:12px 5px">No match</div>';
      results.querySelectorAll('[data-file]').forEach(row=>row.addEventListener('click',()=>close(row.dataset.file)));
    };
    input.addEventListener('input',render);
    input.addEventListener('keydown',event=>{if(event.key==='Escape')close(null);});
    ov.querySelector('[data-cancel]').addEventListener('click',()=>close(null));
    ov.addEventListener('click',event=>{if(event.target===ov)close(null);});
    render();
    setTimeout(()=>input.focus(),0);
  });
}

function openVault(path) {
  const af = app.vault.getAbstractFileByPath(path);
  // Folder: reveal in the file-explorer side panel (NOT openLinkText — that would create a new note)
  if (af && af.children !== undefined) {
    try {
      const leaf = app.workspace.getLeavesOfType('file-explorer')[0];
      if (leaf && leaf.view && typeof leaf.view.revealInFolder === 'function') {
        app.workspace.revealLeaf(leaf);
        leaf.view.revealInFolder(af);
        return;
      }
    } catch(_e){}
    // fallback: open the most-recently-modified markdown inside the folder
    const mds = (af.children||[]).filter(c => c.extension === 'md');
    if (mds.length) {
      mds.sort((a,b)=>(b.stat?.mtime||0)-(a.stat?.mtime||0));
      app.workspace.openLinkText(mds[0].path, '', false);
      return;
    }
    if (typeof Notice !== 'undefined') new Notice('空文件夹：' + path);
    return;
  }
  // File / link — open normally
  try {
    app.workspace.openLinkText(path, '', false);
  } catch(e) {
    window.open('obsidian://open?vault='+encodeURIComponent(VAULT)+'&file='+encodeURIComponent(path));
  }
}


// ─ Project portfolio: one source of truth in project frontmatter + 项目总览.md ─
function taskCompletionStamp(t){
  const exact=String(t?.text||'').match(/\[completed_at::\s*(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\]/i);
  if(exact) return {day:exact[1],time:exact[2]};
  const match=String(t?.text||'').match(/✅\s*(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2}))?/);
  if(match) return {day:match[1],time:match[2]||''};
  const day=taskCompletionDay(t);
  return day?{day,time:''}:null;
}
function taskIsRetired(t){
  const value=String(taskInlineField(t,'task_status')||'').toLowerCase();
  return ['cancelled','superseded','merged','converted-to-reference'].includes(value);
}
function projectTimelineDateLabel(day){
  const date=new Date(day+'T00:00:00');
  if(Number.isNaN(date.getTime())) return day;
  return date.toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'long'});
}
function activeProjectCards(targets){
  return ACTIVE_PROJECT_BOARD_IDS.map(id=>targets.find(item=>item.id===id))
    .filter(Boolean).map(target=>({...target,projectId:target.id,cardId:target.id}));
}
function taskBelongsToProjectCard(task,target){
  return taskProjectId(task)===String(target.projectId||target.id);
}
// The standalone project board was removed from the dashboard HTML; task mutations
// still call this to refresh the Project Activity view when it is mounted.
function loadActiveProjectBoard(){
  loadProjectActivity().catch(error=>console.error('[db26 project activity]',error));
  loadHomeProjectTimeline().catch(error=>console.error('[db26 home project timeline]',error));
}

// ─ Home "项目动态": today's project events; for projects idle today, their latest event ─
let _homeTlLogMap=null, _homeTlAt=0;
async function loadHomeProjectTimeline(){
  const box=$('home-project-timeline'); if(!box) return;
  const summary=$('home-project-summary');
  const today=todayStr();
  const cards=activeProjectCards(projectNoteTargets());
  if(!cards.length){ box.innerHTML=''; if(summary) summary.textContent=''; return; }
  const byId=new Map(cards.map(c=>[c.cardId||c.id,c]));
  const perProject=new Map(cards.map(c=>[c.cardId||c.id,[]]));

  // completed project tasks (all history)
  let tasks=[]; try{tasks=dv.pages('"'+V.DAILY+'"').file.tasks.values;}catch(_e){}
  for(const t of tasks){
    if(!t.completed) continue;
    const card=byId.get(taskProjectId(t)); if(!card) continue;
    const stamp=taskCompletionStamp(t); if(!stamp) continue;
    perProject.get(card.cardId||card.id).push({kind:'task',day:stamp.day,time:stamp.time,id:card.cardId||card.id,label:card.label,title:cleanTaskText(t.text),path:t.path});
  }
  // project life-log lines — cached ~20s so rapid task toggles don't re-scan 90 files
  try{
    let logMap=_homeTlLogMap;
    if(!logMap||Date.now()-_homeTlAt>20000){ logMap=await collectProjectActivityLogs(cards); _homeTlLogMap=logMap; _homeTlAt=Date.now(); }
    for(const [id,arr] of logMap){
      const card=byId.get(id); if(!card) continue;
      for(const ev of arr) perProject.get(id).push({kind:'log',day:ev.day,time:ev.time,id,label:card.label,title:ev.title,path:ev.path});
    }
  }catch(e){ console.error('[db26 home project timeline]',e); }

  const chosen=[];
  for(const [,arr] of perProject){
    if(!arr.length) continue;
    arr.sort((a,b)=>(b.day+' '+(b.time||'00:00')).localeCompare(a.day+' '+(a.time||'00:00')));
    const todayEv=arr.filter(e=>e.day===today);
    chosen.push(...(todayEv.length?todayEv:[arr[0]]));
  }
  chosen.sort((a,b)=>(b.day+' '+(b.time||'00:00')).localeCompare(a.day+' '+(a.time||'00:00')));

  const projectCount=new Set(chosen.map(e=>e.id)).size;
  const todayCount=chosen.filter(e=>e.day===today).length;
  if(summary) summary.textContent=chosen.length?`${projectCount} 项目 · 今日 ${todayCount}`:'';
  if(!chosen.length){ box.innerHTML='<div class="project-activity-empty">No project activity yet.</div>'; return; }
  let previousDay='';
  box.innerHTML=chosen.slice(0,16).map(e=>{
    const color=PROJECT_BOARD_COLORS[e.id]||'var(--blue)';
    const dayHeader=e.day!==previousDay?`<div class="project-rollup-day"><span>${esc(projectTimelineDateLabel(e.day))}</span></div>`:'';
    previousDay=e.day;
    return `${dayHeader}<div class="project-rollup-event">
      <div class="project-rollup-time">${esc(e.time||'—:—')}</div>
      <span class="project-rollup-dot" style="background:${color}"></span>
      <div class="project-rollup-event-body">
        <div class="project-rollup-event-top"><span class="project-rollup-project" style="color:${color}">${esc(e.label)}</span><span class="project-rollup-kind">${e.kind==='task'?'完成任务':'执行记录'}</span></div>
        <div class="project-rollup-title">${esc(e.title)}</div>
      </div>
      ${e.path?`<span class="project-rollup-source" data-action="open-vault" data-path="${esc(e.path)}">Source ↗</span>`:'<span></span>'}
    </div>`;
  }).join('');
}

let _projectActivityLoadToken=0;
function projectActivityLinkMatcher(path){
  return new RegExp('\\s*\\[\\['+String(path||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?:\\|[^\\]]+)?\\]\\]','g');
}
function projectActivityCleanLogText(text,card){
  let value=String(text||'').replace(projectActivityLinkMatcher(card.home),' ');
  const base=card.projectId&&card.projectId!==card.id?projectNoteTargets().find(item=>item.id===card.projectId):null;
  if(base?.home) value=value.replace(projectActivityLinkMatcher(base.home),' ');
  return value.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,(_m,path,label)=>label||taskRefLabel(path))
    .replace(/\s+/g,' ').trim();
}
async function collectProjectActivityLogs(cards){
  const result=new Map(cards.map(card=>[card.cardId||card.id,[]]));
  const files=app.vault.getMarkdownFiles()
    .filter(file=>file.path.startsWith(V.LIFELOG + '/'))
    .sort((a,b)=>(b.basename||'').localeCompare(a.basename||''))
    .slice(0,90);
  await Promise.all(files.map(async file=>{
    const day=(file.basename.match(/\d{4}-\d{2}-\d{2}/)||[])[0];
    if(!day) return;
    let content=''; try{content=await app.vault.cachedRead(file);}catch(_e){return;}
    for(const line of content.split('\n')){
      const match=line.match(/^\s*>?\s*-\s*(\d{2}:\d{2})\s*·\s*(.+)$/);
      if(!match) continue;
      for(const card of cards){
        if(!line.includes('[['+card.home)) continue;
        result.get(card.cardId||card.id).push({
          kind:'log',day,time:match[1],title:projectActivityCleanLogText(match[2],card),path:file.path
        });
      }
    }
  }));
  return result;
}
function projectActivityTaskEvents(card,tasks){
  return tasks.filter(task=>taskBelongsToProjectCard(task,card)&&task.completed&&!taskIsRetired(task))
    .map(task=>{
      const stamp=taskCompletionStamp(task); if(!stamp) return null;
      return {kind:'task',day:stamp.day,time:stamp.time,title:cleanTaskText(task.text),note:taskNote(task),task,path:task.path};
    }).filter(Boolean);
}
function projectActivityOpenTasks(card,tasks){
  return tasks.filter(task=>taskBelongsToProjectCard(task,card)&&!task.completed&&!taskIsRetired(task))
    .sort((a,b)=>(taskPlannedDay(a)||'9999').localeCompare(taskPlannedDay(b)||'9999'));
}
function renderProjectActivityEvents(events){
  if(!events.length) return '<div class="project-activity-empty">No progress logged yet.</div>';
  let previousDay='';
  return events.slice(0,80).map(event=>{
    const dayHeader=event.day!==previousDay?`<div class="project-activity-day">${esc(projectTimelineDateLabel(event.day))}</div>`:'';
    previousDay=event.day;
    const task=event.task;
    const actions=event.kind==='task'
      ? `<span data-action="open-vault" data-path="${esc(event.path)}">Open source</span><span data-action="open-task-doc" data-path="${esc(task.path)}" data-line="${task.line}">${taskInlineField(task,'doc')?'Open task doc':'Create task doc'}</span><span data-action="attach-task-ref" data-path="${esc(task.path)}" data-line="${task.line}">Linked doc</span><span data-action="edit-task-note" data-path="${esc(task.path)}" data-line="${task.line}" data-note="${esc(event.note||'')}">Note</span><span data-action="delete-vault-task" data-path="${esc(task.path)}" data-line="${task.line}">Delete</span>`
      : `<span data-action="open-vault" data-path="${esc(event.path)}">Open Life Log</span>`;
    return `${dayHeader}<div class="project-activity-event">
      <span class="project-activity-event-dot ${event.kind}"></span>
      <div class="project-activity-time">${esc(event.time||'—:—')}</div>
      <div class="project-activity-event-body">
        <div class="project-activity-kind">${event.kind==='task'?'完成任务':'执行记录'}</div>
        <div class="project-activity-title">${esc(event.title)}</div>
        ${event.note?`<div class="project-activity-note">${esc(event.note)}</div>`:''}
        ${event.kind==='task'?renderTaskLinks(task):''}
        <div class="project-activity-actions">${actions}</div>
      </div>
    </div>`;
  }).join('');
}
let _projectRollupModels=[];
function renderProjectRollup(models=_projectRollupModels){
  const periodsBox=$('project-rollup-periods'),summary=$('project-rollup-summary'),timeline=$('project-rollup-timeline');
  if(!periodsBox||!summary||!timeline) return;
  _projectRollupModels=models||[];
  const periods=[['7','7 天'],['30','30 天'],['all','全部']];
  if(!periods.some(([key])=>key===_projectRollupPeriod)) _projectRollupPeriod='30';
  periodsBox.innerHTML=periods.map(([key,label])=>`<span class="project-rollup-period${_projectRollupPeriod===key?' active':''}" data-action="project-rollup-period" data-period="${key}">${label}</span>`).join('');
  const cutoff=_projectRollupPeriod==='all'?'0000-00-00':dateKey(addDays(new Date(),-(Number(_projectRollupPeriod)-1)));
  const events=[];
  for(const model of _projectRollupModels){
    const color=PROJECT_BOARD_COLORS[model.id]||'var(--blue)';
    for(const event of model.events){
      if(event.day<cutoff) continue;
      events.push({...event,projectId:model.id,projectLabel:model.card.label,color});
    }
  }
  events.sort((a,b)=>(b.day+' '+(b.time||'00:00')).localeCompare(a.day+' '+(a.time||'00:00')));
  const projectCount=new Set(events.map(event=>event.projectId)).size;
  const taskCount=events.filter(event=>event.kind==='task').length;
  const logCount=events.filter(event=>event.kind==='log').length;
  const periodLabel=periods.find(([key])=>key===_projectRollupPeriod)?.[1]||'30 天';
  summary.innerHTML=`<span>${esc(periodLabel)}</span><span>${projectCount} 个项目</span><span>${events.length} 条进度</span><span>${taskCount} 项完成</span><span>${logCount} 条执行记录</span>`;
  if(!events.length){timeline.innerHTML='<div class="project-activity-empty">No progress in this period.</div>';return;}
  let previousDay='';
  timeline.innerHTML=events.slice(0,180).map(event=>{
    const dayHeader=event.day!==previousDay?`<div class="project-rollup-day"><span>${esc(projectTimelineDateLabel(event.day))}</span></div>`:'';
    previousDay=event.day;
    return `${dayHeader}<div class="project-rollup-event">
      <div class="project-rollup-time">${esc(event.time||'—:—')}</div>
      <span class="project-rollup-dot" style="background:${event.color}"></span>
      <div class="project-rollup-event-body">
        <div class="project-rollup-event-top"><span class="project-rollup-project" style="color:${event.color}">${esc(event.projectLabel)}</span><span class="project-rollup-kind">${event.kind==='task'?'完成任务':'执行记录'}</span></div>
        <div class="project-rollup-title">${esc(event.title)}</div>
        ${event.note?`<div class="project-rollup-note">${esc(event.note)}</div>`:''}
      </div>
      <span class="project-rollup-source" data-action="open-vault" data-path="${esc(event.path)}">Source ↗</span>
    </div>`;
  }).join('');
}
async function loadProjectActivity(){
  const projectBox=$('project-activity-projects'),head=$('project-activity-head'),nextBox=$('project-activity-next'),eventsBox=$('project-activity-events');
  if(!projectBox||!head||!nextBox||!eventsBox) return;
  const token=++_projectActivityLoadToken;
  let tasks=[]; try{tasks=dv.pages('"' + V.DAILY + '"').file.tasks.values;}catch(_e){}
  const cards=activeProjectCards(projectNoteTargets());
  if(!cards.length) return;
  if(!cards.some(card=>(card.cardId||card.id)===_projectActivitySelected)) _projectActivitySelected=cards[0].cardId||cards[0].id;
  const logMap=await collectProjectActivityLogs(cards);
  if(token!==_projectActivityLoadToken) return;
  const models=cards.map(card=>{
    const id=card.cardId||card.id;
    const open=projectActivityOpenTasks(card,tasks);
    const events=[...projectActivityTaskEvents(card,tasks),...(logMap.get(id)||[])]
      .sort((a,b)=>(b.day+' '+(b.time||'00:00')).localeCompare(a.day+' '+(a.time||'00:00')));
    let page=null;try{page=dv.page(card.home);}catch(_e){}
    return {card,id,open,events,status:String(page?.status||card.status||'active')};
  });
  projectBox.innerHTML=models.map(model=>{
    const recent=model.events[0]?.day||'暂无记录';
    const color=PROJECT_BOARD_COLORS[model.id]||'var(--blue)';
    return `<div class="project-activity-project${model.id===_projectActivitySelected?' active':''}" data-action="project-activity-select" data-project="${esc(model.id)}">
      <span class="project-activity-project-dot" style="background:${color}"></span>
      <div class="project-activity-project-copy"><div class="project-activity-project-name">${esc(model.card.label)}</div><div class="project-activity-project-meta">${model.open.length} 下一步 · 最近 ${esc(recent)}</div></div>
      <span class="project-activity-project-status">${esc(model.status)}</span>
    </div>`;
  }).join('');
  const selected=models.find(model=>model.id===_projectActivitySelected)||models[0];
  const completedCount=selected.events.filter(event=>event.kind==='task').length;
  const logCount=selected.events.filter(event=>event.kind==='log').length;
  head.innerHTML=`<div><div class="project-activity-detail-title">${esc(selected.card.label)}</div><div class="project-activity-detail-meta">${selected.open.length} 个未完成任务 · ${completedCount} 个已完成 · ${logCount} 条执行记录</div></div><span class="project-activity-open" data-action="open-vault" data-path="${esc(selected.card.home+'.md')}">Open project ↗</span>`;
  const input=$('project-activity-input');
  if(input){
    input.placeholder='';
    input.dataset.project=selected.id;
    if(!input.dataset.bound){input.dataset.bound='1';input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();addProjectActivityRecord();}});}
  }
  nextBox.innerHTML=`<div class="project-activity-section-label">项目任务 · 未完成 ${selected.open.length}</div>`+(selected.open.length?selected.open.map(task=>{
    const hasDoc=Boolean(taskInlineField(task,'doc'));
    return `<div class="project-activity-task-block">
      <div class="project-activity-next-row">
        <span class="vt-check" data-action="complete-vault-task" data-path="${esc(task.path)}" data-line="${task.line}"></span>
        <span class="project-activity-next-title" data-action="edit-vault-task" data-path="${esc(task.path)}" data-line="${task.line}">${esc(cleanTaskText(task.text))}</span>
        <span class="project-activity-next-when">${esc(whenLabel(task,todayStr()))}</span>
        <span class="project-activity-task-actions">
          <span data-action="open-task-doc" data-path="${esc(task.path)}" data-line="${task.line}" title="${hasDoc?'Open task doc':'Create task doc'}">📄</span>
          <span data-action="attach-task-ref" data-path="${esc(task.path)}" data-line="${task.line}" title="Link a doc">📎</span>
          <span data-action="delete-vault-task" data-path="${esc(task.path)}" data-line="${task.line}" title="Delete task">×</span>
        </span>
      </div>
      ${renderTaskLinks(task)}
    </div>`;
  }).join(''):'<div class="project-activity-empty compact">No next step</div>');
  eventsBox.innerHTML=`<div class="project-activity-section-label">tasks + timeline</div>${renderProjectActivityEvents(selected.events)}`;
  renderProjectRollup(models);
}
async function addProjectActivityRecord(){
  const input=$('project-activity-input');
  const value=String(input?.value||'').replace(/[\r\n]+/g,' ').trim();
  if(!value) return;
  const cards=activeProjectCards(projectNoteTargets());
  const card=cards.find(item=>(item.cardId||item.id)===_projectActivitySelected)||cards[0];
  if(!card) return;
  input.value='';
  await appendProjectLogEntry(card.projectId||card.id,value,false,false,{label:card.label,paperHome:card.projectId!==card.id?card.home:null});
  await loadProjectActivity();
}
async function addProjectActivityTask(){
  const input=$('project-activity-input');
  const value=String(input?.value||'').replace(/[\r\n]+/g,' ').trim();
  if(!value) return;
  const cards=activeProjectCards(projectNoteTargets());
  const card=cards.find(item=>(item.cardId||item.id)===_projectActivitySelected)||cards[0];
  if(!card) return;
  let page=null; try{page=dv.page(card.home);}catch(_e){}
  input.value='';
  await addVaultTask(String(page?.area||card.area||'Academic'),value,{projectId:card.projectId||card.id,when:'today'});
}
// ─ Milestones & deadlines (scan task-level `[deadline:: ...]`) ──
const AREA_TAGS = ['Academic','Work','Learning','Reflection'];
function cleanTaskText(t) {
  return String(t).replace(/#\S+/g,'').replace(/\[\w+::[^\]]+\]/g,'').replace(/✅\s*\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2})?/g,'').replace(/\s{2,}/g,' ').trim();
}
function taskAreaTag(t) {
  if (!t.tags) return null;
  for (const tag of t.tags) {
    const bare = tag.replace(/^#/,'');
    if (AREA_TAGS.includes(bare)) return bare;
  }
  return null;
}
// ─ Single-column task list (open on top, today's done below) ────
const AREA_ORDER = ['Academic','Work','Learning','Reflection'];
const TODAY_AREAS = ['Learning','Reflection'];
const AREA_COLOR = {Academic:'var(--blue)', Work:'var(--yellow)', Learning:'#66bb6a', Reflection:'var(--orange)'};
const AREA_EMOJI = {Academic:'🎓', Work:'💼', Learning:'📚', Reflection:'🪞'};
const PB = CFG.projectBoard || {};
let ACTIVE_PROJECT_BOARD_IDS = PB.ids || FALLBACK_PROJECT_NOTE_TARGETS.map(p => p.id);
const PROJECT_BOARD_COLORS = PB.colors || {};
const TASK_CONTEXT_SHORT_LABELS = PB.shortLabels || {};
let _addTaskArea = LS('add_task_area','Learning');
let _addTaskContext = LS('add_task_context','personal:Learning');
let _projectActivitySelected = LS('project_activity_selected', ACTIVE_PROJECT_BOARD_IDS[0] || '');
let _projectRollupPeriod = String(LS('project_rollup_period','30'));

function taskCreatedDay(t){ const m=String(t.path).match(/(\d{4}-\d{2}-\d{2})/); return m?m[1]:null; }
function taskCompletionDay(t){
  if (t.completion){ const s=String(t.completion).slice(0,10); if(/^\d{4}-\d{2}-\d{2}$/.test(s)) return s; }
  const m=String(t.text).match(/✅\s*(\d{4}-\d{2}-\d{2})/); return m?m[1]:null;
}
function taskNote(t){
  const m=String(t.text||'').match(/\[note::\s*([^\]]*)\]/i);
  return m ? m[1].trim() : '';
}
function taskInlineField(t,key){
  const m=String(t.text||'').match(new RegExp('\\['+key+'::\\s*([^\\]]+)\\]','i'));
  return m ? m[1].trim() : '';
}
function taskRefs(t){
  const raw=taskInlineField(t,'refs');
  return raw ? raw.split(/\s*;;\s*/).map(x=>x.trim()).filter(Boolean) : [];
}
function taskRefLabel(path){
  const name=String(path||'').split('/').pop()||String(path||'');
  return name.replace(/\.(md|pdf|canvas)$/i,'');
}
function renderTaskLinks(t){
  const doc=taskInlineField(t,'doc');
  const refs=taskRefs(t);
  if(!doc&&!refs.length) return '';
  const docChip=doc?`<span class="task-ref-chip" title="${esc(doc)}">
    <span class="task-ref-chip-label" data-action="open-task-doc" data-path="${esc(t.path)}" data-line="${t.line}">↗ 任务详情 · ${esc(taskRefLabel(doc))}</span>
  </span>`:'';
  const refChips=refs.map(ref=>`<span class="task-ref-chip" title="${esc(ref)}">
    <span class="task-ref-chip-label" data-action="open-vault" data-path="${esc(ref)}">↗ ${esc(taskRefLabel(ref))}</span>
    <span class="task-ref-remove" data-action="remove-task-ref" data-path="${esc(t.path)}" data-line="${t.line}" data-ref="${esc(ref)}" title="Unlink">×</span>
  </span>`).join('');
  return `<div class="task-ref-list">${docChip}${refChips}</div>`;
}
function taskProjectId(t){
  const raw=taskInlineField(t,'project');
  return (CFG.projectAliases || {})[raw] || raw;
}
function taskWhenValue(t){ return taskInlineField(t,'when'); }
function taskPlannedDay(t){
  const v=taskWhenValue(t);
  if(/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  if(v.toLowerCase()==='later') return null;
  return taskCreatedDay(t);
}
function taskProjectById(id){
  const p=projectNoteTargets().find(x=>x.id===id);
  return p?{...p,short:p.label,path:p.home+'.md'}:null;
}
function tomorrowStr(){ return dateKey(addDays(new Date(),1)); }
function yesterdayStr(){ return dateKey(addDays(new Date(),-1)); }
function whenLabel(t,today){
  const raw=taskWhenValue(t), day=taskPlannedDay(t);
  if(raw.toLowerCase()==='later') return 'Later';
  if(day===today) return 'Today';
  if(day===tomorrowStr()) return 'Tomorrow';
  return day ? day.slice(5) : 'Later';
}

function loadVaultTasks() {
  const box = $('task-list-single'); if (!box) return;
  if(!TODAY_AREAS.includes(_addTaskArea)) _addTaskArea='Learning';
  const targets=activeProjectCards(projectNoteTargets());
  const validContexts=['personal:Learning','personal:Reflection',...targets.map(item=>'project:'+(item.cardId||item.id))];
  if(!validContexts.includes(_addTaskContext)) _addTaskContext='personal:'+_addTaskArea;
  const contextSelect=$('task-context-select');
  if(contextSelect){
    contextSelect.innerHTML=`<optgroup label="个人任务"><option value="personal:Learning">📚 Learning</option><option value="personal:Reflection">🪞 Reflection</option></optgroup><optgroup label="项目任务">${targets.map(item=>{const id=item.cardId||item.id;return `<option value="project:${esc(id)}">${esc(TASK_CONTEXT_SHORT_LABELS[id]||item.label)}</option>`;}).join('')}</optgroup>`;
    contextSelect.value=_addTaskContext;
  }
  const selectedProject=_addTaskContext.startsWith('project:')?taskProjectById(_addTaskContext.slice(8)):null;
  const selectedArea=_addTaskContext.startsWith('personal:')?_addTaskContext.slice(9):String(selectedProject?.area||'Academic');
  const contextColor=selectedProject?PROJECT_BOARD_COLORS[selectedProject.id]||AREA_COLOR[selectedArea]:AREA_COLOR[selectedArea];
  const dot = $('task-context-dot'); if(dot) dot.style.background=contextColor||'#888';
  // Dataview returns an empty DataArray while it is re-indexing (e.g. right
  // after files move), and its .file proxy is undefined. Bailing out here used to
  // blank the whole card with no explanation — degrade to an empty list instead.
  let allTasks = [], scanFailed = false;
  try {
    const pages = dv.pages('"' + V.DAILY + '"');
    const tasks = pages && pages.file && pages.file.tasks;
    allTasks = tasks ? Array.from(tasks.values ?? tasks) : [];
  } catch (e) { console.error("vault tasks scan", e); scanFailed = true; }
  const today = todayStr();
  const tomorrow=tomorrowStr(), yesterday=yesterdayStr();
  const isCancelled=t=>String(t.status||'').trim()==='-';
  const isProjectTask=t=>ACTIVE_PROJECT_BOARD_IDS.includes(taskProjectId(t));
  const isPersonalTodayTask=t=>TODAY_AREAS.includes(taskAreaTag(t))&&!isProjectTask(t);
  const isTodayTask=t=>isPersonalTodayTask(t)||isProjectTask(t);
  const areaTasks=allTasks.filter(isTodayTask);
  const open=areaTasks.filter(t=>!t.completed&&!isCancelled(t));
  const cancelled=areaTasks.filter(t=>isCancelled(t));
  const done=areaTasks.filter(t=>t.completed&&taskCompletionDay(t));
  open.sort((a,b)=>(taskPlannedDay(a)||'9999').localeCompare(taskPlannedDay(b)||'9999'));
  done.sort((a,b)=>(taskCompletionDay(b)||'').localeCompare(taskCompletionDay(a)||''));
  const renderOpen = t => {
    const txt=esc(cleanTaskText(t.text)), area=taskAreaTag(t);
    const project=taskProjectById(taskProjectId(t));
    const hasDoc=Boolean(taskInlineField(t,'doc'));
    const note=taskNote(t);
    const pday=taskPlannedDay(t), rawWhen=taskWhenValue(t);
    const color=project?PROJECT_BOARD_COLORS[project.id]||AREA_COLOR[area]:AREA_COLOR[area];
    const taskContext=project?'project:'+project.id:'personal:'+area;
    const areaDot=`<button type="button" class="vt-dot" data-action="cycle-task-context" data-current="${esc(taskContext)}" data-path="${esc(t.path)}" data-line="${t.line}" style="background:${color}" title="${esc(project?.label||area)} · click to switch area" aria-label="Switch area or project"></button>`;
    let ageHtml=pday===today
      ? ''
      : `<div class="vt-age" data-action="schedule-task" data-path="${esc(t.path)}" data-line="${t.line}" title="Click to reschedule">${esc(whenLabel(t,today))}</div>`;
    if(pday&&pday<today){ const days=Math.floor((new Date(today)-new Date(pday))/86400000); ageHtml=`<div class="vt-age aged" data-action="schedule-task" data-path="${esc(t.path)}" data-line="${t.line}" title="${days}d overdue · click to reschedule">${days}d</div>`; }
    if(rawWhen.toLowerCase()==='later') ageHtml=`<div class="vt-age" data-action="schedule-task" data-path="${esc(t.path)}" data-line="${t.line}" title="Click to reschedule">Later</div>`;
    return `<div class="vt-row today-task" style="--task-color:${color}">
      <div class="vt-check" data-action="complete-vault-task" data-path="${esc(t.path)}" data-line="${t.line}" data-text="${esc(String(t.text || '').trim().slice(0, 40))}" title="Mark done"></div>
      ${areaDot}
      <div class="vt-label" data-action="${hasDoc?'open-task-doc':'edit-vault-task'}" data-path="${esc(t.path)}" data-line="${t.line}" title="${hasDoc?'Open task':'Click to edit'}">${txt}</div>
      ${ageHtml}
      <div class="task-ref-add" data-action="attach-task-ref" data-path="${esc(t.path)}" data-line="${t.line}" title="Link a paper or doc">📎</div>
      <div class="today-note-btn" data-action="edit-task-note" data-path="${esc(t.path)}" data-line="${t.line}" data-note="${esc(note)}" title="Note">Note</div>
      <div class="vt-cancel" data-action="cancel-vault-task" data-path="${esc(t.path)}" data-line="${t.line}" data-text="${esc(String(t.text || '').trim().slice(0, 40))}" title="Won't do">−</div>
      <div class="vt-del" data-action="delete-vault-task" data-path="${esc(t.path)}" data-line="${t.line}" title="Delete" style="color:var(--text4);font-size:13px;padding:1px 5px;cursor:pointer">×</div>
      ${renderTaskLinks(t)}
      ${note?`<div class="today-task-note">↳ ${esc(note)}</div>`:''}
    </div>`;
  };
  const renderDone = t => {
    const txt=esc(cleanTaskText(t.text)), area=taskAreaTag(t), project=taskProjectById(taskProjectId(t));
    const color=project?PROJECT_BOARD_COLORS[project.id]||AREA_COLOR[area]:AREA_COLOR[area];
    const hasDoc=Boolean(taskInlineField(t,'doc'));
    const note=taskNote(t);
    return `<div class="vt-row today-task" style="--task-color:${color}">
      <div class="vt-check" data-action="uncomplete-vault-task" data-path="${esc(t.path)}" data-line="${t.line}" title="Click to reopen" style="background:var(--text);border-color:var(--text);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px">✓</div>
      <button type="button" class="vt-dot" data-action="cycle-task-context" data-current="${esc(project?'project:'+project.id:'personal:'+area)}" data-path="${esc(t.path)}" data-line="${t.line}" style="background:${color};opacity:.45" title="${esc(project?.label||area)} · click to switch area" aria-label="Switch area or project"></button>
      <div class="vt-label" data-action="${hasDoc?'open-task-doc':'edit-vault-task'}" data-path="${esc(t.path)}" data-line="${t.line}" title="${hasDoc?'Open task':'Click to edit'}" style="text-decoration:line-through;color:var(--text4)">${txt}</div>
      <div class="task-ref-add" data-action="attach-task-ref" data-path="${esc(t.path)}" data-line="${t.line}" title="Link another paper or result doc">📎</div>
      <div class="today-note-btn" data-action="edit-task-note" data-path="${esc(t.path)}" data-line="${t.line}" data-note="${esc(note)}" title="Note">Note</div>
      <div class="vt-cancel" data-action="cancel-vault-task" data-path="${esc(t.path)}" data-line="${t.line}" data-text="${esc(String(t.text || '').trim().slice(0, 40))}" title="Won't do">−</div>
      <div class="vt-del" data-action="delete-vault-task" data-path="${esc(t.path)}" data-line="${t.line}" title="Delete" style="color:var(--text4);font-size:13px;padding:1px 5px;cursor:pointer">×</div>
      ${renderTaskLinks(t)}
      ${note?`<div class="today-task-note">↳ ${esc(note)}</div>`:''}
    </div>`;
  };

  const overdue=open.filter(t=>{const d=taskPlannedDay(t);return d&&d<today;});
  const todayOpen=open.filter(t=>taskPlannedDay(t)===today);
  // Anything not due today and not overdue is backlog — one collapsed pile
  // rather than the old Tomorrow / Later split, which was never used.
  const backlog=open.filter(t=>{const d=taskPlannedDay(t);return !d||d>=tomorrow;});
  const doneToday=done.filter(t=>taskCompletionDay(t)===today);
  const doneYesterday=done.filter(t=>taskCompletionDay(t)===yesterday);
  const recentDone=done.filter(t=>{const d=taskCompletionDay(t);return d<yesterday&&d>=dateKey(addDays(new Date(),-7));});
  const section=(label,items,renderer,isOpen=true)=>{
    if(!items.length) return '';
    return `<details class="today-section"${isOpen?' open':''}><summary class="vt-section-h">${label} · ${items.length}</summary>${items.map(renderer).join('')}</details>`;
  };
  let html='';
  html+=section('Today',todayOpen,renderOpen,true);
  html+=section('Overdue',overdue,renderOpen,true);
  html+=section('Backlog',backlog,renderOpen,false);
  html+=section('Done today',doneToday,renderDone,true);
  html+=section('Done yesterday',doneYesterday,renderDone,false);
  html+=section('Done · last 7 days',recentDone,renderDone,false);
  html+=section("Won't do",cancelled,renderDone,false);
  if(!html) html=`<div class="vt-empty" style="padding:10px 4px;color:var(--text4);font-size:13px">${scanFailed ? 'Task index unavailable — reload Obsidian.' : 'No tasks in this view.'}</div>`;
  box.innerHTML = html;
}

function setAddTaskContext(value){
  _addTaskContext=String(value||'personal:Learning');
  if(_addTaskContext.startsWith('personal:')) _addTaskArea=_addTaskContext.slice(9);
  LSS('add_task_context',_addTaskContext);
  LSS('add_task_area',_addTaskArea);
  loadVaultTasks();
  $('task-add-input')?.focus();
}
function cycleAddTaskContext(){
  const context=$('task-context-select');
  if(!context?.options?.length) return;
  const values=Array.from(context.options).map(option=>option.value);
  const index=Math.max(0,values.indexOf(_addTaskContext));
  setAddTaskContext(values[(index+1)%values.length]);
}
function availableTaskContexts(){
  return ['personal:Learning','personal:Reflection',...activeProjectCards(projectNoteTargets()).map(item=>'project:'+(item.cardId||item.id))];
}
async function cycleTaskContext(path,line,current){
  const contexts=availableTaskContexts();
  const index=Math.max(0,contexts.indexOf(String(current||'')));
  const next=contexts[(index+1)%contexts.length];
  const file=resolveVaultFile(path);if(!file)return;
  const lines=(await app.vault.read(file)).split('\n'),i=Number(line);if(!lines[i])return;
  let value=lines[i];
  const projectMatch=value.match(/\s*\[project::\s*[^\]]+\]/i);
  value=value.replace(/\s*\[project::\s*[^\]]+\]/i,'');
  if(next.startsWith('project:')){
    const projectId=next.slice(8),project=taskProjectById(projectId);
    const area=String(project?.area||'Academic');
    value=value.replace(/#[A-Za-z][\w-]*/,`#${area}`);
    const done=value.match(/\s*(✅\s*\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2})?)\s*$/);
    value=done?value.slice(0,done.index).replace(/\s*$/,'')+` [project:: ${projectId}] `+done[1]:value.replace(/\s*$/,'')+` [project:: ${projectId}]`;
  }else{
    const area=next.slice(9);
    value=value.replace(/#[A-Za-z][\w-]*/,`#${area}`);
  }
  lines[i]=value;
  await app.vault.modify(file,lines.join('\n'));
  setTimeout(()=>{loadVaultTasks();loadActiveProjectBoard();},220);
}
function currentAddTaskTarget(){
  if(_addTaskContext.startsWith('project:')){
    const projectId=_addTaskContext.slice(8);
    const project=taskProjectById(projectId);
    return {area:String(project?.area||'Academic'),projectId};
  }
  const area=_addTaskContext.startsWith('personal:')?_addTaskContext.slice(9):_addTaskArea;
  return {area:TODAY_AREAS.includes(area)?area:'Learning',projectId:''};
}
async function setTaskInlineField(path,lineStr,key,value){
  const file=resolveVaultFile(path); if(!file) return;
  const lines=(await app.vault.read(file)).split('\n'), i=+lineStr; if(!lines[i]) return;
  const re=new RegExp('\\s*\\['+key+'::\\s*[^\\]]+\\]','i');
  if(re.test(lines[i])){
    lines[i]=lines[i].replace(re,value?` [${key}:: ${value}]`:'');
  }else if(value){
    const done=lines[i].match(/\s*(✅\s*\d{4}-\d{2}-\d{2})\s*$/);
    lines[i]=done
      ? lines[i].slice(0,done.index).replace(/\s*$/,'')+` [${key}:: ${value}] `+done[1]
      : lines[i].replace(/\s*$/,'')+` [${key}:: ${value}]`;
  }
  await app.vault.modify(file,lines.join('\n'));
  setTimeout(()=>{loadVaultTasks();loadActiveProjectBoard();},220);
}
async function attachTaskRef(path,line){
  let task=null;
  try{task=dv.page(path)?.file?.tasks?.values?.find(item=>Number(item.line)===Number(line))||null;}catch(_e){}
  if(!task) return;
  const chosen=await db26PickVaultFile();
  if(!chosen) return;
  const refs=taskRefs(task);
  if(!refs.includes(chosen)) refs.push(chosen);
  await setTaskInlineField(path,line,'refs',refs.join(' ;; '));
}
async function removeTaskRef(path,line,ref){
  let task=null;
  try{task=dv.page(path)?.file?.tasks?.values?.find(item=>Number(item.line)===Number(line))||null;}catch(_e){}
  if(!task) return;
  const refs=taskRefs(task).filter(item=>item!==ref);
  await setTaskInlineField(path,line,'refs',refs.join(' ;; '));
}
async function scheduleTask(path,line){
  let current='';
  try{const p=dv.page(path);const t=p?.file?.tasks?.values?.find(x=>Number(x.line)===Number(line));current=t?taskWhenValue(t):'';}catch(_e){}
  const today=todayStr(), tomorrow=tomorrowStr();
  const next=current===today?tomorrow:current===tomorrow?'later':today;
  return setTaskInlineField(path,line,'when',next);
}

// ─ Project log: one Life Log source, automatic project backlink ─
// Memoised: this scans every markdown file + reads frontmatter, and it is called
// once per task while rendering lists. Cache is cleared when a project
let _projectTargetsCache = null;
function invalidateProjectTargets(){ _projectTargetsCache = null; }
function projectNoteTargets(){
  if (_projectTargetsCache) return _projectTargetsCache;
  const files=app.vault.getMarkdownFiles();
  const found=files.filter(f=>V_PROJ_HOME.test(f.path)).map(f=>{
    const fm=app.metadataCache.getFileCache(f)?.frontmatter||{};
    if(fm.type!=='project'||!fm.project_id) return null;
    const root=f.parent?.path||f.path.replace(V_HOME_TAIL,'');
    return {
      id:String(fm.project_id),
      label:String(fm.note_label||fm.project_name||f.parent?.name||f.basename),
      root,
      home:f.path.replace(/\.md$/,''),
      progress:root+'/'+V.PROG,
      log:root+'/'+V.LOG,
      area:String(fm.area||'Academic'),
      status:String(fm.status||'active')
    };
  }).filter(Boolean);
  _projectTargetsCache = found.length?found.sort((a,b)=>a.label.localeCompare(b.label,'zh-CN')):FALLBACK_PROJECT_NOTE_TARGETS;
  return _projectTargetsCache;
}
// Without an explicit projectBoard.ids, the board shows every project note still in play.
if (!PB.ids) {
  const live = projectNoteTargets().filter(p => !/^(archived?|done|completed|dropped|cancell?ed)$/i.test(p.status)).map(p => p.id);
  if (live.length) ACTIVE_PROJECT_BOARD_IDS = live;
}
async function appendProjectLogEntry(targetId=null, promptedText=null, createDoc=false,openAfter=true,options={}){
  try{
    const targets=projectNoteTargets();
    const target=(targetId&&targets.find(x=>x.id===targetId))||targets.find(x=>x.id===_projectActivitySelected)||targets[0];
    if(!target) throw new Error('No project found');
    let raw=promptedText!=null?String(promptedText):'';
    const displayLabel=String(options.label||target.label);
    if(!raw.trim()&&promptedText==null){
      raw=String(await db26Prompt(displayLabel + ' · project note:')||'');
    }
    raw=raw.replace(/[\r\n]+/g,' ').trim();
    if(!raw) return;
    const now=new Date(), stamp=pad(now.getHours())+':'+pad(now.getMinutes());
    const f=await ensureTodayFile('life-log');
    if(!f) throw new Error('Life Log could not be opened');
    let doc=null, docLink='';
    if(createDoc){
      let title=String(await db26Prompt('Linked doc title (blank = use the note opening):')||'').trim();
      if(!title) title=raw.slice(0,36).replace(/[。！？!?]+$/,'').trim();
      const safeTitle=title.replace(/[\\/:*?"<>|]/g,' ').replace(/\s+/g,' ').trim()||'Note';
      const docs=target.root+'/'+V.TASKDOCS, path=docs+'/'+todayStr()+' · '+safeTitle+'.md';
      try{await app.vault.createFolder(docs);}catch(_e){}
      doc=resolveVaultFile(path);
      if(!doc){
        const source=f.path.replace(/\.md$/,'');
        const body=`---\ntype: research-note\nproject: "${target.id}"\ndate: ${todayStr()}\nsource_log: "[[${source}]]"\n---\n\n# ${safeTitle}\n`;
        doc=await app.vault.create(path,body);
      }
      docLink=` [[${doc.path.replace(/\.md$/,'')}|${safeTitle}]]`;
    }
    const paperLink=options.paperHome?` [[${options.paperHome}|${displayLabel}]]`:'';
    await appendLifeLogLine(f,`- ${stamp} · ${raw}${docLink} [[${target.home}|${target.label}]]${paperLink}`);
    if(typeof Notice!=='undefined') new Notice((doc?'Document prepared + ':'')+'Added to Life Log · '+displayLabel);
    if(openAfter) app.workspace.openLinkText(doc?.path||f.path,'',false);
    setTimeout(()=>{loadActiveProjectBoard();},260);
  }catch(e){
    console.error('[db26 project log]',e);
    if(typeof Notice!=='undefined') new Notice('Project log failed · '+(e?.message||e));
  }
}
// ── Optional task detail notes live in the project's V.TASKDOCS folder ──
function findTaskDoc(reference){
  const raw=String(reference||'').trim().replace(/\.md$/i,'');
  if(!raw) return null;
  const direct=app.vault.getAbstractFileByPath(raw+'.md')||app.vault.getAbstractFileByPath(raw);
  if(direct) return direct;
  const basename=raw.split('/').pop();
  return app.vault.getMarkdownFiles().find(f=>f.basename===basename&&f.path.startsWith(V.PROJECTS + '/'))
    ||app.vault.getMarkdownFiles().find(f=>f.basename===basename&&f.path.includes('/'+V.LEGACYDOCS+'/'))
    ||null;
}

// Open (or create) a task detail doc without introducing another task hierarchy.
async function openTaskDoc(path, lineStr){
  const file = resolveVaultFile(path); if(!file) return;
  const lineIdx = parseInt(lineStr);
  const content = await app.vault.read(file);
  const lines = content.split('\n');
  const ln = lines[lineIdx]; if(ln==null) return;
  const linked = ln.match(/\[doc::\s*([^\]]+)\]/);
  if (linked){
    const existing=findTaskDoc(linked[1].trim());
    if(existing) { app.workspace.openLinkText(existing.path,'',false); return; }
  }
  const title = cleanTaskText(ln.replace(/^\s*-\s*\[[ xX]\]\s*/, ''));
  const area = AREA_ORDER.find(a=>new RegExp('#'+a+'\\b').test(ln)) || 'Academic';
  const pm = ln.match(/\[project::\s*([^\]]+)\]/);
  const project = pm ? pm[1].trim() : '';
  const today = todayStr();
  const safe = (title.replace(/[\\/:*?"<>|]/g,' ').replace(/\s+/g,' ').trim().slice(0,50)) || 'task';
  const target=projectNoteTargets().find(item=>item.id===project)||null;
  const taskRoot=target?target.root+'/'+V.TASKDOCS:V.DOCS;
  try{await app.vault.createFolder(taskRoot);}catch(_e){}
  const fileName = today + ' · ' + safe;
  const docPath = taskRoot + '/' + fileName + '.md';
  const hh=pad(new Date().getHours()), mm=pad(new Date().getMinutes());
  const projectHome=target?.home?`\nproject_home: "[[${target.home}]]"`:'';
  const body = `---\ntype: task-note\nproject: "${project}"\narea: ${area}\nstatus: open\ncreated: ${today}\nparent_daily: "[[${today}]]"${projectHome}\n---\n\n# ${title}\n\n## Note\n\n- ${today} ${hh}:${mm} · \n\n## 相关文档与证据\n\n- \n\n## 结论\n\n- \n`;
  if (!app.vault.getAbstractFileByPath(docPath)) await app.vault.create(docPath, body);
  if (!/\[doc::/.test(ln)) { lines[lineIdx] = ln.replace(/\s*$/,'') + ` [doc:: ${docPath.replace(/\.md$/,'')}]`; await app.vault.modify(file, lines.join('\n')); }
  app.workspace.openLinkText(docPath,'',false);
  setTimeout(loadVaultTasks, 300);
}


// ─ 想做清单 (Someday/Maybe capture list) ────────────────────────
const WISH_PATH = V.SOMEDAY;
const WISH_RE = /^-\s+\[([ xX])\]\s+(\d{4}-\d{2}-\d{2})\s*·\s*(.+?)(?:\s*✅\s*(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2}))?)?\s*$/;
const WISH_NOTE_RE = /^\s{2,}-\s+✍️\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\s*·\s*(.+)$/;

async function ensureWishFile(){
  return ensureVaultFile(WISH_PATH, '# Someday\n\n> 临时想做、想看或想学的事。新完成记录会自动写入精确到分钟的时间。\n\n', V.CAPTURE);
}

// ─ 等待清单 (Waiting For) — structured list with notes/history ──
const WAITING_PATH = V.WAITING;
const WAITING_RE = /^-\s+\[([ xX])\]\s+(\d{4}-\d{2}-\d{2})\s*·\s*(.+?)(?:\s*✅\s*(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2}))?)?\s*$/;
const WAITING_NOTE_RE = /^\s{2,}-\s+✍️\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\s*·\s*(.+)$/;
const _waitingFilter = 'active';   // no switch any more — done items just drop out

async function ensureWaitingFile(){
  return ensureVaultFile(WAITING_PATH, '# Waiting for\n\n> 等待他人回复、交付或外部事件。Dashboard 的 ✍️ 可以添加时间戳Note。\n\n');
}
async function loadWaiting(){
  const box=$('waiting-list'); if(!box) return;
  const inp=$('waiting-add-input');
  if(inp && !inp.dataset.bound){ inp.dataset.bound='1'; inp.addEventListener('keydown',e=>{
    if(e.key!=='Enter') return; e.preventDefault(); const v=inp.value.trim(); if(!v) return;
    inp.value=''; addWaitingItem(v);
  }); }
  const f=app.vault.getAbstractFileByPath(WAITING_PATH);
  if(!f){ box.innerHTML='<div class="vt-empty" style="padding:8px 4px;color:var(--text4);font-size:13px">Nothing waiting. Add one above.</div>'; return; }
  try{
    const content=await app.vault.cachedRead(f), lines=content.split('\n'), items=[];
    lines.forEach((ln,idx)=>{
      const m=ln.match(WAITING_RE); if(!m) return;
      const notes=[];
      for(let j=idx+1;j<lines.length;j++){
        const nm=lines[j].match(WAITING_NOTE_RE); if(nm){ notes.push({stamp:nm[1],text:nm[2].trim()}); continue; }
        break;
      }
      items.push({line:idx,text:m[3].trim(),created:m[2],status:m[1].toLowerCase()==='x'?'done':'open',resolved:m[4]?(m[4]+(m[5]?' '+m[5]:'')):null,notes});
    });
    let shown=items;
    if(_waitingFilter==='active') shown=items.filter(x=>x.status==='open');
    else if(_waitingFilter==='done') shown=items.filter(x=>x.status==='done');
    shown.sort((a,b)=>a.status!==b.status?(a.status==='open'?-1:1):(a.status==='open'?(a.created<b.created?-1:1):((b.resolved||'')<(a.resolved||'')?-1:1)));
    if(!shown.length){ box.innerHTML='<div class="vt-empty" style="padding:8px 4px;color:var(--text4);font-size:13px">'+(_waitingFilter==='active'?'Nothing waiting. Add one above.':'Empty.')+'</div>'; return; }
    const today=todayStr(), age=(d)=>Math.max(0,Math.floor((new Date(today+'T12:00:00')-new Date(d+'T12:00:00'))/86400000));
    box.innerHTML=shown.map(it=>{
      const latest=it.notes.length?it.notes[it.notes.length-1]:null;
      const note=latest?`<div style="flex-basis:100%;font-size:12px;color:var(--text3);padding-left:20px;line-height:1.45;margin-top:1px">↳ ${esc(latest.stamp)} · ${esc(latest.text)}</div>`:'';
      if(it.status==='open') return `<div class="vt-row" style="flex-wrap:wrap">
        <div class="vt-check" data-action="waiting-complete" data-line="${it.line}" title="done"></div>
        <div class="vt-label" data-action="waiting-edit" data-line="${it.line}" title="edit">${esc(it.text)}</div>
        <span class="vt-age${age(it.created)>=7?' aged':''}">${age(it.created)}d</span>
        <div class="vt-promote" data-action="waiting-note" data-line="${it.line}" title="add timestamped note">✍️</div>
        <div class="vt-del" data-action="waiting-delete" data-line="${it.line}" title="delete" style="color:var(--text4);font-size:13px;padding:1px 5px;cursor:pointer">×</div>${note}</div>`;
      const done=it.resolved?'Done '+String(it.resolved).slice(5):'Done';
      return `<div class="vt-row" style="flex-wrap:wrap">
        <div class="vt-check" data-action="waiting-uncomplete" data-line="${it.line}" title="reopen" style="background:var(--text);border-color:var(--text);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px">✓</div>
        <div class="vt-label" style="text-decoration:line-through;color:var(--text4)">${esc(it.text)}</div>
        <span class="vt-age">${esc(done)}</span>
        <div class="vt-promote" data-action="waiting-note" data-line="${it.line}" title="add timestamped note">✍️</div>
        <div class="vt-del" data-action="waiting-delete" data-line="${it.line}" title="delete" style="color:var(--text4);font-size:13px;padding:1px 5px;cursor:pointer">×</div>${note}</div>`;
    }).join('');
  }catch(e){ console.error('[db26 loadWaiting]',e); }
}
async function addWaitingItem(text){
  const clean=String(text||'').replace(/[\r\n]+/g,' ').trim(); if(!clean) return;
  const f=await ensureWaitingFile(), content=await app.vault.read(f);
  await app.vault.modify(f,content.replace(/\s*$/,'')+`\n- [ ] ${todayStr()} · ${clean}\n`);
  setTimeout(loadWaiting,150);
}
async function waitingModifyLine(lineIdx,fn){
  const f=app.vault.getAbstractFileByPath(WAITING_PATH); if(!f) return;
  const lines=(await app.vault.read(f)).split('\n'), i=+lineIdx; if(lines[i]==null) return;
  lines[i]=fn(lines[i]); await app.vault.modify(f,lines.join('\n')); setTimeout(loadWaiting,150);
}
function waitingComplete(line){ const n=new Date(), stamp=todayStr()+' '+pad(n.getHours())+':'+pad(n.getMinutes()); return waitingModifyLine(line,ln=>/\[[xX]\]/.test(ln)?ln:ln.replace(/\[ \]/,'[x]').replace(/\s*$/,'')+' ✅ '+stamp); }
function waitingUncomplete(line){ return waitingModifyLine(line,ln=>ln.replace(/\[[xX]\]/,'[ ]').replace(/\s*✅\s*\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2})?/,'')); }
async function waitingDelete(line){
  const f=app.vault.getAbstractFileByPath(WAITING_PATH); if(!f) return;
  const lines=(await app.vault.read(f)).split('\n'), i=+line; if(!WAITING_RE.test(lines[i]||'')) return;
  if(!(await db26Confirm('Delete this waiting item?\n\n'+(lines[i].match(WAITING_RE)||[])[3]))) return;
  let count=1; while(i+count<lines.length&&WAITING_NOTE_RE.test(lines[i+count])) count++;
  lines.splice(i,count); await app.vault.modify(f,lines.join('\n')); setTimeout(loadWaiting,150);
}
async function addWaitingNote(line){
  const f=app.vault.getAbstractFileByPath(WAITING_PATH); if(!f) return;
  const note=await db26Prompt('Add a timestamped note:'); if(note==null||!note.trim()) return;
  const lines=(await app.vault.read(f)).split('\n'), i=+line; if(!WAITING_RE.test(lines[i]||'')) return;
  let insert=i+1; while(insert<lines.length&&WAITING_NOTE_RE.test(lines[insert])) insert++;
  const n=new Date(), stamp=todayStr()+' '+pad(n.getHours())+':'+pad(n.getMinutes());
  lines.splice(insert,0,'  - ✍️ '+stamp+' · '+note.replace(/[\r\n]+/g,' ').trim());
  await app.vault.modify(f,lines.join('\n')); setTimeout(loadWaiting,150);
}
function writeWaitingText(line,newText){
  return waitingModifyLine(line,ln=>{
    const m=ln.match(/^(-\s+\[[ xX]\]\s+\d{4}-\d{2}-\d{2}\s*·\s*)(.+?)(\s*✅\s*\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2})?)?\s*$/);
    return m?m[1]+newText.trim()+(m[3]||''):ln;
  });
}
// ─ Countdown (Day Matter) — 距未来N天 / 过去已N天 ──────────────────
const COUNTDOWN_PATH = V.COUNTDOWN;
function _cdDays(fromKey, toKey){
  // Align to noon to avoid DST / midnight-boundary ±1 day drift
  const p=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d,12,0,0);};
  return Math.round((p(toKey)-p(fromKey))/86400000);
}
function loadCountdown(){
  const box=$('countdown-list'); if(!box) return;
  const today=todayStr();
  const render=items=>{
    if(!items.length){ box.innerHTML='<div style="font-size:13px;color:var(--text4);padding:8px 4px;line-height:1.5">No countdowns yet. Click + Add to create one.</div>'; return; }
    box.innerHTML=items.map(it=>{
      const diff=_cdDays(today,it.date);
      let txt,color;
      if(diff>0){ txt=`${esc(it.title)} · <b>${diff}</b>d left`; color=diff<=3?'var(--red)':diff<=14?'var(--orange)':'var(--blue)'; }
      else if(diff<0){ txt=`${esc(it.title)} · day <b>${-diff+1}</b>`; color='var(--green-bg)'; }
      else { txt=`${esc(it.title)} · <b>today</b>`; color='var(--red)'; }
      return `<div class="reminder-item" style="cursor:default">
        <div class="rem-dot" style="background:${color}"></div>
        <div class="rem-body"><div class="rem-title" style="font-size:13px">${txt}</div><div class="rem-sub">${it.date}</div></div>
        <div class="rem-del" data-action="countdown-delete" data-line="${it.line}" title="Delete">×</div>
      </div>`;
    }).join('');
  };
  const f=app.vault.getAbstractFileByPath(COUNTDOWN_PATH);
  if(!f){ render([]); return; }
  app.vault.cachedRead(f).then(c=>{
    const items=[];
    c.split('\n').forEach((ln,idx)=>{ const m=ln.match(/^-\s+(\d{4}-\d{2}-\d{2})\s*·\s*(.+?)\s*$/); if(m) items.push({date:m[1],title:m[2].trim(),line:idx}); });
    items.sort((a,b)=>{ const da=_cdDays(today,a.date), db=_cdDays(today,b.date); const fa=da>=0,fb=db>=0; if(fa&&fb)return da-db; if(fa)return -1; if(fb)return 1; return db-da; });
    render(items);
  }).catch(e=>{ console.error('loadCountdown',e); render([]); });
}
async function addCountdown(){
  const title=await db26Prompt('Countdown name (e.g. paper deadline):'); if(!title||!title.trim()) return;
  const date=await db26Prompt('Date (YYYY-MM-DD):', todayStr());
  if(!date||!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())){ if(typeof Notice!=='undefined') new Notice('Date must be YYYY-MM-DD'); return; }
  const line=`- ${date.trim()} · ${title.trim()}`;
  let f=app.vault.getAbstractFileByPath(COUNTDOWN_PATH);
  try{
    if(f){ const c=await app.vault.read(f); await app.vault.modify(f, c.replace(/\s*$/,'')+'\n'+line+'\n'); }
    else { await app.vault.create(COUNTDOWN_PATH, '# '+vBase(V.COUNTDOWN)+'\n\n'+line+'\n'); }
  }catch(e){ console.error('addCountdown',e); }
  setTimeout(loadCountdown,200);
}
async function deleteCountdown(lineStr){
  const f=app.vault.getAbstractFileByPath(COUNTDOWN_PATH); if(!f) return;
  const lines=(await app.vault.read(f)).split('\n'); const i=parseInt(lineStr);
  if(lines[i]==null) return;
  if(!(await db26Confirm('Delete: \n\n'+lines[i].replace(/^-\s*/,'')))) return;
  lines.splice(i,1); await app.vault.modify(f, lines.join('\n')); setTimeout(loadCountdown,150);
}
async function addWishItem(text){
  const clean=(text||'').trim(); if(!clean) return;
  const f=await ensureWishFile();
  let txt=await app.vault.read(f);
  txt = txt.replace(/\s*$/,'') + `\n- [ ] ${todayStr()} · ${clean}`;
  await app.vault.modify(f, txt + '\n');
  setTimeout(loadWishlist, 200);
}
async function wishModifyLine(lineIdx, fn){
  const f=app.vault.getAbstractFileByPath(WISH_PATH); if(!f) return;
  const lines=(await app.vault.read(f)).split('\n');
  if(lines[lineIdx]==null) return;
  const res=fn(lines[lineIdx]);
  if(res===null){ lines.splice(lineIdx,1); } else { lines[lineIdx]=res; }
  await app.vault.modify(f, lines.join('\n'));
  setTimeout(loadWishlist, 150);
}
function wishComplete(line){ const n=new Date(), stamp=todayStr()+' '+pad(n.getHours())+':'+pad(n.getMinutes()); return wishModifyLine(+line, ln=> /\[[xX]\]/.test(ln)?ln : ln.replace(/\[ \]/,'[x]').replace(/\s*$/,'')+' ✅ '+stamp); }
function wishUncomplete(line){ return wishModifyLine(+line, ln=> ln.replace(/\[[xX]\]/,'[ ]').replace(/\s*✅\s*\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2})?/,'')); }
async function wishDelete(line){
  const f=app.vault.getAbstractFileByPath(WISH_PATH); if(!f) return;
  const lines=(await app.vault.read(f)).split('\n'), i=+line; if(!WISH_RE.test(lines[i]||'')) return;
  let count=1;
  while(i+count<lines.length && WISH_NOTE_RE.test(lines[i+count])) count++;
  lines.splice(i,count); await app.vault.modify(f,lines.join('\n')); setTimeout(loadPool,150);
}
async function addWishNote(line){
  const f=app.vault.getAbstractFileByPath(WISH_PATH); if(!f) return;
  const note=await db26Prompt('Add a timestamped note:'); if(note==null||!note.trim()) return;
  const lines=(await app.vault.read(f)).split('\n'), i=+line; if(!WISH_RE.test(lines[i]||'')) return;
  let insert=i+1; while(insert<lines.length && WISH_NOTE_RE.test(lines[insert])) insert++;
  const n=new Date(), stamp=todayStr()+' '+pad(n.getHours())+':'+pad(n.getMinutes());
  lines.splice(insert,0,'  - ✍️ '+stamp+' · '+note.replace(/[\r\n]+/g,' ').trim());
  await app.vault.modify(f,lines.join('\n')); setTimeout(loadPool,150);
}
async function writeWishText(lineIdx, newText){
  await wishModifyLine(+lineIdx, ln=>{
    const m=ln.match(/^(-\s+\[[ xX]\]\s+\d{4}-\d{2}-\d{2}\s*·\s*)(.+?)(\s*✅\s*\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2})?)?\s*$/);
    if(!m) return ln;
    return m[1]+newText.trim()+(m[3]||'');
  });
}
async function promoteWish(line){
  const f=app.vault.getAbstractFileByPath(WISH_PATH); if(!f) return;
  const lines=(await app.vault.read(f)).split('\n');
  const ln=lines[+line]; if(ln==null) return;
  const m=ln.match(WISH_RE); const text=m?m[3].trim():'';
  if(text){ await addVaultTask(_addTaskArea, text, {projectId:''}); }
  const n=new Date(), stamp=todayStr()+' '+pad(n.getHours())+':'+pad(n.getMinutes());
  await wishModifyLine(+line, l=> /\[[xX]\]/.test(l)?l : l.replace(/\[ \]/,'[x]').replace(/\s*$/,'')+' ✅ '+stamp);
  if (typeof Notice!=='undefined') new Notice('已Add to today（'+_addTaskArea+'）');
}

// Bind the two always-on capture inputs (idempotent)
function initTaskInputs(){
  const ti=$('task-add-input');
  if(ti && !ti.dataset.bound){ ti.dataset.bound='1';
    ti.placeholder='';
    ti.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); const v=ti.value.trim(); if(v){ const target=currentAddTaskTarget();addVaultTask(target.area,v,{projectId:target.projectId});ti.value=''; } } });
  }
  const context=$('task-context-select');
  if(context&&!context.dataset.bound){context.dataset.bound='1';context.addEventListener('change',()=>setAddTaskContext(context.value));}
}


async function addVaultTask(area, text, options={}) {
  const clean = (text||'').trim(); if (!clean) return;
  const f = await ensureTodayDaily();
  const content = await app.vault.read(f);
  const lines = content.split('\n');
  const re = new RegExp('^##\\s+.*\\b'+area+'\\b','i');
  let headingIdx = lines.findIndex(l => re.test(l));
  
  const whenValue=todayStr();   // new tasks are always for today
  const projectId=Object.prototype.hasOwnProperty.call(options,'projectId')?options.projectId:'';
  const project=taskProjectById(projectId);
  let meta=` [when:: ${whenValue}]`;
  if(project){
    meta+=` [project:: ${project.id}]`;
    const track=String(options.trackId||'').trim();
    if(track) meta+=` [track:: ${track}]`;
  }
  const taskLine = `- [ ] ${clean} #${area}${meta}`;
  if (headingIdx === -1) {
    lines.push('', '## ' + area, taskLine);
  } else {
    let end = lines.length;
    for (let i = headingIdx + 1; i < lines.length; i++) {
      if (/^##\s/.test(lines[i])) { end = i; break; }
    }
    let insertAt = end;
    while (insertAt > headingIdx + 1 && lines[insertAt - 1].trim() === '') insertAt--;
    lines.splice(insertAt, 0, taskLine);
  }
  await app.vault.modify(f, lines.join('\n'));
  setTimeout(() => { loadVaultTasks(); loadActiveProjectBoard(); }, 250);
}
async function syncLinkedTaskDocStatus(taskLine,isCompleted){
  const match=String(taskLine||'').match(/\[doc::\s*([^\]]+)\]/i);
  if(!match) return;
  const doc=findTaskDoc(match[1].trim());
  if(!doc) return;
  try{
    await app.fileManager.processFrontMatter(doc,fm=>{
      if(isCompleted){
        if(String(fm.status||'')!=='completed') fm.status_before_completion=String(fm.status||'open');
        fm.status=String(fm.type||'')==='writing-draft'?'published':'completed';
        fm.completed=todayStr();
        if(String(fm.type||'')==='writing-draft'&&!fm.published) fm.published=todayStr();
      }else{
        fm.status=String(fm.status_before_completion||(String(fm.type||'')==='writing-draft'?'draft':'open'));
        delete fm.status_before_completion;
        fm.completed='';
      }
    });
  }catch(e){
    console.error('[db26 sync task doc status]',e);
  }
}
async function syncLinkedTaskDocNote(taskLine,note){
  const match=String(taskLine||'').match(/\[doc::\s*([^\]]+)\]/i);
  if(!match) return;
  const doc=findTaskDoc(match[1].trim());
  if(!doc) return;
  try{
    await app.fileManager.processFrontMatter(doc,fm=>{
      fm.result_note=String(note||'').trim();
    });
  }catch(e){
    console.error('[db26 sync task doc note]',e);
  }
}

// A row rendered before a file moved still carries the old path. Archiving
// (or any rename) would otherwise make every action on it fail silently, so
// fall back to matching the basename before giving up.
function resolveVaultFile(path) {
  if (!path) return null;
  const direct = app.vault.getAbstractFileByPath(path);
  if (direct) return direct;
  const base = String(path).split('/').pop();
  const hits = app.vault.getMarkdownFiles().filter(f => f.name === base);
  return hits.length === 1 ? hits[0] : null;   // ambiguous name: refuse to guess
}

// Locate a task line: trust the index only if it still holds that task,
// otherwise find it by its text. Returns -1 when it is genuinely gone.
function findTaskLine(lines, lineIdx, text, open) {
  const box = open ? /^\s*- \[[^xX]\]/ : /^\s*- \[[xX]\]/;
  if (lines[lineIdx] && box.test(lines[lineIdx])) return lineIdx;
  const needle = String(text || '').trim().slice(0, 40);
  if (!needle) return -1;
  const hits = [];
  lines.forEach((l, i) => { if (box.test(l) && l.includes(needle)) hits.push(i); });
  if (hits.length === 1) return hits[0];
  if (hits.length > 1) {   // duplicate text: take the nearest to where it was
    return hits.reduce((a, b) => Math.abs(b - lineIdx) < Math.abs(a - lineIdx) ? b : a);
  }
  return -1;
}

async function cancelVaultTask(path, lineStr, text) {
  const file = resolveVaultFile(path);
  if (!file) { if (typeof Notice !== 'undefined') new Notice('File not found: ' + path); return; }
  const content = await app.vault.read(file);
  const lines = content.split('\n');
  const idx = findTaskLine(lines, parseInt(lineStr), text, true);
  if (idx < 0) {
    if (typeof Notice !== 'undefined') new Notice('找不到这条任务，列表已刷新');
    setTimeout(loadVaultTasks, 50); return;
  }
  let line = lines[idx].replace(/- \[[^\]]\]/, '- [-]');
  if (!/\[cancelled::/.test(line)) line += ' [cancelled:: ' + todayStr() + ']';
  lines[idx] = line;
  await app.vault.modify(file, lines.join('\n'));
  setTimeout(() => { loadVaultTasks(); loadActiveProjectBoard(); }, 300);
}

async function completeVaultTask(path, lineStr, text) {
  const file = resolveVaultFile(path);
  if (!file) { new Notice('File not found: '+path); return; }
  const content = await app.vault.read(file);
  const lines = content.split('\n');
  const lineIdx = findTaskLine(lines, parseInt(lineStr), text, true);
  if (lineIdx < 0) {
    if (typeof Notice !== 'undefined') new Notice('找不到这条任务，列表已刷新');
    setTimeout(loadVaultTasks, 50); return;
  }
  // Mark complete and append Tasks-plugin completion stamp if not present
  let newLine = lines[lineIdx].replace(/- \[[^\]]\]/, '- [x]');
  if (!/✅\s*\d{4}-\d{2}-\d{2}/.test(newLine)) {
    const now=new Date();
    const stamp=todayStr()+' '+pad(now.getHours())+':'+pad(now.getMinutes());
    newLine += ' [completed_at:: ' + stamp + '] ✅ ' + todayStr();
  }
  lines[lineIdx] = newLine;
  await app.vault.modify(file, lines.join('\n'));
  await syncLinkedTaskDocStatus(newLine,true);
  // refresh boards + reminders after dataview re-indexes
  setTimeout(() => { loadVaultTasks(); loadActiveProjectBoard(); }, 300);
}

async function uncompleteVaultTask(path, lineStr) {
  const file = resolveVaultFile(path);
  if (!file) { new Notice('File not found: '+path); return; }
  const lineIdx = parseInt(lineStr);
  const content = await app.vault.read(file);
  const lines = content.split('\n');
  if (!lines[lineIdx] || !/- \[[xX]\]/.test(lines[lineIdx])) { setTimeout(loadVaultTasks, 50); return; }
  // Remove [x] → [ ] and strip the ✅ YYYY-MM-DD completion stamp
  lines[lineIdx] = lines[lineIdx]
    .replace(/- \[[xX]\]/, '- [ ]')
    .replace(/\s*\[completed_at::\s*[^\]]+\]/i,'')
    .replace(/\s*✅\s*\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2})?/, '');
  await app.vault.modify(file, lines.join('\n'));
  await syncLinkedTaskDocStatus(lines[lineIdx],false);
  setTimeout(() => { loadVaultTasks(); loadActiveProjectBoard(); }, 300);
}

// Write new body text into a task line, preserving checkbox / #Tag / inline fields / ✅ stamp
async function writeTaskText(path, lineStr, newBody) {
  const file = resolveVaultFile(path); if (!file) return;
  const lineIdx = parseInt(lineStr);
  const content = await app.vault.read(file);
  const lines = content.split('\n');
  if (!lines[lineIdx] || !/- \[[ xX]\]/.test(lines[lineIdx])) return;
  const m = lines[lineIdx].match(/^(\s*- \[[ xX]\]\s*)(.*?)(\s*✅\s*\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2})?)?$/);
  if (!m) return;
  const prefix = m[1], bodyAll = m[2], tail = m[3] || '';
  const fields = bodyAll.match(/\s*\[\w+::[^\]]*\]/g) || [];
  const withoutFields = bodyAll.replace(/\s*\[\w+::[^\]]*\]/g, ' ');
  const tags = (withoutFields.match(/(?:^|\s)#[^\s#]+/g) || []).map(s=>s.trim()).join(' ');
  const trimmed = String(newBody).trim(); if (!trimmed) return;
  lines[lineIdx] = prefix + trimmed + (tags ? ' ' + tags : '') + fields.join('') + tail;
  await app.vault.modify(file, lines.join('\n'));
}

// Keep Today lightweight: one optional inline note, rendered beneath the task.
async function editTaskNote(path, lineStr, currentNote) {
  const value = await db26Prompt('Note (blank to remove):', currentNote || '');
  if (value == null) return;
  const file = resolveVaultFile(path); if (!file) return;
  const lineIdx = parseInt(lineStr);
  const content = await app.vault.read(file);
  const lines = content.split('\n');
  if (!lines[lineIdx] || !/- \[[ xX]\]/.test(lines[lineIdx])) { setTimeout(loadVaultTasks, 50); return; }
  const clean = String(value).replace(/[\r\n]+/g, ' ').replace(/\]/g, '）').trim();
  const noteRe = /\s*\[note::\s*[^\]]*\]/i;
  lines[lineIdx] = lines[lineIdx].replace(noteRe, '');
  if (clean) {
    const done = lines[lineIdx].match(/\s*(✅\s*\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2})?)\s*$/);
    if (done) lines[lineIdx] = lines[lineIdx].slice(0, done.index).replace(/\s*$/, '') + ` [note:: ${clean}] ` + done[1];
    else lines[lineIdx] = lines[lineIdx].replace(/\s*$/, '') + ` [note:: ${clean}]`;
  }
  await app.vault.modify(file, lines.join('\n'));
  await syncLinkedTaskDocNote(lines[lineIdx],clean);
  setTimeout(()=>{loadVaultTasks();loadActiveProjectBoard();},250);
}

// Inline-edit: turn a label into an input in place; commit on Enter/blur, cancel on Esc
function startInlineEdit(labelEl, onCommit) {
  if (!labelEl || labelEl.dataset.editing) return;
  labelEl.dataset.editing = '1';
  const cur = labelEl.textContent;
  const inp = document.createElement('input');
  inp.className = 'vt-inline-edit'; inp.value = cur;
  labelEl.style.display = 'none';
  labelEl.parentNode.insertBefore(inp, labelEl);
  inp.focus(); inp.select();
  let done = false;
  const finish = async (commit) => {
    if (done) return; done = true;
    const val = inp.value.trim();
    if (commit && val && val !== cur) { try { await onCommit(val); } catch(e){ console.error(e); } }
    setTimeout(() => { loadVaultTasks(); loadActiveProjectBoard(); loadWishlist(); }, 60);
  };
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); finish(true); }
    else if (e.key === 'Escape') { e.preventDefault(); finish(false); }
  });
  inp.addEventListener('blur', () => finish(true));
}

async function deleteVaultTask(path, lineStr) {
  const file = resolveVaultFile(path);
  if (!file) { new Notice('File not found: '+path); return; }
  const lineIdx = parseInt(lineStr);
  const content = await app.vault.read(file);
  const lines = content.split('\n');
  // Obsidian Tasks supports custom checkbox states such as `[-]` (cancelled).
  // These rows are still tasks and can appear in Dashboard, so deletion must
  // accept every single-character checkbox state rather than only [ ], [x].
  const isTaskLine = line => /^\s*[-*+]\s+\[[^\]\r\n]\]/.test(String(line||''));
  if (!Number.isInteger(lineIdx) || !isTaskLine(lines[lineIdx])) {
    new Notice('Task moved — list refreshed, click delete again');
    setTimeout(loadVaultTasks, 50); return;
  }
  const preview = lines[lineIdx].replace(/^\s*[-*+]\s+\[[^\]\r\n]\]\s*/, '').slice(0, 60);
  if (!(await db26Confirm('Delete task：\n\n' + preview, 'Delete'))) return;
  lines.splice(lineIdx, 1);
  await app.vault.modify(file, lines.join('\n'));
  setTimeout(() => { loadVaultTasks(); loadActiveProjectBoard(); }, 300);
}

// ─ Quick open (今日流程入口) ─────────────────────────────────────
function buildQuickLinks() {
  const box = $('quick-links'); if (!box) return;
  const today = todayStr();
  const yest  = dateKey(addDays(new Date(), -1));
  const wk    = (() => {
    const d = new Date();
    const w = getWeek(d);
    return getWeekYear(d) + '-W' + pad(w);
  })();
  const items = [
    {act:'today-daily',     c:'var(--text)',   l:'Daily Note'},
    {open:findDated(V.REVIEW_D, today, ' 复盘'),        c:'var(--yellow-bg)', l:'Daily review'},
    {act:'today-life-log',  c:'var(--blue-bg)',   l:'Life Log'},
    {act:'append-life-log', c:'#26c6da',       l:'Add to life log'},
    {open:findDated(V.REVIEW_D, yest, ' 复盘'),         c:'var(--orange-bg)', l:'Yesterday'},
    {open:V.REVIEW_W + '/' + wk + '.md',                  c:'var(--green-bg)',  l:'Weekly review'},
    {act:'new-speech',     c:'#e91e63',       l:'Speech'},
    {act:'new-acad-write', c:'var(--blue-bg)',   l:'Academic'},
    {act:'new-paper-read', c:'var(--purple)', l:'Paper reading'},
    {act:'new-pub-write',  c:'var(--teal)',   l:'Public writing'},
    {act:'archive-old',    c:'#8d6e63',       l:'Archive old'},
  ];
  box.innerHTML = items.map(x=>{
    if (x.act) return `<div class="ql-btn" data-action="qa" data-key="${x.act}"><div class="ql-dot" style="background:${x.c}"></div>${x.l}</div>`;
    return `<div class="ql-btn" data-action="open-vault" data-path="${esc(x.open)}"><div class="ql-dot" style="background:${x.c}"></div>${x.l}</div>`;
  }).join('');
}
// Archive dated notes older than the current month into `{folder}/YYYY-MM/` subfolders.
// Dataview folder queries and the Daily Note helpers recurse, so aggregation is unaffected;
// links are preserved via fileManager.renameFile.
async function archiveOldDailies() {
  const folders = [V.DAILY, V.REVIEW_D, V.LIFELOG, V.RNOTES];
  const now = new Date();
  const curYM = now.getFullYear()*100 + (now.getMonth()+1);
  const dateRe = /(\d{4})-(\d{1,2})-(\d{1,2})/;
  const moves = [];
  for (const folder of folders) {
    const af = app.vault.getAbstractFileByPath(folder);
    if (!af || af.children === undefined) continue;
    for (const child of af.children) {
      if (child.extension !== 'md') continue;           // skip subfolders & non-md
      const m = child.name.match(dateRe); if (!m) continue;
      const y = +m[1], mo = +m[2];
      if (y*100 + mo > curYM) continue;                 // future only
      const iso = y + '-' + pad(mo) + '-' + pad(+m[3]);
      const sub = datedSubfolder(iso).replace(/\/$/, '');
      if (sub) moves.push({ file: child, folder, sub });
    }
  }
  if (!moves.length) { if (typeof Notice!=='undefined') new Notice('Nothing to archive — all files are this month.'); return; }
  if (!(await db26Confirm('Archive ' + moves.length + ' file(s) into monthly subfolders?\n\n' + [V.DAILY, V.REVIEW_D, V.LIFELOG, V.RNOTES].map(vBase).join(' / ') + ' — files before this month.'))) return;
  const made = new Set();
  let ok = 0;
  for (const mv of moves) {
    const dir = mv.folder + '/' + mv.sub;
    if (!made.has(dir)) { try { await app.vault.createFolder(dir); } catch(_e){} made.add(dir); }
    try { await app.fileManager.renameFile(mv.file, dir + '/' + mv.file.name); ok++; }
    catch(e){ console.error('[db26 archive]', mv.file.path, e); }
  }
  if (typeof Notice!=='undefined') new Notice('Archived ' + ok + '/' + moves.length + ' file(s) ✓');
}

async function quickAction(key) {
  const dateP = todayStr() + ' ';
  if(key==='today-daily') {
    const f = await ensureTodayDaily();
    app.workspace.openLinkText(f.path,'',false);
  } else if (key==='today-life-log') {
    const f = await ensureTodayFile('life-log');
    app.workspace.openLinkText(f.path,'',false);
  } else if (key==='append-life-log') {
    await appendLifeLogEntry();
  } else if (key==='archive-old') {
    await archiveOldDailies();
  } else if (key==='new-speech') {
    await createFromTemplate('Speech Practice Template', V.SPEAKING, dateP + 'Speaking practice name:');
  } else if (key==='new-acad-write') {
    await createFromTemplate('Academic Writing Practice Template', V.ACADEMIC, dateP + 'Writing piece name:');
  } else if (key==='new-pub-write') {
    await createFromTemplate('Public Writing Template', V.WRITE_PUB, dateP + 'Article name:');
  } else if (key==='new-paper-read') {
    await createFromTemplate('Paper Reading Template', V.LIT, 'Paper title (used as filename):');
  }
}

// ─ Literature · one Zotero collection (V.ZOT_COLL) → vault notes ──
// Reads a *copy* of zotero.sqlite through the sqlite3 CLI (Zotero holds a
// lock on the live file), then writes one note per paper. The `## 我的话`
// section of an existing note is always carried over untouched.
const ZOT = {
  COLL:  V.ZOT_COLL,
  OUT:   V.ZOT_OUT,
  SQLITE:['/usr/bin/sqlite3','/opt/homebrew/bin/sqlite3','/usr/local/bin/sqlite3'],
};
const ZOT_MINE = LIT_ESSAY_HEAD;
// Tag → canonical tag, so "research gap", "问题" and "gap" count as one (literature-core.js).
const LIT_CANON = litTagCanon(CFG.tagAliases);
const ZOT_MINE_LEGACY = '## 我的话';

// Filenames must stay stable across syncs (they are the note identity), so cut
// on a word boundary rather than mid-word.
function zotSlug(t) {
  const clean = String(t || '').replace(/[\\/:*?"<>|#^\[\]]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return 'untitled';
  if (clean.length <= 72) return clean;
  const cut = clean.slice(0, 72);
  const sp = cut.lastIndexOf(' ');
  return (sp > 40 ? cut.slice(0, sp) : cut).trim();
}
const zotYear = d => (String(d || '').match(/(\d{4})/) || [, ''])[1] || '';
// The翻译 plugin wraps its machine translation in 🔤…🔤; anything else in
// `comment` is a note the user typed, so keep the two apart.
const zotZh = c => { const m = String(c || '').match(/🔤([\s\S]*?)🔤/); return m ? m[1].trim() : ''; };
const zotOwn = c => String(c || '').replace(/🔤[\s\S]*?🔤/g, '').trim();

// Dataview evaluates this file through `new Function`, where the module-scoped
// `require` isn't always in scope — fall back to the one Electron puts on window.
function zotRequire(mod) {
  const r = (typeof require === 'function') ? require
          : (typeof window !== 'undefined' && typeof window.require === 'function') ? window.require
          : null;
  if (!r) throw new Error('No Node in this environment (needs Obsidian desktop)');
  return r(mod);
}
const zotNotice = m => { try { if (typeof Notice !== 'undefined') new Notice(m); } catch (_e) {} };

function zotSqlitePath() {
  const fs = zotRequire('fs');
  const hit = ZOT.SQLITE.find(p => { try { return fs.existsSync(p); } catch (_e) { return false; } });
  if (!hit) throw new Error('找不到 sqlite3 命令（试过 ' + ZOT.SQLITE.join(' / ') + '）');
  return hit;
}
function zotQuery(bin, db, sql) {
  const { execFileSync } = zotRequire('child_process');
  const out = execFileSync(bin, ['-json', db, sql], { maxBuffer: 64 * 1024 * 1024 }).toString();
  return out.trim() ? JSON.parse(out) : [];
}

const ZOT_SQL_ITEMS = coll => `
WITH v AS (SELECT id.itemID, f.fieldName, idv.value FROM itemData id
  JOIN itemDataValues idv ON idv.valueID=id.valueID JOIN fields f ON f.fieldID=id.fieldID)
SELECT i.itemID id, i.key ikey, i.dateAdded added,
 (SELECT value FROM v WHERE itemID=i.itemID AND fieldName='title') title,
 COALESCE((SELECT value FROM v WHERE itemID=i.itemID AND fieldName='date'),'') dt,
 COALESCE((SELECT value FROM v WHERE itemID=i.itemID AND fieldName='publicationTitle'),'') pub,
 COALESCE((SELECT value FROM v WHERE itemID=i.itemID AND fieldName='DOI'),'') doi,
 COALESCE((SELECT value FROM v WHERE itemID=i.itemID AND fieldName='url'),'') url,
 COALESCE((SELECT value FROM v WHERE itemID=i.itemID AND fieldName='abstractNote'),'') abs,
 COALESCE((SELECT group_concat(c.lastName,', ') FROM itemCreators ic
   JOIN creators c ON c.creatorID=ic.creatorID WHERE ic.itemID=i.itemID),'') authors
FROM collectionItems ci JOIN items i ON i.itemID=ci.itemID
JOIN collections co ON co.collectionID=ci.collectionID
WHERE co.collectionName='${coll}' AND i.itemID NOT IN (SELECT itemID FROM deletedItems)`;

const ZOT_SQL_ANN = coll => `
SELECT att.parentItemID pid, ia.type type, COALESCE(ia.pageLabel,'') page,
  ia.sortIndex sortIndex, COALESCE(ia.text,'') text, COALESCE(ia.comment,'') comment,
  COALESCE(ia.color,'') color, COALESCE(ia.position,'') pos, it.key akey, it.dateAdded at,
  (SELECT key FROM items WHERE itemID=ia.parentItemID) attkey,
  COALESCE((SELECT group_concat(t.name, char(31)) FROM itemTags itg
     JOIN tags t ON t.tagID=itg.tagID WHERE itg.itemID=ia.itemID),'') tags
FROM itemAnnotations ia
JOIN items it ON it.itemID=ia.itemID
JOIN itemAttachments att ON att.itemID=ia.parentItemID
WHERE att.parentItemID IN (
  SELECT ci.itemID FROM collectionItems ci JOIN collections co ON co.collectionID=ci.collectionID
  WHERE co.collectionName='${coll}')
AND it.itemID NOT IN (SELECT itemID FROM deletedItems)
ORDER BY att.parentItemID, ia.sortIndex`;

// ── Section detection ───────────────────────────────────────────
// Zotero has no notion of a paper's sections, but it caches each PDF's plain
// text at storage/<attachmentKey>/.zotero-ft-cache. Find the short lines that
// look like section headings, then place each highlight after the last heading
// that precedes it in that text.
const ZOT_HEAD = /^\s*(?:\d+(?:\.\d+)*)?[.．、]?\s*(Abstract|Introduction|Related\s+Works?|Background|Preliminar\w+|Method(?:s|ology)?|Approach|Proposed[\w\s-]*|Model(?:\s+\w+)?|Framework|Experiment\w*(?:\s+\w+)?|Evaluation|Results?(?:\s+and\s+\w+)?|Analysis|Discussion|Ablation\w*|Conclusions?(?:\s+and\s+[\w\s]+)?|Limitations?|Future\s+Work|Acknowledg\w*|References|Appendix)\s*$/i;

// Canonical bucket + display order, so `ABSTRACT` / `abstract` / `Abstract`
// don't become three different sections.
const ZOT_SECTIONS = [
  [/^abstract/i,                              '摘要 · Abstract'],
  [/^introduction/i,                          '引言 · Introduction'],
  [/^(related|background|preliminar)/i,       '相关工作 · Related Work'],
  [/^(method|approach|proposed|model|framework)/i, '方法 · Method'],
  [/^(experiment|evaluation)/i,               '实验设置 · Experiments'],
  [/^(result|analysis|ablation)/i,            '结果 · Results'],
  [/^discussion/i,                            '讨论 · Discussion'],
  [/^(conclusion|limitation|future)/i,        '结论 · Conclusion'],
  [/^(acknowledg|reference|appendix)/i,       '附录 · Appendix'],
];
const zotSection = raw => {
  for (const [re, name] of ZOT_SECTIONS) if (re.test(raw)) return name;
  return null;
};
const zotNorm = s => String(s).replace(/\s+/g, ' ').trim().toLowerCase();

function zotFullText(attKey) {
  try {
    const fs = zotRequire('fs'), os = zotRequire('os'), pathm = zotRequire('path');
    const f = pathm.join(os.homedir(), 'Zotero', 'storage', attKey, '.zotero-ft-cache');
    if (!fs.existsSync(f)) return null;
    const raw = fs.readFileSync(f, 'utf8');
    const flat = zotNorm(raw);
    const marks = [];
    for (const line of raw.split('\n')) {
      const t = line.trim();
      if (t.length > 60 || !ZOT_HEAD.test(t)) continue;
      const name = zotSection(t.replace(/^\s*\d+(\.\d+)*[.．、]?\s*/, '').trim());
      if (!name) continue;
      const at = flat.indexOf(zotNorm(t));
      if (at >= 0) marks.push({ at, name });
    }
    marks.sort((a, b) => a.at - b.at);
    return { flat, marks };
  } catch (_e) { return null; }
}

// ── Figures ─────────────────────────────────────────────────────
// Zotero renders every image annotation — the rectangle you drag over a figure
// or table — to cache/library/<annotationKey>.png. Copy those into the vault
// and caption them from the PDF's own text: the full-text cache keeps page
// breaks as \f, so the "Fig. N." / "Table N" lines on that page are right there.
// You never tag these, so the caption is also what says whether a picture is
// the method or a result.
const ZOT_FIG_KIND = [
  [/overview|framework|architecture|schematic|structure|pipeline|flow ?chart|workflow|proposed|module|mechanism|diagram|illustration/i, '方法 · Method'],
  [/result|performance|compar|ablation|accuracy|rmse|mae\b|visuali[sz]|prediction|curve|confusion|error|loss/i, '结果 · Results'],
  [/dataset|data set|statistic|parameter|hyper|setting|configuration|notation|description of/i, '实验设置 · Experiments'],
];
const ZOT_FIG_ORDER = ['方法 · Method', '实验设置 · Experiments', '结果 · Results', '其他'];

function zotPageCaptions(attKey) {
  try {
    const fsm = zotRequire('fs'), os = zotRequire('os'), pathm = zotRequire('path');
    const f = pathm.join(os.homedir(), 'Zotero', 'storage', attKey, '.zotero-ft-cache');
    if (!fsm.existsSync(f)) return null;
    const pages = fsm.readFileSync(f, 'utf8').split('\f');
    return pages.map(p => {
      const lines = p.split('\n').map(l => l.trim());
      const caps = [];
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        // "Fig. 2. Schematic…" is a caption; "Figure 2 shows…" is body text.
        if (/^(fig\.?|figure)\s*\d+[.:]/i.test(l) || /^table\s*\d+[.:]\s/i.test(l)) caps.push(l);
        else if (/^table\s*\d+[.:]?$/i.test(l)) caps.push((l + ' ' + (lines.slice(i + 1).find(Boolean) || '')).trim());
      }
      return caps.map(c => c.length > 180 ? c.slice(0, 180) + '…' : c);
    });
  } catch (_e) { return null; }
}

async function zotFigures(it, anns) {
  if (!anns.length) return [];
  const fsm = zotRequire('fs'), os = zotRequire('os'), pathm = zotRequire('path');
  const dir = ZOT.OUT + '/_figures/' + it.ikey;
  const pos = a => { try { return JSON.parse(a.pos || '{}'); } catch (_e) { return {}; } };
  const pageOf = a => pos(a).pageIndex;
  const topOf = a => { const r = (pos(a).rects || [])[0]; return r ? Math.max(r[1], r[3]) : 0; };
  const caps = zotPageCaptions(anns[0].attkey) || [];

  // Several annotations on one page take that page's captions top to bottom —
  // but only when the counts agree; otherwise a wrong caption is worse than none.
  const byPage = {};
  for (const a of anns) (byPage[pageOf(a)] = byPage[pageOf(a)] || []).push(a);
  const caption = {};
  for (const [p, list] of Object.entries(byPage)) {
    const c = caps[+p] || [];
    list.sort((a, b) => topOf(b) - topOf(a));
    if (c.length === list.length) list.forEach((a, i) => { caption[a.akey] = c[i]; });
    else if (list.length === 1 && c.length === 1) caption[list[0].akey] = c[0];
  }

  try { if (!(await app.vault.adapter.exists(dir))) await app.vault.adapter.mkdir(dir); } catch (_e) {}
  const out = [], keep = new Set();
  for (const a of anns.slice().sort((x, y) => (pageOf(x) - pageOf(y)) || (topOf(y) - topOf(x)))) {
    const src = pathm.join(os.homedir(), 'Zotero', 'cache', 'library', a.akey + '.png');
    const vpath = dir + '/' + a.akey + '.png';
    const cap = caption[a.akey] || '';
    const kind = (ZOT_FIG_KIND.find(([re]) => re.test(cap)) || [, /^table/i.test(cap) ? '结果 · Results' : '其他'])[1];
    const f = { akey: a.akey, attkey: a.attkey, page: a.page || (pageOf(a) + 1), caption: cap, kind, vpath, missing: false };
    if (!fsm.existsSync(src)) { f.missing = true; out.push(f); continue; }
    keep.add(vpath);
    try {
      const st = await app.vault.adapter.stat(vpath);
      const size = fsm.statSync(src).size;
      if (!st || st.size !== size) {
        const buf = fsm.readFileSync(src);
        await app.vault.adapter.writeBinary(vpath, buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
      }
    } catch (_e) { f.missing = true; }
    out.push(f);
  }
  // an annotation deleted in Zotero takes its picture with it
  try {
    const listing = await app.vault.adapter.list(dir);
    for (const p of listing.files || []) if (p.endsWith('.png') && !keep.has(p)) await app.vault.adapter.remove(p);
  } catch (_e) {}
  return out;
}

function zotFigureBlock(figs) {
  if (!figs.length) return '';
  const groups = new Map();
  for (const f of figs) { if (!groups.has(f.kind)) groups.set(f.kind, []); groups.get(f.kind).push(f); }
  const keys = [...groups.keys()].sort((a, b) => ZOT_FIG_ORDER.indexOf(a) - ZOT_FIG_ORDER.indexOf(b));
  const one = f => {
    const link = `zotero://open-pdf/library/items/${f.attkey}?annotation=${f.akey}`;
    const meta = ['**p.' + f.page + '**', f.caption ? ZOT_FAINT(f.caption) : '', `[↗](${link})`].filter(Boolean).join('　');
    return f.missing
      ? [meta, ZOT_FAINT('Zotero 还没渲染这张图 —— 在 Zotero 里点开一次这个标注，再同步。'), ''].join('\n')
      : ['![[' + f.vpath + '|720]]', meta, ''].join('\n');
  };
  return ['', `## 图表 · ${figs.length}`]
    .concat(keys.map(k => ['', `### ${k}　<small>${groups.get(k).length}</small>`, ''].concat(groups.get(k).map(one)).join('\n')))
    .join('\n');
}

// ── Thoughts ────────────────────────────────────────────────────
// What you wrote in Zotero, as opposed to what the paper says: sticky notes on
// the PDF, your own words in an annotation's comment, and child notes.
// They live in one document of their own, grouped by paper; the paper note only
// links there.
//
// Much of what Zotero stores as a "note" was not written by you: reading-time
// plugin data, arXiv comments, Semantic Scholar TL;DRs, and notes generated from
// annotations that only repeat the highlights. Those are dropped, and from a
// generated note only the lines you added between the quotes are kept.
const ZOT_SQL_NOTES = coll => `
SELECT n.parentItemID pid, i.key nkey, n.note note, i.dateAdded at, i.dateModified mod
FROM itemNotes n JOIN items i ON i.itemID=n.itemID
WHERE n.parentItemID IN (SELECT ci.itemID FROM collectionItems ci JOIN collections co ON co.collectionID=ci.collectionID
  WHERE co.collectionName='${coll}')
AND i.itemID NOT IN (SELECT itemID FROM deletedItems)`;

function zotNoteToMd(html) {
  const raw = String(html || '');
  const flat = raw.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  if (!flat) return '';
  if (/"readingTime"\s*:/.test(flat) && /^\S*\s*\{/.test(flat)) return '';    // Zotero reading-time plugin
  if (/^Comment:/i.test(flat) && flat.length < 400) return '';               // arXiv metadata
  if (/^\[TLDR\]/i.test(flat)) return '';                                     // Semantic Scholar
  if (/^(?:施引文献|被引|Citations?)\s*[:：]\s*\d+$/i.test(flat)) return '';       // citation-count plugin
  let doc;
  try { doc = new DOMParser().parseFromString('<div id="z">' + raw + '</div>', 'text/html'); } catch (_e) { return ''; }
  const root = doc.getElementById('z') || doc.body;
  // A paragraph built around a copied quote is the annotation again — its quote,
  // its citation, and the comment Zotero appends to it (a translation, or words
  // already taken from the annotation itself). Only paragraphs without one are yours.
  const QUOTE = 'span.highlight, span.underline, span.citation, img[data-annotation]';
  root.querySelectorAll(QUOTE).forEach(e => {
    const para = e.closest('p, li, blockquote, h1, h2, h3, h4, h5, h6') || e;
    para.setAttribute('data-q', '1');
  });
  root.querySelectorAll('[data-q]').forEach(e => e.remove());

  const inline = n => {
    if (n.nodeType === 3) return n.nodeValue.replace(/\s+/g, ' ');
    if (n.nodeType !== 1) return '';
    const tag = n.tagName.toLowerCase();
    const inner = [...n.childNodes].map(inline).join('');
    if (tag === 'br') return '\n';
    if ((tag === 'strong' || tag === 'b') && inner.trim()) return '**' + inner.trim() + '**';
    if ((tag === 'em' || tag === 'i') && inner.trim()) return '*' + inner.trim() + '*';
    if (tag === 'code' && inner.trim()) return '`' + inner.trim() + '`';
    if (tag === 'a' && inner.trim()) return n.getAttribute('href') ? '[' + inner.trim() + '](' + n.getAttribute('href') + ')' : inner;
    return inner;
  };
  const tidy = s => s.replace(/🔤[\s\S]*?🔤/g, '')
    .replace(/[(（]\s*\d{4}\/\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?\s*[)）]/g, '')   // export timestamp
    .replace(/^\[TLDR\][\s\S]*$/i, '')                                                   // a TL;DR pasted inside a note
    .replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim();
  // what is left of a paragraph once its quote and citation are gone: “”, ( ), stray commas
  const empty = s => !s.replace(/[“”"'‘’()（）\[\]\s,，.。;；:：\-–—]/g, '');
  const out = [];
  const block = (n, depth) => {
    if (n.nodeType === 3) { const t = tidy(n.nodeValue); if (!empty(t)) out.push(t); return; }
    if (n.nodeType !== 1) return;
    const tag = n.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) {
      const t = tidy(inline(n));
      // the header Zotero puts on a note generated from annotations
      if (!empty(t) && !/^(?:注释|批注|Annotations)$/i.test(t)) out.push('#### ' + t);
      return;
    }
    if (tag === 'ul' || tag === 'ol') {
      let i = 0;
      for (const li of n.children) {
        if (li.tagName.toLowerCase() !== 'li') continue;
        const t = tidy(inline(li)); if (empty(t)) continue;
        out.push('  '.repeat(depth) + (tag === 'ol' ? (++i) + '. ' : '- ') + t);
      }
      return;
    }
    if (tag === 'blockquote') { const t = tidy(inline(n)); if (!empty(t)) out.push(t.split('\n').map(l => '> ' + l).join('\n')); return; }
    if (tag === 'pre') { const t = n.textContent.trim(); if (t) out.push('```\n' + t + '\n```'); return; }
    if (tag === 'p' || tag === 'div' && ![...n.children].some(c => /^(p|div|ul|ol|h[1-6]|blockquote|pre|table)$/i.test(c.tagName))) {
      const t = tidy(inline(n)); if (!empty(t)) out.push(t); return;
    }
    for (const c of n.childNodes) block(c, depth);
  };
  for (const c of root.childNodes) block(c, 0);
  return out.join('\n\n').trim();
}

// Everything you wrote about one paper, in reading order, notes last.
function zotThoughts(it, anns, notes) {
  const out = [];
  for (const a of anns) {
    // Only what you wrote as a note. Tags — even long ones — stay with their
    // sentence in the paper note and the tag index; they are not repeated here.
    const text = zotOwn(a.comment);
    if (!text) continue;
    out.push({
      kind: a.type === 2 ? '便签' : a.type === 3 ? '图片批注' : '划线批注',
      page: a.page, sort: a.sortIndex || '', at: a.at, text,
      quote: (a.type === 1 || a.type === 5) ? String(a.text).replace(/\s*\n\s*/g, ' ').trim() : '',
      link: `zotero://open-pdf/library/items/${a.attkey}?annotation=${a.akey}`,
    });
  }
  out.sort((x, y) => String(x.sort).localeCompare(String(y.sort)));
  for (const n of notes.slice().sort((x, y) => String(x.at).localeCompare(String(y.at)))) {
    const md = zotNoteToMd(n.note);
    if (md) out.push({ kind: '笔记', page: '', at: n.mod || n.at, text: md, quote: '', link: `zotero://select/library/items/${n.nkey}` });
  }
  return out;
}

function zotThoughtsDoc(papers) {
  const list = papers.filter(p => p.list.length)
    .sort((a, b) => maxAt(b.list).localeCompare(maxAt(a.list)));
  function maxAt(l) { return l.reduce((m, x) => String(x.at) > m ? String(x.at) : m, ''); }
  const head = ['# ' + vBase(V.ZOT_THOUGHTS), '',
    '> Zotero 同步生成：你在 Zotero 里写的便签、批注和笔记，按论文归档，最近写过的排在前面。',
    '> 这里每次同步都会整篇重写 —— 要改请在 Zotero 里改。', ''];
  if (!list.length) return head.concat(['还没有。在 Zotero 里给 PDF 加便签、在划线批注里写自己的话，或者给论文加子笔记，同步后会出现在这里。', '']).join('\n');
  const body = list.map(p => {
    const y = zotYear(p.it.dt);
    const parts = ['## ' + p.slug, '',
      `[[${p.path.replace(/\.md$/, '')}|文献笔记]]` + (y ? ' · ' + y : '') + ' · ' + p.list.length + ' 条 · 最近 ' + maxAt(p.list).slice(0, 10), ''];
    for (const x of p.list) {
      const label = [x.page ? 'p.' + x.page : '', x.kind, String(x.at).slice(5, 10)].filter(Boolean).join(' · ');
      parts.push(`### ${label}　[↗](${x.link})`, '');
      if (x.quote) parts.push('> ' + (x.quote.length > 220 ? x.quote.slice(0, 220) + '…' : x.quote), '');
      parts.push(x.text, '');
    }
    return parts.join('\n');
  });
  return head.concat(body).join('\n');
}

function zotAssignSections(hls) {
  const ft = hls.length ? zotFullText(hls[0].attkey) : null;
  for (const h of hls) {
    h.section = '';
    if (!ft) continue;
    const probe = zotNorm(h.text).slice(0, 60);
    if (probe.length < 15) continue;
    const at = ft.flat.indexOf(probe);
    if (at < 0) continue;
    for (const m of ft.marks) { if (m.at <= at) h.section = m.name; else break; }
  }
  return hls;
}

// A Zotero tag is either a short reusable label ("research gap", "dataset") or
// a whole sentence the user typed into the tag box — which is really a note.
const zotIsLabel = t => t.length <= 16 && !/[,.，。；;]/.test(t);
const zotTags = h => String(h.tags || '').split('\u001f').map(s => s.trim()).filter(Boolean);

const ZOT_FAINT = s => `<small style="color:var(--text-faint)">${s}</small>`;

// Older notes put a faint hint right under 综述段落, and it looked enough like
// an input box that the paragraph got typed into the hint itself — where it
// rendered as faint small print and was filtered out of the Synthesis view as
// if it were still the hint. Text inside the tag that isn't one of the stock
// hints is yours.
const ZOT_ESSAY_HINTS = LIT_ESSAY_HINTS;
const ZOT_SMALL = /<small\b[^>]*>([\s\S]*?)<\/small>/g;
const zotIsHint = s => ZOT_ESSAY_HINTS.includes(String(s).trim());


// On sync, the same repair in the file: unwrap a paragraph written into the
// hint, drop a hint nobody touched. Nothing else in your part of the note moves.
function zotTidyTail(tail) {
  const i = tail.indexOf(ZOT_MINE);
  if (i < 0) return tail;
  const start = i + ZOT_MINE.length;
  const j = tail.indexOf('\n## ', start);
  const end = j < 0 ? tail.length : j;
  const before = tail.slice(start, end);
  if (!/<small\b/.test(before)) return tail;          // nothing of ours in there: leave your text exactly as it is
  const seg = before.replace(ZOT_SMALL, (_, inner) => zotIsHint(inner) ? '' : inner.trim()).trim();
  const rest = tail.slice(end).replace(/^\n+/, '');
  return tail.slice(0, start) + '\n\n' + (seg ? seg + '\n\n' : '') + (rest ? '\n' + rest : '');
}

// ── 速览 table ──────────────────────────────────────────────────
// Filled from the tags you put on individual sentences. A row you typed by
// hand survives as long as no tagged sentence claims it.
const ZOT_BRIEF_HEAD = LIT_BRIEF_HEAD;

function zotBriefRows(hls, old) {
  return LIT_BRIEF.map(([key, label]) => {
    const hit = hls.find(h => zotTags(h).some(t => LIT_CANON(t) === key));
    let v = '';
    if (hit) {
      // Chinese first: this row exists to be scanned, not cited.
      v = (zotZh(hit.comment) || String(hit.text)).replace(/\s*\n\s*/g, ' ').trim();
      if (v.length > 96) v = v.slice(0, 96).replace(/[\s,，、]+\S*$/, '') + '…';
    }
    return `| **${label}** | ${v || (old && old[label]) || ''} |`;
  });
}

const zotParseBrief = litBriefFromNote;

// Colours carry no meaning in this library — kept only as a scanning marker.
function zotNote(it, hls, mine, oldBrief, figs, thoughts) {
  figs = figs || []; thoughts = thoughts || [];
  // A sticky note is written on a page of the paper, so it belongs in the paper
  // note at that place — among the highlights around it — as well as in the
  // thoughts document.
  const stickies = thoughts.filter(t => t.kind === '便签');
  const oneSticky = t => [
    ['**p.' + (t.page || '?') + '**', '便签', `[↗](${t.link})`].join('　'),
    // a callout, which the sentence index skips, not a plain quote it would read as a highlight
    '> [!note] 我的便签',
  ].concat(String(t.text).split('\n').map(l => '> ' + l)).concat(['']).join('\n');
  zotAssignSections(hls);
  const y = zotYear(it.dt);
  const venue = it.pub || (/arxiv/i.test(it.url) ? 'arXiv preprint' : 'preprint');
  const lastSorted = hls.map(h => h.at).sort();
  // One entry per day you actually annotated this paper — drives the timeline.
  const perDay = {};
  for (const h of hls) { const d = h.at.slice(0, 10); perDay[d] = (perDay[d] || 0) + 1; }
  const sessions = Object.keys(perDay).sort().reverse().map(d => `  - "${d} · ${perDay[d]}"`);
  const fm = [
    '---',
    'type: paper',
    'collection: ' + ZOT.COLL,
    'zotero_key: ' + it.ikey,
    'title: ' + JSON.stringify(it.title || ''),
    'authors: ' + JSON.stringify(it.authors || ''),
    'year: ' + (y || '""'),
    'venue: ' + JSON.stringify(venue),
    'doi: ' + JSON.stringify(it.doi || ''),
    'status: ' + (hls.length >= 20 ? 'deep' : (hls.length || figs.length || stickies.length) ? 'read' : 'unread'),
    'highlights: ' + hls.length,
    'figures: ' + figs.length,
    'last_read: ' + (lastSorted.length ? lastSorted[lastSorted.length - 1].slice(0, 10) : '""'),
    'added: ' + it.added.slice(0, 10),
    sessions.length ? 'sessions:\n' + sessions.join('\n') : 'sessions: []',
    'topics: []',
    'related_concepts: []',
    '---',
  ].join('\n');

  const head = [
    '# ' + (it.title || '(no title)'),
    '',
    [it.authors, y, venue].filter(Boolean).join(' · ') +
      `　[在 Zotero 中打开](zotero://select/library/items/${it.ikey})` +
      (it.doi ? `　[DOI](https://doi.org/${it.doi})` : ''),
  ].join('\n');

  // A plain blockquote, not a callout — 36 callout boxes made the note
  // unreadable. Translation stays, but small and faint.
  const one = h => {
    const zh = zotZh(h.comment);
    const tags = zotTags(h);
    const labels = tags.filter(zotIsLabel);
    // Anything too long to be a label is a note you typed into the tag box.
    const notes = tags.filter(t => !zotIsLabel(t)).concat(zotOwn(h.comment) ? [zotOwn(h.comment)] : []);
    const link = `zotero://open-pdf/library/items/${h.attkey}?annotation=${h.akey}`;
    const meta = [
      labels.map(l => '`' + l + '`').join(' '),
      h.page ? '**p.' + h.page + '**' : '',
      `[↗](${link})`,
    ].filter(Boolean).join('　');
    return [
      meta,
      '> ' + String(h.text).replace(/\s*\n\s*/g, ' ').trim(),
      zh ? '> ' + ZOT_FAINT(zh.replace(/\s*\n\s*/g, ' ')) : null,
    ].concat(notes.map(n => '> **我：** ' + n.replace(/\s*\n\s*/g, ' ')))
     .concat([''])
     .filter(x => x !== null).join('\n');
  };

  let body;
  if (!hls.length) {
    body = ['', '## 摘要', '', (it.abs || '（Zotero 里没有摘要）').replace(/\s*\n\s*/g, ' '), '']
      .concat(figs.length ? [zotFigureBlock(figs), ''] : [])
      .concat(stickies.length ? ['', `## 我的便签 · ${stickies.length} 条`, ''].concat(stickies.map(oneSticky)) : [])
      .concat(figs.length || stickies.length ? []
        : ['> [!info] 还没读', '> 这篇在 ' + ZOT.COLL + ' 里，但一条划线都没有。', '']).join('\n');
  } else {
    // Group by the section each highlight came from, in the order a paper reads.
    const order = ZOT_SECTIONS.map(s => s[1]);
    const buckets = new Map();
    for (const h of hls) {
      const k = h.section || '未定位';
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k).push(h);
    }
    // a sticky has no text to locate, so it takes the section of the highlight
    // just before it in the PDF (or the first one, if it comes before them all)
    const bySort = hls.slice().sort((a, b) => String(a.sortIndex).localeCompare(String(b.sortIndex)));
    for (const t of stickies) {
      const prev = bySort.filter(h => String(h.sortIndex) <= String(t.sort)).pop() || bySort[0];
      const k = (prev && prev.section) || '未定位';
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k).push({ sortIndex: t.sort, sticky: t });
    }
    for (const list of buckets.values()) list.sort((a, b) => String(a.sortIndex).localeCompare(String(b.sortIndex)));
    const keys = [...buckets.keys()].sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });

    body = ['', ZOT_BRIEF_HEAD, '', '| | |', '|---|---|']
      .concat(zotBriefRows(hls, oldBrief))
      .concat(figs.length ? [zotFigureBlock(figs)] : [])
      .concat(['', `## 我划的句子 · ${hls.length} 条`])
      .concat(keys.map(k => ['', `### ${k}　<small>${buckets.get(k).filter(x => !x.sticky).length}</small>`, '']
        .concat(buckets.get(k).map(x => x.sticky ? oneSticky(x.sticky) : one(x))).join('\n')))
      .join('\n');
  }

  // Raw material for the paragraph below: the sentences you marked as the gap
  // and the method, plus anything you wrote yourself.
  const pick = key => hls.filter(h => zotTags(h).some(t => LIT_CANON(t) === key));
  const mineNotes = hls.filter(h => zotTags(h).some(t => !zotIsLabel(t)) || zotOwn(h.comment));
  const short = h => { const s = (String(h.text)).replace(/\s*\n\s*/g, ' ').trim(); return s.length > 110 ? s.slice(0, 110) + '…' : s; };
  const stockLines = []
    .concat(pick('gap').map(h => `> - **gap** ${short(h)}`))
    .concat(pick('method').map(h => `> - **方法** ${short(h)}`))
    .concat(mineNotes.map(h => {
      const n = zotTags(h).filter(t => !zotIsLabel(t)).concat(zotOwn(h.comment) ? [zotOwn(h.comment)] : [])[0];
      return `> - **我写过** ${String(n).replace(/\s*\n\s*/g, ' ').slice(0, 110)}`;
    }));
  for (const t of thoughts.filter(x => x.kind === '便签' || x.kind === '笔记'))
    stockLines.push('> - **我写过** ' + t.text.replace(/\s*\n+\s*/g, ' ').replace(/^#+\s*/, '').slice(0, 110));
  // callout, not a quote block, so the sentence index never reads it as a highlight
  const childNotes = thoughts.filter(t => t.kind === '笔记');
  const pointer = childNotes.length
    ? ['', `> [!note] Zotero 子笔记 · ${childNotes.length} 条　[[${V.ZOT_THOUGHTS.replace(/\.md$/, '')}#${zotSlug(it.title)}|打开]]`, ''].join('\n')
    : '';
  const stock = (hls.length || thoughts.length) && stockLines.length
    ? ['', '> [!tip]- 素材 · 在下面「综述段落」写一段自己的话，related work 能直接改写进去（这里自动生成，同步会刷新）'].concat(stockLines).concat(['']).join('\n')
    : '';

  const blank = [
    ZOT_MINE, '', '', '## 我的话', '',
    '- 和我自己的工作是什么关系？', '- 存疑 / 不同意的地方？', '- 想到的下一步？', '',
  ].join('\n');

  return [fm, '', head, body, pointer, stock, '', (mine || blank), ''].join('\n');
}

async function zotSync() {
  const btn = $('lit-sync-btn');
  const say = m => { const s = $('lit-synced'); if (s) s.textContent = m; };
  if (btn) { btn.disabled = true; btn.textContent = 'Syncing…'; }
  try {
    const fs = zotRequire('fs'), os = zotRequire('os'), pathm = zotRequire('path');
    const live = pathm.join(os.homedir(), 'Zotero', 'zotero.sqlite');
    if (!fs.existsSync(live)) throw new Error('找不到 ' + live);
    const bin = zotSqlitePath();

    // Copy out of the way of Zotero's lock, WAL included so we see recent edits.
    const tmp = pathm.join(os.tmpdir(), 'db26-zot-' + Date.now() + '.sqlite');
    fs.copyFileSync(live, tmp);
    for (const ext of ['-wal', '-shm']) {
      try { if (fs.existsSync(live + ext)) fs.copyFileSync(live + ext, tmp + ext); } catch (_e) {}
    }

    let items, anns, notes;
    try {
      items = zotQuery(bin, tmp, ZOT_SQL_ITEMS(ZOT.COLL));
      anns  = zotQuery(bin, tmp, ZOT_SQL_ANN(ZOT.COLL));
      notes = zotQuery(bin, tmp, ZOT_SQL_NOTES(ZOT.COLL));
    } finally {
      for (const ext of ['', '-wal', '-shm']) { try { fs.unlinkSync(tmp + ext); } catch (_e) {} }
    }
    if (!items.length) throw new Error('Zotero 里没找到合集 “' + ZOT.COLL + '”');

    const byId = {};
    const figById = {}, allById = {}, notesById = {};
    for (const n of notes) (notesById[n.pid] = notesById[n.pid] || []).push(n);
    for (const a of anns) {
      if (a.type === 1 || a.type === 2 || a.type === 3 || a.type === 5) (allById[a.pid] = allById[a.pid] || []).push(a);
      if (a.type === 1 || a.type === 5) (byId[a.pid] = byId[a.pid] || []).push(a);
      else if (a.type === 3) (figById[a.pid] = figById[a.pid] || []).push(a);
    }

    if (!(await app.vault.adapter.exists(ZOT.OUT))) await app.vault.adapter.mkdir(ZOT.OUT);

    // A note is identified by its zotero_key, not its filename — otherwise
    // editing a title in Zotero would silently leave the old note behind as a
    // duplicate and orphan whatever you wrote in `## 我的话`.
    const byKey = {};
    try {
      const listing = await app.vault.adapter.list(ZOT.OUT);
      for (const p of (listing.files || [])) {
        if (!p.endsWith('.md')) continue;
        const k = (await app.vault.adapter.read(p)).match(/^zotero_key:\s*(\S+)/m);
        if (k) byKey[k[1]] = p;
      }
    } catch (_e) {}

    let created = 0, updated = 0, renamed = 0, figCount = 0, figMissing = 0, thoughtCount = 0;
    const thoughtPapers = [];
    for (const it of items) {
      const hls = byId[it.id] || [];
      const path = ZOT.OUT + '/' + zotSlug(it.title) + '.md';
      const prev = byKey[it.ikey];
      // Everything from `## 综述段落` to the end of the file is yours; it is
      // carried over verbatim. Notes written before that section existed keep
      // their `## 我的话` tail and gain an empty 综述段落 above it.
      let tail = '', oldBrief = null;
      if (prev) {
        const old = await app.vault.adapter.read(prev);
        oldBrief = zotParseBrief(old);
        let i = old.indexOf(ZOT_MINE);
        if (i >= 0) tail = zotTidyTail(old.slice(i).trim());
        else {
          i = old.indexOf(ZOT_MINE_LEGACY);
          if (i >= 0) tail = [ZOT_MINE, '', '', old.slice(i).trim()].join('\n');
        }
        updated++;
        if (prev !== path) { try { await app.vault.adapter.remove(prev); renamed++; } catch (_e) {} }
      } else created++;
      const figs = await zotFigures(it, figById[it.id] || []);
      figCount += figs.length; figMissing += figs.filter(f => f.missing).length;
      const thoughts = zotThoughts(it, allById[it.id] || [], notesById[it.id] || []);
      thoughtCount += thoughts.length;
      thoughtPapers.push({ it, slug: zotSlug(it.title), path, list: thoughts });
      await app.vault.adapter.write(path, zotNote(it, hls, tail, oldBrief, figs, thoughts));
    }

    await app.vault.adapter.write(V.ZOT_THOUGHTS, zotThoughtsDoc(thoughtPapers));
    const collected = await litWriteCollections(true);
    LSS('zot_synced_at', Date.now());
    zotNotice(`Zotero 同步完成 · ${items.length} 篇（新建 ${created} · 更新 ${updated}` +
      (renamed ? ` · 改名 ${renamed}` : '') + `）· ${anns.length - figCount} 条划线` +
      (figCount ? ` · ${figCount} 张图` + (figMissing ? `（${figMissing} 张待 Zotero 渲染）` : '') : '') +
      (thoughtCount ? ` · ${thoughtCount} 条想法` : '') + (collected ? ' · 合集已更新' : ''));
    say('Just synced');
    // Dataview needs a beat to index the files we just wrote.
    loadLiterature();
    setTimeout(loadLiterature, 900);
    setTimeout(loadLiterature, 2500);
  } catch (e) {
    zotNotice('Zotero 同步失败：' + (e && e.message ? e.message : e));
    say('Sync failed');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Sync Zotero'; }
  }
}

function setLitMode(mode) { LSS('lit_mode', mode); loadLiterature(); }
function setLitTag(tag) { LSS('lit_tag', tag); loadLiterature(); }

// ── Sentence-level index ────────────────────────────────────────
// The notes written by zotSync are the source of truth; parse the highlight
// blocks back out of them so this view works without touching Zotero.
const LIT_UNTAGGED = ' untagged';

// Every paper note parsed once per change to the folder (see literature-core.js).
let _litPapers = null, _litPapersSig = '';
function litPapers() {
  const files = app.vault.getMarkdownFiles().filter(f => f.path.startsWith(ZOT.OUT + '/'));
  const sig = files.length + ':' + files.reduce((a, f) => Math.max(a, f.stat.mtime), 0);
  if (_litPapers && _litPapersSig === sig) return _litPapers;
  _litPapers = files.map(f => [f.path, _litRawCache[f.path]])
    .filter(([, raw]) => raw && litFrontmatter(raw).type === 'paper')
    .map(([path, raw]) => litPaperFromNote(raw, path));
  _litPapersSig = sig;
  return _litPapers;
}

// cachedRead is async, so the raw bodies are primed before rendering.
let _litRawCache = {}, _litRawMtime = {};
async function litPrimeRaw() {
  const files = app.vault.getMarkdownFiles().filter(f => f.path.startsWith(ZOT.OUT + '/'));
  const next = {}, mtimes = {};
  for (const f of files) {
    try {
      // re-read a note once it changes, e.g. after you write its 综述段落
      next[f.path] = _litRawMtime[f.path] === f.stat.mtime ? _litRawCache[f.path] : await app.vault.cachedRead(f);
      mtimes[f.path] = f.stat.mtime;
    } catch (_e) {}
  }
  _litRawCache = next; _litRawMtime = mtimes;
}

// A literature quote as a card: source line, sentence, translation, your notes, links.
function litQuoteHtml(q, withPaper) {
  const src = [withPaper && q.paper ? q.paper.title : '', q.section, q.page ? 'p.' + q.page : ''].filter(Boolean).join('　·　');
  const path = q.paper ? q.paper.path : '';
  return `<div class="lit-q">
    ${src ? `<div class="lit-q-src">${esc(src)}</div>` : ''}
    <div class="lit-q-text">${esc(q.text)}</div>
    ${q.zh ? `<div class="lit-q-zh">${esc(q.zh)}</div>` : ''}
    ${(q.mine || []).map(m => `<div class="lit-q-mine">我：${esc(m)}</div>`).join('')}
    <div class="lit-q-foot">
      ${path ? `<span class="lit-q-link" data-action="open-vault" data-path="${esc(path)}">Open note →</span>` : ''}
      ${q.link ? `<a class="lit-q-link" href="${esc(q.link)}">Jump to source ↗</a>` : ''}
      ${(q.tags || []).map(t => `<span class="lit-chip" data-action="lit-tag" data-tag="${esc(LIT_CANON(t))}">${esc(LIT_CANON(t))}</span>`).join('')}
    </div>
  </div>`;
}

// "Open note →" for a generated collection note, or "生成笔记" before it exists.
function litDocLink(kind) {
  const path = V.LIT + '/' + LIT_COLLECTION_FILES[kind];
  return app.vault.getAbstractFileByPath(path)
    ? `<span class="lit-notes-open" data-action="open-vault" data-path="${esc(path)}">打开笔记 →</span>`
    : `<span class="lit-notes-open" data-action="lit-build">生成笔记</span>`;
}

function litPaperHead(p) {
  return `<div class="lit-essay-h" data-action="open-vault" data-path="${esc(p.path)}">
    <span class="lit-essay-y">${esc(p.year || '—')}</span>
    <span class="lit-essay-t">${esc(p.title)}</span>
    <span class="lit-essay-v">${esc(litCite(p.authors, p.year))}${p.venue ? ' · ' + esc(p.venue) : ''}</span>
  </div>`;
}

function litTodoList(title, papers) {
  if (!papers.length) return '';
  return `<div class="lit-essay-todo">
    <div class="lit-essay-todo-h">${esc(title)} · ${papers.length}</div>
    ${papers.map(p => `<div class="lit-essay-todo-i" data-action="open-vault" data-path="${esc(p.path)}">
      <span>${esc(p.title)}</span><span class="lit-tagn">${esc(litCite(p.authors, p.year))}</span></div>`).join('')}
  </div>`;
}

function litGapView() {
  const papers = litPapers();
  if (!papers.length) return `<div class="rp-empty">No paper notes yet — sync first.</div>`;
  const g = litGapCollection(papers, LIT_CANON);
  const head = `<div class="lit-qhead">Gaps　<span>${g.total} 条 · ${g.groups.length} 篇</span>${litDocLink('gaps')}</div>`;
  const body = g.groups.length ? g.groups.map(group => `<div class="lit-essay">
      ${litPaperHead(group.paper)}
      ${group.items.map(q => litQuoteHtml({ ...q, paper: group.paper }, false)).join('')}
    </div>`).join('')
    : `<div class="rp-empty">还没有标为 gap 的句子。在 Zotero 里给指出研究缺口的句子加上 <code>gap</code> 标签（<code>research gap</code>、<code>问题</code>、<code>研究缺口</code> 也算），同步后会汇总到这里。</div>`;
  return `<div class="lit-qlist lit-essaywrap">${head}${body}${litTodoList('已读但还没标 gap', g.missing)}</div>`;
}

let _litMatrixQuery = '';
function litMatrixView() {
  const rows = litMatrixRows(litPapers());
  if (!rows.length) return `<div class="rp-empty">No highlighted papers yet — sync first.</div>`;
  const labels = LIT_BRIEF.map(([, l]) => l);
  const cell = v => v ? esc(v) : '<span class="lit-dim">—</span>';
  return `<div class="lit-qlist lit-essaywrap">
    <div class="lit-qhead">Matrix　<span>${rows.length} 篇 · 内容来自每篇笔记的「速览」表</span>${litDocLink('matrix')}</div>
    <input type="search" class="lit-matrix-filter" id="lit-matrix-filter" placeholder="筛选：方法、数据集、年份……" value="${esc(_litMatrixQuery)}">
    <div class="lit-matrix-wrap"><table class="lit-matrix">
      <thead><tr><th>论文</th><th>年份</th>${labels.map(l => `<th>${esc(l)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr data-search="${esc([r.paper.title, r.paper.authors, r.paper.year, r.paper.venue, ...r.cells].join(' ').toLowerCase())}">
        <td><span class="lit-matrix-t" data-action="open-vault" data-path="${esc(r.paper.path)}">${esc(r.paper.title)}</span>
          <div class="lit-matrix-c">${esc(litCite(r.paper.authors, r.paper.year))}</div></td>
        <td>${esc(r.paper.year || '—')}</td>
        ${r.cells.map(c => `<td>${cell(c)}</td>`).join('')}
      </tr>`).join('')}</tbody>
    </table></div>
  </div>`;
}
function litBindMatrixFilter() {
  const input = $('lit-matrix-filter'); if (!input) return;
  const apply = () => {
    _litMatrixQuery = input.value;
    const q = input.value.trim().toLowerCase();
    for (const tr of dv.container.querySelectorAll('.lit-matrix tbody tr')) tr.hidden = !!q && !tr.dataset.search.includes(q);
  };
  input.addEventListener('input', apply);
  apply();
}

function litEssayView() {
  const papers = litPapers();
  if (!papers.length) return `<div class="rp-empty">No paper notes yet — sync first.</div>`;
  const syn = litSynthesisGroups(papers);
  const head = `<div class="lit-qhead">Synthesis　<span>${syn.written} / ${papers.length} 篇 · 按主题分组</span>` +
    (syn.written ? `<button type="button" class="act-btn lit-copy" data-action="lit-copy-essays">Copy all</button>` : '') +
    litDocLink('synthesis') + `</div>`;
  const body = syn.written ? syn.groups.map(g => `<div class="lit-topic">
      <div class="lit-topic-h">${esc(g.topic)}<span>${g.papers.length}</span></div>
      ${g.papers.map(p => `<div class="lit-essay">
        ${litPaperHead(p)}
        <div class="lit-essay-b">${esc(p.essay).replace(/\n/g, '<br>')}<span class="lit-cite">（${esc(litCite(p.authors, p.year))}）</span></div>
      </div>`).join('')}
    </div>`).join('')
    : `<div class="rp-empty">还没写过。打开任意一篇笔记，在 <code>## 综述段落</code> 下面写一段；在 frontmatter 的 <code>topics</code> 里填主题（如 <code>topics: [复习与记忆]</code>），这里就会按主题分组。</div>`;
  return `<div class="lit-qlist lit-essaywrap">${head}${body}${litTodoList('已读但还没写综述段落', syn.notWritten)}</div>`;
}

const litEssayCount = () => litPapers().filter(p => p.essay).length;

// Writes the four collection notes into V.LIT. Reads the paper notes straight from disk:
// right after a sync the vault index has not caught up with the files just written.
async function litWriteCollections(quiet) {
  try {
    if (!(await app.vault.adapter.exists(ZOT.OUT))) { if (!quiet) new Notice('还没有文献笔记，先同步 Zotero'); return 0; }
    const listing = await app.vault.adapter.list(ZOT.OUT);
    const papers = [];
    for (const path of (listing.files || []).filter(p => p.endsWith('.md'))) {
      const raw = await app.vault.adapter.read(path);
      if (litFrontmatter(raw).type === 'paper') papers.push(litPaperFromNote(raw, path));
    }
    if (!papers.length) { if (!quiet) new Notice('还没有文献笔记，先同步 Zotero'); return 0; }
    const now = new Date();
    const docs = litCollectionDocs(papers, LIT_CANON, todayStr() + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()));
    try { if (!(await app.vault.adapter.exists(V.LIT))) await app.vault.adapter.mkdir(V.LIT); } catch (_e) {}
    for (const [kind, doc] of Object.entries(docs)) {
      const path = V.LIT + '/' + LIT_COLLECTION_FILES[kind];
      const existing = (await app.vault.adapter.exists(path)) ? await app.vault.adapter.read(path) : null;
      await app.vault.adapter.write(path, litMergeCollection(existing, doc.head, doc.body));
    }
    if (!quiet) new Notice(`合集已更新 · ${papers.length} 篇论文 → ${V.LIT}/`);
    setTimeout(loadLiterature, 600);
    return papers.length;
  } catch (e) {
    new Notice('更新合集失败：' + (e && e.message ? e.message : e));
    return 0;
  }
}

// ── Notes: the thoughts document, read back ─────────────────────
// The document zotSync writes is the source here, so this view shows exactly
// what that file holds and "Open" lands on the same thing.
let _litThoughtsRaw = '';
async function litLoadThoughts() {
  try {
    const f = app.vault.getAbstractFileByPath(V.ZOT_THOUGHTS);
    _litThoughtsRaw = f ? await app.vault.cachedRead(f) : '';
  } catch (_e) { _litThoughtsRaw = ''; }
  return _litThoughtsRaw;
}
function litParseThoughts(raw) {
  const papers = [];
  let paper = null, item = null;
  for (const line of String(raw || '').split('\n')) {
    const h2 = line.match(/^## (.+)$/);
    if (h2) { paper = { title: h2[1].trim(), path: '', meta: '', items: [] }; papers.push(paper); item = null; continue; }
    if (!paper) continue;
    const link = !item && line.match(/^\[\[([^|\]]+)\|[^\]]*\]\](.*)$/);
    if (link) { paper.path = link[1] + '.md'; paper.meta = link[2].replace(/^\s*·\s*/, '').trim(); continue; }
    const h3 = line.match(/^### (.+?)(?:　\[↗\]\(([^)]+)\))?\s*$/);
    if (h3) { item = { label: h3[1].trim(), link: h3[2] || '', quote: '', text: '' }; paper.items.push(item); continue; }
    if (!item) continue;
    if (/^> /.test(line) && !item.text) { item.quote += (item.quote ? ' ' : '') + line.slice(2); continue; }
    item.text += (item.text ? '\n' : '') + line;
  }
  for (const p of papers) for (const it of p.items) it.text = it.text.trim();
  return papers.filter(p => p.items.length);
}
const litThoughtCount = () => litParseThoughts(_litThoughtsRaw).reduce((a, p) => a + p.items.length, 0);

function litNotesView() {
  const papers = litParseThoughts(_litThoughtsRaw);
  const open = `<span class="lit-notes-open" data-action="open-vault" data-path="${esc(V.ZOT_THOUGHTS)}">Open ${esc(vBase(V.ZOT_THOUGHTS))} →</span>`;
  const head = `<div class="lit-qhead">Notes　<span>${papers.reduce((a, p) => a + p.items.length, 0)}</span>${open}</div>`;
  if (!papers.length) return `<div class="lit-qlist lit-essaywrap">${head}<div class="rp-empty">还没有。在 Zotero 里给 PDF 加便签、在批注里写自己的话，或者给论文加子笔记，然后点右上角 Sync。</div></div>`;
  return `<div class="lit-qlist lit-essaywrap">${head}${papers.map(p => `
    <div class="lit-essay">
      <div class="lit-essay-h" data-action="open-vault" data-path="${esc(p.path)}">
        <span class="lit-essay-t">${esc(p.title)}</span><span class="lit-essay-v">${esc(p.meta)}</span>
      </div>
      ${p.items.map(it => `<div class="lit-note">
        <div class="lit-note-m">${esc(it.label)}${it.link ? `　<a class="wt-zlink" href="${esc(it.link)}">↗ Zotero</a>` : ''}</div>
        ${it.quote ? `<div class="lit-note-q">${esc(it.quote)}</div>` : ''}
        <div class="lit-essay-b">${esc(it.text).replace(/\n/g, '<br>')}</div>
      </div>`).join('')}
    </div>`).join('')}</div>`;
}

async function litCopyEssays() {
  const syn = litSynthesisGroups(litPapers());
  try { await navigator.clipboard.writeText(litSynthesisPlain(syn)); zotNotice(`已复制 ${syn.written} 段（按主题分组，附引用）`); }
  catch (_e) { zotNotice('Copy failed'); }
}

function litTagView() {
  const papers = litPapers();
  const { tags, untagged } = litTagCollection(papers, LIT_CANON);
  if (!tags.length && !untagged.length) return `<div class="rp-empty">No marks parsed yet — sync first.</div>`;

  let sel = String(LS('lit_tag', ''));
  if (sel !== LIT_UNTAGGED && !tags.some(t => t.tag === sel)) sel = tags.length ? tags[0].tag : LIT_UNTAGGED;

  const row = (t, n, sub, label) => `<div class="lit-tagrow${sel === t ? ' lit-tagrow-on' : ''}" data-action="lit-tag" data-tag="${esc(t)}">` +
    `<span class="lit-tagname">${esc(label != null ? label : t)}</span><span class="lit-tagn">${n}${sub ? ' · ' + sub + ' 篇' : ''}</span></div>`;
  const left = tags.map(t => row(t.tag, t.items.length, t.paperCount)).join('') +
    (untagged.length ? `<div class="lit-tagsep"></div>` + row(LIT_UNTAGGED, untagged.length, 0, 'Untagged') : '');

  const picked = sel === LIT_UNTAGGED ? untagged : (tags.find(t => t.tag === sel) || { items: [] }).items;
  const title = sel === LIT_UNTAGGED ? 'Untagged' : sel;
  const paperCount = new Set(picked.map(q => q.paper.path)).size;
  return `<div class="lit-taglayout">
    <div class="lit-taglist">${left}</div>
    <div class="lit-qlist">
      <div class="lit-qhead">${esc(title)}　<span>${picked.length} 条 · ${paperCount} 篇 · 同义标签已合并</span>${litDocLink('tags')}</div>
      ${picked.length ? picked.map(q => litQuoteHtml(q, true)).join('') : `<div class="rp-empty">Nothing under this tag.</div>`}
    </div>
  </div>`;
}

async function loadLiterature() {
  const tbl = $('lit-table'); if (!tbl) return;
  const raw = String(LS('lit_mode', 'all'));
  const mode = ['gap', 'matrix', 'read', 'tag', 'essay', 'notes'].includes(raw) ? raw : 'all';
  const viewTitle = $('lit-view-title');
  if (viewTitle) viewTitle.textContent = { all: 'Papers', gap: 'Gap 合集', matrix: '文献对比矩阵', tag: '标签合集', essay: '综述草稿', read: 'Timeline', notes: 'Notes' }[mode];
  const stamp = Number(LS('zot_synced_at', 0));
  const s = $('lit-synced');
  if (s) s.textContent = stamp ? 'Synced ' + new Date(stamp).toLocaleString() : 'Never synced';
  // 18 small files — cheap enough to always have the bodies on hand so the
  // tab counts are right on the very first render.
  await litPrimeRaw();
  await litLoadThoughts();

  let papers = [];
  try {
    papers = dv.pages('"' + ZOT.OUT + '"').values
      .filter(p => p.type === 'paper')
      .map(p => ({
        name: p.file.name, path: p.file.path,
        authors: String(p.authors || ''), year: String(p.year || ''),
        venue: String(p.venue || ''), n: Number(p.highlights) || 0,
        last: String(p.last_read || ''), status: String(p.status || 'unread'),
        // `sessions` is a YAML list of "YYYY-MM-DD · N" written by zotSync.
        sessions: (p.sessions ? Array.from(p.sessions) : []).map(v => {
          const m = String(v).match(/(\d{4}-\d{2}-\d{2})\s*·\s*(\d+)/);
          return m ? { day: m[1], n: Number(m[2]) } : null;
        }).filter(Boolean),
      }))
      .sort((a, b) => b.n - a.n || b.last.localeCompare(a.last));
  } catch (_e) {}

  const read = papers.filter(p => p.n > 0);
  const st = $('lit-stats');
  if (st) {
    const tab = (m, v, l) => `<div class="rp-stat lit-tab${mode === m ? ' lit-tab-on' : ''}" data-action="lit-mode" data-mode="${m}">` +
      `<div class="rp-stat-v">${v}</div><div class="rp-stat-l">${l}</div></div>`;
    const core = litPapers();
    st.innerHTML = tab('all', papers.length, 'Papers') +
      tab('gap', litGapCollection(core, LIT_CANON).total, 'Gaps') +
      tab('matrix', litMatrixRows(core).length, 'Matrix') +
      tab('tag', litTagCollection(core, LIT_CANON).tags.length, 'Tags') +
      tab('essay', litEssayCount(), 'Synthesis') +
      tab('read', read.length, 'Timeline') +
      tab('notes', litThoughtCount(), 'Notes');
  }

  if (!papers.length) {
    tbl.innerHTML = `<div class="rp-empty">还没有文献笔记。点右上角「从 Zotero 同步」，会把 Zotero 的 <code>${esc(ZOT.COLL)}</code> 合集写到 <code>${esc(ZOT.OUT)}/</code>。</div>`;
    return;
  }

  if (mode === 'read') { tbl.innerHTML = litTimeline(read); return; }
  if (mode === 'gap') { tbl.innerHTML = litGapView(); return; }
  if (mode === 'matrix') { tbl.innerHTML = litMatrixView(); litBindMatrixFilter(); return; }
  if (mode === 'notes') { tbl.innerHTML = litNotesView(); return; }
  if (mode === 'essay') {
    await litPrimeRaw();
    tbl.innerHTML = litEssayView();
    return;
  }
  if (mode === 'tag') {
    await litPrimeRaw();
    tbl.innerHTML = litTagView();
    return;
  }

  const tag = s => s === 'deep' ? ['Deep', 'lit-deep'] : s === 'read' ? ['Read', 'lit-read'] : ['New', 'lit-new'];
  tbl.innerHTML =
    `<div class="lit-row lit-head"><div></div><div>Title</div><div>Authors</div><div>Year</div><div>Source</div><div>Marks</div><div>Last read</div></div>` +
    papers.map(p => {
      const [lbl, cls] = tag(p.status);
      return `<div class="lit-row lit-item${p.n ? '' : ' lit-dim'}" data-action="open-vault" data-path="${esc(p.path)}">
        <div><span class="lit-pill ${cls}">${lbl}</span></div>
        <div class="lit-t">${esc(p.name)}</div>
        <div class="lit-x">${esc(p.authors.split(', ').slice(0, 2).join(', '))}${p.authors.split(', ').length > 2 ? ' 等' : ''}</div>
        <div class="lit-x">${esc(p.year || '—')}</div>
        <div class="lit-x">${esc(p.venue || '—')}</div>
        <div class="lit-n">${p.n || '—'}</div>
        <div class="lit-x">${esc(p.last || '—')}</div>
      </div>`;
    }).join('');
}

// One row per (day, paper) you annotated — same shape as the all-project timeline.
function litTimeline(read) {
  const events = [];
  for (const p of read) {
    const days = p.sessions.length ? p.sessions : (p.last ? [{ day: p.last, n: p.n }] : []);
    for (const d of days) events.push({ ...d, p });
  }
  if (!events.length) return `<div class="rp-empty">No marks yet.</div>`;
  events.sort((a, b) => b.day.localeCompare(a.day) || b.n - a.n);

  let prev = '';
  return `<div class="project-rollup-timeline lit-timeline">` + events.map(e => {
    const head = e.day !== prev
      ? `<div class="project-rollup-day"><span>${esc(projectTimelineDateLabel(e.day))}</span></div>` : '';
    prev = e.day;
    return `${head}<div class="project-rollup-event lit-event" data-action="open-vault" data-path="${esc(e.p.path)}">
      <div class="project-rollup-time">${e.n}</div>
      <span class="project-rollup-dot" style="background:var(--blue)"></span>
      <div class="project-rollup-event-body">
        <div class="project-rollup-event-top"><span class="project-rollup-kind">${esc(e.p.venue || '—')}${e.p.year ? ' · ' + esc(e.p.year) : ''}</span></div>
        <div class="project-rollup-title">${esc(e.p.name)}</div>
      </div>
      <span></span>
    </div>`;
  }).join('') + `</div>`;
}

// ─ Reading profile · parses exported book notes (💭 想法 / 📌 划线) ──
// Heavy (~5MB); parsed once per session and re-parsed only when the folder changes.
let _rpCache = null, _rpSig = '';

function rpFiles() {
  return app.vault.getMarkdownFiles()
    .filter(f => f.path.startsWith(V.WEREAD + '/') && !/dashboard|readme/i.test(f.basename));
}

async function rpParse() {
  const files = rpFiles();
  const sig = files.length + ':' + files.reduce((a, f) => Math.max(a, f.stat.mtime), 0);
  if (_rpCache && _rpSig === sig) return _rpCache;

  const hours = new Array(24).fill(0);
  const rows = [];
  for (const f of files) {
    let t = '';
    try { t = await app.vault.cachedRead(f); } catch (_e) { continue; }
    let cat = ((t.match(/分类：\s*([^\n]+)/) || [, ''])[1] || '').replace(/^[>\s-]+/, '').trim();
    if (/[：:]/.test(cat)) cat = '';           // guard: mis-captured neighbouring field
    const rt = t.match(/readingTime:\s*(?:(\d+)小时)?(?:(\d+)分钟)?/) || [];
    const rd = (t.match(/^readingDate:\s*(.*)$/m) || [, ''])[1].trim();
    for (const m of t.matchAll(/💭[\s\S]*?⏱\s*\d{4}-\d{2}-\d{2} (\d{2}):/g)) hours[+m[1]]++;

    // Your thoughts, with the passage they hang off when there is one — the
    // the export pairs them under `### 划线评论`. Keep only the newest few
    // per book; the whole library would be ~3000 entries.
    const ev = [];
    const clean = s => String(s).replace(/\^\S+/g, '').replace(/>?\s*⏱[^\n]*/g, '').replace(/\s+/g, ' ').trim();
    // `(?!📌)` keeps a quote from swallowing the next highlight block.
    for (const m of t.matchAll(/^>\s*📌((?:(?!📌)[\s\S])*?)\n\s*-\s*💭\s*(.+?)\s*\n\s*-\s*⏱\s*(\d{4}-\d{2}-\d{2} \d{2}:\d{2})/gm)) {
      ev.push({ at: m[3], thought: clean(m[2]), quote: clean(m[1]) });
    }
    for (const m of t.matchAll(/^\s*-?\s*💭\s*(.+?)\s*-\s*⏱\s*(\d{4}-\d{2}-\d{2} \d{2}:\d{2})/gm)) {
      ev.push({ at: m[2], thought: clean(m[1]), quote: '' });
    }
    // The export lists some thoughts twice (inline and under 划线评论), minutes
    // apart. Keep the newest copy, preferring the one that carries the passage.
    ev.sort((a, b) => b.at.localeCompare(a.at) || (b.quote ? 1 : 0) - (a.quote ? 1 : 0));
    const seenText = new Set();
    const uniq = ev.filter(e => {
      if (!e.thought || seenText.has(e.thought)) return false;
      seenText.add(e.thought);
      return true;
    });
    ev.length = 0; ev.push(...uniq);
    rows.push({
      name: f.basename, path: f.path,
      cat: cat || '未分类',
      top: (cat || '未分类').split('-')[0].trim(),
      prog: parseInt((t.match(/^progress:\s*(\d+)/m) || [, '0'])[1]) || 0,
      year: /^\d{4}/.test(rd) && !rd.startsWith('1970') ? rd.slice(0, 4) : null,
      mins: (parseInt(rt[1]) || 0) * 60 + (parseInt(rt[2]) || 0),
      th: (t.match(/💭/g) || []).length,
      hl: (t.match(/📌/g) || []).length,
      last: ev.length ? ev[0].at : '',
      nEv: ev.length,
      ev: ev.slice(0, 8),
    });
  }
  _rpCache = { rows, hours }; _rpSig = sig;
  return _rpCache;
}


// Every line below is derived from the numbers it quotes — nothing is templated flattery.
// Recent reading: the books you last wrote something in, newest first. Each
// shows your own thoughts — with the highlighted passage above them when the
// thought was written on one, which is how 87% of them were written.
function rpRecent(rows, limit) {
  const books = rows.filter(b => b.nEv > 0).sort((a, b) => b.last.localeCompare(a.last)).slice(0, limit);
  if (!books.length) return `<div class="rp-empty">No thoughts found — check the WeChat Reading plugin has synced.</div>`;

  const when = at => {
    const d = Math.floor((Date.now() - new Date(at.replace(' ', 'T')).getTime()) / 864e5);
    const day = at.slice(5, 10);
    return d <= 0 ? 'today' : d === 1 ? 'yesterday' : d < 7 ? d + 'd ago' : day;
  };

  return books.map(b => {
    const shown = b.ev.slice(0, 3);
    const more = b.nEv - shown.length;
    return `<div class="rp-bk">
      <div class="rp-bk-h" data-action="open-vault" data-path="${esc(b.path)}">
        <span class="rp-bk-t">${esc(b.name)}</span>
        <span class="rp-bk-m">${when(b.last)}　·　${b.nEv} thoughts${b.hl ? '　·　' + b.hl + ' marks' : ''}</span>
      </div>
      ${shown.map(e => `<div class="rp-ev">
        ${e.quote ? `<div class="rp-ev-q">${esc(e.quote)}</div>` : ''}
        <div class="rp-ev-t">${esc(e.thought)}</div>
        <div class="rp-ev-d">${esc(e.at.slice(0, 16))}</div>
      </div>`).join('')}
      ${more > 0 ? `<div class="rp-bk-more" data-action="open-vault" data-path="${esc(b.path)}">+${more} more →</div>` : ''}
    </div>`;
  }).join('');
}


async function loadReadingProfile() {
  const host = $('rp-recent'); if (!host) return;
  if (!_rpCache) host.innerHTML = `<div class="rp-empty">Loading…</div>`;
  let data;
  try { data = await rpParse(); } catch (_e) { host.innerHTML = `<div class="rp-empty">Read failed.</div>`; return; }
  const { rows, hours } = data;
  if (!rows.length) { host.innerHTML = `<div class="rp-empty">在 <code>${esc(V.WEREAD)}/</code> 里没找到书。</div>`; return; }

  const totTh = rows.reduce((a, b) => a + b.th, 0);
  const totHl = rows.reduce((a, b) => a + b.hl, 0);
  const totM = rows.reduce((a, b) => a + b.mins, 0);
  const done = rows.filter(b => b.prog >= 100).length;

  const stat = (v, l, strong) => `<div class="rp-stat${strong ? ' rp-stat-key' : ''}"><div class="rp-stat-v">${v}</div><div class="rp-stat-l">${l}</div></div>`;
  const st = $('rp-stats');
  if (st) st.innerHTML =
    stat(rows.length, 'Books') +
    stat(Math.round(totM / 60) + 'h', 'Hours') +
    stat(totTh, 'Thoughts', true) +
    stat(totHl, 'Highlights') +
    stat(done + ' · ' + Math.round(done / rows.length * 100) + '%', 'Finished') +
    stat((totHl / (totTh || 1)).toFixed(1) + ':1', 'Ratio');

  const nBooks = Number(LS('rp_books', 5)) === 10 ? 10 : 5;
  host.innerHTML = rpRecent(rows, nBooks);
  for (const t of dv.container.querySelectorAll('.rp-ntab')) t.classList.toggle('active', Number(t.dataset.n) === nBooks);




}

// ─ WeRead recent (frontmatter `reading_progress`, `status`, mtime) ─
function loadWeread() {
  loadReadingProfile();
}

// ── English · daily drill ───────────────────────────────────────
// The topic is not picked from a list. It is built from what you actually did
// that day, so there is nothing to recall before you can start speaking — the
// content is already in your head, only the language is missing. The plan fixes
// the *form* (which IELTS part) per weekday; the content is whatever the day
// produced, so it never runs out and never repeats.
//
// Nothing here asks you to fill in a note. One document, one line per day,
// written by the buttons — the same shape as the punch clock, which is the only
// capture in this vault that has actually survived.
const EN_PLAN_DAYS = 31;

// Mon…Sun. `mins` is the floor, not the target.
const EN_WEEK = [
  { k: 'p1',   label: 'Part 1', mins: 5, hint: '短问答 · 练流利度' },
  { k: 'p2',   label: 'Part 2', mins: 2, hint: '2 分钟独白 · 你最缺的长度' },
  { k: 'p3',   label: 'Part 3', mins: 4, hint: '抽象展开 · 练观点' },
  { k: 'p1',   label: 'Part 1', mins: 5, hint: '短问答 · 练流利度' },
  { k: 'p2',   label: 'Part 2', mins: 2, hint: '2 分钟独白' },
  { k: 'sent', label: '长难句',  mins: 5, hint: '读你自己划过的句子' },
  { k: 'rest', label: '休',     mins: 0, hint: '' },
];

// Standard IELTS cue-card frames. Which one you get depends on what the day was
// about — deterministic, so the page renders instantly and offline.
const EN_FRAMES = [
  [/测试|调试|验证|跑通|运行|排查|bug/i, 'something you tested or debugged recently',
    ['what it was', 'how you approached it', 'what the result was'], 'how you felt about it'],
  [/阅读|读|paper|论文|文献|初稿|综述/i, 'something you read recently',
    ['what it was about', 'why you read it', 'what you took away from it'], 'whether you would recommend it'],
  [/会议|开会|讨论|汇报|组会|沟通/, 'a meeting or discussion you took part in',
    ['who was there', 'what it was about', 'what was decided'], 'how useful it was'],
  [/写|文档|修改|整理|记录|介绍|简历/, 'something you wrote or revised recently',
    ['what it was', 'who it was for', 'what you changed'], 'how satisfied you are with it'],
  [/代码|实现|优化|开发|搭建|联用|部署|打包/, 'something you built or improved recently',
    ['what it was', 'what problem it solved', 'how you did it'], 'what you would do differently'],
  [/求职|面试|职位|公司|career/i, 'a step you took in your career recently',
    ['what you did', 'why you did it then', 'what happened'], 'how you feel about the next step'],
  [/实验|数据|结果|模型|训练/, 'a piece of work you are still in the middle of',
    ['what you are trying to find out', 'how far you have got', 'what is in the way'], 'what you expect to happen'],
];
const EN_FALLBACK_FRAME = ['something you worked on recently',
  ['what it was', 'how you approached it', 'what the result was'], 'why it mattered to you'];

// Abstract questions cannot come from a task list, so these are a small fixed
// bank grouped by the areas your work already falls into.
const EN_P3 = [
  'Do you think AI tools will change how research gets documented?',
  'Should researchers be expected to explain their work to people outside the field?',
  'Is it better to specialise early, or to stay broad for longer?',
  'Does working across several projects at once help or hurt the quality of each?',
  'How much of what makes someone good at their job can actually be taught?',
  'Will remote collaboration ever fully replace being in the same room?',
  'Do deadlines improve work, or only make it finish?',
];

// ── storage: one document, newest day first, same shape as the punch log ──
function EN_FILE_() { return V.ENLOG; }
function EN_HEAD_() { return '# ' + vBase(V.ENLOG); }

async function enDoc() {
  let f = app.vault.getAbstractFileByPath(EN_FILE_());
  if (f) return f;
  const body = [EN_HEAD_(), '',
    '> 由 Dashboard 的 English 页写入。每天一个小节，最新的在最上面。',
    '> `::` 开头的行是值得带走的表达，会汇总到页面上的 Keepers。', '', ''].join('\n');
  const dir = EN_FILE_().slice(0, EN_FILE_().lastIndexOf('/'));
  try { await app.vault.createFolder(dir); } catch (_e) {}
  return await app.vault.create(EN_FILE_(), body);
}

function enReadDay(text, date) {
  const m = text.match(new RegExp('^## ' + date + '[ \\t]*$', 'm'));
  if (!m) return [];
  const rest = text.slice(m.index + m[0].length);
  const end = rest.search(/^## /m);
  return (end < 0 ? rest : rest.slice(0, end)).split('\n').filter(l => /^\s*-/.test(l));
}

function enWriteDay(text, date, lines) {
  const block = '## ' + date + '\n\n' + lines.join('\n') + '\n\n';
  const m = text.match(new RegExp('^## ' + date + '[ \\t]*$', 'm'));
  if (m) {
    const after = text.slice(m.index + m[0].length);
    const end = after.search(/^## /m);
    return text.slice(0, m.index) + block + (end < 0 ? '' : after.slice(end));
  }
  const days = [...text.matchAll(/^## (\d{4}-\d{2}-\d{2})[ \t]*$/gm)];
  const older = days.find(d => d[1] < date);
  if (older) return text.slice(0, older.index) + block + text.slice(older.index);
  return text.replace(/\s*$/, '') + '\n\n' + block;
}

async function enLoad(date) {
  try {
    const f = app.vault.getAbstractFileByPath(EN_FILE_());
    if (!f) return [];
    return enReadDay(await app.vault.cachedRead(f), date);
  } catch (_e) { return []; }
}
async function enSave(date, lines) {
  const f = await enDoc();
  await app.vault.modify(f, enWriteDay(await app.vault.read(f), date, lines));
}
async function enAllDays() {
  const f = app.vault.getAbstractFileByPath(EN_FILE_());
  if (!f) return [];
  let text = '';
  try { text = await app.vault.cachedRead(f); } catch (_e) { return []; }
  return [...text.matchAll(/^## (\d{4}-\d{2}-\d{2})[ \t]*$/gm)]
    .map(m => ({ date: m[1], lines: enReadDay(text, m[1]) }))
    .filter(d => d.lines.length)
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ── the day's material ──────────────────────────────────────────
// Yesterday by default: you practise in the morning, and a night's distance
// makes it a recollection rather than a running commentary.
let _enDailyCache = {};
async function enLoadTasks(dateStr) {
  if (_enDailyCache[dateStr] !== undefined) return _enDailyCache[dateStr];
  let out = [];
  try {
    const f = findDailyNote(dateStr);
    if (f) {
      const t = await app.vault.cachedRead(f);
      out = [...t.matchAll(/^\s*- \[[xX]\]\s*(.+)$/gm)].map(m => m[1]
        .replace(/\[[a-z_]+::[^\]]*\]/gi, '')
        .replace(/[✅➕📅🔼⏫🔽]\s*\d{4}-\d{2}-\d{2}/g, '')
        .replace(/[✅➕📅🔼⏫🔽]/g, '').replace(/#\S+/g, '')
        .replace(/\s+/g, ' ').trim()).filter(x => x && x.length > 1);
    }
  } catch (_e) {}
  _enDailyCache[dateStr] = out;
  return out;
}

function enFrame(tasks) {
  for (const [re, noun, bullets, close] of EN_FRAMES) {
    const hit = tasks.filter(t => re.test(t));
    if (hit.length) return { noun, bullets, close, raw: hit };
  }
  return { noun: EN_FALLBACK_FRAME[0], bullets: EN_FALLBACK_FRAME[1], close: EN_FALLBACK_FRAME[2], raw: tasks };
}

// Day 1 is the first day you logged anything; before that, today is Day 1.
function enDayNo(days) {
  if (!days.length) return 1;
  const first = days[days.length - 1].date;
  const ms = new Date(todayStr() + 'T12:00') - new Date(first + 'T12:00');
  return Math.max(1, Math.round(ms / 86400000) + 1);
}

const enSlotFor = dateStr => EN_WEEK[(new Date(dateStr + 'T12:00').getDay() + 6) % 7];

// ── actions ─────────────────────────────────────────────────────
async function enPractise(slotKey, downgrade) {
  try {
    const date = todayStr();
    const lines = await enLoad(date);
    const slot = downgrade ? EN_WEEK[0] : (EN_WEEK.find(s => s.k === slotKey) || EN_WEEK[0]);
    const src = String(LS('en_src', '')) || _enSrcDate;
    const tasks = await enLoadTasks(src);
    const what = tasks[0] ? tasks[0].slice(0, 24) : '打卡记录';
    if (lines.some(l => l.includes('· ' + slot.label + ' ·'))) {
      new Notice('今天这项已经记过了'); return;
    }
    lines.push('- Day ' + enDayNo(await enAllDays()) + ' · ' + slot.label + ' · ' + what + ' · ' + slot.mins + 'min');
    await enSave(date, lines);
    new Notice(slot.label + ' 已记录 —— 去说吧');
    loadEnglish();
  } catch (e) {
    if (typeof Notice !== 'undefined') new Notice('记录失败：' + (e && e.message ? e.message : e));
  }
}

// A keeper is one phrase worth stealing. Asked for after the fact, never as a
// blank waiting to be filled.
async function enKeep() {
  try {
    const zh = await db26Prompt('中文（想说但说不出来的那句）:');
    if (!zh || !zh.trim()) return;
    const en = await db26Prompt('英文（AI 给你的说法）:');
    if (!en || !en.trim()) return;
    const date = todayStr();
    const lines = await enLoad(date);
    if (!lines.length) lines.push('- Day ' + enDayNo(await enAllDays()) + ' · 随手记');
    lines.push('  - ' + zh.trim() + ' :: ' + en.trim());
    await enSave(date, lines);
    loadEnglish();
  } catch (e) {
    if (typeof Notice !== 'undefined') new Notice('记录失败：' + (e && e.message ? e.message : e));
  }
}

// English you already highlighted, with the translation that came with it.
async function enSentences(limit) {
  const out = [];
  try {
    for (const f of app.vault.getMarkdownFiles().filter(x => x.path.startsWith(V.ZOT_OUT + '/'))) {
      const t = await app.vault.cachedRead(f);
      for (const m of t.matchAll(/^> ([A-Z][^\n]{70,190})\n> <small[^>]*>([^<]+)<\/small>/gm)) {
        out.push({ en: m[1], zh: m[2], src: f.basename });
        if (out.length >= limit * 4) break;
      }
      if (out.length >= limit * 4) break;
    }
  } catch (_e) {}
  return out.slice(0, limit);
}

let _enSrcDate = '';

async function loadEnglish() {
  const host = $('english-body'); if (!host) return;

  const days = await enAllDays();
  const todayLines = await enLoad(todayStr());
  const dayNo = enDayNo(days);
  const slot = enSlotFor(todayStr());

  // material: yesterday, else today, else nothing
  const yest = dateKey(addDays(new Date(), -1));
  let src = yest, tasks = await enLoadTasks(yest);
  if (!tasks.length) { src = todayStr(); tasks = await enLoadTasks(src); }
  _enSrcDate = src;
  LSS('en_src', src);

  const f = enFrame(tasks);
  const doneToday = todayLines.some(l => /· (Part \d|长难句) ·/.test(l));

  const p3 = EN_P3[(dayNo - 1) % EN_P3.length];
  const sents = slot.k === 'sent' ? await enSentences(3) : [];

  const card = slot.k === 'rest'
    ? `<div class="rp-empty">今天休息。明天是 ${esc(EN_WEEK[0].label)}。</div>`
    : slot.k === 'sent'
      ? `<div class="eb-kind">${esc(slot.label)} · ${slot.mins} 分钟</div>
         ${sents.length ? sents.map(s => `<div class="ls-item">
            <div class="ls-en">${esc(s.en)}</div>
            <div class="ls-zh">${esc(s.zh)}</div>
            <div class="ls-src">${esc(s.src.slice(0, 40))}</div></div>`).join('')
          : `<div class="rp-empty">还没有带中译的划线。先到 Literature 页同步一次 Zotero。</div>`}`
      : slot.k === 'p3'
        ? `<div class="eb-kind">${esc(slot.label)} · ${slot.mins} 分钟</div>
           <div class="eb-cue"><div class="eb-lead">${esc(p3)}</div>
           <div class="eb-say">说出你的立场，给两个理由，再说一个反面情况。</div></div>`
        : `<div class="eb-kind">${esc(slot.label)} · ${slot.mins} 分钟</div>
           <div class="eb-cue">
             <div class="eb-lead">Describe ${esc(f.noun)}.</div>
             <div class="eb-say">You should say:</div>
             <ul class="eb-bul">${f.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>
             <div class="eb-say">and explain ${esc(f.close)}.</div>
           </div>
           ${f.raw.length ? `<div class="eb-raw"><span>素材 ${esc(src.slice(5))}</span>${
             f.raw.slice(0, 3).map(r => `<b>${esc(r.slice(0, 26))}</b>`).join('')}</div>` : ''}`;

  const acts = slot.k === 'rest' ? '' : `
    <div class="eb-act">
      <button type="button" class="act-btn primary nx-go" data-action="en-do" data-slot="${esc(slot.k)}">${doneToday ? '再来一次' : '做完了'}</button>
      <span class="nx-skip" data-action="en-keep">＋ 记一句表达</span>
      ${slot.k !== 'p1' && !doneToday ? `<span class="nx-skip" data-action="en-do" data-slot="p1" data-down="1">今天太忙 · 降成 Part 1</span>` : ''}
    </div>
    <div class="nx-steps"><span>① 先说完，不改</span><span>② 贴给 AI 纠错</span><span>③ 用改后的版本再说一遍</span></div>`;

  // week strip
  const dow = (new Date().getDay() + 6) % 7;
  const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const doneDates = new Set(days.map(d => d.date));
  const weekHtml = EN_WEEK.map((s, i) => {
    const d = dateKey(addDays(new Date(), i - dow));
    const cls = i === dow ? 'on' : (s.k === 'rest' ? 'rest' : (i < dow ? (doneDates.has(d) ? 'ok' : 'miss') : ''));
    return `<div class="eb-d ${cls}"><b>${DOW[i]}</b><i>${i < dow && doneDates.has(d) ? '✓' : esc(s.label)}</i></div>`;
  }).join('');

  // keepers, newest first
  const keepers = [];
  for (const d of days) for (const l of d.lines) {
    const m = l.match(/^\s+-\s*(.+?)\s*::\s*(.+)$/);
    if (m) keepers.push({ zh: m[1], en: m[2], date: d.date });
  }

  host.innerHTML = `
    <div class="card rp-card">
      <div class="card-title">Today
        <span class="card-sub">Day ${dayNo} / ${EN_PLAN_DAYS}　·　${esc(slot.hint || '')}</span></div>
      ${card}
      ${acts}
    </div>

    <div class="card rp-card">
      <div class="card-title">This week <span class="card-sub">排的是题型，内容每天从你做过的事里来</span></div>
      <div class="eb-week">${weekHtml}</div>
    </div>

    <div class="two-col wr-cols">
      <div class="card rp-card">
        <div class="card-title">Log <span class="card-sub">${days.length} 天</span></div>
        ${days.length ? days.slice(0, 14).map(d => {
          const head = d.lines.find(l => /^- /.test(l)) || '- —';
          const keeps = d.lines.filter(l => l.includes('::')).length;
          const mm = head.match(/· (\d+)min\s*$/);
          return `<div class="eb-lrow" data-action="open-vault" data-path="${esc(EN_FILE_())}">
            <span class="eb-ld">${d.date.slice(5).replace('-', '/')}</span>
            <span class="eb-lk">${esc((head.match(/· (Part \d|长难句|随手记) ·/) || [, '—'])[1])}</span>
            <span class="eb-lw">${esc(head.replace(/^- Day \d+ · [^·]+· /, '').replace(/ · \d+min$/, ''))}</span>
            <span class="eb-lm">${mm ? mm[1] + 'm' : ''}</span>
            <span class="eb-lp">${keeps ? '+' + keeps : ''}</span></div>`;
        }).join('') : '<div class="rp-empty">还没开始。上面点一下「做完了」就有第一条。</div>'}
      </div>

      <div class="card rp-card">
        <div class="card-title">Keepers <span class="card-sub">${keepers.length} 条 · 语料库自己长出来的</span></div>
        ${keepers.length ? `<div class="eb-kp">${keepers.slice(0, 24).map(k =>
          `<div class="eb-kr"><u>${esc(k.zh)}</u><b>${esc(k.en)}</b></div>`).join('')}</div>`
          : '<div class="rp-empty">练完点「＋ 记一句表达」，一天一两条就够。</div>'}
      </div>
    </div>`;
}

// ── Writing · research vocabulary and moves ─────────────────────
// Practice material for writing in this field, built from the papers in one
// Zotero collection tree rather than typed in by hand. Three things come out:
//
//   terms  vocabulary, each with example sentences sorted by what the sentence
//          does with the word (introduces it, defines it, says why it matters,
//          uses it in a gap, in a method, in a result)
//   moves  the recurring moves of a paper — gap, method, result, contribution,
//          limitation — as real sentences to imitate
//   expr   stock phrases ("superior performance", "verify the effectiveness")
//
// Terms come from three places, because each misses what the others catch:
// "long form (ACRONYM)" on first use, the keywords journals attach to papers,
// and phrases common in this collection but rare in the rest of the library.
// A candidate is kept only if it can actually be taught — at least 4 clean
// example sentences covering at least 3 different uses.
//
// The scan reads ~50 MB of full text, so it runs when Zotero has changed, not
// on every page open, and writes its result to the vault as JSON.
const WT_USES = [
  { k: 'first',  label: '首次引出',   hint: '第一次出现时怎么带出缩写' },
  { k: 'def',    label: '定义',       hint: '怎么给它下定义' },
  { k: 'why',    label: '为什么重要', hint: '怎么说它的意义' },
  { k: 'gap',    label: '指出不足',   hint: '怎么在 gap 里用它' },
  { k: 'method', label: '方法里',     hint: '怎么在方法描述里用它' },
  { k: 'result', label: '结果里',     hint: '怎么在结果里用它' },
];
const WT_MOVES = [
  { k: 'gap',          label: 'Research gap', zh: '指出研究空白' },
  { k: 'method',       label: 'Method',       zh: '描述方法' },
  { k: 'result',       label: 'Result',       zh: '报告结果' },
  { k: 'contribution', label: 'Contribution', zh: '列出贡献' },
  { k: 'limitation',   label: 'Limitation',   zh: '承认局限与展望' },
];
// Structure words that carry each move, bolded so the frame of the sentence
// shows through its content.
const WT_CUE = {
  gap: /\b(however|nevertheless|although|despite|existing (?:methods|approaches|studies|works|models)|current (?:methods|approaches|studies)|most (?:existing|current|previous)|few (?:studies|works|methods)|little (?:attention|research|work)|ha(?:s|ve) (?:not|rarely|seldom) been|remains? (?:a |an )?(?:challenge|challenging|unclear|open|unexplored|limited)|fail(?:s|ed)? to|struggle to|still (?:face|faces|suffer|suffers|have|has)|(?:is|are) (?:still )?limited)\b/gi,
  method: /\b(to (?:address|tackle|solve|overcome) (?:this|these|the above)[^,]{0,30}|(?:is|are) proposed|we propose|this (?:paper|study|work|article) proposes|we (?:develop|present|introduce|design)|specifically|consists of|is designed to|by (?:introducing|incorporating|integrating))\b/gi,
  result: /\b(experiment(?:al)?(?: results)?|results? (?:show|demonstrate|indicate|verify|validate|reveal)|demonstrate(?:s|d)? that|outperform(?:s|ed)?|superior|state-of-the-art|compared (?:with|to)|effectiveness|achiev(?:es|ed|ing)?)\b/gi,
  contribution: /\b((?:main|primary|major|key)? ?contributions? (?:of (?:this|our) (?:paper|work|study) )?(?:are|is|can be summarized|include|as follows)|to the best of our knowledge|(?:first|novel)|in summary)\b/gi,
  limitation: /\b(limitations?|shortcomings?|future work|in (?:the )?future|does not (?:consider|account for)|beyond the scope|remains? to be)\b/gi,
};

// "Operating-conditions" and "operating condition" are one term. No regex lookbehind in this
// file: iPadOS WebKit before 16.4 cannot parse it, and one such literal stops the whole plugin loading.
const wtNorm = s => String(s).toLowerCase().replace(/[-‐–]/g, ' ').replace(/\s+/g, ' ').trim()
  .replace(/(\w{2,}?[^\Wsiu])s$/, '$1');
// Split into sentences after a full stop that is followed by a capital, keeping the stop.
const wtSentences = (text, before) => text.replace(new RegExp('(' + before + '[.])\\s+(?=[A-Z])', 'g'), '$1\u0000').split('\u0000');

async function wtBuildIndex(env) {
  const { fs, path, storage, sql, root, manual = [], prev = null, today, pause = async () => {} } = env;
  const lit = s => "'" + String(s).replace(/'/g, "''") + "'";
  const SUB = `WITH RECURSIVE sub(id) AS (SELECT collectionID FROM collections WHERE collectionName=${lit(root)}
      UNION SELECT c.collectionID FROM collections c JOIN sub ON c.parentCollectionID=sub.id),
    phd AS (SELECT DISTINCT ci.itemID FROM collectionItems ci JOIN sub ON ci.collectionID=sub.id
      WHERE ci.itemID NOT IN (SELECT itemID FROM deletedItems))`;
  const field = (id, name) => `(SELECT v.value FROM itemData d JOIN itemDataValues v ON v.valueID=d.valueID
      JOIN fields f ON f.fieldID=d.fieldID WHERE d.itemID=${id} AND f.fieldName='${name}')`;

  const papers = sql(`${SUB} SELECT i.itemID id, i.key k, ${field('i.itemID', 'title')} t,
      substr(${field('i.itemID', 'date')},1,4) y, ${field('i.itemID', 'abstractNote')} a
    FROM items i WHERE i.itemID IN (SELECT itemID FROM phd)`);
  if (!papers.length) throw new Error('Zotero 里没找到合集 “' + root + '”');
  const P = [], pIndex = {};
  for (const p of papers) { pIndex[p.id] = P.length; P.push({ k: p.k, t: p.t || '', y: p.y || '' }); }
  const atts = sql(`${SUB} SELECT ai.key ak, a.parentItemID pid FROM itemAttachments a JOIN items ai ON ai.itemID=a.itemID
    WHERE a.parentItemID IN (SELECT itemID FROM phd)`);
  const attPaper = {};
  for (const a of atts) if (pIndex[a.pid] != null) attPaper[a.ak] = pIndex[a.pid];

  // ── read full texts ─────────────────────────────────────────────
  const BAD = /[=∑∈≤≥±∂√×→←∀∃⇓⇑]|\[\d|https?:|www\.|©|\bdoi\b|arxiv|\*|corresponding|e-?mail|funding|grant no|competing|authorship|declaration|received \d|accepted \d|available online|^\W/i;
  const HEAD = /^(?:\d+(?:\.\d+)*\.?\s*)?(?:[Aa]bstract|ABSTRACT|[Ii]ntroduction|INTRODUCTION|Background|BACKGROUND|Conclusions?|CONCLUSIONS?|Related [Ww]orks?|Methodology|Methods?|Results?|Discussion)\s+(?=[A-Z])/;
  // Citation markers are what makes a definition look like a definition in a
  // paper; drop the marker, keep the sentence.
  const CITE = /\s*\[\d+(?:\s*[,–-]\s*\d+)*\]|\s*\((?:[A-Z][A-Za-z-]+(?: et al\.)?(?: and [A-Z][A-Za-z-]+)?,?\s*\d{4}[a-z]?(?:;\s*)?)+\)/g;
  const clean = s => {
    s = s.trim().replace(HEAD, '').replace(CITE, '').replace(/\s+([,.;])/g, '$1').replace(/(?:,\s*)+\./g, '.').replace(/,(?:\s*,)+/g, ',');
    // a heading left in front: "VII. LIMITATIONS The limitations…", "APT adapter We build…"
    s = s.replace(/^(?:[IVX]+\.\s*)?[A-Z][A-Z\s-]{3,}\s+(?=[A-Z][a-z])/, '');
    const hm = s.match(/^([A-Z][\w-]*(?: [\w-]+){0,4}) (?=(?:We|The|This|These|Our|To|In this)\b)/);
    if (hm && !/,|\b(?:is|are|was|were|has|have|can|will|may)\b/.test(hm[1])) s = s.slice(hm[0].length);
    if (s.length < 70 || s.length > 260 || BAD.test(s) || !/\.$/.test(s)) return null;
    if (/\bet al\.$|\s\d{1,4}\s+[A-Z]\.\s?[A-Z][a-z]+\b/.test(s)) return null;   // a running page header spliced into the text
    if ((s.match(/\d/g) || []).length > 6) return null;
    // a table row or a heading has no finite verb
    if (!/\b(?:is|are|was|were|be|been|has|have|had|can|could|will|would|may|might|should|must|does|do|did)\b|\b[a-z]{3,}(?:ed|es)\b/i.test(s)) return null;
    return s;
  };
  const sents = [];          // { s, p }
  const gramsP = new Map(), gramsR = new Map();
  let nP = 0, nR = 0, nFiles = 0;
  const STOP = new Set('a an the of and or to in on for with by from as at is are was were be been this that these those it its we our their they which such than then into over under between based using used via can may will also each both other more most some any all not no only very well however thus hence where when while there here one two three first second new different could would should has have had table fig figure section proposed paper study work results result method methods model models data'.split(' '));
  const countGrams = (low, into) => {
    const w = low.replace(/[^a-z\s-]/g, ' ').split(/\s+/).filter(Boolean);
    const seen = new Set();
    for (let n = 2; n <= 3; n++) for (let i = 0; i + n <= w.length; i++) {
      const g = w.slice(i, i + n);
      if (STOP.has(g[0]) || STOP.has(g[n - 1]) || g.some(x => x.length < 3)) continue;
      seen.add(g.join(' '));
    }
    for (const g of seen) into.set(g, (into.get(g) || 0) + 1);
  };
  const acrDocs = new Map();  // "form|ACR" → papers
  let dirs = [];
  try { dirs = fs.readdirSync(storage); } catch (_e) {}
  for (const d of dirs) {
    const f = path.join(storage, d, '.zotero-ft-cache');
    if (!fs.existsSync(f)) continue;
    if (++nFiles % 25 === 0) await pause();
    let t = fs.readFileSync(f, 'utf8');
    const ref = t.search(/\n\s*(?:references|bibliography)\s*\n/i);
    if (ref > t.length * 0.4) t = t.slice(0, ref);          // the reference list is other papers' titles
    t = t.replace(/-\n(?=[a-z])/g, '').replace(/\s+/g, ' ');
    const p = attPaper[d];
    if (p == null) { nR++; countGrams(t.toLowerCase(), gramsR); continue; }
    nP++;
    countGrams(t.toLowerCase(), gramsP);
    for (const raw of wtSentences(t, '[a-z0-9)\\]]')) { const s = clean(raw); if (s) sents.push({ s, p }); }
    const seen = new Set();
    for (const m of t.matchAll(/\b((?:[A-Za-z][a-z]+[ -]){0,5}[A-Za-z][a-z]+) \(([A-Z][A-Za-z0-9]{1,7})\)/g)) {
      const acr = m[2].replace(/s$/, ''), L = acr.replace(/[^A-Z]/g, '');
      if (L.length < 2) continue;
      const parts = m[1].split(' '); let need = L.length; const out = [];
      for (let i = parts.length - 1; i >= 0 && need > 0; i--) { out.unshift(parts[i]); need -= parts[i].split('-').length; }
      if (need !== 0 || out.join(' ').split(/[ -]/).map(w => w[0].toUpperCase()).join('') !== L) continue;
      seen.add(out.join(' ').toLowerCase() + '|' + acr);
    }
    for (const k of seen) acrDocs.set(k, (acrDocs.get(k) || 0) + 1);
  }
  await pause();

  // word → sentence ids, so each term only looks at sentences that can contain it
  const inv = new Map();
  sents.forEach((x, i) => { for (const w of new Set(x.s.toLowerCase().match(/[a-z]{3,}/g) || [])) { if (!inv.has(w)) inv.set(w, []); inv.get(w).push(i); } });

  // ── candidates ──────────────────────────────────────────────────
  const norm = wtNorm;
  const GENERIC_ACR = new Set('CNN SVM ML DL AI NN ANN DNN RNN RF DT LR MSE FC BN API TP TN FP FN SGD PCA NLP GPU CPU SOTA MLP IoT KNN ReLU ROC AUC IT'.split(' '));
  const NOISE = /universit|institut|college|school|laborator|province|china|foundation|competing|authorship|editing|appeared|influence the|financial|funding|acknowledg|supervision|conceptuali|investigation|availability|writing|administration|software|table|figure|elsevier|ieee|springer|journal|copyright|licen|manuscript|reviewer|key lab|state key|et al|data curation|visuali[sz]ation|formal analysis/;
  const IEEE = /^(?:training|data models?|computational model(?:l)?ing|task analysis|predictive models?|feature extraction|prediction|mathematical models?|analytical models?|deep learning|machine learning|artificial intelligence|neural networks?|data mining|optimi[sz]ation|knowledge engineering|adaptation models?|monitoring|reliability|maintenance|computer science.*|statistics.*|electrical engineering.*|mathematics.*|biological system modeling|load modeling|sensors?|costs?|accuracy|benchmark testing|real-time systems|market research|market|industries|production|manufacturing|classification|estimation|simulation|performance evaluation|convolution|kernel|vibrations?|noise measurement|feature engineering|correlation|time series analysis|transformers)$/i;
  const EXPR = /\b(?:improve|enhance|increase|reduce|performance|effectiveness|superiority|results?|verify|validate|demonstrate|significant(?:ly)?|superior|optimal|better|excellent|effective|accurate|robust(?:ness)?|feasibility|compared|comparison|high accuracy|good|great|promising|satisfactory)\b/;
  const VERBISH = /^(?:thereby|obtained|fully|address|investigate|predict|capture|extract|further|achieve|provide|propose|improve|enhance|reduce|obtain|utilize|leverage|consider|perform|conduct|apply|employ|adopt|learn|transfer|transferring|compute|calculate|evaluate|verify|validate|demonstrate|ensure|enable|avoid|solve|increase|decrease|make|take|become|remain|show|shows|real|high|low|large|small|complex|various|different|specific|multiple|original|previous|existing|traditional|conventional|typical|common|general|several|many)$/;
  const ADJ_END = /^(?:industrial|predictive|remaining|long-term|short-term|based|driven|related|specific|effective|efficient|accurate|robust|significant|different|various|multiple|similar|available|possible)$/;
  const cand = new Map();
  const add = (form, acr, src, df) => {
    const k = norm(form); if (k.length < 4 || NOISE.test(k)) return;
    if (!cand.has(k)) cand.set(k, { form: form.toLowerCase().replace(/\s+/g, ' ').trim(), acr: '', src: new Set(), df: 0 });
    const e = cand.get(k);
    if (acr && !e.acr) e.acr = acr;
    e.src.add(src); e.df = Math.max(e.df, df || 0);
  };
  for (const [k, n] of acrDocs) { if (n < 4) continue; const [f, a] = k.split('|'); if (!GENERIC_ACR.has(a)) add(f, a, '缩写', n); }
  for (const r of sql(`${SUB} SELECT lower(t.name) k, COUNT(DISTINCT it.itemID) n FROM itemTags it JOIN tags t ON t.tagID=it.tagID
      WHERE it.type=1 AND it.itemID IN (SELECT itemID FROM phd) GROUP BY lower(t.name) HAVING n>=2`)) {
    let form = r.k.trim(), acr = '';
    const m = form.match(/^(.+?)\s*\(([a-z0-9-]{2,7})\)$/);
    if (m) {
      form = m[1];
      const L = m[2].toUpperCase().replace(/[^A-Z]/g, '');
      if (form.split(/[ -]/).map(w => w[0] ? w[0].toUpperCase() : '').join('') === L) acr = m[2].toUpperCase();
    }
    if (IEEE.test(form)) continue;
    if (!/\s|-/.test(form) && r.n < 3) continue;            // a bare word needs more than two papers behind it
    add(form, acr, '关键词', r.n);
  }
  const expr = [];
  // the long forms of acronyms excluded as too generic, so they cannot come back as phrases
  const genericForms = new Set();
  for (const k of acrDocs.keys()) { const [f, a] = k.split('|'); if (GENERIC_ACR.has(a)) genericForms.add(norm(f)); }
  for (const [g, p] of gramsP) {
    if (p < 15 || NOISE.test(g) || / and /.test(g) || genericForms.has(norm(g))) continue;
    const r = gramsR.get(g) || 0;
    if ((p / nP) / ((p / nP) + (r / Math.max(1, nR))) < 0.8) continue;
    if (EXPR.test(g)) { expr.push({ p: g, df: p }); continue; }
    // a phrase that opens with a verb or adverb, or ends on an adjective, is a
    // collocation to borrow, not a term to define
    const w = g.split(' ');
    if (VERBISH.test(w[0]) || /ly$/.test(w[0]) || ADJ_END.test(w[w.length - 1])) { expr.push({ p: g, df: p }); continue; }
    add(g, '', '词组', p);
  }
  // the long form should carry the acronym even when it arrived through another source
  const acrOf = new Map();
  for (const [k, n] of acrDocs) { const [f, a] = k.split('|'); if (n >= 4 && !GENERIC_ACR.has(a) && !acrOf.has(norm(f))) acrOf.set(norm(f), a); }
  for (const [k, e] of cand) if (!e.acr && acrOf.has(k)) e.acr = acrOf.get(k);
  for (const m of manual) {
    const k = norm(m.form);
    if (!cand.has(k)) cand.set(k, { form: String(m.form).toLowerCase().trim(), acr: '', src: new Set(), df: 0 });
    const e = cand.get(k); e.src.add('手动'); e.manual = true; if (m.acr && !e.acr) e.acr = m.acr;
  }

  // one card per acronym: "root mean square error" and "root mean squared error"
  // A glossary term owns its acronym outright: any other spelling folds into it.
  const byAcr = new Map();
  const ordered = [...cand.entries()].sort((x, y) => (y[1].manual ? 1 : 0) - (x[1].manual ? 1 : 0));
  for (const [k, e] of ordered) {
    if (!e.acr || !cand.has(k)) continue;
    const o = byAcr.get(e.acr);
    if (!o) { byAcr.set(e.acr, k); continue; }
    const ok = cand.get(o);
    if (e.manual && ok.manual) continue;
    const [keep, drop] = ok.manual ? [o, k] : (ok.df >= e.df) ? [o, k] : [k, o];
    for (const x of cand.get(drop).src) cand.get(keep).src.add(x);
    cand.delete(drop); byAcr.set(e.acr, keep);
  }
  // an n-gram that almost always occurs inside a longer one is only a piece of it
  const phraseKeys = [...cand.keys()];
  for (const k of phraseKeys) {
    const e = cand.get(k); if (!e || e.manual || e.acr || !e.src.has('词组') || e.src.size > 1) continue;
    if (phraseKeys.some(o => o !== k && cand.has(o) && ` ${o} `.includes(` ${k} `) && cand.get(o).df >= e.df * 0.8)) cand.delete(k);
  }
  // fragments and restatements of a term that has an acronym: "large language",
  // "language model", "llm prompting" are all the LLM card already
  const withAcr = [...cand.values()].filter(e => e.acr);
  for (const [k, e] of [...cand.entries()]) {
    if (e.acr || e.manual) continue;
    const words = k.split(' ');
    if (withAcr.some(a => {
      const f = norm(a.form);
      if (f === k) return false;
      const fw = f.split(' ');
      const shares2 = fw.length >= 3 && fw.some((_, i) => i + 1 < fw.length && ` ${k} `.includes(` ${fw[i]} ${fw[i + 1]} `));
      return ` ${f} `.includes(` ${k} `) || words.includes(a.acr.toLowerCase()) || shares2
        || new RegExp('^' + f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' (?:prediction|estimation|prognosi|method|model|approach|framework|task|problem|technique)$').test(k);
    })) cand.delete(k);
  }

  // ── examples per term ───────────────────────────────────────────
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const T = '⟦T⟧';
  const USE_RE = {
    def:    new RegExp('^(?:the\\s+|an?\\s+)?' + T + '(?:\\s+(?:of|for|in)\\s+[^,.]{3,40})?\\s*(?:,[^,]{0,40},\\s*)?(?:is|are|can be|could be|may be)\\s+(?:defined as|referred to as|known as|described as|the |an? )', 'i'),
    why:    new RegExp(T + '[^.]{0,70}\\b(?:plays? an? (?:important|key|crucial|vital|critical|essential) role|is (?:crucial|essential|critical|vital|indispensable)\\b|is of (?:great|vital|critical) (?:importance|significance))|\\b(?:crucial|essential|vital|important|critical)\\s+(?:to|for)\\b[^.]{0,40}' + T, 'i'),
    gap:    new RegExp('^(?:however|although|despite|nevertheless|yet)\\b[^.]*' + T + '|' + T + '[^.]{0,80}\\b(?:still (?:faces?|suffers?|has|have)|remains? (?:a |an )?(?:challeng|difficult|open)|is (?:still )?(?:challenging|difficult))', 'i'),
    method: new RegExp('\\b(?:this (?:paper|study|work|article) proposes|(?:is|are|was|were) (?:proposed|introduced|adopted|employed|applied|used|utilized)|we (?:propose|introduce|develop|present|design|adopt|employ|use|apply|leverage|utilize|incorporate|integrate|build|construct)(?:d|ed|s)?|we built)\\b[^.]*' + T + '|' + T + '[^.]{0,60}\\b(?:is|are|was|were) (?:adopted|employed|used|utilized|introduced|applied|incorporated|integrated)\\b', 'i'),
    // a result compares or quantifies; "achieve transfer knowledge" does neither
    result: new RegExp('\\b(?:outperform\\w*|compared (?:with|to)|superior to|state-of-the-art|achiev\\w* (?:better|higher|lower|the (?:best|highest|lowest)|superior|an? (?:accuracy|rmse|mae|score|improvement))|(?:improv|reduc|increas|decreas)\\w* (?:the )?(?:accuracy|performance|error|rmse|mae|precision|by \\d))\\b[^.]*' + T + '|' + T + '[^.]{0,90}\\b(?:outperform\\w*|compared (?:with|to)|superior to|achiev\\w* (?:better|higher|lower|the (?:best|highest|lowest)|superior|an? (?:accuracy|rmse|mae|score))|(?:improv|reduc)\\w* (?:the )?(?:accuracy|performance|error|rmse|mae|by \\d))', 'i'),
  };
  const yearBonus = y => (+y >= 2024 ? 1.5 : +y >= 2021 ? 1 : 0);
  const pick = (list, n) => {
    const out = [], used = new Set();
    for (const x of list.sort((a, b) => b.score - a.score)) { if (used.has(x.p)) continue; used.add(x.p); out.push({ s: x.s, p: x.p }); if (out.length >= n) break; }
    return out;
  };
  const terms = [];
  const prevSeen = {};
  for (const t of (prev && prev.terms) || []) prevSeen[t.id] = t.firstSeen;
  let ti = 0;
  for (const [id, e] of cand) {
    if (++ti % 40 === 0) await pause();
    const words = norm(e.form).split(' ').filter(w => w.length >= 3);
    const keys = words.concat(e.acr ? [e.acr.toLowerCase()] : []);
    const ids = new Set();
    // sentences that contain the rarest word of the long form, or the acronym
    const rare = words.slice().sort((a, b) => (inv.get(a) || []).length - (inv.get(b) || []).length)[0];
    for (const i of (inv.get(rare) || [])) ids.add(i);
    if (e.acr) for (const i of (inv.get(e.acr.toLowerCase()) || [])) ids.add(i);
    if (!ids.size) continue;
    const longPat = norm(e.form).split(' ').map(reEsc).join('[\\s‐-]+') + 's?';
    const longRe = new RegExp('\\b' + longPat + '\\b', 'gi');
    const acrRe = e.acr ? new RegExp('\\b' + reEsc(e.acr) + 's?\\b', 'g') : null;
    const firstRe = e.acr ? new RegExp('⟦L⟧\\s*\\(' + reEsc(e.acr) + 's?\\)') : null;
    const pool = {}; WT_USES.forEach(u => pool[u.k] = []);
    let total = 0;
    for (const i of ids) {
      let { s, p } = sents[i];
      // a heading glued to the sentence: "Large Language Model A large language model (LLM) is…"
      const occ = [...s.matchAll(longRe)];
      if (occ.length >= 2 && occ[0].index < 50) { const cut = s.slice(0, occ[1].index).search(/\b[A-Z][a-z]*\s*$/); if (cut > 0) s = s.slice(cut); }
      let n1 = s.replace(longRe, '⟦L⟧');
      const isFirst = firstRe ? firstRe.test(n1) : false;
      let n2 = n1.replace(firstRe ? new RegExp('⟦L⟧\\s*\\(' + reEsc(e.acr) + 's?\\)', 'g') : /$^/, T).replace(/⟦L⟧/g, T);
      if (acrRe) n2 = n2.replace(acrRe, T);
      if (!n2.includes(T)) continue;
      let use = isFirst ? 'first' : null;
      if (!use) for (const k of ['def', 'why', 'gap', 'method', 'result']) if (USE_RE[k].test(n2)) { use = k; break; }
      if (!use) continue;
      total++;
      pool[use].push({ s, p, score: -Math.abs(s.length - 150) / 35 - n2.indexOf(T) / 45 + yearBonus(P[p].y) });
    }
    const covered = WT_USES.filter(u => pool[u.k].length).length;
    if (!e.manual && (total < 4 || covered < 3)) continue;
    const ex = {};
    for (const u of WT_USES) if (pool[u.k].length) ex[u.k] = pick(pool[u.k], 3);
    terms.push({
      id, form: e.form, acr: e.acr, src: [...e.src], df: e.df, total,
      counts: Object.fromEntries(WT_USES.map(u => [u.k, pool[u.k].length])),
      ex, firstSeen: prevSeen[id] || today, manual: !!e.manual,
    });
  }
  terms.sort((a, b) => b.total - a.total);

  // ── moves ───────────────────────────────────────────────────────
  const MOVE_RE = {
    gap: /^(?:however|nevertheless|although|despite)\b[^.]*\b(?:existing|current|conventional|traditional|most|previous|these|such)\b|\b(?:few (?:studies|works|methods)|little (?:attention|research)|ha(?:s|ve) (?:not|rarely|seldom) been|remains? (?:a |an )?(?:challenge|challenging|unclear|open|unexplored)|fail(?:s|ed)? to|struggle to)\b/i,
    method: /^(?:to (?:address|tackle|solve|overcome)[^,]{0,80},\s*)?(?:a|an|this|the)\b[^.]{0,120}\b(?:is|are) proposed\b|\b(?:we propose|this (?:paper|study|work|article) proposes|we (?:develop|present|introduce))\b/i,
    result: /\b(?:experiment(?:al)?(?: results)?|results|evaluations?|extensive experiments)\b[^.]{0,80}\b(?:show|demonstrate|indicate|verify|validate|reveal|confirm)s?\b|\boutperform(?:s|ed)?\b/i,
    contribution: /\b(?:main|primary|major|key)?\s*contributions?\s+(?:of\s+(?:this|our)\s+(?:paper|work|study|article)\s+)?(?:are|is|can be summarized|include|lie)\b|\bto the best of our knowledge\b/i,
    limitation: /\b(?:limitations? of (?:this|our|the proposed)|(?:this|our) (?:study|work|method|approach) (?:has|also has) (?:some |several )?limitations?|in (?:the )?future(?: work)?,? we|future (?:work|research|studies) (?:will|could|should|may)|beyond the scope of)\b/i,
  };
  const pools = {}; WT_MOVES.forEach(m => pools[m.k] = []);
  const consider = (s, p) => {
    for (const m of WT_MOVES) {
      if (!MOVE_RE[m.k].test(s)) continue;
      if (m.k === 'gap' && /\b(?:cost|financial|labou?r|price|budget)\b/i.test(s)) continue;
      pools[m.k].push({ s, p, score: -Math.abs(s.length - 160) / 40 + yearBonus(P[p].y) });
      break;
    }
  };
  for (const p of papers) {
    if (!p.a) continue;
    for (const raw of wtSentences(p.a.replace(/\s+/g, ' '), '')) {
      const s = raw.trim().replace(CITE, '').replace(/\s+([,.;])/g, '$1');
      if (s.length >= 70 && s.length <= 260 && !BAD.test(s) && /\.$/.test(s)) consider(s, pIndex[p.id]);
    }
  }
  // contribution and limitation statements live in the body, not the abstract
  for (const x of sents) if (MOVE_RE.contribution.test(x.s) || MOVE_RE.limitation.test(x.s)) consider(x.s, x.p);
  const moves = {};
  for (const m of WT_MOVES) moves[m.k] = pick(pools[m.k], 30);

  // ── stock phrases ────────────────────────────────────────────────
  expr.sort((a, b) => b.df - a.df);
  const exprOut = [];
  for (const x of expr.slice(0, 60)) {
    const re = new RegExp('\\b' + x.p.split(' ').map(reEsc).join('\\s+') + '\\b', 'i');
    const w = x.p.split(' ').sort((a, b) => (inv.get(a) || []).length - (inv.get(b) || []).length)[0];
    const hits = (inv.get(w) || []).filter(i => re.test(sents[i].s)).map(i => ({ ...sents[i], score: -Math.abs(sents[i].s.length - 140) / 35 + yearBonus(P[sents[i].p].y) }));
    if (hits.length < 2) continue;
    exprOut.push({ p: x.p, df: x.df, ex: pick(hits, 2) });
    if (exprOut.length >= 40) break;
  }

  // drop papers no example points at, to keep the file small
  const used = new Set();
  const mark = list => (list || []).forEach(e => used.add(e.p));
  terms.forEach(t => Object.values(t.ex).forEach(mark));
  Object.values(moves).forEach(mark);
  exprOut.forEach(x => mark(x.ex));
  const remap = {}, P2 = [];
  [...used].sort((a, b) => a - b).forEach(i => { remap[i] = P2.length; P2.push(P[i]); });
  const fix = list => (list || []).forEach(e => { e.p = remap[e.p]; });
  terms.forEach(t => Object.values(t.ex).forEach(fix));
  Object.values(moves).forEach(fix);
  exprOut.forEach(x => fix(x.ex));

  return {
    v: 1, root, builtAt: Date.now(),
    stats: { papers: papers.length, texts: nP, sentences: sents.length, candidates: cand.size },
    papers: P2, terms, moves, expr: exprOut,
  };
}

// ── Writing · the page ──────────────────────────────────────────
// One card a day, not tied to any paper: the aim is writing in this field in
// general. The glossary and the log are plain notes, so both can be edited by
// hand; the index is derived and rebuilt when Zotero changes.
const WT_WEEK = ['term', 'term', 'move', 'term', 'move', 'review', 'rest'];
const WT_WEEK_LABEL = { term: '术语', move: '句式', review: '回顾', rest: '—' };
const WT_REBUILD_GAP = 30 * 60 * 1000;   // Zotero touches its database while open; don't chase every write

// Which use a term card asks you to imitate, by how many times you've practised it.
const WT_FOCUS = [['first', 'def'], ['why'], ['gap'], ['method'], ['result']];
const WT_TERM_TASK = {
  first: t => `仿照「首次引出」和「定义」，写一句放在 Introduction 第一段的话：第一次提到 ${t}，顺带说清它是什么。`,
  def: t => `仿照「定义」，用自己的话给 ${t} 下一个定义。`,
  why: t => `仿照「为什么重要」，写一句说明为什么 ${t} 值得研究。`,
  gap: t => `仿照「指出不足」，用 ${t} 写一句你研究方向上的 gap —— 写整体还缺什么，不必对应某一篇论文。`,
  method: t => `仿照「方法里」，写一句描述一个用到 ${t} 的方法，可以是你正在做或打算做的。`,
  result: t => `仿照「结果里」，写一句报告与 ${t} 有关的结果，数字可以先用 X 代替。`,
};
const WT_MOVE_TASK = {
  gap: '用加粗的那几个结构，给你的研究方向写一句 gap —— 写这个方向整体还缺什么。',
  method: '写一句介绍一个方法：它是什么、为了解决什么问题。可以是你正在做的，也可以是打算做的。',
  result: '写一句报告结果：在什么数据上、和谁比、好在哪里。数字可以先用 X 代替。',
  contribution: '仿照上面的句式，列出你研究的两到三条贡献。',
  limitation: '写一句承认局限，再接一句未来工作。',
};

// ── the index ────────────────────────────────────────────────────
let _wtIndex = null, _wtIndexMtime = 0, _wtBuilding = false, _wtLastTry = 0, _wtLastError = '';
async function wtIndexLoad() {
  try {
    const st = await app.vault.adapter.stat(V.WTINDEX);
    if (!st) return null;
    if (_wtIndex && st.mtime === _wtIndexMtime) return _wtIndex;
    _wtIndex = JSON.parse(await app.vault.adapter.read(V.WTINDEX));
    _wtIndexMtime = st.mtime;
    return _wtIndex;
  } catch (_e) { return null; }
}

function wtZoteroMtime() {
  try {
    const fsm = zotRequire('fs'), os = zotRequire('os'), pathm = zotRequire('path');
    return fsm.statSync(pathm.join(os.homedir(), 'Zotero', 'zotero.sqlite')).mtimeMs;
  } catch (_e) { return 0; }
}

async function wtRebuild(byHand) {
  if (_wtBuilding) return;
  let fsm, os, pathm;
  try { fsm = zotRequire('fs'); os = zotRequire('os'); pathm = zotRequire('path'); }
  catch (_e) { if (byHand) new Notice('写作素材只能在电脑端的 Obsidian 里更新'); return; }
  _wtBuilding = true; _wtLastTry = Date.now(); _wtLastError = '';
  if ($('writing-body')) loadWriting();
  const live = pathm.join(os.homedir(), 'Zotero', 'zotero.sqlite');
  const tmp = pathm.join(os.tmpdir(), 'db26-wt-' + Date.now() + '.sqlite');
  try {
    if (!fsm.existsSync(live)) throw new Error('找不到 ' + live);
    const bin = zotSqlitePath();
    fsm.copyFileSync(live, tmp);
    for (const ext of ['-wal', '-shm']) { try { if (fsm.existsSync(live + ext)) fsm.copyFileSync(live + ext, tmp + ext); } catch (_e) {} }
    const prev = await wtIndexLoad();
    const gloss = await wtGlossLoad();
    const idx = await wtBuildIndex({
      fs: fsm, path: pathm, storage: pathm.join(os.homedir(), 'Zotero', 'storage'),
      sql: q => zotQuery(bin, tmp, q), root: V.ZOT_ROOT, prev, today: todayStr(),
      // glossary terms are always indexed, even when they would not pass the gate on their own
      manual: gloss.active.map(g => ({ form: g.form, acr: g.acr })),
      pause: () => new Promise(r => setTimeout(r, 0)),
    });
    idx.dbMtime = fsm.statSync(live).mtimeMs;
    const dir = V.WTINDEX.slice(0, V.WTINDEX.lastIndexOf('/'));
    try { if (dir && !(await app.vault.adapter.exists(dir))) await app.vault.adapter.mkdir(dir); } catch (_e) {}
    await app.vault.adapter.write(V.WTINDEX, JSON.stringify(idx));
    // terms you put in the glossary yourself are not discoveries
    const fresh = prev ? idx.terms.filter(t => !t.manual && !prev.terms.some(p => p.id === t.id)).length : 0;
    new Notice(`写作素材已更新 · ${idx.stats.papers} 篇 · ${idx.terms.length} 个术语` + (fresh ? ` · 新发现 ${fresh}` : ''));
  } catch (e) {
    // A background attempt reports in the card; only a click on 立即更新 pops a notice.
    _wtLastError = e && e.message ? e.message : String(e);
    if (byHand) new Notice('写作素材更新失败：' + _wtLastError);
  } finally {
    for (const ext of ['', '-wal', '-shm']) { try { fsm.unlinkSync(tmp + ext); } catch (_e) {} }
    _wtBuilding = false;
    if ($('writing-body')) loadWriting();
  }
}

// ── the glossary: a note you can edit by hand ───────────────────
const WT_GLOSS_ON = '## 在练', WT_GLOSS_OFF = '## 不练';
async function wtGlossLoad() {
  const out = { active: [], off: [] };
  try {
    const f = app.vault.getAbstractFileByPath(V.WTTERMS);
    if (!f) return out;
    let into = null;
    for (const line of (await app.vault.read(f)).split('\n')) {
      if (line.startsWith(WT_GLOSS_ON)) { into = out.active; continue; }
      if (line.startsWith(WT_GLOSS_OFF)) { into = out.off; continue; }
      if (line.startsWith('## ')) { into = null; continue; }
      const m = into && line.match(/^\s*[-*]\s+(.+?)(?:\s+·\s+(.+?))?\s*$/);
      if (!m) continue;
      const fm = m[1].match(/^(.+?)\s*\(([^)]+)\)$/);
      into.push({ form: (fm ? fm[1] : m[1]).trim(), acr: fm ? fm[2].trim() : '', zh: (m[2] || '').trim() });
    }
  } catch (_e) {}
  return out;
}
async function wtGlossSave(g) {
  const line = x => '- ' + x.form + (x.acr ? ' (' + x.acr + ')' : '') + (x.zh ? ' · ' + x.zh : '');
  const body = ['# ' + vBase(V.WTTERMS), '',
    '> Dashboard 的 Writing 页会读写这个文件，也可以直接改：一行一个术语，「·」后面写中文。',
    '> 「在练」里的词轮流出现在每日练习里；「不练」里的词不再出现在候选里。', '',
    WT_GLOSS_ON, '', ...g.active.map(line), '', WT_GLOSS_OFF, '', ...g.off.map(line), ''].join('\n');
  const f = app.vault.getAbstractFileByPath(V.WTTERMS);
  if (f) await app.vault.modify(f, body);
  else {
    const dir = V.WTTERMS.slice(0, V.WTTERMS.lastIndexOf('/'));
    try { await app.vault.createFolder(dir); } catch (_e) {}
    await app.vault.create(V.WTTERMS, body);
  }
}

// ── the log: what you wrote, by day ─────────────────────────────
// - 术语 · large language model (LLM) · 定义
//   > the sentence
async function wtLogLoad() {
  const days = [];
  try {
    const f = app.vault.getAbstractFileByPath(V.WTLOG);
    if (!f) return days;
    let day = null, item = null;
    for (const line of (await app.vault.cachedRead(f)).split('\n')) {
      const d = line.match(/^## (\d{4}-\d{2}-\d{2})\s*$/);
      if (d) { day = { date: d[1], items: [] }; days.push(day); item = null; continue; }
      if (!day) continue;
      const m = line.match(/^- (术语|句式|回顾) · (.+?)(?: · (.+))?\s*$/);
      if (m) { item = { kind: m[1], key: m[2].trim(), use: (m[3] || '').trim(), text: '' }; day.items.push(item); continue; }
      const q = line.match(/^\s+>\s?(.*)$/);
      if (q && item) item.text += (item.text ? '\n' : '') + q[1];
    }
  } catch (_e) {}
  return days.sort((a, b) => b.date.localeCompare(a.date));
}
async function wtLogAppend(item) {
  const date = todayStr();
  const lines = ['- ' + item.kind + ' · ' + item.key + (item.use ? ' · ' + item.use : '')]
    .concat(String(item.text).split('\n').map(l => '  > ' + l));
  let f = app.vault.getAbstractFileByPath(V.WTLOG);
  if (!f) {
    const dir = V.WTLOG.slice(0, V.WTLOG.lastIndexOf('/'));
    try { await app.vault.createFolder(dir); } catch (_e) {}
    f = await app.vault.create(V.WTLOG, '# ' + vBase(V.WTLOG) + '\n\n> Dashboard 的 Writing 页写入。每天一个小节，最新的在最上面。\n\n');
  }
  const text = await app.vault.read(f);
  const head = new RegExp('^## ' + date + '[ \\t]*$', 'm');
  const m = text.match(head);
  let next;
  if (m) {
    const after = text.slice(m.index + m[0].length);
    const end = after.search(/^## /m);
    const block = (end < 0 ? after : after.slice(0, end)).replace(/\s*$/, '');
    next = text.slice(0, m.index + m[0].length) + block + '\n' + lines.join('\n') + '\n\n' + (end < 0 ? '' : after.slice(end));
  } else {
    const first = text.search(/^## \d{4}-\d{2}-\d{2}/m);
    const block = '## ' + date + '\n\n' + lines.join('\n') + '\n\n';
    next = first < 0 ? text.replace(/\s*$/, '\n\n') + block : text.slice(0, first) + block + text.slice(first);
  }
  await app.vault.modify(f, next);
}

// ── picking today's card ────────────────────────────────────────
const wtLabel = t => t.form + (t.acr ? ' (' + t.acr + ')' : '');
let _wtAlt = {}, _wtDraft = '', _wtReveal = false, _wtCardKey = '';
function wtKeepDraft() { const el = $('wt-input'); if (el) _wtDraft = el.value; }

function wtMonday(ds) {
  const d = new Date(ds + 'T12:00'); d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return dateKey(d);
}

function wtToday(idx, gloss, log) {
  const today = todayStr();
  const pick = LS('wt_pick', null);
  let kind = (pick && pick.date === today && pick.kind) || WT_WEEK[(new Date(today + 'T12:00').getDay() + 6) % 7];
  const all = log.flatMap(d => d.items.map(i => ({ ...i, date: d.date })));
  const byId = new Map(idx.terms.map(t => [t.id, t]));
  const offIds = new Set(gloss.off.map(g => wtNorm(g.form)));

  const practisedTimes = label => all.filter(i => i.kind === '术语' && i.key === label).length;
  const lastDate = label => (all.find(i => i.kind === '术语' && i.key === label) || {}).date || '';

  const termFor = key => {
    const t = byId.get(key); if (!t) return null;
    const g = gloss.active.find(x => wtNorm(x.form) === key);
    return { ...t, zh: g ? g.zh : '', acr: t.acr || (g && g.acr) || '' };
  };
  const pickTerm = skip => {
    let pool = gloss.active.map(g => termFor(wtNorm(g.form))).filter(Boolean);
    if (!pool.length) pool = idx.terms.filter(t => !offIds.has(t.id)).slice(0, 30).map(t => termFor(t.id));
    pool = pool.filter(t => t.id !== skip);
    pool.sort((a, b) => lastDate(wtLabel(a)).localeCompare(lastDate(wtLabel(b))));   // never practised ('') sorts first
    return pool[0] || null;
  };

  if (kind === 'review') {
    const monday = wtMonday(today);
    const week = all.filter(i => i.date >= monday && i.kind !== '回顾');
    const done = new Set(all.filter(i => i.date >= monday && i.kind === '回顾').map(i => i.key));
    const due = week.find(i => !done.has(i.key));
    if (!due) return { kind: 'review-empty' };
    if (due.kind === '句式') return { kind: 'move', blind: true, move: WT_MOVES.find(m => m.k === due.key) || WT_MOVES[0] };
    const t = idx.terms.find(x => wtLabel(x) === due.key);
    if (!t) return { kind: 'review-empty' };
    return { kind: 'term', blind: true, term: termFor(t.id), n: practisedTimes(due.key) };
  }
  if (kind === 'rest') return { kind: 'rest' };
  // One card a day: once today's is written, it stays on screen as done rather
  // than rolling straight on to the next one.
  const doneToday = all.filter(i => i.date === today);
  if (kind === 'move') {
    const wrote = !(pick && pick.date === today && pick.key) && doneToday.filter(i => i.kind === '句式').pop();
    if (wrote) return { kind: 'move', done: true, move: WT_MOVES.find(m => m.k === wrote.key) || WT_MOVES[0] };
    const key = pick && pick.date === today && pick.kind === 'move' && pick.key;
    const count = k => all.filter(i => i.kind === '句式' && i.key === k).length;
    const move = WT_MOVES.find(m => m.k === key) || WT_MOVES.slice().sort((a, b) => count(a.k) - count(b.k))[0];
    return { kind: 'move', move };
  }
  const wroteT = !(pick && pick.date === today && pick.key) && doneToday.filter(i => i.kind === '术语').pop();
  if (wroteT) {
    const t = idx.terms.find(x => wtLabel(x) === wroteT.key);
    if (t) return { kind: 'term', done: true, term: termFor(t.id), n: practisedTimes(wroteT.key) };
  }
  const key = pick && pick.date === today && pick.kind === 'term' && pick.key;
  const term = (key && termFor(key)) || pickTerm();
  if (!term) return { kind: 'no-terms' };
  return { kind: 'term', term, n: practisedTimes(wtLabel(term)) };
}

// ── render ──────────────────────────────────────────────────────
const wtSrc = (idx, e) => {
  const p = idx.papers[e.p] || {};
  return `← ${esc(String(p.t || '').slice(0, 86))}${p.y ? ' · ' + esc(p.y) : ''}` +
    (p.k ? `　<a class="wt-zlink" href="zotero://select/library/items/${esc(p.k)}">↗</a>` : '');
};
const wtMarkTerm = (s, t) => {
  let h = esc(s);
  const long = wtNorm(t.form).split(' ').map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s‐-]+');
  h = h.replace(new RegExp('\\b(' + long + 's?)\\b', 'gi'), '<mark>$1</mark>');
  if (t.acr) h = h.replace(new RegExp('\\b(' + t.acr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + 's?)\\b(?![^<]*</mark>)', 'g'), '<mark>$1</mark>');
  return h;
};
const wtMarkCue = (s, k) => esc(s).replace(new RegExp(WT_CUE[k].source, 'gi'), m => '<b>' + m + '</b>');

function wtTermCard(idx, today) {
  const t = today.term, label = wtLabel(t);
  const focus = (WT_FOCUS[Math.min(today.n, WT_FOCUS.length - 1)] || []).filter(k => t.ex[k]);
  const use = focus[0] || WT_USES.map(u => u.k).find(k => t.ex[k]);
  const rows = WT_USES.filter(u => t.ex[u.k]).map(u => {
    const list = t.ex[u.k], e = list[(_wtAlt[u.k] || 0) % list.length];
    const more = t.counts[u.k] || list.length;
    return `<div class="wt-ex${focus.includes(u.k) ? ' on' : ''}">
      <div class="wt-k">${esc(u.label)}<i>${esc(u.hint)}</i></div>
      ${today.blind && !_wtReveal ? '<div class="wt-s wt-hidden">先凭记忆写，写完再看例句</div>'
        : `<div class="wt-s">${wtMarkTerm(e.s, t)}</div>
      <div class="wt-src">${wtSrc(idx, e)}${list.length > 1 ? `　·　<span class="wt-alt" data-action="wt-alt" data-use="${u.k}">换一句</span>` : ''}${more > list.length ? `<span class="wt-more">同类共 ${more} 句</span>` : ''}</div>`}
    </div>`;
  }).join('');
  return `
    <div class="wt-head">
      <span class="wt-term">${esc(t.form)}</span>${t.acr ? `<span class="wt-acr">${esc(t.acr)}</span>` : ''}
      ${t.zh ? `<span class="wt-zh">${esc(t.zh)}</span>` : ''}
      <span class="wt-n">${today.blind ? '回顾 · ' : ''}${t.total} 句可参考${today.n ? ` · 练过 ${today.n} 次` : ''}</span>
    </div>
    ${rows}
    ${today.blind && !_wtReveal ? '<div class="wt-acts" style="margin-top:6px"><span class="nx-skip" data-action="wt-reveal">看例句</span></div>' : ''}
    ${today.done ? `<div class="wt-done">今天这张写完了 ✓　<span class="nx-skip" data-action="wt-skip" data-key="${esc(t.id)}">再练一张</span>　<span class="nx-skip" data-action="wt-pick" data-kind="move">练一张句式</span></div>` : `
    <div class="wt-you">
      <b>${today.blind ? '凭记忆重写' : '你来写'}</b>
      <p>${esc((WT_TERM_TASK[use] || WT_TERM_TASK.def)(label))}</p>
      <textarea id="wt-input" class="wt-box" rows="3" placeholder="English…">${esc(_wtDraft)}</textarea>
      <div class="wt-acts">
        <button type="button" class="act-btn primary" data-action="wt-save" data-kind="${today.blind ? '回顾' : '术语'}" data-key="${esc(label)}" data-use="${esc((WT_USES.find(u => u.k === use) || {}).label || '')}">存进句子库</button>
        ${today.blind ? '' : `<span class="nx-skip" data-action="wt-skip" data-key="${esc(t.id)}">换一个术语</span>
        <span class="nx-skip" data-action="wt-pick" data-kind="move">今天改练句式</span>`}
      </div>
    </div>`}`;
}

function wtMoveCard(idx, today) {
  const m = today.move, list = idx.moves[m.k] || [];
  const start = ((_wtAlt.move || 0) * 4) % Math.max(1, list.length);
  const shown = list.slice(start, start + 4).concat(start + 4 > list.length ? list.slice(0, Math.max(0, start + 4 - list.length)) : []);
  return `
    <div class="wt-head">
      <span class="wt-term">${esc(m.label)}</span><span class="wt-zh">${esc(m.zh)}</span>
      <span class="wt-n">${today.blind ? '回顾 · ' : ''}从 ${idx.stats.papers} 篇论文里挑的 ${list.length} 句</span>
    </div>
    ${today.blind && !_wtReveal
      ? '<div class="wt-ex"><div class="wt-s wt-hidden">先凭记忆写，写完再看例句</div></div><div class="wt-acts" style="margin-top:6px"><span class="nx-skip" data-action="wt-reveal">看例句</span></div>'
      : shown.map(e => `<div class="wt-ex"><div class="wt-k">${esc(m.k)}</div><div class="wt-s">${wtMarkCue(e.s, m.k)}</div><div class="wt-src">${wtSrc(idx, e)}</div></div>`).join('') +
        (list.length > 4 ? '<div class="wt-acts" style="margin-top:6px"><span class="nx-skip" data-action="wt-alt" data-use="move">换一批</span></div>' : '')}
    ${today.done ? `<div class="wt-done">今天这张写完了 ✓　<span class="nx-skip" data-action="wt-pick" data-kind="term">练一张术语</span></div>` : `
    <div class="wt-you">
      <b>${today.blind ? '凭记忆重写' : '你来写'}</b>
      <p>${esc(WT_MOVE_TASK[m.k])}</p>
      <textarea id="wt-input" class="wt-box" rows="3" placeholder="English…">${esc(_wtDraft)}</textarea>
      <div class="wt-acts">
        <button type="button" class="act-btn primary" data-action="wt-save" data-kind="${today.blind ? '回顾' : '句式'}" data-key="${esc(m.k)}">存进句子库</button>
        ${today.blind ? '' : '<span class="nx-skip" data-action="wt-pick" data-kind="term">今天改练术语</span>'}
      </div>
    </div>`}`;
}

async function wtSection(host) {
  const idx = await wtIndexLoad();
  const nodeOK = !!wtZoteroMtime();

  // Rebuild in the background when Zotero has changed since the index was made — but only
  // once a collection has been chosen in settings; until then Zotero is not touched unasked.
  const zotChosen = !!(CFG.vault && CFG.vault.ZOT_ROOT);
  if (nodeOK && zotChosen && !_wtBuilding) {
    const stale = !idx || wtZoteroMtime() > (idx.dbMtime || 0);
    // Wait out the gap after any attempt, failed ones included — a missing collection
    // would otherwise retry on every redraw.
    const rested = Date.now() - _wtLastTry > WT_REBUILD_GAP && (!idx || Date.now() - idx.builtAt > WT_REBUILD_GAP);
    if (stale && rested) setTimeout(() => wtRebuild(false), 50);
  }
  const failed = !_wtBuilding && _wtLastError
    ? `<span class="wt-error">上次更新失败：${esc(_wtLastError)}</span>　` : '';
  const status = _wtBuilding ? '<span class="wt-busy">正在从 Zotero 更新写作素材…</span>'
    : idx ? failed + `${idx.stats.papers} 篇 · ${idx.terms.length} 个术语 · 更新于 ${new Date(idx.builtAt).toTimeString().slice(0, 5)} ${dateKey(new Date(idx.builtAt)).slice(5)}` +
      (nodeOK ? '　<span class="nx-skip" data-action="wt-rebuild">立即更新</span>' : '')
    : failed ? failed + '<span class="nx-skip" data-action="wt-rebuild">重试</span>'
    : nodeOK ? '<span class="nx-skip" data-action="wt-rebuild">立即更新</span>' : '';

  if (!idx) {
    return `<div class="card rp-card"><div class="card-title">Research writing <span class="card-sub">${status}</span></div>
      <div class="rp-empty">${_wtBuilding ? '第一次建立写作素材，大约十秒。' : nodeOK ? (zotChosen ? `还没有写作素材。写作素材来自 Zotero 合集「${esc(V.ZOT_ROOT)}」（含子合集）。` : '在设置里填写「写作素材合集」后，会从 Zotero 自动提取术语与句式。') : '写作素材要在电脑端的 Obsidian 里建立一次，之后手机上也能看。'}</div></div>`;
  }

  const [gloss, log] = await Promise.all([wtGlossLoad(), wtLogLoad()]);
  const today = wtToday(idx, gloss, log);
  const cardKey = todayStr() + ':' + today.kind + ':' + (today.term ? today.term.id : today.move ? today.move.k : '');
  if (cardKey !== _wtCardKey) { _wtCardKey = cardKey; _wtAlt = {}; _wtReveal = false; }

  const kindNow = today.blind ? 'review' : today.kind;
  const card = today.kind === 'term' ? wtTermCard(idx, today)
    : today.kind === 'move' ? wtMoveCard(idx, today)
    : today.kind === 'rest' ? '<div class="rp-empty">周日休息。<span class="nx-skip" data-action="wt-pick" data-kind="term">还是想练一张</span></div>'
    : today.kind === 'review-empty' ? '<div class="rp-empty">这周还没有练过的内容可以回顾。<span class="nx-skip" data-action="wt-pick" data-kind="term">练一张术语</span></div>'
    : '<div class="rp-empty">术语表还空着 —— 在下面「候选」里挑几个点「＋ 练」。</div>';

  // week strip
  const monday = wtMonday(todayStr());
  const doneDays = new Set(log.map(d => d.date));
  const dowNow = (new Date().getDay() + 6) % 7;
  const week = WT_WEEK.map((k, i) => {
    const d = new Date(monday + 'T12:00'); d.setDate(d.getDate() + i);
    const ds = dateKey(d);
    const cls = [i === dowNow ? 'on' : '', k === 'review' ? 'rev' : '', doneDays.has(ds) ? 'ok' : ''].filter(Boolean).join(' ');
    return `<div class="wt-d ${cls}"><b>${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</b><i>${doneDays.has(ds) ? '✓' : WT_WEEK_LABEL[k]}</i></div>`;
  }).join('');

  // glossary tabs
  const activeIds = new Set(gloss.active.map(g => wtNorm(g.form)));
  const offIds = new Set(gloss.off.map(g => wtNorm(g.form)));
  const ack = String(LS('wt_ack', ''));
  const candidates = idx.terms.filter(t => !activeIds.has(t.id) && !offIds.has(t.id));
  const fresh = candidates.filter(t => ack && t.firstSeen > ack);
  const tab = String(LS('wt_tab', 'active'));
  const all = log.flatMap(d => d.items);
  const timesFor = label => all.filter(i => i.kind === '术语' && i.key === label).length;
  const byId = new Map(idx.terms.map(t => [t.id, t]));
  const tabs = [['active', '在练', gloss.active.length], ['cand', '候选', candidates.length], ['fresh', '新发现', fresh.length], ['off', '不练', gloss.off.length]]
    .map(([k, l, n]) => `<span class="kpi-tab${tab === k ? ' active' : ''}" data-action="wt-tab" data-tab="${k}">${l} ${n}</span>`).join('');
  const rowCand = t => `<div class="wt-li"><u>${esc(t.acr || '')}</u><span title="${esc(t.src.join(' · '))}">${esc(t.form)}</span><em>${t.total} 句</em>
    <span class="wt-op" data-action="wt-add" data-id="${esc(t.id)}">＋ 练</span><span class="wt-op" data-action="wt-off" data-id="${esc(t.id)}">×</span></div>`;
  let list;
  if (tab === 'cand') list = candidates.map(rowCand).join('');
  else if (tab === 'fresh') list = (fresh.length ? `<div class="wt-note">上次看过之后，新论文带来的词。<span class="wt-op" data-action="wt-ack">都看过了</span></div>` : '') + fresh.map(rowCand).join('');
  else if (tab === 'off') list = gloss.off.map(g => `<div class="wt-li"><u>${esc(g.acr)}</u><span>${esc(g.form)}</span><em></em><span class="wt-op" data-action="wt-restore" data-id="${esc(wtNorm(g.form))}">恢复</span></div>`).join('');
  else list = gloss.active.map(g => {
    const t = byId.get(wtNorm(g.form));
    const n = timesFor(wtLabel({ form: t ? t.form : g.form, acr: (t && t.acr) || g.acr }));
    return `<div class="wt-li${t ? '' : ' miss'}"><u>${esc((t && t.acr) || g.acr)}</u><span>${esc(g.form)}${g.zh ? ` <small>${esc(g.zh)}</small>` : ''}</span>
      <em>${t ? (n ? '练过 ' + n : t.total + ' 句') : '没找到例句'}</em>
      ${t ? `<span class="wt-op" data-action="wt-pick" data-kind="term" data-key="${esc(t.id)}">今天练</span>` : ''}
      <span class="wt-op" data-action="wt-off" data-id="${esc(wtNorm(g.form))}">×</span></div>`;
  }).join('');
  if (!list) list = '<div class="rp-empty">空</div>';

  // moves and stock phrases
  const moveCount = k => all.filter(i => i.kind === '句式' && i.key === k).length;
  const moves = WT_MOVES.map(m => `<div class="wt-li"><u>${esc(m.k)}</u><span>${esc(m.zh)}</span><em>${moveCount(m.k) ? '练过 ' + moveCount(m.k) : (idx.moves[m.k] || []).length + ' 句'}</em>
    <span class="wt-op" data-action="wt-pick" data-kind="move" data-key="${m.k}">今天练</span></div>`).join('');
  const expr = (idx.expr || []).slice(0, 18).map(x => `<span class="wt-chip" title="${esc(x.ex[0] ? x.ex[0].s : '')}">${esc(x.p)}</span>`).join('');

  // library
  const groups = new Map();
  for (const d of log) for (const i of d.items) {
    const k = i.kind === '句式' ? (WT_MOVES.find(m => m.k === i.key) || { label: i.key }).label : i.key;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push({ ...i, date: d.date });
  }
  const library = groups.size ? [...groups.entries()].map(([k, items], gi) => `<details class="wt-group"${gi < 3 ? ' open' : ''}>
      <summary>${esc(k)} <small>${items.length}</small></summary>
      ${items.map(i => `<div class="wt-mine">${esc(i.text).replace(/\n/g, '<br>')}<small>${i.date.slice(5)} · ${esc(i.kind)}${i.use ? ' · ' + esc(i.use) : ''}</small></div>`).join('')}
    </details>`).join('')
    : '<div class="rp-empty">写下的第一句会出现在这里，按术语和句式归档。</div>';

  return `
    <div class="card rp-card">
      <div class="card-title">Today <span class="card-sub">${WT_WEEK_LABEL[kindNow] || ''} · ${status}</span></div>
      ${card}
    </div>
    <div class="card rp-card">
      <div class="card-title">节奏 <span class="card-sub">术语和句式轮换 · 周六回顾，先不看例句凭记忆重写</span></div>
      <div class="wt-rhythm">${week}</div>
    </div>
    <div class="two-col wr-cols">
      <div class="card rp-card">
        <div class="card-title">术语表 <span class="card-sub" style="margin-left:auto">${tabs}</span></div>
        <div class="wt-list">${list}</div>
        <div class="wt-note">也可以直接改 <span class="wt-op" data-action="open-vault" data-path="${esc(V.WTTERMS)}">${esc(vBase(V.WTTERMS))}</span></div>
      </div>
      <div class="card rp-card">
        <div class="card-title">句式 <span class="card-sub">期刊里反复出现的动作</span></div>
        <div class="wt-list">${moves}</div>
        ${expr ? `<div class="wt-sub">常用表达</div><div class="wt-chips">${expr}</div>` : ''}
      </div>
    </div>
    <div class="card rp-card">
      <div class="card-title">我的句子库 <span class="card-sub">${log.reduce((a, d) => a + d.items.length, 0)} 句　<span class="wt-op" data-action="open-vault" data-path="${esc(V.WTLOG)}">打开</span></span></div>
      <div class="wt-lib">${library}</div>
    </div>`;
}

// ── actions ─────────────────────────────────────────────────────
async function wtAction(a, t) {
  try {
    if (a === 'wt-save') {
      const el = $('wt-input');
      const text = el ? el.value.trim() : '';
      if (!text) { new Notice('先写一句'); return; }
      await wtLogAppend({ kind: t.dataset.kind, key: t.dataset.key, use: t.dataset.use || '', text });
      _wtDraft = ''; _wtReveal = false;
      const pk = LS('wt_pick', null);
      if (pk && pk.date === todayStr()) LSS('wt_pick', { date: pk.date, kind: pk.kind, key: '' });
      new Notice('已存进句子库');
    } else if (a === 'wt-alt') {
      wtKeepDraft(); _wtAlt[t.dataset.use] = (_wtAlt[t.dataset.use] || 0) + 1;
    } else if (a === 'wt-reveal') {
      wtKeepDraft(); _wtReveal = true;
    } else if (a === 'wt-pick') {
      wtKeepDraft(); LSS('wt_pick', { date: todayStr(), kind: t.dataset.kind, key: t.dataset.key || '' });
    } else if (a === 'wt-skip') {
      wtKeepDraft();
      const idx = await wtIndexLoad(), gloss = await wtGlossLoad();
      const pool = gloss.active.map(g => wtNorm(g.form)).filter(k => idx.terms.some(x => x.id === k));
      const ids = pool.length ? pool : idx.terms.slice(0, 30).map(x => x.id);
      const next = ids[(ids.indexOf(t.dataset.key) + 1) % ids.length];
      LSS('wt_pick', { date: todayStr(), kind: 'term', key: next });
    } else if (a === 'wt-tab') {
      wtKeepDraft(); LSS('wt_tab', t.dataset.tab);
    } else if (a === 'wt-ack') {
      LSS('wt_ack', todayStr());
    } else if (a === 'wt-rebuild') {
      wtRebuild(true); return;
    } else if (a === 'wt-add' || a === 'wt-off' || a === 'wt-restore') {
      wtKeepDraft();
      const idx = await wtIndexLoad(), gloss = await wtGlossLoad();
      const id = t.dataset.id, term = idx && idx.terms.find(x => x.id === id);
      const drop = list => list.filter(g => wtNorm(g.form) !== id);
      if (a === 'wt-add') {
        const zh = await db26Prompt('「' + (term ? term.form : id) + '」的中文（可以空着）:', '');
        if (zh === null) return;
        gloss.off = drop(gloss.off);
        gloss.active = drop(gloss.active).concat([{ form: term ? term.form : id, acr: term ? term.acr : '', zh: String(zh || '').trim() }]);
      } else if (a === 'wt-off') {
        const g = gloss.active.find(x => wtNorm(x.form) === id);
        gloss.active = drop(gloss.active);
        gloss.off = drop(gloss.off).concat([g || { form: term ? term.form : id, acr: term ? term.acr : '', zh: '' }]);
      } else {
        gloss.off = drop(gloss.off);     // back among the candidates, not straight into practice
      }
      await wtGlossSave(gloss);
    }
  } catch (e) {
    new Notice('操作失败：' + (e && e.message ? e.message : e));
  }
  loadWriting();
}

// ── Writing · two tracks ────────────────────────────────────────
// Academic is practice (you are training a skill); Public is production (you
// are shipping a piece). They share a page but nothing else — mixing their
// states was what made the old setup unreadable.
const WR_ACAD = V.ACADEMIC;
const WR_PUB = V.WRITE_PUB;
const WR_HOME = V.WRITE_HOME;
const WR_STAGES = [
  { key: 'idea', label: 'Idea', bg: 'var(--bg4)', fg: 'var(--text3)' },
  { key: 'draft', label: 'Draft', bg: 'var(--yellow-bg)', fg: 'var(--yellow-text)' },
  { key: 'published', label: 'Published', bg: 'var(--green-bg)', fg: 'var(--green-text)' },
];
const WR_DEAD = ['superseded', 'archived'];

async function wtScan(dir) {
  const out = [];
  for (const f of app.vault.getMarkdownFiles().filter(x => x.path.startsWith(dir + '/'))) {
    let t = '';
    try { t = await app.vault.cachedRead(f); } catch (_e) {}
    out.push({
      file: f, name: f.basename, mtime: f.stat.mtime,
      status: (t.match(/^status:\s*(.*)$/m) || [, ''])[1].trim().toLowerCase(),
      created: (t.match(/^created:\s*(.*)$/m) || [, ''])[1].trim(),
      published: (t.match(/^published:\s*(\S+)/m) || [, ''])[1].trim(),
    });
  }
  return out.sort((a, b) => b.mtime - a.mtime);
}

const wrDate = ms => new Date(ms).toISOString().slice(5, 10).replace('-', '/');

async function wrNew(kind) {
  try {
    const isAcad = kind === 'acad';
    const title = await db26Prompt(isAcad ? 'Academic practice topic:' : 'Article title:');
    if (!title || !title.trim()) return;
    const safe = title.replace(/[\\/:*?"<>|#^\[\]]/g, ' ').replace(/\s+/g, ' ').trim();
    const dir = isAcad ? WR_ACAD : WR_PUB;
    const name = isAcad ? safe : todayStr() + ' ' + safe;
    const path = dir + '/' + name + '.md';
    if (app.vault.getAbstractFileByPath(path)) { await app.workspace.openLinkText(path, '', false); return; }

    let body = await readTemplate(isAcad ? 'Academic Writing Practice Template' : 'Public Writing Template');
    body = String(body || '# ' + safe + '\n');
    // The public template is written for Templater; strip its script block and
    // fill the placeholders here so plain vault.create still produces a
    // correct note.
    body = body.replace(/^<%\*[\s\S]*?-%>\n?/, '')
      .replace(/<%\s*tp\.file\.title\s*%>/g, safe)
      .replace(/<%\s*tp\.date\.now\("YYYY-MM-DD"\)\s*%>/g, todayStr())
      .replace(/\{\{\s*Topic\s*\}\}/g, safe)
      .replace(/\{\{\s*date:YYYY-MM-DD\s*\}\}/g, todayStr());
    if (!isAcad && !/^status:/m.test(body)) body = body.replace(/^(---\n)/, '$1status: idea\n');

    try { await app.vault.createFolder(dir); } catch (_e) {}
    const f = await app.vault.create(path, body);
    await app.workspace.openLinkText(f.path, '', false);
    loadWriting();
  } catch (e) {
    if (typeof Notice !== 'undefined') new Notice('新建失败：' + (e && e.message ? e.message : e));
  }
}

async function loadWriting() {
  const host = $('writing-body'); if (!host) return;
  const draft = $('wt-input'); if (draft) _wtDraft = draft.value;
  const pub = await wtScan(WR_PUB);
  const research = await wtSection(host);

  const live = pub.filter(a => !WR_DEAD.includes(a.status));
  const dead = pub.filter(a => WR_DEAD.includes(a.status));
  const byStage = k => live.filter(a => (a.status || 'idea') === k);
  const pill = st => {
    const s = WR_STAGES.find(x => x.key === st) || { label: st || 'idea', bg: 'var(--bg4)', fg: 'var(--text3)' };
    return `<span class="wr-pill" style="background:${s.bg};color:${s.fg}">${esc(s.label)}</span>`;
  };
  const row = a => `<div class="wr-row" data-action="open-vault" data-path="${esc(a.file.path)}">
    ${pill(a.status)}<span class="wr-name">${esc(a.name)}</span><span class="wr-when">${wrDate(a.mtime)}</span></div>`;

  host.innerHTML = research + `
    <div class="card rp-card">
      <div class="card-title">Public writing <span class="card-sub">产出 · ${live.length} 在流水线上</span></div>
      <div class="wr-pipe">
        ${WR_STAGES.map(s => `<div class="wr-stage" style="background:${s.bg}">
          <span class="wr-sn" style="color:${s.fg}">${byStage(s.key).length}</span>
          <span class="wr-sl" style="color:${s.fg}">${esc(s.label)}</span></div>`).join('')}
      </div>
      <div class="wr-act">
        <button type="button" class="act-btn primary" data-action="wr-new" data-kind="pub">＋ 新文章</button>
        <span class="wr-meta" data-action="open-vault" data-path="${esc(WR_HOME)}">Open project →</span>
      </div>
      <div class="wr-list">${live.length ? live.map(row).join('') : '<div class="rp-empty">流水线是空的。</div>'}</div>
      ${dead.length ? `<details class="wr-dead"><summary>Archived · ${dead.length}</summary>${dead.map(row).join('')}</details>` : ''}
    </div>`;
}

// ── Punch storage ───────────────────────────────────────────────
// One document owns the clock (V.PUNCH), newest day first.
// The daily note only embeds that day's heading (![[<punch doc>#2026-09-11]]),
// so the data lives in exactly one place and the note that an external agent
// rewrites every night is never touched by the punch buttons.
function PUNCH_FILE_() { return V.PUNCH; }
function PUNCH_HEAD_() { return '# ' + vBase(V.PUNCH); }

async function punchDoc() {
  let f = app.vault.getAbstractFileByPath(PUNCH_FILE_());
  if (f) return f;
  const body = [PUNCH_HEAD_(), '',
    '> 由 Dashboard 首页的打卡按钮写入。每天一个小节，最新的在最上面。',
    '> 每篇 Daily Note 通过 `![[' + vBase(V.PUNCH) + '#日期]]` 嵌入当天这一节，不复制数据。', '', ''].join('\n');
  const dir = PUNCH_FILE_().slice(0, PUNCH_FILE_().lastIndexOf('/'));
  try { await app.vault.createFolder(dir); } catch (_e) {}
  return await app.vault.create(PUNCH_FILE_(), body);
}

// Pull one day's bullet lines out of the document.
function punchReadDay(text, date) {
  const re = new RegExp('^## ' + date + '[ \\t]*$', 'm');
  const m = text.match(re);
  if (!m) return [];
  const rest = text.slice(m.index + m[0].length);
  const end = rest.search(/^## /m);
  return (end < 0 ? rest : rest.slice(0, end)).split('\n')
    .map(l => l.match(/^-\s*(\d{2}:\d{2})\s+(\w+)(?:\s+(\w+))?\s*$/))
    .filter(Boolean)
    .map(x => ({ at: x[1], key: x[2], cat: x[3] || '' }));
}

// Replace (or insert, newest first) one day's section.
function punchWriteDay(text, date, list) {
  const block = ['## ' + date, ''].concat(
    list.map(p => `- ${p.at} ${p.key}${p.cat ? ' ' + p.cat : ''}`)
  ).concat(['']).join('\n');

  const re = new RegExp('^## ' + date + '[ \\t]*$', 'm');
  const m = text.match(re);
  if (m) {
    const after = text.slice(m.index + m[0].length);
    const end = after.search(/^## /m);
    return text.slice(0, m.index) + block + (end < 0 ? '' : after.slice(end));
  }
  // insert before the first day that is older, else append
  const days = [...text.matchAll(/^## (\d{4}-\d{2}-\d{2})[ \t]*$/gm)];
  const older = days.find(d => d[1] < date);
  if (older) return text.slice(0, older.index) + block + text.slice(older.index);
  const body = text.replace(/\s*$/, '');
  return body + '\n\n' + block;
}

async function punchLoad(date) {
  try {
    const f = app.vault.getAbstractFileByPath(PUNCH_FILE_());
    if (!f) return [];
    return punchReadDay(await app.vault.cachedRead(f), date);
  } catch (_e) { return []; }
}

async function punchSave(date, list) {
  const f = await punchDoc();
  const before = await app.vault.read(f);
  await app.vault.modify(f, punchWriteDay(before, date, list));
}

// Every logged day, newest first — one read instead of scanning every note.
async function punchAllDays() {
  const f = app.vault.getAbstractFileByPath(PUNCH_FILE_());
  if (!f) return [];
  let text = '';
  try { text = await app.vault.cachedRead(f); } catch (_e) { return []; }
  return [...text.matchAll(/^## (\d{4}-\d{2}-\d{2})[ \t]*$/gm)]
    .map(m => ({ date: m[1], list: punchReadDay(text, m[1]) }))
    .filter(d => d.list.length)
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ── Punch clock ─────────────────────────────────────────────────
// Wake / one button per activity / End, appended to V.PUNCH as
// `- HH:MM key [cat]` under that day's heading. Append-only: every press adds
// one line, so multiple blocks and multiple pauses need no paired state.
//
// The activity buttons ARE the start button — tapping a different one both
// closes the current block and opens the next, so switching costs one tap, the
// same as starting. Tapping the lit one stops it. That is deliberate: the
// previous per-category timers died because they demanded start/stop
// bookkeeping, not because labelling is hard.
//
// Nothing here is precious: the store is a plain list you can open and edit by
// hand, and Undo drops the last line for the ordinary case of a mis-tap.
const PUNCH_CATS = [
  { key: 'research', label: 'Research', color: 'var(--m-blue)',   bg: 'var(--blue-bg)',   fg: 'var(--blue-text)' },
  { key: 'work',     label: 'Work',     color: 'var(--m-yellow)', bg: 'var(--yellow-bg)', fg: 'var(--yellow-text)' },
  { key: 'social',   label: 'Social',   color: 'var(--m-purple)', bg: 'var(--purple-bg)', fg: 'var(--purple-text)' },
  { key: 'learning', label: 'Learning', color: 'var(--m-green)',  bg: 'var(--green-bg)',  fg: 'var(--green-text)' },
];
const PUNCH_CAT = k => PUNCH_CATS.find(c => c.key === k) || null;
const PUNCH_COLOR = k => (PUNCH_CAT(k) || {}).color || 'var(--blue)';

function parsePunch(text) {
  // Indent-anchored so the closing --- of the frontmatter is never eaten.
  const m = text.match(/^punch:[ \t]*\n((?:[ \t]+-[ \t]*.*\n?)*)/m);
  if (!m) return [];
  return m[1].split('\n')
    .map(l => l.match(/-\s*"?(\d{2}:\d{2})\s+(\w+)(?:\s+(\w+))?"?/))
    .filter(Boolean)
    .map(x => ({ at: x[1], key: x[2], cat: x[3] || '' }));
}

function writePunch(text, list) {
  const body = list.map(p => `  - "${p.at} ${p.key}${p.cat ? ' ' + p.cat : ''}"`).join('\n');
  const block = 'punch:\n' + body;
  if (/^punch:/m.test(text)) {
    return text.replace(/^punch:[ \t]*(?:\[\])?[ \t]*\n(?:[ \t]+-[ \t]*.*\n)*/m, block + '\n');
  }
  if (/^---\n[\s\S]*?\n---/.test(text)) {
    return text.replace(/^(---\n[\s\S]*?\n)(---)/, '$1' + block + '\n$2');
  }
  return '---\n' + block + '\n---\n\n' + text;
}

async function doPunch(key, cat) {
  try {
    const date = todayStr();
    const list = await punchLoad(date);
    const d = new Date();
    const at = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    const last = list.length ? list[list.length - 1] : null;
    const carried = punchCarriedRunning(await punchLoad(dayBefore(date)), list, hMins(at));

    // Each activity button is a toggle: lit means running, press it again and
    // it stops. The old Break button meant "pause" or "resume" depending on a
    // state you had to remember first — one control with two meanings is the
    // kind of friction that killed the previous two attempts at timing.
    let entry;
    if (key === 'in') {
      const runningCat = last && last.key === 'in' ? last.cat : carried;
      if (runningCat && runningCat === cat) {
        entry = { at, key: 'break', cat: '' };
      } else {
        // switching away from last night's session closes it first, so it stitches to midnight
        if (carried) list.push({ at, key: 'break', cat: '' });
        entry = { at, key: 'in', cat: cat || '' };
      }
    } else {
      entry = { at, key, cat: '' };
    }

    list.push(entry);
    await punchSave(date, list);
    const name = entry.key === 'in' ? (PUNCH_CAT(entry.cat) || {}).label || 'Start'
      : entry.key === 'wake' ? 'Wake'
      : entry.key === 'break' ? ((PUNCH_CAT(cat) || {}).label || 'Paused') + ' paused' : 'End';
    if (typeof Notice !== 'undefined') new Notice(name + ' · ' + at);
    loadPunch();
  } catch (e) {
    if (typeof Notice !== 'undefined') new Notice('Punch failed: ' + (e && e.message ? e.message : e));
  }
}

// Drops the most recent press. Mis-taps are common — the buttons sit on the
// home page — and re-deriving the fix by hand is out of proportion to the slip.
async function punchUndo() {
  try {
    const date = todayStr();
    const list = await punchLoad(date);
    if (!list.length) { if (typeof Notice !== 'undefined') new Notice('今天还没有打卡记录'); return; }
    const gone = list.pop();
    await punchSave(date, list);
    if (typeof Notice !== 'undefined')
      new Notice('已撤销 ' + gone.at + ' ' + gone.key + (gone.cat ? ' ' + gone.cat : ''));
    loadPunch();
    if ($('health-body')) renderHealth();
  } catch (e) {
    if (typeof Notice !== 'undefined') new Notice('撤销失败：' + (e && e.message ? e.message : e));
  }
}

// Jumps straight to a day's section of the log so a wrong block can be retyped.
function punchEdit(date) {
  try { app.workspace.openLinkText(PUNCH_FILE_() + '#' + (date || todayStr()), '', false); }
  catch (_e) { openVault(PUNCH_FILE_()); }
}

const lastActiveCat = list => {
  for (let i = list.length - 1; i >= 0; i--) if (list[i].key === 'in' && list[i].cat) return list[i].cat;
  return '';
};

async function loadPunch() {
  const row = $('punch-row'); if (!row) return;
  const list = await punchLoad(todayStr());
  const prevList = await punchLoad(dayBefore(todayStr()));
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
  const carried = punchCarriedRunning(prevList, list, nowMins);

  const last = list.length ? list[list.length - 1] : null;
  const running = last && last.key === 'in' ? last.cat : (carried || null);
  // Nothing is running: leave a dot on the one you stopped, so picking it back
  // up does not mean recalling what you were doing.
  const paused = running ? '' : lastActiveCat(list);
  const lastOf = k => { const h = list.filter(p => p.key === k); return h.length ? h[h.length - 1].at : ''; };
  const btn = (action, key, label, at, on, c, dot) =>
    `<button type="button" class="punch-btn${on ? ' punch-live' : ''}${dot ? ' punch-paused' : ''}" data-action="punch" data-key="${action}"${key ? ` data-cat="${key}"` : ''}` +
    `${on && c ? ` style="--punch-bg:${c.bg};--punch-fg:${c.fg}"` : ''}><span class="punch-l">${label}</span>${at ? `<span class="punch-t">${at}</span>` : ''}</button>`;

  const wake = lastOf('wake');
  const carry = punchCarry(prevList, list) || carried;
  const totals = punchTotals(list, carry);
  row.innerHTML =
    btn('wake', '', 'Wake', '', last && last.key === 'wake') +
    `<span class="punch-sep"></span>` +
    PUNCH_CATS.map(c => btn('in', c.key, c.label,
      totals.byCat[c.key] ? hFmt(totals.byCat[c.key]) : '',
      running === c.key, c, paused === c.key)).join('') +
    `<span class="punch-sep"></span>` +
    btn('out', '', 'End', '', last && last.key === 'out') +
    `<span class="punch-sum">${punchSummary(list, totals, carry)}</span>`;
}

// Every in→(break|out|other in) span, carrying the activity it belongs to.
// `carryCat` means the day opened mid-session because the day before ran past
// midnight; the span then starts at 00:00.
function punchSpans(list, carryCat) {
  const spans = [];
  let open = null, cat = '';
  if (carryCat) { open = '00:00'; cat = carryCat; }
  for (const p of list) {
    if (p.key === 'in') {
      if (open != null && p.cat !== cat) { spans.push([open, p.at, cat]); open = p.at; cat = p.cat; }
      else if (open == null) { open = p.at; cat = p.cat; }
    } else if (p.key === 'break' || p.key === 'out') {
      if (open != null) { spans.push([open, p.at, cat]); open = null; cat = ''; }
    }
  }
  return { spans, open, cat, mins: hMins };
}

// A session that runs past midnight is split at 24:00: the evening stays on
// the day it started, the rest is credited to the next day — what the calendar
// grid has to draw anyway. Punches are filed under the date the button was
// pressed, so the two halves sit in different sections of the punch document
// and have to be stitched back together here. The stitch happens when the next
// day closes the session: its first punch is Break or End, or — pressed before the
// button showed the session as running — the same activity again, with no Wake
// before it and within PUNCH_CARRY_MAX of the start. Anything else (an `in` left
// dangling overnight, followed by the morning's Wake) is a forgotten End, not an
// all-night shift, so it stays uncounted rather than billed to midnight.
const PUNCH_CARRY_MAX = 8 * 60;
// A clock time past midnight on the day a session started: 00:53 the next morning is 24:53.
function hPastMidnight(t) {
  const m = hMins(t) + 24 * 60;
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
}
// For display: 24:53 reads as 00:53⁺¹.
function hShow(t) {
  const m = hMins(t);
  if (m < 24 * 60) return t;
  return String(Math.floor(m / 60) - 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0') + '⁺¹';
}

function dayBefore(ds) {
  const d = new Date(String(ds) + 'T12:00:00');
  d.setDate(d.getDate() - 1);
  return dateKey(d);
}

// '' unless the previous day was still running at midnight AND this day opens
// by closing it.
function punchCarry(prevList, list) {
  if (!prevList || !prevList.length) return '';
  const { open, cat } = punchSpans(prevList);
  if (open == null) return '';
  const items = list || [];
  const idx = items.findIndex(p => p.key === 'in' || p.key === 'break' || p.key === 'out');
  if (idx < 0) return '';
  const first = items[idx];
  if (first.key !== 'in') return cat || 'other';
  const woke = items.slice(0, idx).some(p => p.key === 'wake');
  const elapsed = 24 * 60 - hMins(open) + hMins(first.at);
  return !woke && first.cat === cat && elapsed <= PUNCH_CARRY_MAX ? (cat || 'other') : '';
}

// Before anything is pressed today, a session still open at midnight is the one running —
// until Wake, or until it would be longer than PUNCH_CARRY_MAX.
function punchCarriedRunning(prevList, list, nowMins) {
  if (!prevList || !prevList.length || (list || []).length) return '';
  const { open, cat } = punchSpans(prevList);
  if (open == null || !cat) return '';
  return 24 * 60 - hMins(open) + nowMins <= PUNCH_CARRY_MAX ? cat : '';
}

// Spans for one day of a newest-first day list. A session that runs past midnight belongs
// wholly to the day it started: it ends there at e.g. 24:53, and the next day starts after it.
function punchDaySpans(days, i) {
  const cur = days[i]; if (!cur) return { spans: [], open: null, cat: '' };
  const prev = days[i + 1], next = days[i - 1];
  const carry = (prev && prev.date === dayBefore(cur.date)) ? punchCarry(prev.list, cur.list) : '';
  const r = punchSpans(cur.list, carry);
  if (carry) {
    if (r.spans.length && r.spans[0][0] === '00:00') r.spans.shift();
    else if (r.open === '00:00') { r.open = null; r.cat = ''; }
  }
  if (r.open != null && next && cur.date === dayBefore(next.date)) {
    const nextCarry = punchCarry(cur.list, next.list);
    const closed = nextCarry ? punchSpans(next.list, nextCarry).spans[0] : null;
    if (closed && closed[0] === '00:00') {
      r.spans.push([r.open, hPastMidnight(closed[1]), r.cat]);
      r.open = null; r.cat = '';
    }
  }
  return r;
}

// Today's totals. With carryCat, the part of last night's session after midnight is left
// out — it is credited to yesterday — though it still shows as running.
function punchTotals(list, carryCat) {
  const { spans, open, cat } = punchSpans(list, carryCat);
  const now = new Date().getHours() * 60 + new Date().getMinutes();
  const byCat = {}; let total = 0;
  const add = (c, m) => { if (m <= 0) return; byCat[c || 'other'] = (byCat[c || 'other'] || 0) + m; total += m; };
  spans.forEach(([s, e, c], i) => { if (!(carryCat && i === 0 && s === '00:00')) add(c, hMins(e) - hMins(s)); });
  if (open != null && !(carryCat && open === '00:00')) add(cat, now - hMins(open));
  return { byCat, total };
}

function punchSummary(list, totals, carryCat) {
  if (!list.length && !carryCat) return '';
  const t = totals || punchTotals(list, carryCat);
  const wake = list.find(p => p.key === 'wake');
  const { open } = punchSpans(list, carryCat);
  const out = [...list].reverse().find(p => p.key === 'out');
  return [wake ? 'up ' + wake.at : '', t.total ? 'tracked ' + hFmt(t.total) : '',
    open != null ? 'running' : (out ? 'ended ' + out.at : '')]
    .filter(Boolean).join('　·　');
}

// ── Health · rhythm ─────────────────────────────────────────────
// Plan comes from the schedule table you already wrote; actuals come from the
// `punch:` list in each daily note. The point is the gap between the two.
const HEALTH_PLAN_NOTE = V.SCHEDULE;
const HEALTH_DAYS = 60;   // fetched; each card slices the window it needs

let _planCache = null;
async function healthPlan() {
  if (_planCache) return _planCache;
  const out = [];
  try {
    const f = app.vault.getAbstractFileByPath(HEALTH_PLAN_NOTE);
    if (f) {
      const t = await app.vault.cachedRead(f);
      for (const line of t.split('\n')) {
        const m = line.match(/^\|\s*\*{0,2}(\d{1,2}:\d{2})(?:\s*[-–]\s*(\d{1,2}:\d{2}))?\*{0,2}\s*\|\s*\*{0,2}(.+?)\*{0,2}\s*\|/);
        if (!m || !m[2]) continue;
        const label = m[3].replace(/\*/g, '').trim();
        out.push({
          from: m[1].padStart(5, '0'), to: m[2].padStart(5, '0'), label,
          kind: /高强度|深潜|写作|deep work|focus|writing/i.test(label) ? 'focus' : /午休|睡|放松|运动|午餐|lunch|nap|sleep|relax|\brest\b|exercise|workout/i.test(label) ? 'rest' : 'other',
        });
      }
    }
  } catch (_e) {}
  _planCache = out;
  return out;
}

function hMins(t) { return +String(t).slice(0, 2) * 60 + +String(t).slice(3, 5); }
const hFmt = m => m < 60 ? m + 'm' : Math.floor(m / 60) + 'h' + (m % 60 ? String(m % 60).padStart(2, '0') : '');

// Every logged day, straight from the punch document.
async function healthDays(limit) {
  const raw = await punchAllDays();
  return raw.slice(0, limit).map((d, i) => {
    const { spans, open, cat } = punchDaySpans(raw, i);
    const wake = d.list.find(p => p.key === 'wake');
    const worked = spans.reduce((a, sp) => a + Math.max(0, hMins(sp[1]) - hMins(sp[0])), 0);
    return { date: d.date, path: dailyNotePath(d.date), list: d.list, spans, open, cat, wake: wake ? wake.at : '', worked };
  });
}

// The axis was hard-cropped at 06:00 because 00:00–06:00 was a quarter of the
// width and permanently empty. Sessions that run past midnight put real blocks
// down there, so the floor now follows the data: 06:00 on an ordinary week,
// lower when something actually starts before it. Anything clipped would be
// drawn off-grid and silently lost, which is worse than a taller chart.
const HZ_HI = 24 * 60;
let HZ_LO = 6 * 60;
let HZ_TICKS = [6, 9, 12, 15, 18, 21, 24];
const hzPct = t => Math.max(0, Math.min(100, ((hMins(t) - HZ_LO) / (HZ_HI - HZ_LO)) * 100));

function hzSetRange(days) {
  let lo = 6 * 60;
  for (const d of (days || [])) {
    for (const sp of (d.spans || [])) lo = Math.min(lo, hMins(sp[0]));
    if (d.wake) lo = Math.min(lo, hMins(d.wake));
  }
  HZ_LO = Math.max(0, Math.floor(lo / 60) * 60);
  HZ_TICKS = [];
  for (let h = HZ_LO / 60; h < 24; h += 3) HZ_TICKS.push(h);
  HZ_TICKS.push(24);
}

async function renderHealth() {
  const host = $('health-body'); if (!host) return;
  const plan = await healthPlan();
  const all = await healthDays(HEALTH_DAYS);
  const days = all.slice(0, 14);
  hzSetRange(days);

  const axis = HZ_TICKS.map(h =>
    `<span class="hz-tick" style="left:${((h * 60 - HZ_LO) / (HZ_HI - HZ_LO)) * 100}%">${h}</span>`).join('');
  // Schedule labels are prose, in Chinese or English; the chart wants a word.
  const PLAN_WORDS = [
    [/起床|淋浴|wake|shower/i, 'Wake'], [/散步|户外|walk/i, 'Walk'], [/早餐|breakfast/i, 'Breakfast'],
    [/高强度科研|深潜|deep work|focus/i, 'Deep work'], [/高强度工作|写作|writing/i, 'Deep work 2'],
    [/杂务|admin|email/i, 'Admin'], [/午餐|lunch/i, 'Lunch'], [/午休|闭目|nap/i, 'Nap'],
    [/波谷|琐碎|shallow|errands/i, 'Shallow'], [/运动|有氧|exercise|workout/i, 'Exercise'],
    [/放松与交流|交流|social|friends/i, 'Social'], [/娱乐|咖啡馆|练字|leisure|reading/i, 'Leisure'], [/入睡|睡眠|sleep|bed/i, 'Sleep'],
  ];
  const planShort = label => {
    for (const [re, word] of PLAN_WORDS) if (re.test(label)) return word;
    return label.replace(/[（(][^）)]*[）)]/g, '').split(/[：:]/).pop().trim().slice(0, 5);
  };
  const planRow = plan.filter(p => hMins(p.to) > HZ_LO).map(p => {
    const w = hzPct(p.to) - hzPct(p.from);
    const name = planShort(p.label) || p.label.slice(0, 4);
    return `<span class="hz-pblk hz-${p.kind}" style="left:${hzPct(p.from)}%;width:${w}%" title="${esc(p.from + '–' + p.to + '  ' + p.label)}">` +
      (w > 6.5 ? `<b>${esc(name)}</b>${w > 10 ? `<i>${p.from}–${p.to}</i>` : ''}` : '') + `</span>`;
  }).join('');

  if (!days.length) {
    host.innerHTML = `<div class="card rp-card"><div class="card-title">Today</div>
      <div class="hz-axis">${axis}</div><div class="hz-big"></div>
      <div class="rp-empty">还没有打卡记录。到首页按 Wake / Research / Work / Social / Learning。</div></div>`;
    return;
  }

  const donut = (mins, total) => {
    const R = 26, C = 2 * Math.PI * R;
    let at = 0;
    const arcs = PUNCH_CATS.concat([{ key: 'other', label: 'Untagged', color: 'var(--m-grey)', bg: 'var(--bg4)', fg: 'var(--text3)' }])
      .filter(c => mins[c.key]).map(c => {
        const frac = mins[c.key] / total;
        const seg = `<circle class="hz-arc" r="${R}" cx="34" cy="34" stroke="${c.color}"` +
          ` stroke-dasharray="${(frac * C).toFixed(2)} ${C.toFixed(2)}"` +
          ` stroke-dashoffset="${(-at * C).toFixed(2)}"><title>${esc(c.label)} ${hFmt(mins[c.key])}</title></circle>`;
        at += frac;
        return seg;
      }).join('');
    return `<svg class="hz-donut" viewBox="0 0 68 68" role="img">` +
      `<circle r="${R}" cx="34" cy="34" class="hz-arc hz-arc-bg"></circle>${arcs}` +
      `<text x="34" y="34" class="hz-dnum">${total ? hFmt(total) : '—'}</text>` +
      `<text x="34" y="44" class="hz-dlab">tracked</text></svg>`;
  };

  const catMins = spans => { const o = {}; for (const [s, e, c] of spans) o[c || 'other'] = (o[c || 'other'] || 0) + Math.max(0, hMins(e) - hMins(s)); return o; };
  const chip = (c, m) => `<span class="hz-chip" style="background:${c.bg || 'var(--bg4)'};color:${c.fg || 'var(--text3)'}">${esc(c.label)} ${hFmt(m)}</span>`;

  // ── today, full size, blocks labelled in place ──
  const today = days.find(d => d.date === todayStr());
  const nowHM = () => { const n = new Date(); return String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0'); };
  const tLive = (today && today.open != null && hMins(nowHM()) > hMins(today.open)) ? [today.open, nowHM(), today.cat] : null;
  const tSpans = today ? (tLive ? today.spans.concat([tLive]) : today.spans) : [];
  const blocks = tSpans.map(([s, e, c]) => {
    const cat = PUNCH_CAT(c) || { label: 'Untagged', bg: 'var(--bg4)', fg: 'var(--text3)' };
    const w = hzPct(e) - hzPct(s);
    const live = tLive && tLive[0] === s && tLive[1] === e;
    return `<span class="hz-blk${live ? ' hz-live' : ''}" style="left:${hzPct(s)}%;width:${w}%;background:${cat.bg};color:${cat.fg}" title="${esc(cat.label + ' ' + s + '–' + hShow(e) + (live ? ' · running' : ''))}">` +
      (w > 8 ? `<b>${esc(cat.label)}</b><i>${s}–${hShow(e)}</i>` : '') + `</span>`;
  }).join('');
  const tCats = catMins(tSpans);
  const tTotal = Object.values(tCats).reduce((a, b) => a + b, 0);
  const tOut = today ? [...today.list].reverse().find(p => p.key === 'out') : null;
  const tEnd = tOut ? tOut.at : '';
  const mark = (at, arrow, label) =>
    `<span class="hz-mk" style="left:${hzPct(at)}%" title="${esc(label + ' ' + at)}"><i>${arrow}</i></span>`;
  const marks = (today && today.wake ? mark(today.wake, '↑', 'Wake') : '') +
    (tEnd ? mark(tEnd, '↓', 'End') : '');
  const todayCard = `<div class="card rp-card">
    <div class="card-title">Today <span class="card-sub">${today ? esc(today.date) : '还没打卡'}</span>
      <span class="hz-acts"><span class="hz-act" data-action="punch-undo">↩ Undo</span><span class="hz-act" data-action="punch-edit" data-date="${esc(todayStr())}">✎ Edit log</span></span></div>
    <div class="hz-todaywrap">
      <div class="hz-donutwrap">${donut(tCats, tTotal)}</div>
      <div class="hz-todayline">
        <div class="hz-axis">${axis}</div>
        <div class="hz-planline"><span class="hz-rowlab">plan</span><span class="hz-planrow">${planRow}</span></div>
        <div class="hz-bigline"><span class="hz-rowlab">actual</span><div class="hz-big">${blocks}${marks}</div></div>
        <div class="hz-chips">${PUNCH_CATS.filter(c => tCats[c.key]).map(c => chip(c, tCats[c.key])).join('')
          || '<span class="hz-note">今天还没有记录</span>'}</div>
      </div>
    </div>
  </div>`;

  // ── this week: hours down the side, days across ──
  // Hours down the side, one column per day,每块按真实起止定位 — the shape
  // Toggl uses, because a stacked bar loses *when* the work happened.
  const wkToday = new Date();
  const wkMon = new Date(wkToday);
  wkMon.setDate(wkToday.getDate() - ((wkToday.getDay() + 6) % 7));
  const wkKey = dt => dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
  const wkIndex = {};
  for (const d of all) wkIndex[d.date] = d;
  const wkDays = Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(wkMon); dt.setDate(wkMon.getDate() + i);
    const key = wkKey(dt);
    return wkIndex[key] || { date: key, spans: [], worked: 0, list: [], wake: '', path: dailyNotePath(key) };
  });
  const wkRange = wkDays[0].date.slice(5).replace('-', '/') + ' – ' + wkDays[6].date.slice(5).replace('-', '/');
  const WK_H = 26;   // px per hour
  const wkHours = []; for (let h = HZ_LO / 60; h < HZ_HI / 60; h++) wkHours.push(h);
  // the grid ends at 24:00; a session past midnight is drawn to there and labelled with its real end
  const wkTop = t => ((Math.min(hMins(t), HZ_HI) - HZ_LO) / 60) * WK_H;
  const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const weekCard = `<div class="card rp-card">
    <div class="card-title">This week
      <span class="card-sub">${wkRange}　·　total ${hFmt(wkDays.reduce((a, d) => a + d.worked, 0))}</span></div>
    <div class="hz-cal" style="--wkh:${WK_H}px">
      <div class="hz-calgut">
        <div class="hz-calhd"></div>
        ${wkHours.map(h => `<div class="hz-calhr">${h}:00</div>`).join('')}
      </div>
      ${wkDays.map(d => {
        const dt = new Date(d.date + 'T00:00');
        const blocks = d.spans.map(([s2, e2, c2]) => {
          const cat = PUNCH_CAT(c2) || { label: 'Untagged', bg: 'var(--bg4)', fg: 'var(--text3)' };
          const top = wkTop(s2), hgt = Math.max(14, wkTop(e2) - top);
          return `<div class="hz-cale" style="top:${top}px;height:${hgt}px;background:${cat.bg};color:${cat.fg}"` +
            ` title="${esc(cat.label + ' ' + s2 + '–' + hShow(e2))}">` +
            `<b>${esc(cat.label)}</b>` +
            (hgt > 34 ? `<i>${s2}–${hShow(e2)}</i>` : '') +
            (hgt > 52 ? `<u>${hFmt(hMins(e2) - hMins(s2))}</u>` : '') + `</div>`;
        }).join('');
        const isToday = d.date === todayStr();
        return `<div class="hz-calday${isToday ? ' hz-caltoday' : ''}${d.spans.length ? '' : ' hz-calempty'}" data-action="open-vault" data-path="${esc(d.path)}">` +
          `<div class="hz-calhd"><b>${dt.getDate()}</b><span>${DOW[dt.getDay()]}</span>` +
          `<em>${d.worked ? hFmt(d.worked) : '—'}</em></div>` +
          `<div class="hz-calbody">${wkHours.map(() => '<div class="hz-calrow"></div>').join('')}${blocks}</div></div>`;
      }).join('')}
    </div>
  </div>`;
  // One row per day carrying both the shape of the day and its numbers —
  // the strip and the table were two views of the same thing.
  const LOG_DAYS = 14;
  const logIndex = {};
  for (const d of all) logIndex[d.date] = d;
  const logWindow = Array.from({ length: LOG_DAYS }, (_, i) => {
    const dt = new Date(); dt.setDate(dt.getDate() - i);
    const key = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
    return logIndex[key] || { date: key, spans: [], worked: 0, list: [], wake: '', path: dailyNotePath(key) };
  });
  const logRows = logWindow.map(d => {
    const first = d.spans.length ? d.spans[0][0] : '';
    const last = d.spans.length ? d.spans[d.spans.length - 1][1] : '';
    const gross = d.spans.length ? hMins(last) - hMins(first) : 0;
    const brk = gross > d.worked ? gross - d.worked : 0;
    const bars = d.spans.map(([s2, e2, c2]) =>
      `<span class="hz-sb" style="left:${hzPct(s2)}%;width:${hzPct(e2) - hzPct(s2)}%;background:${(PUNCH_CAT(c2) || {}).color || 'var(--m-grey)'}" title="${esc((PUNCH_CAT(c2) || {}).label || '')} ${s2}–${hShow(e2)}"></span>`).join('');
    return `<div class="hz-lrow${d.spans.length ? '' : ' hz-lempty'}" data-action="punch-edit" data-date="${esc(d.date)}" title="${esc(d.date)} · 打开记录改这一天">
      <span class="hz-ld">${d.date.slice(5).replace('-', '/')}</span>
      <span class="hz-strack">${bars}</span>
      <span class="hz-lw">${d.wake || '—'}</span>
      <span class="hz-lr">${first || '—'}${last ? '→' + hShow(last) : ''}</span>
      <span class="hz-lt">${d.worked ? hFmt(d.worked) : '—'}</span>
      <span class="hz-lb">${brk ? hFmt(brk) : '—'}</span>
    </div>`;
  }).join('');
  const logCard = `<div class="card rp-card">
    <div class="card-title">Daily log <span class="card-sub">last ${LOG_DAYS} days　·　${logWindow.filter(d => d.spans.length).length} logged</span></div>
    <div class="hz-axis hz-axis-sub">${axis}</div>
    <div class="hz-lrow hz-lhead"><span class="hz-ld"></span><span class="hz-strack hz-nobg"></span>
      <span class="hz-lw">wake</span><span class="hz-lr">span</span><span class="hz-lt">worked</span><span class="hz-lb">break</span></div>
    ${logRows}</div>`;
  // ── metrics, grouped rather than a flat row of seven ──
  const wakes = days.filter(d => d.wake).map(d => hMins(d.wake));
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  const sd = a => a.length < 2 ? 0 : Math.sqrt(mean(a.map(v => (v - mean(a)) ** 2)));
  const clock = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(Math.round(m % 60)).padStart(2, '0');
  const focus = plan.filter(p => p.kind === 'focus');
  const DEEP = ['research', 'work'];
  let inFocus = 0, switches = 0;
  const byCat = {};
  for (const d of days) {
    for (const [s, e, c] of d.spans) {
      const a = hMins(s), b = hMins(e);
      byCat[c || 'other'] = (byCat[c || 'other'] || 0) + Math.max(0, b - a);
      if (DEEP.includes(c)) for (const f of focus)
        inFocus += Math.max(0, Math.min(b, hMins(f.to)) - Math.max(a, hMins(f.from)));
    }
    for (let i = 1; i < d.spans.length; i++)
      if (d.spans[i][2] && d.spans[i][2] !== d.spans[i - 1][2]) switches++;
  }
  const focusAvail = focus.reduce((a, f) => a + (hMins(f.to) - hMins(f.from)), 0) * days.length;
  const lags = days.filter(d => d.wake && d.spans.length).map(d => hMins(d.spans[0][0]) - hMins(d.wake)).filter(v => v >= 0);
  const wd = [], we = [];
  for (const d of days) { if (!d.wake) continue; const dow = new Date(d.date + 'T00:00').getDay(); (dow === 0 || dow === 6 ? we : wd).push(hMins(d.wake)); }
  const jet = (wd.length && we.length) ? Math.abs(mean(we) - mean(wd)) : null;
  const workedDays = days.filter(d => d.worked);

  // oldest → newest so the line reads left to right like a calendar
  const series = days.slice().reverse();
  const focusPerDay = focus.reduce((a, f) => a + (hMins(f.to) - hMins(f.from)), 0) || 1;
  const spark = vals => {
    const pts = vals.filter(v => v != null);
    if (pts.length < 3) return '';
    const lo = Math.min(...pts), hi = Math.max(...pts), rng = (hi - lo) || 1;
    const step = 100 / Math.max(1, vals.length - 1);
    let dPath = '', prev = null;
    vals.forEach((v, i) => {
      if (v == null) { prev = null; return; }
      const x = (i * step).toFixed(1), y = (16 - ((v - lo) / rng) * 14).toFixed(1);
      dPath += (prev == null ? 'M' : 'L') + x + ' ' + y + ' ';
      prev = v;
    });
    return `<svg class="rp-spark" viewBox="0 0 100 18" preserveAspectRatio="none"><path d="${dPath.trim()}"/></svg>`;
  };
  const dayDeep = d => {
    let m = 0;
    for (const [s2, e2, c2] of d.spans) if (DEEP.includes(c2))
      for (const f of focus) m += Math.max(0, Math.min(hMins(e2), hMins(f.to)) - Math.max(hMins(s2), hMins(f.from)));
    return Math.round(m / focusPerDay * 100);
  };

  const stat = (v, l, k, sp) => `<div class="rp-stat${k ? ' rp-stat-key' : ''}"><div class="rp-stat-v">${v}</div>` +
    `${sp || ''}<div class="rp-stat-l">${l}</div></div>`;
  const stats =
    stat(focusAvail ? Math.round(inFocus / focusAvail * 100) + '%' : '—', 'Golden hours used', true, spark(series.map(dayDeep))) +
    stat(workedDays.length ? hFmt(Math.round(mean(workedDays.map(d => d.worked)))) : '—', 'Avg / day', false, spark(series.map(d => d.worked || 0))) +
    stat(wakes.length ? clock(mean(wakes)) : '—', 'Avg wake', false, spark(series.map(d => d.wake ? hMins(d.wake) : null))) +
    stat(wakes.length > 1 ? '±' + Math.round(sd(wakes)) + 'm' : '—', 'Wake spread') +
    stat(lags.length ? Math.round(mean(lags)) + 'm' : '—', 'Wake → start', false,
      spark(series.map(d => (d.wake && d.spans.length) ? hMins(d.spans[0][0]) - hMins(d.wake) : null))) +
    stat(days.length ? (switches / days.length).toFixed(1) : '—', 'Switches / day', false,
      spark(series.map(d => d.spans.filter((sp, i) => i && sp[2] && sp[2] !== d.spans[i - 1][2]).length))) +
    stat(jet == null ? '—' : Math.round(jet) + 'm', 'Social jetlag');

  const HZ_PERIODS = [['day', 'Today', 1], ['week', 'Week', 7], ['month', 'Month', 30]];
  const pKey = ['day', 'week', 'month'].includes(String(LS('hz_period', 'week'))) ? String(LS('hz_period', 'week')) : 'week';
  const pDays = all.slice(0, (HZ_PERIODS.find(p => p[0] === pKey) || [, , 7])[2]);
  const pCat = {};
  for (const d of pDays) for (const [s2, e2, c2] of d.spans)
    pCat[c2 || 'other'] = (pCat[c2 || 'other'] || 0) + Math.max(0, hMins(e2) - hMins(s2));
  const pTotal = Object.values(pCat).reduce((a, b) => a + b, 0) || 1;
  const pTabs = HZ_PERIODS.map(([k, lbl]) =>
    `<span class="kpi-tab${pKey === k ? ' active' : ''}" data-action="hz-period" data-p="${k}">${lbl}</span>`).join('');
  const catTotal = pTotal;
  const catRows = PUNCH_CATS.concat([{ key: 'other', label: 'Untagged', color: 'var(--m-grey)', bg: 'var(--bg4)', fg: 'var(--text3)' }])
    .filter(c => pCat[c.key]).sort((a, b) => pCat[b.key] - pCat[a.key])
    .map(c => `<div class="hz-splitrow"><span class="hz-splitl">${esc(c.label)}</span>` +
      `<span class="hz-splitbar"><i style="width:${Math.round(pCat[c.key] / catTotal * 100)}%;background:${c.color}"></i></span>` +
      `<span class="hz-splitv">${hFmt(pCat[c.key])}</span>` +
      `<span class="hz-splitp">${Math.round(pCat[c.key] / catTotal * 100)}%</span></div>`).join('');

  host.innerHTML = `
    <div class="rp-stats">${stats}</div>
    ${todayCard}
    ${weekCard}

    <div class="card rp-card">
      <div class="card-title">Where the time went <span class="card-sub">${pTabs}</span></div>
      <div class="hz-split">${catRows || '<div class="rp-empty">还没有分类记录。</div>'}</div>
    </div>
    ${logCard}`;

  // When a past-midnight session drags the axis down to 00:00 the grid opens on
  // six empty hours. Scroll it to the first block instead — the早间 rows stay
  // reachable, they just are not what you look at first.
  if (HZ_LO < 6 * 60) {
    const cal = host.querySelector('.hz-cal');
    if (cal) {
      const firstBlk = wkDays.reduce((a, d) => d.spans.length ? Math.min(a, hMins(d.spans[0][0])) : a, 6 * 60);
      cal.scrollTop = Math.max(0, ((Math.min(firstBlk, 6 * 60) - HZ_LO) / 60) * WK_H - WK_H / 2);
    }
  }
}

// ─ Health · Daily check-ins (driven by daily-note frontmatter) ──
// Read habits from daily-note frontmatter (exercise / speech_practice booleans)


function weekKeys() {
  // Mon→Sun of current week
  const now = new Date();
  const dow = (now.getDay()+6)%7; // Mon=0
  const mon = new Date(now); mon.setDate(mon.getDate()-dow);
  const out = [];
  for (let i=0; i<7; i++) { const d=new Date(mon); d.setDate(mon.getDate()+i); out.push(dateKey(d)); }
  return out;
}



// ─ Writing delta (real char/word count vs. day's baseline) ──────
async function loadWritingDelta() {
  const TARGET_FOLDERS = [V.PHD_PAPER, V.ACADEMIC];
  const files = [];
  for (const folder of TARGET_FOLDERS) {
    const F = app.vault.getAbstractFileByPath(folder);
    if (!F || !F.children) continue;
    const walk = (n) => {
      if (n.children) n.children.forEach(walk);
      else if (n.path && n.path.endsWith('.md')) files.push(n);
    };
    walk(F);
  }
  let total = 0;
  for (const f of files) {
    try {
      const txt = await app.vault.cachedRead(f);
      // strip frontmatter
      const body = txt.replace(/^---[\s\S]*?---\n?/, '');
      // Chinese chars + English words
      const cn = (body.match(/[一-龥]/g)||[]).length;
      const en = (body.match(/\b[A-Za-z][A-Za-z'-]*\b/g)||[]).length;
      total += cn + en;
    } catch(_e){}
  }
  // baseline at first load of the day
  const t = todayStr();
  const baselines = LS('writing_baselines', {});
  if (baselines[t] == null) { baselines[t] = total; LSS('writing_baselines', baselines); }
  const rawDelta = Math.max(0, total - baselines[t]);
  // Guard: a corpus jump >8000 words in one session almost certainly means a
  // bulk import or sync flood — reset the baseline and report 0 so
  // the frontmatter is never polluted by non-writing events.
  let delta = rawDelta;
  if (rawDelta > 8000) {
    baselines[t] = total; LSS('writing_baselines', baselines);
    delta = 0;
    console.warn('[db26] Writing delta spike detected (' + rawDelta + ' words) — baseline reset, recording 0.');
  }
  window._db26_writingDelta = delta;
  await autoBumpQuantFrontmatter();
}

// ─ Auto-write quantitative fields into today's Daily Note frontmatter ─
// Runs on dashboard load. Only bumps fields upward — never overwrites a
// higher manual value, and never sets a bool back from true to false.
async function autoBumpQuantFrontmatter() {
  const today = todayStr();
  const f = app.vault.getAbstractFileByPath(V.DAILY + '/' + today + '.md');
  if (!f) return; // skip if no daily note yet today

  // papers_read = files created today under V.LIT
  let papersCount = 0;
  const litFolder = app.vault.getAbstractFileByPath(V.LIT);
  if (litFolder) {
    const walk = (n) => {
      if (n.children) n.children.forEach(walk);
      else if (n.path && n.path.endsWith('.md') && n.stat) {
        if (dateKey(new Date(n.stat.ctime)) === today) papersCount++;
      }
    };
    walk(litFolder);
  }

  // speech_practice = any file created today under V.PRACTICE
  let practiceFound = false;
  const pracFolder = app.vault.getAbstractFileByPath(V.PRACTICE);
  if (pracFolder) {
    const walk = (n) => {
      if (practiceFound) return;
      if (n.children) n.children.forEach(walk);
      else if (n.path && n.path.endsWith('.md') && n.stat) {
        if (dateKey(new Date(n.stat.ctime)) === today) practiceFound = true;
      }
    };
    walk(pracFolder);
  }

  // manuscript_words = writing delta from loadWritingDelta
  const delta = Number(window._db26_writingDelta) || 0;

  // Skip the write entirely when nothing would change — processFrontMatter always
  // rewrites the file, and this runs on every dashboard open (sync churn).
  const cache = app.metadataCache.getFileCache(f)?.frontmatter || {};
  const wouldChange =
    papersCount > (Number(cache.papers_read)||0) ||
    delta > (Number(cache.manuscript_words)||0) ||
    (practiceFound && cache.speech_practice !== true);
  if (!wouldChange) return;

  try {
    await app.fileManager.processFrontMatter(f, fm => {
      if (papersCount > (Number(fm.papers_read)||0))     fm.papers_read = papersCount;
      if (delta > (Number(fm.manuscript_words)||0))       fm.manuscript_words = delta;
      if (practiceFound && fm.speech_practice !== true)   fm.speech_practice = true;
    });
  } catch(e) { console.error('autoBumpQuantFrontmatter failed:', e); }
}


// ═══ Question Pool — all questions live in one Markdown document ══
const QPOOL_PATH = V.QUESTION;
const _qFilter = 'active';   // no switch any more
const _qDaysBetween = (a,b) => Math.floor((new Date(String(b).slice(0,10))-new Date(String(a).slice(0,10)))/86400000);

function parseQuestionPool(content){
  const records=[];
  const seqByDate={};
  const parts=String(content||'').split(/^##\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\s*$/gm);
  for(let i=1;i<parts.length;i+=2){
    const created=parts[i], block=parts[i+1]||'';
    const meta=block.match(/<small>\s*status:\s*([^|<]+?)\s*\|\s*area:\s*([^<]+?)\s*<\/small>/i);
    const questionMatch=block.match(/^❓\s*(.+)$/m);
    const resultMatch=block.match(/^\s*(?:-\s*)?(?:✍️|💡|➡️)\s*(.*?)(?:\s+·\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}))?\s*$/m);
    if(!questionMatch) continue;
    const date=created.slice(0,10), seq=(seqByDate[date]||0)+1; seqByDate[date]=seq;
    const id='Q'+date+'-'+String(seq).padStart(3,'0');
    const status=meta?meta[1].trim():'open', result=resultMatch?resultMatch[1].trim():'';
    records.push({
      kind:'q', id, path:QPOOL_PATH,
      status, area:meta?meta[2].trim():'Academic', created,
      resolved:resultMatch&&resultMatch[2]?resultMatch[2]:null,
      question:questionMatch[1].trim(), answer:status==='answered'?result:''
    });
  }
  return records;
}

function questionPoolBody(records){
  const head='---\ntype: question-pool\nupdated: '+todayStr()+'\n---\n\n# Question\n\n> 按提出时间排列。状态与领域以小字显示；`❓` 是问题；缩进的 `- ✍️` 是回答；`➡️` 是转任务结果。\n\n';
  const sorted=[...records].sort((a,b)=>String(a.created).localeCompare(String(b.created)));
  return head+sorted.map(q=>{
    const result=q.status==='converted'?'Today':String(q.answer||'').replace(/[\r\n]+/g,' ');
    const resultLine=q.status==='converted' ? `\n\n➡️ ${result}${q.resolved?' · '+q.resolved:''}` : result ? `\n\n  - ✍️ ${result}${q.resolved?' · '+q.resolved:''}` : '';
    return `## ${q.created||todayStr()+' 00:00'}\n\n<small>status: ${q.status||'open'} | area: ${q.area||'Academic'}</small>\n\n❓ ${String(q.question||'').replace(/[\r\n]+/g,' ')}${resultLine}\n`;
  }).join('\n');
}

async function ensureQuestionPoolFile(){
  return ensureVaultFile(QPOOL_PATH, questionPoolBody([]), V.CAPTURE);
}

async function readQuestionPool(){
  const f=await ensureQuestionPoolFile();
  return {file:f, records:parseQuestionPool(await app.vault.read(f))};
}

async function writeQuestionPool(file,records){
  await app.vault.modify(file,questionPoolBody(records));
}

async function updateQuestionRecord(id,updater){
  const {file,records}=await readQuestionPool();
  const q=records.find(x=>x.id===id); if(!q) return null;
  updater(q);
  await writeQuestionPool(file,records);
  return q;
}

const questionLink=q=>`[[${QPOOL_PATH}|${q.question}]]`;

// Append a back-linked bullet into a day's Daily Note `## ❓ Questions`.
async function logQuestionToDaily(line, dateStr) {
  const ds = dateStr || todayStr();
  const f = (ds===todayStr()) ? await ensureTodayDaily() : dailyFile(ds);
  if (!f) return;
  try { await appendToSection(f, '❓ Questions', line); } catch(e){ console.error('[db26 logQuestionToDaily]', e); }
}

async function addQuestion(text) {
  const clean=String(text||'').replace(/[\r\n]+/g,' ').trim(); if(!clean) return;
  const today=todayStr(), now=new Date(), hh=pad(now.getHours()), mm=pad(now.getMinutes());
  const {file,records}=await readQuestionPool();
  const used=records.filter(q=>q.id.startsWith('Q'+today+'-')).map(q=>Number(q.id.slice(-3))||0);
  const seq=(used.length?Math.max(...used):0)+1;
  const qid = 'Q'+today+'-'+String(seq).padStart(3,'0');
  const q={kind:'q',id:qid,path:QPOOL_PATH,status:'open',area:_addTaskArea,created:today+' '+hh+':'+mm,resolved:null,question:clean,answer:''};
  records.push(q); await writeQuestionPool(file,records);
  await logQuestionToDaily(`- ${hh}:${mm} · ❓ ${questionLink(q)}`, today);
  setTimeout(loadPool, 200);
}

// Cycle a question's area (same areas as Today): Academic → Work → Learning → Reflection.
async function cycleQuestionArea(id) {
  await updateQuestionRecord(id,q=>{ q.area=AREA_ORDER[(AREA_ORDER.indexOf(q.area)+1)%AREA_ORDER.length]||'Academic'; });
  setTimeout(loadPool, 120);
}

// Fill / edit the answer → marks resolved (binary) + back-links today's Daily Note.
async function answerQuestion(id) {
  const {records}=await readQuestionPool(), old=records.find(q=>q.id===id); if(!old) return;
  const cur=String(old.answer||'');
  const ans = await db26Prompt("Answer (links back to today's Daily Note):", cur);
  if (ans==null || !ans.trim()) return;
  const today = todayStr(), isNew = !cur.trim(), now=new Date(), resolvedStamp=today+' '+pad(now.getHours())+':'+pad(now.getMinutes());
  const q=await updateQuestionRecord(id,x=>{ x.answer=ans.replace(/[\r\n]+/g,' ').trim(); x.status='answered'; if(!x.resolved)x.resolved=resolvedStamp; });
  if (isNew){
    const hh=pad(new Date().getHours()), mm=pad(new Date().getMinutes());
    await logQuestionToDaily(`- ${hh}:${mm} · ✅ ${questionLink(q)} → ${ans.trim().slice(0,60)}`, today);
  }
  if (typeof Notice!=='undefined') new Notice("Answered · linked to today's Daily Note ✓");
  setTimeout(loadPool, 200);
}

// Promote a question into a Today task (no popup, like Someday → Today), using its own area.
async function convertQuestion(id) {
  const {records}=await readQuestionPool(), old=records.find(q=>q.id===id); if(!old) return;
  const area=AREA_ORDER.includes(old.area)?old.area:'Academic', taskText=old.question;
  try { await addVaultTask(area, taskText); } catch(e){ console.error('[db26 convertQuestion]', e); }
  const now=new Date(), resolvedStamp=todayStr()+' '+pad(now.getHours())+':'+pad(now.getMinutes());
  const q=await updateQuestionRecord(id,x=>{ x.status='converted'; if(!x.resolved)x.resolved=resolvedStamp; });
  const hh=pad(new Date().getHours()), mm=pad(new Date().getMinutes());
  await logQuestionToDaily(`- ${hh}:${mm} · ➡️ ${questionLink(q)} → #${area} ${taskText.slice(0,50)}`, todayStr());
  if (typeof Notice!=='undefined') new Notice('Added to Today · '+area+' ✓');
  setTimeout(loadPool, 200);
}

async function deleteQuestion(id) {
  const {file,records}=await readQuestionPool(), q=records.find(x=>x.id===id); if(!q) return;
  if(!(await db26Confirm('Delete this question?\n\n'+q.question))) return;
  await writeQuestionPool(file,records.filter(x=>x.id!==id));
  setTimeout(loadQuestions, 150);
}

// ═══ Capture Pool — Question + Someday unified into one card ═══
const POOL_MODES = [
  {kind:'q', lbl:'❓ question', c:'var(--blue)'},
  {kind:'w', lbl:'someday',  c:'var(--orange)'},
];
let _poolMode = Number(LS('pool_mode', 0)) || 0;
function cyclePoolKind(){ _poolMode=(_poolMode+1)%POOL_MODES.length; LSS('pool_mode',_poolMode); loadPool(); }
function initPoolInput(){
  const inp=$('pool-add-input'); if(!inp || inp.dataset.bound) return; inp.dataset.bound='1';
  inp.addEventListener('keydown', e=>{ if(e.key!=='Enter') return; e.preventDefault();
    const v=inp.value.trim(); if(!v) return; inp.value='';
    const m=POOL_MODES[_poolMode]||POOL_MODES[0];
    if(m.kind==='w') addWishItem(v); else addQuestion(v);
  });
}

function renderPoolQuestion(it, today){
  const title = esc(it.question);
  const area = AREA_ORDER.includes(it.area) ? it.area : 'Academic';
  const aColor = AREA_COLOR[area] || 'var(--text4)';
  const ansLine = it.answer ? `<div style="flex-basis:100%;font-size:12px;color:var(--text3);padding-left:20px;line-height:1.45;margin-top:1px">↳ ${esc(it.answer)}</div>` : '';
  if (it.status==='open'){
    const age=Math.max(0,_qDaysBetween(it.created,today));
    return `<div class="vt-row">
      <div class="vt-dot" data-action="q-cycle-area" data-id="${esc(it.id)}" style="background:${aColor}" title="${area} · click to change area"></div>
      <div class="vt-label" data-action="open-vault" data-path="${QPOOL_PATH}" title="open Question document"><span style="color:var(--text4);font-size:11px">❓</span> ${title}</div>
      <span class="vt-age${age>=7?' aged':''}">${age}d</span>
      <div class="vt-promote" data-action="q-answer" data-id="${esc(it.id)}" title="write answer">✍️</div>
      <div class="vt-promote" data-action="q-convert" data-id="${esc(it.id)}" title="Add to today">→</div>
      <div class="vt-del" data-action="q-delete" data-id="${esc(it.id)}" title="delete" style="color:var(--text4);font-size:13px;padding:1px 5px;cursor:pointer">×</div>
    </div>`;
  }
  const resolvedLabel = it.resolved ? 'Done '+String(it.resolved).slice(5) : 'Done';
  return `<div class="vt-row" style="flex-wrap:wrap">
    <div class="vt-dot" data-action="q-cycle-area" data-id="${esc(it.id)}" style="background:${aColor};opacity:.45" title="${area} · click to change area"></div>
    <div class="vt-label" data-action="open-vault" data-path="${QPOOL_PATH}" title="open Question document"><span style="color:var(--green);font-size:11px">✓</span> ${title}</div>
    <span class="vt-age">${esc(resolvedLabel)}</span>
    <div class="vt-promote" data-action="q-answer" data-id="${esc(it.id)}" title="edit answer">✍️</div>
    <div class="vt-del" data-action="q-delete" data-id="${esc(it.id)}" title="delete" style="color:var(--text4);font-size:13px;padding:1px 5px;cursor:pointer">×</div>
    ${ansLine}
  </div>`;
}
function renderPoolWish(it, today){
  const wishText=String(it.text||'').replace(/^\s*💡\s*/, '');
  const latestNote=it.notes&&it.notes.length?it.notes[it.notes.length-1]:null;
  const noteLine=latestNote?`<div style="flex-basis:100%;font-size:12px;color:var(--text3);padding-left:20px;line-height:1.45;margin-top:1px">↳ ${esc(latestNote.stamp)} · ${esc(latestNote.text)}</div>`:'';
  if (it.status==='open'){
    const age=Math.max(0,_qDaysBetween(it.created,today));
    return `<div class="vt-row" style="flex-wrap:wrap">
      <div class="vt-check" data-action="wish-complete" data-line="${it.line}" title="done"></div>
      <div class="vt-label" data-action="wish-edit" data-line="${it.line}" title="edit">${esc(wishText)}</div>
      <span class="vt-age${age>=7?' aged':''}">${age}d</span>
      <div class="vt-promote" data-action="wish-note" data-line="${it.line}" title="add timestamped note">✍️</div>
      <div class="vt-promote" data-action="wish-promote" data-line="${it.line}" title="Add to today">→</div>
      <div class="vt-del" data-action="wish-delete" data-line="${it.line}" title="delete" style="color:var(--text4);font-size:13px;padding:1px 5px;cursor:pointer">×</div>
      ${noteLine}
    </div>`;
  }
  const resolvedLabel = it.resolved ? 'Done '+String(it.resolved).slice(5) : 'Done';
  return `<div class="vt-row" style="flex-wrap:wrap">
    <div class="vt-check" data-action="wish-uncomplete" data-line="${it.line}" title="reopen" style="background:var(--text);border-color:var(--text);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px">✓</div>
    <div class="vt-label" style="text-decoration:line-through;color:var(--text4)">${esc(wishText)}</div>
    <span class="vt-age">${esc(resolvedLabel)}</span>
    <div class="vt-promote" data-action="wish-note" data-line="${it.line}" title="add timestamped note">✍️</div>
    <div class="vt-del" data-action="wish-delete" data-line="${it.line}" title="delete" style="color:var(--text4);font-size:13px;padding:1px 5px;cursor:pointer">×</div>
    ${noteLine}
  </div>`;
}

async function loadPool(){
  const box = $('pool-list'); if (!box) return;
  const mode = POOL_MODES[_poolMode] || POOL_MODES[0];
  const tg = $('pool-kind-toggle');
  if (tg){ tg.textContent = mode.lbl; tg.style.color='#fff'; tg.style.background=mode.c; tg.style.borderColor=mode.c; }
  const pin = $('pool-add-input'); if (pin) pin.placeholder = '';
  const today = todayStr();
  let qs=[];
  try { qs=(await readQuestionPool()).records; } catch(e){ console.error('[db26 loadPool q]', e); }
  let ws=[];
  try {
    const wf = app.vault.getAbstractFileByPath(WISH_PATH);
    if (wf){
      const content = await app.vault.cachedRead(wf);
      const wlines = content.split('\n');
      wlines.forEach((ln,idx)=>{
        const m = ln.match(WISH_RE); if(!m) return;
        const notes=[];
        for(let j=idx+1;j<wlines.length;j++){
          const nm=wlines[j].match(WISH_NOTE_RE);
          if(nm){ notes.push({stamp:nm[1],text:nm[2].trim()}); continue; }
          break;
        }
        ws.push({ kind:'w', line:idx, text:m[3].trim(),
          status:(m[1].toLowerCase()==='x')?'done':'open', created:m[2], resolved:m[4]?(m[4]+(m[5]?' '+m[5]:'')):null, notes });
      });
    }
  } catch(e){ console.error('[db26 loadPool w]', e); }
  const isActive = it => it.status==='open';
  const yesterday = yesterdayStr();
  const isYesterdayDone = it => !isActive(it) && String(it.resolved||'').slice(0,10)===yesterday;
  let items = qs.concat(ws);
  if (_qFilter==='active')    items = items.filter(isActive);
  else if (_qFilter==='done') items = items.filter(isYesterdayDone);
  else                        items = items.filter(it=>isActive(it)||isYesterdayDone(it));
  items.sort((a,b)=>{
    const aa=isActive(a), ba=isActive(b);
    if (aa!==ba) return aa?-1:1;
    if (aa) return a.created<b.created?-1:1;
    return (b.resolved||'')<(a.resolved||'')?-1:1;
  });
  if (!items.length){ box.innerHTML='<div class="vt-empty" style="padding:8px 4px;color:var(--text4);font-size:13px">'+(_qFilter==='active'?'Nothing open. Add a question above, or switch to someday.':_qFilter==='done'?'昨日没有完成项；更早记录保留在源文档中。':'Empty.')+'</div>'; return; }
  box.innerHTML = items.map(it=> it.kind==='q' ? renderPoolQuestion(it,today) : renderPoolWish(it,today)).join('');
}

// Legacy entry-points now refresh the unified pool card.
function loadQuestions(){ return loadPool(); }
function loadWishlist(){ return loadPool(); }

// ─ Navigation ───────────────────────────────────────────────────
const DASHBOARD_VIEW_KEY='db26_current_view';
const DASHBOARD_SCROLL_PREFIX='db26_scroll_';
let _currentDashboardView='dashboard';
function dashboardLocalGet(key,fallback){
  try{return JSON.parse(lsGet(key))??fallback;}catch(_e){return fallback;}
}
function dashboardLocalSet(key,value){
  try{lsSet(key,JSON.stringify(value));}catch(_e){}
}
function dashboardScrollHost(){
  return dv.container.closest('.markdown-preview-view')
    ||dv.container.closest('.view-content')
    ||document.scrollingElement;
}
function rememberDashboardScroll(){
  const host=dashboardScrollHost();
  if(host) dashboardLocalSet(DASHBOARD_SCROLL_PREFIX+_currentDashboardView,Number(host.scrollTop)||0);
}
function switchView(name,navEl) {
  rememberDashboardScroll();
  dv.container.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  dv.container.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const v=$('view-'+name);
  if(!v) name='dashboard';
  const targetView=$('view-'+name); if(targetView) targetView.classList.add('active');
  const targetNav=navEl||dv.container.querySelector('.nav-item[data-view="'+name+'"]');
  if(targetNav) targetNav.classList.add('active');
  _currentDashboardView=name;
  dashboardLocalSet(DASHBOARD_VIEW_KEY,name);
  // Lazy-load each tab's content on first switch
  try {
    if      (name==='projects')   loadProjectActivity();
    else if (name==='english')    loadEnglish();
    else if (name==='writing')    loadWriting();
    else if (name==='time')       renderHealth();
    else if (name==='literature') loadLiterature();
    else if (name==='reading')    loadWeread();
  } catch(e) { console.error('[db26 switchView] '+name+' failed:', e); }
  const savedY=Number(dashboardLocalGet(DASHBOARD_SCROLL_PREFIX+name,0))||0;
  [80,350].forEach(delay=>setTimeout(()=>{
    const host=dashboardScrollHost();
    if(host) host.scrollTop=savedY;
  },delay));
}
function restoreDashboardView(){
  const saved=String(dashboardLocalGet(DASHBOARD_VIEW_KEY,'dashboard')||'dashboard');
  const valid=dv.container.querySelector('.nav-item[data-view="'+saved+'"]')?saved:'dashboard';
  _currentDashboardView=valid;
  switchView(valid,dv.container.querySelector('.nav-item[data-view="'+valid+'"]'));
  const host=dashboardScrollHost();
  if(host&&!host.dataset.db26ScrollBound){
    host.dataset.db26ScrollBound='1';
    host.addEventListener('scroll',()=>{
      const active=String(dashboardLocalGet(DASHBOARD_VIEW_KEY,'dashboard')||'dashboard');
      dashboardLocalSet(DASHBOARD_SCROLL_PREFIX+active,Number(host.scrollTop)||0);
    },{passive:true});
  }
}

// ── SINGLE CLICK DELEGATE (stops Obsidian intercepting clicks) ──
const _root = dv.container.querySelector('#db26') || dv.container;
_root.addEventListener('click', e => {
    const taskRow=e.target.closest('.today-task,.project-card-task,.project-activity-task-block,.project-activity-event,.vt-row');
    _root.querySelectorAll('.task-actions-visible').forEach(row=>{if(row!==taskRow) row.classList.remove('task-actions-visible');});
    if(taskRow&&!e.target.closest('[data-action="delete-vault-task"],.vt-del,.project-card-delete')) taskRow.classList.add('task-actions-visible');
    const t = e.target.closest('[data-action]');
    if (!t) return;
    e.preventDefault();
    e.stopPropagation();
    const a = t.dataset.action;
    if      (a==='wr-new')         wrNew(t.dataset.kind);
    else if (a.startsWith('wt-'))  wtAction(a, t);
    else if (a==='en-do')          enPractise(t.dataset.slot, t.dataset.down === '1');
    else if (a==='en-keep')        enKeep();
    else if (a==='punch')          doPunch(t.dataset.key, t.dataset.cat);
    else if (a==='punch-undo')     punchUndo();
    else if (a==='punch-edit')     punchEdit(t.dataset.date);
    else if (a==='hz-period')      { LSS('hz_period', t.dataset.p); renderHealth(); }
    else if (a==='rp-books')       { LSS('rp_books', Number(t.dataset.n)); loadReadingProfile(); }
    else if (a==='zot-sync')       zotSync();
    else if (a==='lit-mode')       setLitMode(t.dataset.mode);
    else if (a==='lit-tag')        setLitTag(t.dataset.tag);
    else if (a==='lit-copy-essays') litCopyEssays();
    else if (a==='lit-build')      litWriteCollections(false);
    else if (a==='nav')            switchView(t.dataset.view, dv.container.querySelector('.nav-item[data-view="'+t.dataset.view+'"]'));
    else if (a==='qa')             quickAction(t.dataset.key);
    else if (a==='complete-vault-task') completeVaultTask(t.dataset.path, t.dataset.line, t.dataset.text);
    else if (a==='uncomplete-vault-task') uncompleteVaultTask(t.dataset.path, t.dataset.line);
    else if (a==='edit-vault-task')     startInlineEdit(t, val=>writeTaskText(t.dataset.path, t.dataset.line, val));
    else if (a==='edit-task-note')      editTaskNote(t.dataset.path, t.dataset.line, t.dataset.note);
    else if (a==='cancel-vault-task')   cancelVaultTask(t.dataset.path, t.dataset.line, t.dataset.text);
    else if (a==='delete-vault-task')   deleteVaultTask(t.dataset.path, t.dataset.line);
    else if (a==='attach-task-ref')     attachTaskRef(t.dataset.path,t.dataset.line);
    else if (a==='remove-task-ref')     removeTaskRef(t.dataset.path,t.dataset.line,t.dataset.ref);
    else if (a==='cycle-add-context')   cycleAddTaskContext();
    else if (a==='cycle-task-context')  cycleTaskContext(t.dataset.path,t.dataset.line,t.dataset.current);
    else if (a==='schedule-task')       scheduleTask(t.dataset.path,t.dataset.line);
    else if (a==='project-activity-select') { _projectActivitySelected=t.dataset.project; LSS('project_activity_selected',_projectActivitySelected); loadProjectActivity(); }
    else if (a==='project-activity-add') addProjectActivityRecord();
    else if (a==='project-activity-add-task') addProjectActivityTask();
    else if (a==='project-rollup-period') { _projectRollupPeriod=t.dataset.period; LSS('project_rollup_period',_projectRollupPeriod); renderProjectRollup(); }
    else if (a==='open-task-doc')       openTaskDoc(t.dataset.path, t.dataset.line);
    else if (a==='wish-complete')       wishComplete(t.dataset.line);
    else if (a==='wish-uncomplete')     wishUncomplete(t.dataset.line);
    else if (a==='wish-delete')         wishDelete(t.dataset.line);
    else if (a==='wish-promote')        promoteWish(t.dataset.line);
    else if (a==='wish-edit')           startInlineEdit(t, val=>writeWishText(t.dataset.line, val));
    else if (a==='wish-note')           addWishNote(t.dataset.line);
    else if (a==='waiting-complete')    waitingComplete(t.dataset.line);
    else if (a==='waiting-uncomplete')  waitingUncomplete(t.dataset.line);
    else if (a==='waiting-edit')        startInlineEdit(t,val=>writeWaitingText(t.dataset.line,val));
    else if (a==='waiting-note')        addWaitingNote(t.dataset.line);
    else if (a==='waiting-delete')      waitingDelete(t.dataset.line);
    else if (a==='cycle-pool-kind')     cyclePoolKind();
    else if (a==='q-cycle-area')        cycleQuestionArea(t.dataset.id);
    else if (a==='q-answer')            answerQuestion(t.dataset.id);
    else if (a==='q-convert')           convertQuestion(t.dataset.id);
    else if (a==='q-delete')            deleteQuestion(t.dataset.id);
    else if (a==='add-countdown')       addCountdown();
    else if (a==='countdown-delete')    deleteCountdown(t.dataset.line);
    else if (a==='open-vault')     openVault(t.dataset.path);
});

// Knowledge map lives inside the Dashboard, alongside Reading.
// ── 文件预览 · three-pane vault browser ──────────────────────────
// Left: top-level folders, auto-discovered and ordered by last activity,
// with a pinned "recent" bucket. Middle: what is in the selection, newest
// first. Right: the first lines of the picked file, so you can tell what a
// note is without opening it.
const FB_COLD_DAYS = 90;
const FB_RECENT = ' recent';

function initKnowledgeMap() {
  const mount = dv.container.querySelector('#knowledge-map-mount');
  if (!mount) return;
  mount.replaceChildren();
  const root = mount.createDiv({ cls: 'fb' });
  root.innerHTML = `
    <div class="fb-search"><span class="fb-search-i">&#9906;</span><input type="text" class="fb-search-in" placeholder="Search all notes…"><span class="fb-search-n"></span></div>
    <div class="fb-grid">
      <div class="fb-col fb-left"><div class="fb-h">Folders</div><div class="fb-left-body"></div></div>
      <div class="fb-col fb-mid"><div class="fb-h fb-midhead"><span class="fb-crumb"></span><button type="button" class="fb-new">+ Note</button></div><div class="fb-mid-body"></div></div>
      <div class="fb-col fb-right"><div class="fb-h">Preview</div><div class="fb-right-body"></div></div>
    </div>`;

  const $q = s => root.querySelector(s);
  const leftBody = $q('.fb-left-body'), midBody = $q('.fb-mid-body'), rightBody = $q('.fb-right-body');
  const crumb = $q('.fb-crumb'), input = $q('.fb-search-in'), searchN = $q('.fb-search-n');

  const isFolder = e => Array.isArray(e?.children);
  const label = e => String(e?.basename ?? e?.name ?? '').replace(/^\d+[_ .-]+/, '').replace(/_/g, ' ') || String(e?.name || '');
  const ago = ms => {
    if (!ms) return '';
    const d = Math.floor((Date.now() - ms) / 864e5);
    return d <= 0 ? 'today' : d === 1 ? 'yesterday' : d < 30 ? d + 'd' : d < 365 ? Math.floor(d / 30) + 'mo' : Math.floor(d / 365) + 'y';
  };

  // md descendants of a folder — count and freshness in one pass
  const statOf = f => {
    let n = 0, last = 0;
    const walk = e => {
      for (const c of (e.children || [])) {
        if (c.name.startsWith('.')) continue;
        if (isFolder(c)) walk(c);
        else if (c.extension === 'md') { n++; last = Math.max(last, c.stat?.mtime || 0); }
      }
    };
    walk(f);
    return { n, last };
  };

  let tops = [], selected = FB_RECENT, trail = [], picked = null, coldOpen = false, query = '';

  const readTops = () => (app.vault.getRoot().children || [])
    .filter(e => isFolder(e) && !e.name.startsWith('.'))
    .map(f => ({ f, ...statOf(f) }))
    .filter(x => x.n > 0)
    .sort((a, b) => b.last - a.last);

  const recentFiles = (limit = 40) => app.vault.getMarkdownFiles()
    .filter(f => !f.path.startsWith('.'))
    .sort((a, b) => (b.stat?.mtime || 0) - (a.stat?.mtime || 0))
    .slice(0, limit);

  function renderLeft() {
    leftBody.replaceChildren();
    const cut = Date.now() - FB_COLD_DAYS * 864e5;
    const hot = tops.filter(t => t.last >= cut), cold = tops.filter(t => t.last < cut);

    const row = (key, name, count, when, cls) => {
      const b = leftBody.createDiv({ cls: 'fb-f' + (cls ? ' ' + cls : '') + (selected === key ? ' on' : '') });
      b.createSpan({ cls: 'fb-fn', text: name });
      b.createSpan({ cls: 'fb-fc', text: count == null ? '' : String(count) });
      b.createSpan({ cls: 'fb-fd', text: when || '' });
      b.onclick = () => { selected = key; trail = []; picked = null; query = ''; input.value = ''; render(); };
      return b;
    };

    row(FB_RECENT, 'Recent', recentFiles().length, '', 'fb-pin');
    leftBody.createDiv({ cls: 'fb-sep' });
    for (const t of hot) row(t.f.path, label(t.f), t.n, ago(t.last));

    if (cold.length) {
      const head = leftBody.createDiv({ cls: 'fb-fold', text: (coldOpen ? '▾' : '▸') + ' Inactive · ' + cold.length });
      head.onclick = () => { coldOpen = !coldOpen; renderLeft(); };
      if (coldOpen) for (const t of cold) row(t.f.path, label(t.f), t.n, ago(t.last), 'fb-dim');
    }
  }

  function midItems() {
    if (query) {
      const q = query.toLowerCase();
      return app.vault.getMarkdownFiles()
        .filter(f => f.basename.toLowerCase().includes(q))
        .sort((a, b) => (b.stat?.mtime || 0) - (a.stat?.mtime || 0))
        .slice(0, 200)
        .map(f => ({ e: f, when: f.stat?.mtime || 0, where: f.parent?.path || '' }));
    }
    if (selected === FB_RECENT) {
      return recentFiles().map(f => ({ e: f, when: f.stat?.mtime || 0, where: f.parent?.path || '' }));
    }
    const path = trail.length ? trail[trail.length - 1] : selected;
    const dir = app.vault.getAbstractFileByPath(path);
    if (!isFolder(dir)) return [];
    return dir.children
      .filter(e => !e.name.startsWith('.') && (isFolder(e) || e.extension === 'md'))
      .map(e => {
        if (!isFolder(e)) return { e, when: e.stat?.mtime || 0 };
        const s = statOf(e);
        return { e, n: s.n, when: s.last };
      })
      .sort((a, b) => b.when - a.when);
  }

  function renderMid() {
    midBody.replaceChildren();
    const items = midItems();

    if (query) crumb.textContent = 'Search: ' + query;
    else if (selected === FB_RECENT) crumb.textContent = 'Recently modified';
    else {
      const parts = [selected].concat(trail.slice(1));
      crumb.textContent = parts.map(p => label(app.vault.getAbstractFileByPath(p) || { name: p.split('/').pop() })).join(' / ');
    }

    // No breadcrumb to climb while a search is showing whole-vault results.
    if (!query && trail.length > 1) {
      const back = midBody.createDiv({ cls: 'fb-i fb-back', text: '‹ Back' });
      back.onclick = () => { trail.pop(); render(); };
    }

    if (!items.length) { midBody.createDiv({ cls: 'fb-empty', text: query ? 'No match' : 'No notes here' }); return; }

    for (const it of items) {
      const folder = isFolder(it.e);
      const r = midBody.createDiv({ cls: 'fb-i' + (folder ? ' fb-isdir' : '') + (folder && !it.n ? ' fb-dim' : '') + (picked && picked.path === it.e.path ? ' on' : '') });
      r.createSpan({ cls: 'fb-ic', text: folder ? '/' : '·' });
      r.createSpan({ cls: 'fb-in', text: folder ? label(it.e) : it.e.basename });
      if (folder) r.createSpan({ cls: 'fb-ib', text: String(it.n) });
      else if (it.where && (query || selected === FB_RECENT)) r.createSpan({ cls: 'fb-ip', text: it.where.split('/')[0] });
      r.createSpan({ cls: 'fb-id', text: ago(it.when) });
      r.onclick = () => {
        if (folder) { if (!trail.length) trail = [selected]; trail.push(it.e.path); picked = null; render(); }
        else { picked = it.e; renderMid(); renderRight(); }
      };
    }
  }

  // The right pane is a real reader/editor: rendered markdown by default,
  // a textarea on demand. Edits are written straight back to the file, so a
  // pending save must be flushed before we ever swap files.
  let editing = false, loadedText = '', saveTimer = null, savingFor = null;

  async function flushSave() {
    if (!saveTimer) return;
    clearTimeout(saveTimer); saveTimer = null;
    if (savingFor) { const { file, text } = savingFor; savingFor = null; await writeNote(file, text); }
  }

  async function writeNote(file, text) {
    if (text === loadedText) return true;
    try {
      // Someone else changed it since we loaded — don't clobber their edit.
      const onDisk = await app.vault.read(file);
      if (onDisk !== loadedText && onDisk !== text) {
        if (typeof Notice !== 'undefined') new Notice('Changed elsewhere — not overwritten. Reopen it.');
        return false;
      }
      await app.vault.modify(file, text);
      loadedText = text;
      return true;
    } catch (e) {
      if (typeof Notice !== 'undefined') new Notice('保存失败：' + (e && e.message ? e.message : e));
      return false;
    }
  }

  async function renderRight() {
    await flushSave();
    rightBody.replaceChildren();
    if (!picked) { rightBody.createDiv({ cls: 'fb-empty', text: 'Pick a file to read or edit it here' }); return; }
    const f = picked;

    rightBody.createDiv({ cls: 'fb-pt', text: f.basename });
    rightBody.createDiv({ cls: 'fb-pm', text: (f.parent?.path || '') + '　·　' + ago(f.stat?.mtime) });

    const bar = rightBody.createDiv({ cls: 'fb-pbar' });
    const toggle = bar.createEl('button', { cls: 'fb-pbtn', text: editing ? 'Done' : 'Edit' });
    const state = bar.createSpan({ cls: 'fb-pstate' });
    const open = bar.createSpan({ cls: 'fb-pa', text: 'Open in Obsidian →' });
    open.onclick = async ev => {
      await flushSave();
      try { app.workspace.openLinkText(f.path, '', ev.ctrlKey || ev.metaKey); } catch (_e) {}
    };

    const body = rightBody.createDiv({ cls: 'fb-pb' });
    body.setText('Loading…');

    let text = '';
    try { text = await app.vault.read(f); }
    catch (_e) { body.setText('Read failed'); return; }
    if (picked !== f) return;                       // a newer pick won the race
    loadedText = text;

    toggle.onclick = () => { editing = !editing; renderRight(); };

    if (!editing) {
      body.replaceChildren();
      body.addClass('markdown-rendered');
      try {
        const ob = zotRequire('obsidian');
        const MR = ob.MarkdownRenderer;
        if (MR && MR.render) await MR.render(app, text, body, f.path, dv.component || new ob.Component());
        else if (MR && MR.renderMarkdown) await MR.renderMarkdown(text, body, f.path, dv.component);
        else throw new Error('no renderer');
      } catch (_e) {
        body.removeClass('markdown-rendered');
        body.setText(text);                          // plain text beats nothing
      }
      return;
    }

    body.replaceChildren();
    body.removeClass('markdown-rendered');
    const ta = body.createEl('textarea', { cls: 'fb-pta' });
    ta.value = text;
    ta.addEventListener('input', () => {
      state.textContent = 'Unsaved…';
      savingFor = { file: f, text: ta.value };
      clearTimeout(saveTimer);
      saveTimer = setTimeout(async () => {
        saveTimer = null;
        const payload = savingFor; savingFor = null;
        if (!payload) return;
        const ok = await writeNote(payload.file, payload.text);
        state.textContent = ok ? 'Saved ' + new Date().toLocaleTimeString() : 'Not saved';
      }, 700);
    });
    ta.addEventListener('blur', flushSave);
    ta.focus();
  }

  function render() { renderLeft(); renderMid(); renderRight(); }

  // Quick note: a blank, date-named file dropped into whatever folder the
  // middle column is currently showing (Inbox when that is "最近" or a search).
  const FB_NEW_FALLBACK = V.INBOX;
  async function newQuickNote() {
    const dir = (!query && selected !== FB_RECENT)
      ? (trail.length ? trail[trail.length - 1] : selected)
      : FB_NEW_FALLBACK;
    const d = new Date();
    const stamp = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    let name = stamp + ' · 速记', path = dir + '/' + name + '.md', i = 1;
    while (app.vault.getAbstractFileByPath(path)) { i++; name = stamp + ' · 速记 ' + i; path = dir + '/' + name + '.md'; }
    try {
      await app.vault.create(path, '');
      await app.workspace.openLinkText(path, '', false);
      tops = readTops();
      if (!query && selected !== FB_RECENT) render();
    } catch (e) {
      if (typeof Notice !== 'undefined') new Notice('新建失败：' + (e && e.message ? e.message : e));
    }
  }
  root.querySelector('.fb-new').addEventListener('click', newQuickNote);

  let timer = null;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => { query = input.value.trim(); picked = null; renderMid(); renderRight(); }, 140);
  });

  tops = readTops();
  searchN.textContent = app.vault.getMarkdownFiles().length + ' 篇';
  render();
}

// ── INIT ────────────────────────────────────────────────────────
const _safe = (label, fn) => { try { fn(); } catch(e){ console.error('[db26 init] '+label+' failed:', e); } };

// Start the cross-device state read in the background. Dataview may dispose async
// callbacks while it refreshes during Obsidian startup, so first paint must not
// depend on this promise. LS() already provides a localStorage fallback.
loadStateFromVault().catch(e => console.error('[db26] background state load failed:', e));
{
  // Hydrate from the fast local cache for first paint. Once the vault state finishes
  // loading, subsequent reads and writes automatically use _stateCache.
  _addTaskArea = LS('add_task_area','Learning');
  _addTaskContext = LS('add_task_context','personal:'+_addTaskArea);
  _projectActivitySelected = LS('project_activity_selected', ACTIVE_PROJECT_BOARD_IDS[0] || '');
  const legacyActivityIds = PB.legacyIds || {};
  _projectActivitySelected=legacyActivityIds[_projectActivitySelected]||_projectActivitySelected;
  _projectRollupPeriod = String(LS('project_rollup_period','30'));
  _poolMode = Number(LS('pool_mode',0)) || 0;
  // Keep the memoised project/daily-note caches fresh when the vault changes.
  try {
    const bustProjects = f => { if (V_HOME_TAIL.test(String(f?.path||f||''))) invalidateProjectTargets(); };
    const bustDaily = f => { if (String(f?.path||f||'').startsWith(V.DAILY + '/')) invalidateDailyPages(); };
    for (const ev of ['create','delete','rename']) {
      dv.component?.registerEvent(app.vault.on(ev, f => { bustProjects(f); bustDaily(f); }));
    }
    dv.component?.registerEvent(app.metadataCache.on('changed', f => { bustProjects(f); bustDaily(f); }));
  } catch (_e) {}
  // Phase 2: render everything that may depend on synced state
  _safe('initHero',         () => initHero());
  _safe('buildHeatmap',     () => setTimeout(buildHeatmap, 0));
  _safe('loadVaultTasks',   () => loadVaultTasks());
  _safe('loadHomeProjectTimeline', () => loadHomeProjectTimeline().catch(e=>console.error('[db26 home project timeline]',e)));
  _safe('loadPool',         () => loadPool());
  _safe('initPoolInput',    () => initPoolInput());
  _safe('loadWaiting',      () => loadWaiting());
  _safe('loadCountdown',    () => loadCountdown());
  _safe('initTaskInputs',   () => initTaskInputs());
  _safe('buildQuickLinks',  () => buildQuickLinks());
  _safe('loadWeread',       () => loadWeread());
  _safe('initKnowledgeMap', () => initKnowledgeMap());
  _safe('loadPunch', () => loadPunch());
  _safe('loadWritingDelta', () => loadWritingDelta());
  _safe('restoreDashboardView', () => setTimeout(restoreDashboardView, 0));
}

// Flush any pending state writes before tab closes
const _flushStateBeforeUnload = () => {
  if (_stateDirty && _stateCache) {
    try { app.vault.adapter.write(STATE_PATH, JSON.stringify(_stateCache)); } catch(_e){}
  }
};
try {
  dv.component?.registerDomEvent(window, 'beforeunload', _flushStateBeforeUnload);
} catch (_e) {
  window.addEventListener('beforeunload', _flushStateBeforeUnload);
  try { dv.component?.register(() => window.removeEventListener('beforeunload', _flushStateBeforeUnload)); } catch (_e2) {}
}
