// ═══════════════════════════════════════════════
//  app_v2_additions.js
//  Settings · Current Affairs · Bookmarks
//  Smart Review (SRS) · Full Syllabus
//  Question language switching (EN/HI)
// ═══════════════════════════════════════════════

// ── PAGE META additions ───────────────────────
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (typeof PAGE_META !== 'undefined') {
      PAGE_META.syllabus      = { title:'Full Syllabus',    sub:'Paper 1 · Paper 2 · Paper 3 — Complete MPPSC Coverage' };
      PAGE_META.bookmarkspage = { title:'Bookmarks',        sub:'Your saved questions' };
      PAGE_META.currentaffairs= { title:'Current Affairs',  sub:'Daily updates — National · MP · International' };
      PAGE_META.settings      = { title:'Settings',         sub:'Language, notifications, and more' };
    }
    renderSyllabus();
    renderCurrentAffairs();
    renderBookmarks();
    _updateBookmarkBadge();
  }, 600);
});

// ══════════════════════════════════════════════
//  QUESTION LANGUAGE SWITCHING
// ══════════════════════════════════════════════

// Returns the correct question pool based on q_lang setting
// app.js calls Q directly — this patches it so Hindi works
function getActiveQPool() {
  const ql = localStorage.getItem('q_lang') || 'en';
  if (ql === 'hi' && typeof Q_HI !== 'undefined' && Q_HI.length) return Q_HI;
  return typeof Q !== 'undefined' ? Q : [];
}

// Patch: when Hindi is selected and a PYQ paper is launched,
// use the Hi version if available. Called from app.js renderPYQ/startTest.
function getActivePYQPool(varName) {
  const ql = localStorage.getItem('q_lang') || 'en';
  const hiVar = varName + '_HI';
  if (ql === 'hi' && typeof window[hiVar] !== 'undefined') return window[hiVar];
  return typeof window[varName] !== 'undefined' ? window[varName] : [];
}

// ══════════════════════════════════════════════
//  BOOKMARKS
// ══════════════════════════════════════════════
function _getBookmarks() {
  try { return JSON.parse(localStorage.getItem('mppsc_bookmarks') || '[]'); } catch { return []; }
}
function _saveBookmarks(bms) {
  localStorage.setItem('mppsc_bookmarks', JSON.stringify(bms));
  _updateBookmarkBadge();
}
function _updateBookmarkBadge() {
  const bms = _getBookmarks();
  const badge = document.getElementById('bookmark-count-badge');
  if (badge) {
    badge.textContent = bms.length;
    badge.style.display = bms.length ? 'inline-flex' : 'none';
  }
  const total = document.getElementById('bookmark-total-count');
  if (total) total.textContent = bms.length + ' saved';
}

// Called from quiz question screen bookmark button
function toggleQBookmark() {
  if (typeof appState === 'undefined' || !appState.pool) return;
  const m = appState.pool[appState.cur];
  if (!m) return;
  const bms = _getBookmarks();
  const idx = bms.findIndex(b => b.q === m.q);
  const btn = document.getElementById('btn-bookmark');
  if (idx >= 0) {
    bms.splice(idx, 1);
    if (btn) { btn.style.background = '#FFF7ED'; btn.style.color = '#D97706'; }
    if (typeof showToast === 'function') showToast('Bookmark removed', '#64748B');
  } else {
    bms.push({ q: m.q, o: m.o, a: m.a, c: m.c || '', e: m.e || '', saved: Date.now() });
    if (btn) { btn.style.background = '#FCD34D'; btn.style.color = '#92400E'; }
    if (typeof showToast === 'function') showToast('🔖 Bookmarked!', '#D97706');
  }
  _saveBookmarks(bms);
}

// Update bookmark button state when rendering a question
function updateBookmarkBtnState() {
  if (typeof appState === 'undefined' || !appState.pool) return;
  const m = appState.pool[appState.cur];
  if (!m) return;
  const bms = _getBookmarks();
  const isBookmarked = bms.some(b => b.q === m.q);
  const btn = document.getElementById('btn-bookmark');
  if (btn) {
    btn.style.background = isBookmarked ? '#FCD34D' : '#FFF7ED';
    btn.style.color = isBookmarked ? '#92400E' : '#D97706';
  }
}

function renderBookmarks() {
  const list = document.getElementById('bookmarks-list');
  const total = document.getElementById('bookmark-total-count');
  if (!list) return;
  const bms = _getBookmarks();
  if (total) total.textContent = bms.length + ' saved';
  if (!bms.length) {
    list.innerHTML = '<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px">No bookmarks yet.<br>Tap 🔖 while answering any question to save it here.</div>';
    return;
  }
  const LABS = ['A','B','C','D'];
  list.innerHTML = bms.map((b, i) => `
    <div style="padding:14px 0;border-bottom:1px solid var(--border)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px">
        <div style="font-size:13px;font-weight:600;color:var(--text);line-height:1.5;flex:1">${b.q}</div>
        <button onclick="removeBookmark(${i})" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:16px;flex-shrink:0;padding:0">🗑</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:8px">
        ${(b.o||[]).map((opt,j) => `
          <div style="font-size:12px;padding:5px 10px;border-radius:7px;background:${j===b.a?'#ECFDF5':'var(--bg)'};color:${j===b.a?'#166534':'var(--muted)'};border:1px solid ${j===b.a?'#6EE7B7':'var(--border)'}">
            ${LABS[j]}) ${opt} ${j===b.a?'✓':''}
          </div>`).join('')}
      </div>
      ${b.e ? `<div style="font-size:11px;color:var(--muted);background:var(--bg);border-radius:7px;padding:7px 10px;border-left:3px solid var(--navy)">${b.e}</div>` : ''}
      <div style="font-size:10px;color:var(--muted);margin-top:6px">${b.c||''} · Saved ${new Date(b.saved).toLocaleDateString('en-IN')}</div>
    </div>`).join('');
}

function removeBookmark(idx) {
  const bms = _getBookmarks();
  bms.splice(idx, 1);
  _saveBookmarks(bms);
  renderBookmarks();
}

function clearAllBookmarks() {
  if (!confirm('Clear all bookmarks?')) return;
  _saveBookmarks([]);
  renderBookmarks();
  if (typeof showToast === 'function') showToast('All bookmarks cleared', '#64748B');
}

// ══════════════════════════════════════════════
//  CURRENT AFFAIRS
// ══════════════════════════════════════════════

// Static current affairs data — add new items here each month
// Format: { title, desc, tag:'national'|'mp'|'international', date }
const CURRENT_AFFAIRS_DATA = [
  { title:'Election Commission announces MP Urban Body Elections 2026', desc:'The Election Commission of India has announced dates for urban local body elections across Madhya Pradesh, covering 16 municipal corporations and 86 municipalities.', tag:'mp', date:'March 2026' },
  { title:'India GDP Growth Rate Q3 FY2026', desc:'India\'s GDP grew at 7.2% in Q3 FY2026, maintaining its position as the world\'s fastest-growing major economy. The services sector led growth at 8.1%.', tag:'national', date:'March 2026' },
  { title:'MP Budget 2026-27 Highlights', desc:'Chief Minister Mohan Yadav presented a ₹3.65 lakh crore budget for MP, with focus on infrastructure, agriculture and education. 35% increase in education allocation.', tag:'mp', date:'March 2026' },
  { title:'India signs trade agreement with ASEAN nations', desc:'India has signed an enhanced trade and investment framework with ASEAN nations, expected to boost bilateral trade to $300 billion by 2030.', tag:'international', date:'February 2026' },
  { title:'MPPSC 2026 Prelims Notification Released', desc:'MPPSC has released the official notification for Prelims 2026. Total vacancies: 350. Application window: March 15 – April 15, 2026.', tag:'mp', date:'March 2026' },
  { title:'RBI Monetary Policy — Repo Rate unchanged at 6.25%', desc:'RBI\'s Monetary Policy Committee kept the repo rate unchanged at 6.25% while maintaining an accommodative stance to support growth.', tag:'national', date:'February 2026' },
  { title:'Vikrant Massey wins National Film Award', desc:'Actor Vikrant Massey from MP won the National Film Award for Best Actor for his performance in "12th Fail", a film about UPSC aspirants.', tag:'mp', date:'February 2026' },
  { title:'India launches Mission Gaganyaan — crewed orbital test', desc:'ISRO successfully launched the Gaganyaan crew module test flight, a major milestone toward India\'s first crewed space mission planned for late 2026.', tag:'national', date:'January 2026' },
  { title:'G20 Summit 2026 hosted by South Africa', desc:'South Africa hosts the G20 Summit in Johannesburg. Key agenda: climate finance, AI governance, and debt relief for developing nations.', tag:'international', date:'January 2026' },
  { title:'MP Government launches "Mukhyamantri Jan Kalyan Yojana"', desc:'New welfare scheme launched for BPL families in MP, providing ₹12,000 annual assistance for education, health and nutrition for families below poverty line.', tag:'mp', date:'January 2026' },
  { title:'India becomes world\'s 3rd largest economy by PPP', desc:'World Bank report confirms India has overtaken Japan to become the world\'s third largest economy by Purchasing Power Parity (PPP) terms.', tag:'national', date:'December 2025' },
  { title:'COP30 Climate Summit — India\'s commitments', desc:'India pledged 500 GW renewable energy capacity by 2030 at COP30 in Belem, Brazil. Net zero target reaffirmed for 2070.', tag:'international', date:'December 2025' },
];

let _caFilter = 'all';

function filterCA(tag) {
  _caFilter = tag;
  ['all','national','mp','international'].forEach(t => {
    const btn = document.getElementById('ca-tab-' + t);
    if (btn) { btn.style.background = t === tag ? '#1A237E' : '#F1F5F9'; btn.style.color = t === tag ? '#fff' : '#64748B'; }
  });
  renderCurrentAffairs();
}

function renderCurrentAffairs() {
  const list = document.getElementById('current-affairs-list');
  const title = document.getElementById('ca-month-title');
  if (!list) return;
  if (title) title.textContent = 'Current Affairs — March 2026';
  const items = _caFilter === 'all' ? CURRENT_AFFAIRS_DATA : CURRENT_AFFAIRS_DATA.filter(d => d.tag === _caFilter);
  if (!items.length) { list.innerHTML = '<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px">No items in this category.</div>'; return; }
  list.innerHTML = items.map(item => `
    <div class="ca-item">
      <span class="ca-tag ${item.tag}">${item.tag === 'national' ? '🏛 National' : item.tag === 'mp' ? '🏙 MP Special' : '🌍 International'}</span>
      <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:5px;line-height:1.4">${item.title}</div>
      <div style="font-size:12px;color:var(--muted);line-height:1.6">${item.desc}</div>
      <div style="font-size:10px;color:var(--muted);margin-top:6px;font-weight:600">${item.date}</div>
    </div>`).join('');
}

// ══════════════════════════════════════════════
//  FULL SYLLABUS
// ══════════════════════════════════════════════
const SYLLABUS_DATA = [
  {
    paper: '📘 Paper 1 — General Studies',
    subjects: [
      { name: '🏛️ History of India', topics: ['Ancient India — Indus Valley, Vedic Age, Maurya, Gupta','Medieval India — Sultanate, Mughal Empire, Vijayanagara','Modern India — British Rule, Freedom Struggle, 1857 Revolt','Indian National Congress, Gandhi, Nehru, Azad','Post-Independence consolidation'] },
      { name: '🌍 Geography', topics: ['Physical Geography of India — mountains, rivers, plains','MP Geography — districts, divisions, rivers, climate','Agriculture, minerals, industries of MP','World Geography — continents, oceans, climate zones','Environmental Geography'] },
      { name: '⚖️ Indian Polity', topics: ['Constitution of India — Preamble, Fundamental Rights, DPSP','Parliament, President, PM, Council of Ministers','State Government — Governor, CM, Vidhan Sabha','Local Self Government — Panchayati Raj, Urban bodies','Election Commission, CAG, UPSC, Finance Commission'] },
      { name: '💰 Economy', topics: ['Indian Economy — planning, budget, GDP, inflation','Agriculture — Green Revolution, land reforms','Industry — LPG reforms 1991, Make in India','Banking — RBI, commercial banks, monetary policy','MP Economy — GDP, major industries, schemes'] },
      { name: '🔬 Science & Technology', topics: ['Physics, Chemistry, Biology basics','Space — ISRO, missions, satellites','Defence technology, nuclear policy','IT, AI, Biotechnology developments','Health & medicine'] },
      { name: '🌿 Environment', topics: ['Ecology, biodiversity, food chains','Climate change, greenhouse gases, global warming','National Parks of MP — Kanha, Pench, Bandhavgarh','Environmental laws and policies','Pollution types and control'] },
      { name: '📰 Current Affairs', topics: ['National events — last 12 months','International affairs — summits, treaties','MP government schemes and events','Sports, awards, personalities','Science & technology news'] },
    ]
  },
  {
    paper: '🧮 Paper 2 — CSAT',
    subjects: [
      { name: '📖 Comprehension', topics: ['Reading comprehension passages','Inference and conclusion drawing','Vocabulary in context','Passage summary'] },
      { name: '🧩 Logical Reasoning', topics: ['Syllogisms','Blood relations','Seating arrangements','Direction sense','Coding-decoding','Series and patterns'] },
      { name: '📐 Quantitative Aptitude', topics: ['Number system, HCF, LCM','Percentage, profit & loss','Ratio, proportion, averages','Time, speed & distance','Geometry basics','Data interpretation'] },
      { name: '🎯 Decision Making', topics: ['Administrative decision scenarios','Ethical dilemmas in public service','Priority-based problem solving'] },
      { name: '🔤 Hindi Language', topics: ['Hindi grammar — संज्ञा, सर्वनाम, क्रिया, विशेषण','Sentence correction','Comprehension in Hindi','Antonyms, synonyms in Hindi'] },
    ]
  },
  {
    paper: '🏛️ Paper 3 — MP Special GK',
    subjects: [
      { name: '📚 MP General Knowledge', topics: ['MP History — medieval and modern','MP Geography — all districts, rivers, forests','MP Polity — Vidhan Sabha, Governor, CM','MP Economy — agriculture, industry, minerals','MP Culture — tribes, festivals, arts, crafts','MP Wildlife — national parks, sanctuaries','Important personalities from MP','MP Government schemes — 2020-2026','MP Sports achievements'] },
    ]
  }
];

function renderSyllabus() {
  const tree = document.getElementById('syllabus-tree');
  if (!tree) return;
  tree.innerHTML = SYLLABUS_DATA.map((paper, pi) => `
    <div class="syl-paper" onclick="toggleSylPaper(${pi})">
      ${paper.paper}
      <span id="syl-arrow-${pi}">▼</span>
    </div>
    <div id="syl-paper-${pi}" style="margin-bottom:12px">
      ${paper.subjects.map((subj, si) => `
        <div class="syl-subject" onclick="toggleSylSubject(${pi},${si})">
          ${subj.name}
          <span id="syl-sarrow-${pi}-${si}" style="font-size:12px;color:var(--muted)">▶</span>
        </div>
        <div class="syl-topics" id="syl-topics-${pi}-${si}">
          ${subj.topics.map(t => `<div class="syl-topic">▸ ${t}</div>`).join('')}
        </div>`).join('')}
    </div>`).join('');
}

function toggleSylPaper(pi) {
  const el = document.getElementById('syl-paper-' + pi);
  const arrow = document.getElementById('syl-arrow-' + pi);
  if (!el) return;
  const hidden = el.style.display === 'none';
  el.style.display = hidden ? 'block' : 'none';
  if (arrow) arrow.textContent = hidden ? '▼' : '▶';
}

function toggleSylSubject(pi, si) {
  const el = document.getElementById('syl-topics-' + pi + '-' + si);
  const arrow = document.getElementById('syl-sarrow-' + pi + '-' + si);
  if (!el) return;
  const hidden = el.style.display === 'none' || el.style.display === '';
  el.style.display = hidden ? 'block' : 'none';
  if (arrow) arrow.textContent = hidden ? '▼' : '▶';
}

// ══════════════════════════════════════════════
//  SMART REVIEW (SRS — Spaced Repetition)
// ══════════════════════════════════════════════
const SRS_INTERVALS = [1, 3, 7, 14, 30]; // days

function _getSRSData() {
  try { return JSON.parse(localStorage.getItem('mppsc_srs') || '{}'); } catch { return {}; }
}
function _saveSRSData(data) { localStorage.setItem('mppsc_srs', JSON.stringify(data)); }

// Call this when a question is answered wrong — adds to SRS
function addToSRS(question) {
  if (!question || !question.q) return;
  const data = _getSRSData();
  const key = question.q.slice(0, 80);
  if (!data[key]) {
    data[key] = { q: question, level: 0, nextReview: Date.now(), lastReview: null };
  }
  _saveSRSData(data);
  _updateSRSBadge();
}

function _updateSRSBadge() {
  const data = _getSRSData();
  const now = Date.now();
  const due = Object.values(data).filter(d => d.nextReview <= now).length;
  const badge = document.getElementById('srs-count-badge');
  if (badge) {
    badge.textContent = due;
    badge.style.display = due > 0 ? 'inline-flex' : 'none';
  }
}

function renderSRS() {
  const statsGrid = document.getElementById('srs-stats-grid');
  const reviewArea = document.getElementById('srs-review-area');
  if (!statsGrid || !reviewArea) return;
  const data = _getSRSData();
  const all = Object.values(data);
  const now = Date.now();
  const due = all.filter(d => d.nextReview <= now);
  const total = all.length;
  const mastered = all.filter(d => d.level >= SRS_INTERVALS.length - 1).length;
  statsGrid.innerHTML = [
    { label:'Due Today', value: due.length, color:'var(--danger)', bg:'#FEF2F2' },
    { label:'Total in SRS', value: total, color:'var(--navy)', bg:'#EEF2FF' },
    { label:'Mastered', value: mastered, color:'var(--success)', bg:'#ECFDF5' },
    { label:'In Progress', value: total - mastered, color:'var(--warn)', bg:'#FFFBEB' },
  ].map(s => `<div style="background:${s.bg};border-radius:12px;padding:12px 14px">
    <div style="font-size:11px;color:${s.color};font-weight:600">${s.label}</div>
    <div style="font-size:26px;font-weight:800;color:${s.color};font-family:'Syne',sans-serif">${s.value}</div>
  </div>`).join('');

  if (!due.length) {
    reviewArea.innerHTML = `<div class="card" style="text-align:center;padding:32px">
      <div style="font-size:40px;margin-bottom:12px">✅</div>
      <div style="font-family:'Syne',sans-serif;font-size:16px;font-weight:700;margin-bottom:8px">All caught up!</div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:16px">No reviews due today. Come back tomorrow or practice more to add questions.</div>
      <button class="btn-primary" style="width:auto;padding:10px 24px" onclick="showPage('test')">Practice MCQs →</button>
    </div>`;
    return;
  }

  // Show first due question
  const item = due[0];
  const m = item.q;
  const LABS = ['A','B','C','D'];
  reviewArea.innerHTML = `
    <div class="card" style="margin-bottom:12px">
      <div style="font-size:11px;color:var(--muted);font-weight:600;margin-bottom:10px">REVIEW ${due.indexOf(item)+1} of ${due.length} DUE</div>
      <div style="font-size:15px;font-weight:600;color:var(--text);line-height:1.6;margin-bottom:14px">${m.q}</div>
      <div id="srs-opts" style="display:flex;flex-direction:column;gap:8px">
        ${(m.o||[]).map((opt, j) => `
          <button onclick="srsAnswer('${item.q.q.slice(0,80).replace(/'/g,"\\'")}', ${j})"
            style="text-align:left;padding:12px 14px;border-radius:10px;border:1.5px solid var(--border);background:var(--bg);color:var(--text);font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif">
            ${LABS[j]}) ${opt}
          </button>`).join('')}
      </div>
      <div id="srs-result" style="display:none;margin-top:14px"></div>
    </div>`;
}

function srsAnswer(key, choice) {
  const data = _getSRSData();
  const item = data[key];
  if (!item) return;
  const m = item.q;
  const correct = choice === m.a;
  const LABS = ['A','B','C','D'];
  const optsEl = document.getElementById('srs-opts');
  const resultEl = document.getElementById('srs-result');
  if (optsEl) {
    optsEl.querySelectorAll('button').forEach((btn, j) => {
      btn.disabled = true;
      if (j === m.a) { btn.style.background = '#ECFDF5'; btn.style.borderColor = '#6EE7B7'; btn.style.color = '#166534'; }
      else if (j === choice && !correct) { btn.style.background = '#FEF2F2'; btn.style.borderColor = '#FCA5A5'; btn.style.color = '#991B1B'; }
    });
  }
  if (correct) {
    item.level = Math.min(item.level + 1, SRS_INTERVALS.length - 1);
  } else {
    item.level = 0;
  }
  const nextDays = SRS_INTERVALS[item.level];
  item.nextReview = Date.now() + nextDays * 86400000;
  item.lastReview = Date.now();
  data[key] = item;
  _saveSRSData(data);
  _updateSRSBadge();
  if (resultEl) {
    resultEl.style.display = 'block';
    resultEl.innerHTML = `
      <div style="padding:12px;border-radius:10px;background:${correct?'#ECFDF5':'#FEF2F2'};margin-bottom:12px">
        <div style="font-weight:700;color:${correct?'#166534':'#991B1B'};margin-bottom:4px">${correct ? '✅ Correct!' : '❌ Wrong!'}</div>
        <div style="font-size:12px;color:var(--muted)">Correct: ${LABS[m.a]}) ${(m.o||[])[m.a]||''}</div>
        ${m.e ? `<div style="font-size:12px;color:var(--muted);margin-top:4px">${m.e}</div>` : ''}
        <div style="font-size:11px;color:var(--muted);margin-top:6px">Next review in ${nextDays} day(s)</div>
      </div>
      <button class="btn-primary" onclick="renderSRS()" style="width:auto;padding:10px 22px">Next Review →</button>`;
  }
}

// ══════════════════════════════════════════════
//  SETTINGS — NOTIFICATION TOGGLE
// ══════════════════════════════════════════════
function toggleNotifications(enabled) {
  if (enabled && 'Notification' in window) {
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') {
        if (typeof showToast === 'function') showToast('🔔 Notifications enabled!', '#059669');
        localStorage.setItem('notifications_enabled', '1');
      } else {
        if (typeof showToast === 'function') showToast('Notifications blocked by browser', '#DC2626');
        document.getElementById('setting-notifications').checked = false;
      }
    });
  } else {
    localStorage.removeItem('notifications_enabled');
    if (typeof showToast === 'function') showToast('Notifications disabled', '#64748B');
  }
}

// Restore notification toggle state on load
window.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('setting-notifications');
  if (el) el.checked = localStorage.getItem('notifications_enabled') === '1';
});

// ══════════════════════════════════════════════
//  THEME SYSTEM
//  9 themes + admin universal override
//  Reads admin_universal_theme from Firestore config
// ══════════════════════════════════════════════

const THEMES = [
  { id:'default',  name:'Classic Blue',   emoji:'🔵', p:['#1A237E','#FF6B00','#F4F6FB','#fff'] },
  { id:'dark',     name:'Dark Night',     emoji:'🌙', p:['#818CF8','#FB923C','#0F172A','#1E293B'] },
  { id:'amoled',   name:'AMOLED Black',   emoji:'⚫', p:['#60A5FA','#F472B6','#000','#0D0D0D'] },
  { id:'emerald',  name:'Emerald Forest', emoji:'🌿', p:['#065F46','#F59E0B','#ECFDF5','#fff'] },
  { id:'ocean',    name:'Ocean Breeze',   emoji:'🌊', p:['#0C4A6E','#0EA5E9','#F0F9FF','#fff'] },
  { id:'purple',   name:'Royal Purple',   emoji:'💜', p:['#5B21B6','#A855F7','#FAF5FF','#fff'] },
  { id:'rose',     name:'Rose Petal',     emoji:'🌸', p:['#9F1239','#F97316','#FFF1F2','#fff'] },
  { id:'sunset',   name:'Sunset Warm',    emoji:'🌅', p:['#B45309','#EF4444','#FFFBEB','#fff'] },
  { id:'mint',     name:'Mint Fresh',     emoji:'🍃', p:['#134E4A','#10B981','#F0FDFA','#fff'] },
  { id:'saffron',  name:'Saffron India',  emoji:'🇮🇳', p:['#9A3412','#F97316','#FFF7ED','#fff'] },
];

// Is there an admin-forced theme?
let _adminLockedTheme = null;

function _activeTheme() {
  return _adminLockedTheme || localStorage.getItem('user_theme') || 'default';
}

function applyTheme(id) {
  const body = document.body;
  THEMES.forEach(t => body.classList.remove('theme-' + t.id));
  if (id && id !== 'default') body.classList.add('theme-' + id);
}

function _renderThemeGrid() {
  const grid = document.getElementById('theme-grid');
  if (!grid) return;
  const active = _activeTheme();
  const locked = !!_adminLockedTheme;

  grid.innerHTML = THEMES.map(t => {
    const on = t.id === active;
    return `<div onclick="${locked ? "showToast('Theme locked by admin','#7C3AED')" : `pickTheme('${t.id}')`}"
      style="border:2.5px solid ${on ? 'var(--navy)' : 'var(--border)'};border-radius:14px;padding:12px;cursor:${locked ? 'not-allowed' : 'pointer'};background:${t.p[3]};transition:border .2s;position:relative;overflow:hidden">
      ${on ? `<div style="position:absolute;top:6px;right:6px;background:var(--navy);color:#fff;border-radius:50%;width:18px;height:18px;font-size:10px;display:flex;align-items:center;justify-content:center;font-weight:700">✓</div>` : ''}
      ${locked && !on ? `<div style="position:absolute;top:6px;right:6px;font-size:11px">🔒</div>` : ''}
      <div style="display:flex;gap:4px;margin-bottom:8px;align-items:center">
        <div style="width:20px;height:20px;border-radius:50%;background:${t.p[0]};flex-shrink:0"></div>
        <div style="width:20px;height:20px;border-radius:50%;background:${t.p[1]};flex-shrink:0"></div>
        <div style="width:20px;height:20px;border-radius:50%;background:${t.p[2]};border:1px solid #E2E8F0;flex-shrink:0"></div>
      </div>
      <div style="font-size:13px;font-weight:700;color:${t.p[0]};font-family:'Syne',sans-serif">${t.emoji} ${t.name}</div>
    </div>`;
  }).join('');

  const label = document.getElementById('theme-active-label');
  if (label) {
    const th = THEMES.find(x => x.id === active) || THEMES[0];
    label.textContent = (locked ? '🔒 ' : '') + th.name;
  }
}

window.pickTheme = function(id) {
  if (_adminLockedTheme) return;
  localStorage.setItem('user_theme', id);
  applyTheme(id);
  _renderThemeGrid();
  const t = THEMES.find(x => x.id === id);
  if (typeof showToast === 'function') showToast((t ? t.emoji + ' ' : '') + (t ? t.name : id) + ' theme applied!', '#059669');
};

// Load admin universal theme from Firestore, then apply
function _loadAndApplyTheme() {
  try {
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      firebase.firestore().collection('config').doc('app_settings').get().then(snap => {
        if (snap.exists && snap.data().universalTheme) {
          _adminLockedTheme = snap.data().universalTheme;
          applyTheme(_adminLockedTheme);
        } else {
          _adminLockedTheme = null;
          applyTheme(localStorage.getItem('user_theme') || 'default');
        }
        _renderThemeGrid();
      }).catch(() => {
        applyTheme(localStorage.getItem('user_theme') || 'default');
        _renderThemeGrid();
      });
    } else {
      applyTheme(localStorage.getItem('user_theme') || 'default');
      _renderThemeGrid();
    }
  } catch(e) {
    applyTheme(localStorage.getItem('user_theme') || 'default');
  }
}

// Apply stored theme immediately (before Firebase loads) to avoid flash
(function() {
  const stored = localStorage.getItem('user_theme');
  if (stored && stored !== 'default') {
    document.addEventListener('DOMContentLoaded', () => applyTheme(stored));
  }
})();

// Full load after DOM ready
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(_loadAndApplyTheme, 700);
});

// Re-render grid when settings page opens
(function patchShowPageForTheme() {
  if (typeof showPage !== 'function') { setTimeout(patchShowPageForTheme, 300); return; }
  const _orig = showPage;
  window.showPage = function(id, ...rest) {
    _orig.apply(this, [id, ...rest]);
    if (id === 'settings') setTimeout(_renderThemeGrid, 60);
  };
  setTimeout(patchShowPageForTheme, 0); // patch once
})();
