// ══════════════════════════════════════════════
// MP GK PORTAL 2026 — CORE APPLICATION
// ══════════════════════════════════════════════

const chapList = [...new Set(Q.map(q => q.c))];
const chapColors = ['#1A237E','#00695C','#B71C1C','#1565C0','#4A148C','#E65100','#1B5E20','#37474F','#880E4F','#004D40','#3E2723','#1A237E','#33691E','#01579B'];
const LABS = ['A','B','C','D'];

const PAGE_META = {
  dashboard:{title:'Dashboard',sub:'Your complete study overview'},
  notes:{title:'Study Notes',sub:'15 chapters — complete reference material'},
  flashcards:{title:'Flashcards',sub:'Rapid-fire revision mode'},
  test:{title:'MCQ Test',sub:'421 questions + 600 PYQ across all chapters'},
  daily:{title:'Daily 10',sub:'10 questions every day — build the habit'},
  timed:{title:'Timed Mock Test',sub:'Exam simulation with live countdown'},
  pyq:{title:'PYQ Papers',sub:'MPPSC 2021–2024 — 600 questions + PDF download'},
  maps:{title:'Map Quiz',sub:'India states · MP divisions · MP districts'},
  progress:{title:'My Progress',sub:'Study heatmap & chapter-wise progress rings'},
  review:{title:'Review Flags',sub:'Community-reported questions — admin panel'}
};

// ── STATE ──────────────────────────────────────
let appState = {
  pool:[], cur:0, ans:[], revArr:[], conf:[],
  timedPool:[], timedAns:[], timedCur:0, timedInt:null, timedMins:90, timedQ:100,
  flashPool:[], flashCur:0, flashKnown:0, flashLearn:0, flashFlipped:false,
  flags:[], history:[],
  streak:0, lastDate:'',
  starredNotes: [],
  reviewFilter:'all',
  startTime:0
};
let testMode = 0;
let currentFlagQIdx = -1;

// ── PERSIST ────────────────────────────────────
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem('mpgk26') || '{}');
    if (s.flags) appState.flags = s.flags;
    if (s.history) appState.history = s.history;
    if (s.streak) appState.streak = s.streak;
    if (s.lastDate) appState.lastDate = s.lastDate;
    if (s.starredNotes) appState.starredNotes = s.starredNotes;
    checkStreak();
  } catch(e) {}
}
function saveState() {
  try {
    localStorage.setItem('mpgk26', JSON.stringify({
      flags: appState.flags,
      history: appState.history.slice(-3000),
      streak: appState.streak,
      lastDate: appState.lastDate,
      starredNotes: appState.starredNotes
    }));
  } catch(e) {}
}
function checkStreak() {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (appState.lastDate !== today && appState.lastDate !== yesterday && appState.lastDate) {
    appState.streak = 0;
  }
  updateStreakUI();
}
function updateStreakUI() {
  const s = appState.streak;
  el('streak-display') && (el('streak-display').textContent = s);
  el('d-streak') && (el('d-streak').textContent = s + ' 🔥');
  el('daily-streak-num') && (el('daily-streak-num').textContent = s);
}
function incrementStreak() {
  const today = new Date().toDateString();
  if (appState.lastDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    appState.streak = (appState.lastDate === yesterday) ? appState.streak + 1 : 1;
    appState.lastDate = today;
    saveState();
    updateStreakUI();
  }
}

// ── HELPERS ────────────────────────────────────
function el(id) { return document.getElementById(id); }
function showToast(msg, color) {
  let t = el('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:11px 22px;border-radius:30px;font-size:13px;font-weight:600;z-index:9999;transition:opacity .3s;pointer-events:none;box-shadow:0 4px 20px rgba(0,0,0,.25)';
    document.body.appendChild(t);
  }
  t.style.background = color || '#1A237E';
  t.style.color = '#fff';
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._tmr);
  t._tmr = setTimeout(() => t.style.opacity = '0', 2600);
}

// ── NAVIGATION ─────────────────────────────────
function closeSidebarMobile() {
  if (window.innerWidth <= 900) {
    var sb = document.getElementById('sidebar');
    if (sb) sb.classList.remove('open');
  }
}
function showPage(id, skipTestReset) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pg = el('page-' + id);
  if (!pg) return;
  pg.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    if ((n.getAttribute('onclick') || '').includes("'" + id + "'")) n.classList.add('active');
  });
  const meta = PAGE_META[id] || { title: id, sub: '' };
  el('pg-title') && (el('pg-title').textContent = meta.title);
  el('pg-sub') && (el('pg-sub').textContent = meta.sub);
  if (id === 'dashboard') renderDashboard();
  if (id === 'notes') renderNotes();
  if (id === 'flashcards') renderFlashFilter();
  if (id === 'pyq') renderPYQ('all');
  if (id === 'weakareas') renderWeakAreas();
  if (id === 'progress') renderProgress();
  if (id === 'review') renderReviewPage();
  if (id === 'test' && !skipTestReset) resetTestHome();
  if (id === 'daily') renderDailyPage();
  closeSidebarMobile();
}
// Navigate to test page WITHOUT resetting — used when launching a test directly
function launchTestPage() {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pg = el('page-test');
  if (pg) pg.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    if ((n.getAttribute('onclick') || '').includes("'test'")) n.classList.add('active');
  });
  el('pg-title') && (el('pg-title').textContent = PAGE_META.test.title);
  el('pg-sub') && (el('pg-sub').textContent = PAGE_META.test.sub);
  closeSidebarMobile();
}
function toggleSidebar() { el('sidebar').classList.toggle('open'); }

// ── DASHBOARD ──────────────────────────────────
function renderDashboard() {
  const hist = appState.history;
  const correct = hist.filter(h => h.c).length;
  const acc = hist.length > 0 ? Math.round(correct / hist.length * 100) : 0;

  setText('d-attempted', hist.length);
  setText('d-attempted-of', 'of ' + (Q.length + totalPYQqs()) + ' total');
  setText('d-accuracy', acc + '%');
  setText('d-flags', appState.flags.length);
  updateFlagBadge();

  // Chapter grid
  const grid = el('dash-ch-grid');
  if (!grid) return;
  grid.innerHTML = '';
  chapList.forEach((ch, i) => {
    const chQ = Q.filter(q => q.c === ch).length;
    const done = hist.filter(h => h.ch === ch);
    const pct = done.length > 0 ? Math.round(done.filter(h => h.c).length / done.length * 100) : 0;
    const prog = Math.round(Math.min(done.length, chQ) / chQ * 100);
    const c = chapColors[i % chapColors.length];
    const d = document.createElement('div');
    d.className = 'ch-card';
    d.innerHTML = `<div style="display:flex;justify-content:space-between"><span class="ch-name">${ch.replace(/^Ch\.\d+\s*/,'')}</span><span style="font-size:10px;font-weight:700;color:${c}">${pct > 0 ? pct + '%' : ''}</span></div>
      <div class="ch-count">${chQ} qs | ${Math.min(done.length,chQ)} done</div>
      <div class="ch-pb"><div class="ch-pf" style="width:${prog}%;background:${c}"></div></div>`;
    d.onclick = () => { showPage('test'); setTimeout(() => filterChipOnly(ch), 100); };
    grid.appendChild(d);
  });

  renderHeatmap('heatmap');
  renderWeakPreview();
}

function totalPYQqs() {
  if (typeof PYQ_PAPERS === 'undefined') return 0;
  return PYQ_PAPERS.reduce((s, p) => s + (p.mcqs ? p.mcqs.length : 0), 0);
}

function setText(id, val) { el(id) && (el(id).textContent = val); }

function renderWeakPreview() {
  const w = el('dash-weak');
  if (!w) return;
  const data = getWeakData().slice(0, 5);
  if (!data.length) { w.innerHTML = '<div style="font-size:13px;color:var(--muted);text-align:center;padding:20px">Complete some tests to see weak areas</div>'; return; }
  w.innerHTML = data.map(d => {
    const bc = d.acc < 40 ? 'var(--danger)' : d.acc < 70 ? 'var(--warn)' : 'var(--success)';
    return `<div class="weak-item"><div class="weak-name">${d.ch.substring(0,16)}</div>
      <div class="weak-bar-wrap"><div class="weak-bar" style="width:${Math.max(d.acc,2)}%;background:${bc}"></div></div>
      <div class="weak-pct" style="color:${bc}">${d.acc}%</div></div>`;
  }).join('');
}

function renderHeatmap(id) {
  const el2 = el(id); if (!el2) return;
  el2.innerHTML = '';
  for (let i = 0; i < 182; i++) {
    const date = new Date(Date.now() - (181 - i) * 86400000).toDateString();
    const cnt = appState.history.filter(h => h.date === date).length;
    const lvl = cnt === 0 ? 0 : cnt < 3 ? 1 : cnt < 7 ? 2 : cnt < 12 ? 3 : 4;
    const d = document.createElement('div');
    d.className = 'hm-cell hm-' + lvl;
    d.title = date + ': ' + cnt + ' questions';
    el2.appendChild(d);
  }
}

function getWeakData() {
  return chapList.map((ch, i) => {
    const done = appState.history.filter(h => h.ch === ch);
    const acc = done.length > 0 ? Math.round(done.filter(h => h.c).length / done.length * 100) : 0;
    return { ch: ch.replace(/^Ch\.\d+\s*/, '').substring(0, 18), acc, done: done.length, color: chapColors[i % chapColors.length] };
  }).filter(w => w.done > 0).sort((a, b) => a.acc - b.acc);
}

// ── NOTES ──────────────────────────────────────
function renderNotes() {
  const nav = el('notes-nav');
  const area = el('notes-content-area');
  if (!nav || !area) return;
  nav.innerHTML = '';
  area.innerHTML = '';
  NOTES.forEach((n, i) => {
    const starred = appState.starredNotes.includes(n.id);
    const item = document.createElement('div');
    item.className = 'notes-nav-item' + (i === 0 ? ' active' : '') + (starred ? ' starred' : '');
    item.id = 'nnav-' + n.id;
    item.textContent = n.name;
    item.onclick = () => {
      document.querySelectorAll('.notes-nav-item').forEach(x => x.classList.remove('active'));
      document.querySelectorAll('.note-content').forEach(x => x.classList.remove('active'));
      item.classList.add('active');
      el('nc-' + n.id) && el('nc-' + n.id).classList.add('active');
    };
    nav.appendChild(item);
    const cont = document.createElement('div');
    cont.className = 'note-content card' + (i === 0 ? ' active' : '');
    cont.id = 'nc-' + n.id;
    cont.innerHTML = n.content + `<div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn-ghost" onclick="practiceChapter('${n.id}')">Practice Questions →</button>
      <button id="star-${n.id}" onclick="toggleStar('${n.id}')" style="background:none;border:none;cursor:pointer;font-size:15px;color:${starred?'#F9A825':'#CBD5E1'};font-weight:600">${starred?'★ Starred':'☆ Star this chapter'}</button>
    </div>`;
    area.appendChild(cont);
  });
}
function toggleStar(id) {
  const idx = appState.starredNotes.indexOf(id);
  const btn = el('star-' + id);
  const navItem = el('nnav-' + id);
  if (idx >= 0) {
    appState.starredNotes.splice(idx, 1);
    if (btn) { btn.textContent = '☆ Star this chapter'; btn.style.color = '#CBD5E1'; }
    navItem && navItem.classList.remove('starred');
  } else {
    appState.starredNotes.push(id);
    if (btn) { btn.textContent = '★ Starred'; btn.style.color = '#F9A825'; }
    navItem && navItem.classList.add('starred');
  }
  saveState();
}
function practiceChapter(id) {
  const chMap = {c1:'Ch.1 Parichay',c2:'Ch.2 Geo Position',c3:'Ch.3 Extreme Districts',c4:'Ch.4 Population',c5:'Ch.5 Rajya Prateek',c6:'Ch.6 Upnaam',c7:'Ch.7 Capitals',c8:'Ch.8 Prashasan',c9:'Ch.9 Rajneetik',c10:'Ch.10 Divas & Varsh',c11:'Ch.11 Gathan',c12:'Ch.12 Geography',c13:'Ch.13 Economy',c15:'Ch.15 Kya Badla'};
  const ch = chMap[id];
  showPage('test');
  if (ch) setTimeout(() => filterChipOnly(ch), 150);
}

// ── FLASHCARDS ─────────────────────────────────
function renderFlashFilter() {
  const wrap = el('flash-filter'); if (!wrap || wrap.children.length > 1) return;
  chapList.forEach(ch => {
    const c = document.createElement('div');
    c.className = 'chip on'; c.textContent = ch;
    c.onclick = function() { this.classList.toggle('on'); syncFlashAll(); };
    wrap.appendChild(c);
  });
  updateFlashCount();
}
function flashChipAll(btn) {
  const on = !btn.classList.contains('on');
  btn.classList.toggle('on', on);
  document.querySelectorAll('#flash-filter .chip:not(.chip-all)').forEach(c => c.classList.toggle('on', on));
  updateFlashCount();
}
function syncFlashAll() {
  const all = [...document.querySelectorAll('#flash-filter .chip:not(.chip-all)')].every(c => c.classList.contains('on'));
  document.querySelector('#flash-filter .chip-all') && document.querySelector('#flash-filter .chip-all').classList.toggle('on', all);
  updateFlashCount();
}
function updateFlashCount() {
  const sel = [...document.querySelectorAll('#flash-filter .chip:not(.chip-all).on')].map(c => c.textContent);
  setText('flash-count-info', Q.filter(q => sel.includes(q.c)).length + ' cards selected');
}
function startFlash() {
  const sel = [...document.querySelectorAll('#flash-filter .chip:not(.chip-all).on')].map(c => c.textContent);
  let src = Q.filter(q => sel.includes(q.c));
  src.sort(() => Math.random() - .5);
  appState.flashPool = src; appState.flashCur = 0; appState.flashKnown = 0; appState.flashLearn = 0; appState.flashFlipped = false;
  el('flash-session').style.display = 'block';
  renderFlashCard();
}
function renderFlashCard() {
  const m = appState.flashPool[appState.flashCur];
  if (!m) { el('flash-session').style.display = 'none'; showToast('🎉 All cards done! Known: '+appState.flashKnown+', Learning: '+appState.flashLearn); return; }
  el('flash-hint') && (el('flash-hint').style.display = 'block');
  setText('flash-q', m.q);
  setText('flash-ans', '✔ ' + m.o[m.a]);
  el('flash-ans') && el('flash-ans').classList.remove('show');
  el('flash-expl') && (el('flash-expl').textContent = m.n, el('flash-expl').classList.remove('show'));
  el('flash-nav') && (el('flash-nav').style.display = 'none');
  appState.flashFlipped = false;
  setText('flash-counter', 'Card ' + (appState.flashCur + 1) + ' of ' + appState.flashPool.length);
  setText('flash-known', appState.flashKnown);
  setText('flash-learn', appState.flashLearn);
}
function flipCard() {
  if (appState.flashFlipped) return;
  appState.flashFlipped = true;
  el('flash-ans') && el('flash-ans').classList.add('show');
  el('flash-expl') && el('flash-expl').classList.add('show');
  el('flash-hint') && (el('flash-hint').style.display = 'none');
  el('flash-nav') && (el('flash-nav').style.display = 'flex');
}
function flashKnow() { appState.flashKnown++; appState.flashCur++; renderFlashCard(); }
function flashDontKnow() { appState.flashLearn++; appState.flashCur++; renderFlashCard(); }

// ── MCQ TEST ───────────────────────────────────
function resetTestHome() {
  el('test-home-scr') && (el('test-home-scr').style.display = 'block');
  el('test-q-scr') && (el('test-q-scr').style.display = 'none');
  el('test-result-scr') && (el('test-result-scr').style.display = 'none');
  el('review-answers-section') && (el('review-answers-section').style.display = 'none');
  initChipFilters();
  renderPYQPracticeSection();
}
function renderPYQPracticeSection() {
  const wrap = el('pyq-practice-section');
  if (!wrap) return;
  wrap.innerHTML = '';
  // Show all papers that have MCQs, grouped by year
  const withMCQ = PYQ_PAPERS.filter(p => p.mcqs && p.mcqs.length > 0);
  if (!withMCQ.length) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  withMCQ.forEach(p => {
    const btn = document.createElement('div');
    btn.className = 'mode-card';
    const icon = p.year === '2021' ? (p.paper === 'Paper 1' ? '📜' : '📋') : '📄';
    btn.innerHTML = `<div class="mode-icon">${icon}</div><div class="mode-name">${p.year} ${p.paper}</div><div class="mode-desc">${p.mcqs.length} PYQ Qs</div>`;
    btn.onclick = () => { testMode = 0; startTest(true, p.mcqs); launchTestPage(); };
    wrap.appendChild(btn);
  });
}
function initChipFilters() {
  const wrap = el('ch-filter-chips');
  if (!wrap || wrap.children.length > 0) return;
  chapList.forEach(ch => {
    const c = document.createElement('div');
    c.className = 'chip on'; c.textContent = ch;
    c.onclick = function() { this.classList.toggle('on'); };
    wrap.appendChild(c);
  });
}
function selectAllChaps() {
  document.querySelectorAll('#ch-filter-chips .chip').forEach(c => c.classList.add('on'));
}
function selMode(el2, n) {
  document.querySelectorAll('#test-home-scr .mode-card').forEach(m => m.classList.remove('sel'));
  el2.classList.add('sel'); testMode = n;
}
function filterChipOnly(ch) {
  document.querySelectorAll('#ch-filter-chips .chip').forEach(c => c.classList.toggle('on', c.textContent === ch));
}
function startTest(isPYQ, pyqPool) {
  let src;
  if (isPYQ) {
    src = pyqPool;
  } else {
    const selChaps = [...document.querySelectorAll('#ch-filter-chips .chip.on')].map(c => c.textContent);
    src = Q.filter(q => selChaps.includes(q.c));
    src.sort(() => Math.random() - .5);
  }
  if (!src || !src.length) { showToast('No questions selected! Choose at least one chapter.', '#DC2626'); return; }
  appState.pool = testMode === 0 ? src : src.slice(0, Math.min(testMode, src.length));
  appState.ans = new Array(appState.pool.length).fill(null);
  appState.revArr = new Array(appState.pool.length).fill(false);
  appState.conf = new Array(appState.pool.length).fill(null);
  appState.cur = 0; appState.startTime = Date.now();
  el('test-home-scr').style.display = 'none';
  el('test-q-scr').style.display = 'block';
  el('test-result-scr').style.display = 'none';
  renderQ();
  incrementStreak();
}

function renderQ() {
  if (appState.cur >= appState.pool.length) { showResults(); return; }
  const m = appState.pool[appState.cur];
  const pct = (appState.cur + 1) / appState.pool.length * 100;
  setText('qchap-badge', m.c || 'PYQ');
  setText('q-num-badge', 'Q' + (appState.cur + 1));
  setText('q-info-text', (appState.cur + 1) + ' / ' + appState.pool.length);
  el('q-pfill') && (el('q-pfill').style.width = pct + '%');
  el('q-upd-badge') && (el('q-upd-badge').style.display = m.u ? 'inline-block' : 'none');
  setText('q-text', m.q);

  const oc = el('q-opts'); if (!oc) return;
  oc.innerHTML = '';
  m.o.forEach((opt, i) => {
    const b = document.createElement('button');
    b.className = 'opt';
    b.innerHTML = `<span class="opt-lbl">${LABS[i]}</span><span>${opt}</span>`;
    const a = appState.ans[appState.cur], rv = appState.revArr[appState.cur];
    if (a !== null || rv) {
      b.disabled = true;
      if (i === m.a) b.classList.add('right');
      else if (a === i) b.classList.add('wrong');
    } else { b.onclick = () => doAns(i); }
    oc.appendChild(b);
  });

  const a = appState.ans[appState.cur], rv = appState.revArr[appState.cur];
  const ab = el('q-ans-box');
  if (a !== null || rv) {
    ab && ab.classList.add('show');
    setText('q-ans-correct', '✔ Sahi Jawab: ' + LABS[m.a] + ') ' + m.o[m.a]);
    setText('q-ans-expl', m.n);
    const au = el('q-ans-upd');
    if (au) { au.textContent = m.u ? '★ 2026 Update: ' + m.u : ''; au.style.display = m.u ? 'inline-block' : 'none'; }
    el('btn-reveal') && (el('btn-reveal').style.display = 'none');
    el('btn-next') && (el('btn-next').style.display = 'block');
    el('btn-skip') && (el('btn-skip').style.display = 'none');
    el('conf-wrap') && (el('conf-wrap').style.display = 'flex');
    const cv = appState.conf[appState.cur];
    el('conf-sure') && el('conf-sure').classList.toggle('sel', cv === 'sure');
    el('conf-unsure') && el('conf-unsure').classList.toggle('sel', cv === 'unsure');
  } else {
    ab && ab.classList.remove('show');
    el('btn-reveal') && (el('btn-reveal').style.display = '');
    el('btn-next') && (el('btn-next').style.display = 'none');
    el('btn-skip') && (el('btn-skip').style.display = '');
    el('conf-wrap') && (el('conf-wrap').style.display = 'none');
  }
  // flag button
  const flagBtn = el('btn-flag');
  if (flagBtn) {
    const flagged = appState.flags.some(f => f.q === m.q);
    flagBtn.classList.toggle('flagged', flagged);
    flagBtn.innerHTML = flagged ? '🚩 Flagged' : '🚩 Flag for Review';
  }
}

function doAns(i) {
  if (appState.ans[appState.cur] !== null) return;
  appState.ans[appState.cur] = i;
  const m = appState.pool[appState.cur];
  const correct = i === m.a;
  appState.history.push({ q: m.q, ch: m.c || 'PYQ', c: correct, date: new Date().toDateString() });
  saveState();
  document.querySelectorAll('.opt').forEach((b, j) => {
    b.disabled = true;
    if (j === m.a) b.classList.add('right');
    else if (j === i && !correct) b.classList.add('wrong');
  });
  const ab = el('q-ans-box');
  ab && ab.classList.add('show');
  setText('q-ans-correct', '✔ Sahi Jawab: ' + LABS[m.a] + ') ' + m.o[m.a]);
  setText('q-ans-expl', m.n);
  const au = el('q-ans-upd');
  if (au) { au.textContent = m.u ? '★ 2026 Update: ' + m.u : ''; au.style.display = m.u ? 'inline-block' : 'none'; }
  el('btn-reveal') && (el('btn-reveal').style.display = 'none');
  el('btn-next') && (el('btn-next').style.display = 'block');
  el('btn-skip') && (el('btn-skip').style.display = 'none');
  el('conf-wrap') && (el('conf-wrap').style.display = 'flex');
  if (!correct) showToast('Incorrect — See explanation below', '#DC2626');
  else showToast('Correct! ✓', '#15803D');
}
function revealAns() { appState.revArr[appState.cur] = true; renderQ(); }
function nextQ() { appState.cur++; renderQ(); }
function skipQ() { appState.ans[appState.cur] = -1; appState.cur++; renderQ(); }
function setConf(v) {
  appState.conf[appState.cur] = v;
  el('conf-sure') && el('conf-sure').classList.toggle('sel', v === 'sure');
  el('conf-unsure') && el('conf-unsure').classList.toggle('sel', v === 'unsure');
}

function showResults() {
  el('test-q-scr').style.display = 'none';
  el('test-result-scr').style.display = 'block';
  const elapsed = Math.floor((Date.now() - appState.startTime) / 1000);
  let c = 0, w = 0, s = 0;
  appState.ans.forEach((a, i) => {
    if (a === appState.pool[i].a) c++;
    else if (a === null || appState.revArr[i] || a === -1) s++;
    else w++;
  });
  const tot = appState.pool.length, pct = Math.round(c / tot * 100);
  setText('res-pct', pct + '%');
  const grade = pct >= 80 ? 'Excellent! 🎉' : pct >= 65 ? 'Good work 👍' : pct >= 50 ? 'Keep practicing 📚' : 'More revision needed 💪';
  setText('res-grade', grade);
  const cir = el('res-circle');
  if (cir) cir.style.borderColor = pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warn)' : 'var(--danger)';
  setText('rg-c', c); setText('rg-w', w); setText('rg-s', s); setText('rg-t', tot);
  setText('rg-a', (c + w > 0 ? Math.round(c / (c + w) * 100) : 0) + '%');
  setText('rg-tm', Math.floor(elapsed / 60) + 'm ' + elapsed % 60 + 's');
  renderDashboard();
}
function retakeTest() { resetTestHome(); }
function showReview() {
  const sec = el('review-answers-section');
  sec && (sec.style.display = 'block');
  renderReviewList('all');
  sec && sec.scrollIntoView({ behavior: 'smooth' });
}
function filterReview(type) {
  appState.reviewFilter = type;
  ['all','wrong','unsure'].forEach(t => {
    const b = el('rf-' + t);
    if (b) b.style.borderColor = t === type ? 'var(--navy)' : 'var(--border)';
  });
  renderReviewList(type);
}
function renderReviewList(filter) {
  const list = el('review-list-container'); if (!list) return;
  list.innerHTML = '';
  appState.pool.forEach((m, i) => {
    const a = appState.ans[i], rv = appState.revArr[i], cn = appState.conf[i];
    let st = a === m.a ? 'correct' : (a === null || a === -1 || rv) ? 'skipped' : 'wrong';
    if (filter === 'wrong' && st !== 'wrong') return;
    if (filter === 'unsure' && cn !== 'unsure') return;
    const ya = a !== null && a >= 0 ? LABS[a] + ') ' + m.o[a] : '—';
    const d = document.createElement('div');
    d.className = 'rev-item ' + st;
    const stL = st === 'correct' ? '<span class="rtag t-c">Correct</span>' : st === 'wrong' ? '<span class="rtag t-w">Wrong</span>' : '<span class="rtag t-s">Skipped</span>';
    const confL = cn === 'unsure' ? '<span class="rtag t-u">Unsure</span>' : cn === 'sure' ? '<span class="rtag t-c">Sure</span>' : '';
    d.innerHTML = `<div class="rev-q">Q${i+1}: ${m.q}</div>
      <div class="rev-tags">${stL}${confL}<span class="rtag t-c">Correct: ${LABS[m.a]}) ${m.o[m.a]}</span>${st==='wrong'?`<span class="rtag t-w">Your: ${ya}</span>`:''}</div>
      <div class="rev-expl">${m.n}${m.u?` | <b style="color:var(--warn)">★ ${m.u}</b>`:''}</div>`;
    list.appendChild(d);
  });
  if (!list.children.length) list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px">No questions match this filter.</div>';
}

// ── DAILY 10 ───────────────────────────────────
function renderDailyPage() {
  const ddi = el('daily-date-info');
  if (ddi) ddi.textContent = 'Today: ' + new Date().toLocaleDateString('en-IN', {weekday:'long',day:'numeric',month:'long'});
  updateStreakUI();
}
function startDaily() {
  const shuffled = [...Q].sort(() => Math.random() - .5).slice(0, 10);
  testMode = 10;
  appState.pool = shuffled;
  appState.ans = new Array(10).fill(null);
  appState.revArr = new Array(10).fill(false);
  appState.conf = new Array(10).fill(null);
  appState.cur = 0; appState.startTime = Date.now();
  launchTestPage();
  el('test-home-scr').style.display = 'none';
  el('test-q-scr').style.display = 'block';
  el('test-result-scr').style.display = 'none';
  renderQ();
  incrementStreak();
}

// ── TIMED TEST ─────────────────────────────────
let timedConfig = { q: 100, t: 90 };
function selTimedMode(btn, q, t) {
  document.querySelectorAll('#timed-mode-grid .mode-card').forEach(m => m.classList.remove('sel'));
  btn.classList.add('sel');
  timedConfig = { q, t };
}
function startTimedTest() {
  const src = [...Q].sort(() => Math.random() - .5).slice(0, timedConfig.q);
  appState.timedPool = src;
  appState.timedAns = new Array(src.length).fill(null);
  appState.timedCur = 0;
  el('timed-home').style.display = 'none';
  el('timed-test-wrap').style.display = 'block';
  let secs = timedConfig.t * 60;
  function tick() {
    const m = Math.floor(secs / 60), s = secs % 60;
    const tim = el('timed-timer');
    if (tim) { tim.textContent = m + ':' + (s < 10 ? '0' : '') + s; tim.classList.toggle('warn', secs < 300); }
    if (secs <= 0) { endTimedTest(); return; }
    secs--;
  }
  tick();
  appState.timedInt = setInterval(tick, 1000);
  renderTimedQ();
  incrementStreak();
}
function renderTimedQ() {
  if (appState.timedCur >= appState.timedPool.length) { endTimedTest(); return; }
  const m = appState.timedPool[appState.timedCur];
  setText('timed-info', 'Q ' + (appState.timedCur + 1) + ' / ' + appState.timedPool.length);
  el('timed-pbar') && (el('timed-pbar').style.width = ((appState.timedCur+1)/appState.timedPool.length*100)+'%');
  setText('timed-chap', m.c);
  setText('timed-qnum', 'Q' + (appState.timedCur + 1));
  setText('timed-qtext', m.q);
  const oc = el('timed-opts'); if (!oc) return;
  oc.innerHTML = '';
  el('timed-ans-box') && el('timed-ans-box').classList.remove('show');
  el('timed-reveal') && (el('timed-reveal').style.display = 'inline-block');
  el('timed-next') && (el('timed-next').style.display = 'none');
  m.o.forEach((opt, i) => {
    const b = document.createElement('button');
    b.className = 'opt';
    b.innerHTML = `<span class="opt-lbl">${LABS[i]}</span><span>${opt}</span>`;
    b.onclick = () => timedAnsClick(i);
    oc.appendChild(b);
  });
}
function timedAnsClick(i) {
  const m = appState.timedPool[appState.timedCur];
  appState.timedAns[appState.timedCur] = i;
  const correct = i === m.a;
  appState.history.push({ q: m.q, ch: m.c, c: correct, date: new Date().toDateString() });
  document.querySelectorAll('#timed-opts .opt').forEach((b, j) => {
    b.disabled = true;
    if (j === m.a) b.classList.add('right');
    else if (j === i && !correct) b.classList.add('wrong');
  });
  el('timed-ans-box') && el('timed-ans-box').classList.add('show');
  setText('timed-ans-correct', '✔ ' + LABS[m.a] + ') ' + m.o[m.a]);
  setText('timed-ans-expl', m.n);
  el('timed-reveal') && (el('timed-reveal').style.display = 'none');
  el('timed-next') && (el('timed-next').style.display = 'block');
}
function timedReveal() {
  const m = appState.timedPool[appState.timedCur];
  el('timed-ans-box') && el('timed-ans-box').classList.add('show');
  setText('timed-ans-correct', '✔ ' + LABS[m.a] + ') ' + m.o[m.a]);
  setText('timed-ans-expl', m.n);
  el('timed-reveal') && (el('timed-reveal').style.display = 'none');
  el('timed-next') && (el('timed-next').style.display = 'block');
}
function timedNext() { appState.timedCur++; renderTimedQ(); }
function timedSkip() { appState.timedAns[appState.timedCur] = -1; appState.timedCur++; renderTimedQ(); }
function endTimedTest() {
  clearInterval(appState.timedInt);
  saveState();
  const c = appState.timedAns.filter((a, i) => a === appState.timedPool[i].a).length;
  const tot = appState.timedPool.length;
  const pct = Math.round(c / tot * 100);
  el('timed-test-wrap').innerHTML = `
    <div class="card" style="max-width:500px;margin:0 auto;text-align:center;padding:32px">
      <div style="font-size:32px;margin-bottom:12px">⏱️</div>
      <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;margin-bottom:16px">Time's Up!</div>
      <div class="score-circle" style="border-color:${pct>=70?'var(--success)':pct>=40?'var(--warn)':'var(--danger)'}">
        <div class="score-pct">${pct}%</div><div class="score-grade">Score</div>
      </div>
      <div class="result-grid" style="margin-top:14px">
        <div class="rg-item g"><div class="rg-val">${c}</div><div class="rg-lbl">Correct</div></div>
        <div class="rg-item r"><div class="rg-val">${tot-c}</div><div class="rg-lbl">Wrong/Skip</div></div>
        <div class="rg-item"><div class="rg-val">${tot}</div><div class="rg-lbl">Total</div></div>
      </div>
      <div style="margin-top:16px;display:flex;gap:10px;justify-content:center">
        <button class="btn-primary" style="width:auto;padding:10px 22px" onclick="location.reload()">Try Again</button>
        <button class="btn-secondary" onclick="showPage('dashboard')">Dashboard</button>
      </div>
    </div>`;
}

// ── PYQ ───────────────────────────────────────
function renderPYQ(year) {
  document.querySelectorAll('.pyq-tab').forEach(t => t.classList.toggle('active', t.dataset.year === year));
  const list = el('pyq-list'); if (!list) return;
  list.innerHTML = '';
  const papers = year === 'all' ? PYQ_PAPERS : PYQ_PAPERS.filter(p => p.year === year);
  papers.forEach(p => {
    const card = document.createElement('div');
    card.className = 'pyq-paper-card';
    const qCount = p.mcqs ? p.mcqs.length : 0;
    const pid = p.paperId;
    const paperIcon = p.paper === 'Paper 2' ? '📋' : '📄';
    const hasMCQ = qCount > 0;
    card.innerHTML = `
      <div class="pyq-icon">${paperIcon}</div>
      <div class="pyq-info">
        <div class="pyq-name">${p.name}</div>
        <div class="pyq-meta">${p.date} &nbsp;·&nbsp; <b>${qCount} practice questions</b> available &nbsp;·&nbsp; ${(p.tags||[]).map(t=>`<span style="background:#EEF0FF;color:var(--navy);padding:1px 6px;border-radius:4px;font-size:10px;font-weight:600">${t}</span>`).join(' ')}</div>
      </div>
      <div class="pyq-actions">
        <button class="btn-dl" onclick="downloadPYQ('${pid}')">⬇ Download</button>
        ${hasMCQ
          ? `<button class="btn-practice" onclick="practicePYQ('${pid}')">Practice ${qCount} Qs</button>`
          : `<button class="btn-practice" style="opacity:.45;cursor:not-allowed" disabled>No MCQs yet</button>`
        }
      </div>`;
    list.appendChild(card);
  });
}
function downloadPYQ(paperId) {
  const p = PYQ_PAPERS.find(x => x.paperId === paperId);
  const url = p && p.pdfUrl ? p.pdfUrl : 'https://mppsc.mp.gov.in';
  showToast('📥 Opening PDF...', '#1A237E');
  setTimeout(() => window.open(url, '_blank'), 600);
}
function practicePYQ(paperId) {
  const p = PYQ_PAPERS.find(x => x.paperId === paperId);
  if (!p || !p.mcqs || !p.mcqs.length) { showToast('No MCQs available for this paper yet', '#DC2626'); return; }
  testMode = 0;
  startTest(true, p.mcqs);
  launchTestPage();
}

// ── WEAK AREAS ────────────────────────────────
function renderWeakAreas() {
  const list = el('weak-list-full'); if (!list) return;
  list.innerHTML = '';
  const data = chapList.map((ch, i) => {
    const done = appState.history.filter(h => h.ch === ch);
    const acc = done.length > 0 ? Math.round(done.filter(h => h.c).length / done.length * 100) : -1;
    return { ch, acc, done: done.length, color: chapColors[i % chapColors.length] };
  });
  if (data.every(d => d.done === 0)) {
    list.innerHTML = '<div style="font-size:13px;color:var(--muted);text-align:center;padding:30px">Complete some tests to see weak areas.</div>';
    return;
  }
  [...data].sort((a, b) => a.acc - b.acc).forEach(w => {
    const bc = w.acc < 0 ? '#CBD5E1' : w.acc < 40 ? 'var(--danger)' : w.acc < 70 ? 'var(--warn)' : 'var(--success)';
    const pct = w.acc < 0 ? 0 : w.acc;
    list.innerHTML += `<div class="weak-item">
      <div class="weak-name">${w.ch.replace(/^Ch\.\d+\s*/,'').substring(0,18)}</div>
      <div class="weak-bar-wrap"><div class="weak-bar" style="width:${Math.max(pct,2)}%;background:${bc}"></div></div>
      <div class="weak-pct" style="color:${bc}">${w.acc>=0?w.acc+'%':'—'}</div>
    </div>`;
  });
  const sugg = el('weak-suggestions');
  if (sugg) {
    const weak = data.filter(d => d.done > 0 && d.acc >= 0 && d.acc < 50);
    sugg.innerHTML = weak.length > 0
      ? '<div style="margin-bottom:10px;font-weight:600">Focus on these chapters:</div>' + weak.map(w => `<div style="padding:5px 0;font-size:13px">🔴 ${w.ch.replace(/^Ch\.\d+\s*/,'')} — ${w.acc}% accuracy</div>`).join('')
      : '<div style="color:var(--success);font-size:13px">✅ Great performance across all chapters!</div>';
  }
  const wrongQs = new Set(appState.history.filter(h => !h.c).map(h => h.q));
  const count = Q.filter(q => wrongQs.has(q.q)).length;
  setText('smart-rev-info', count > 0 ? count + ' previously wrong questions found — perfect for targeted revision.' : 'Complete some tests first to unlock smart revision.');
}
function startSmartRevision() {
  const wrongQs = new Set(appState.history.filter(h => !h.c).map(h => h.q));
  const src = Q.filter(q => wrongQs.has(q.q));
  if (!src.length) { showToast('No wrong answers found yet. Try some tests first!', '#DC2626'); return; }
  testMode = 0;
  startTest(true, src.sort(() => Math.random() - .5));
  launchTestPage();
}

// ── PROGRESS ──────────────────────────────────
function renderProgress() {
  const hist = appState.history;
  const correct = hist.filter(h => h.c).length;
  const acc = hist.length > 0 ? Math.round(correct / hist.length * 100) : 0;
  const pg = el('prog-stats'); if (!pg) return;
  pg.innerHTML = `
    <div class="stat-card"><div class="stat-accent" style="background:var(--navy)"></div><div class="stat-lbl">Total Attempted</div><div class="stat-val">${hist.length}</div></div>
    <div class="stat-card"><div class="stat-accent" style="background:var(--success)"></div><div class="stat-lbl">Overall Accuracy</div><div class="stat-val">${acc}%</div></div>
    <div class="stat-card"><div class="stat-accent" style="background:var(--saff)"></div><div class="stat-lbl">Current Streak</div><div class="stat-val">${appState.streak} 🔥</div></div>
    <div class="stat-card"><div class="stat-accent" style="background:var(--danger)"></div><div class="stat-lbl">Flags Reported</div><div class="stat-val">${appState.flags.length}</div></div>`;
  renderHeatmap('heatmap2');
  const rings = el('progress-rings'); if (!rings) return;
  rings.innerHTML = '';
  chapList.forEach((ch, i) => {
    const done = hist.filter(h => h.ch === ch);
    const pct = done.length > 0 ? Math.round(done.filter(h => h.c).length / done.length * 100) : 0;
    const color = pct === 0 ? '#CBD5E1' : pct < 40 ? '#DC2626' : pct < 70 ? '#D97706' : '#16A34A';
    const r = 24, circ = 2 * Math.PI * r, dash = circ * (pct / 100);
    rings.innerHTML += `<div class="ring-wrap">
      <svg width="58" height="58" viewBox="0 0 58 58">
        <circle cx="29" cy="29" r="${r}" fill="none" stroke="#E2E8F0" stroke-width="5"/>
        <circle cx="29" cy="29" r="${r}" fill="none" stroke="${color}" stroke-width="5"
          stroke-dasharray="${dash.toFixed(1)} ${circ.toFixed(1)}" stroke-dashoffset="${(circ*0.25).toFixed(1)}" stroke-linecap="round"/>
        <text x="29" y="34" text-anchor="middle" font-size="12" font-weight="700" fill="${color}">${done.length > 0 ? pct + '%' : '—'}</text>
      </svg>
      <div class="ring-lbl">${ch.replace(/^Ch\.\d+\s*/,'').split(' ').slice(0,2).join(' ')}</div>
    </div>`;
  });
}

// ── REVIEW FLAGS ───────────────────────────────
function updateFlagBadge() {
  const pending = appState.flags.filter(f => f.status === 'pending').length;
  const b = el('flag-count-badge');
  if (b) { b.textContent = pending; b.style.display = pending > 0 ? '' : 'none'; }
}
function flagQuestion() {
  currentFlagQIdx = appState.cur;
  const m = appState.pool[appState.cur];
  setText('flag-q-preview', 'Q' + (appState.cur + 1) + ': ' + m.q);
  el('flag-note') && (el('flag-note').value = '');
  el('flag-modal').style.display = 'flex';
}
function closeFlagModal() { el('flag-modal').style.display = 'none'; }
function submitFlag() {
  const m = appState.pool[currentFlagQIdx];
  const reason = (document.querySelector('input[name="fr"]:checked') || {}).value || 'wrong_answer';
  const note = (el('flag-note') || {}).value || '';
  const existing = appState.flags.find(f => f.q === m.q);
  if (existing) {
    existing.votes = (existing.votes || 1) + 1;
    showToast('Your vote added — ' + existing.votes + ' users flagged this question.', '#D97706');
  } else {
    appState.flags.push({ q: m.q, ch: m.c || 'PYQ', ans: m.o[m.a], reason, note, date: new Date().toLocaleDateString('en-IN'), votes: 1, status: 'pending', id: Date.now() });
    showToast('Report submitted! Thank you for helping improve accuracy 🙏', '#15803D');
  }
  saveState(); updateFlagBadge(); closeFlagModal();
  const btn = el('btn-flag');
  if (btn) { btn.classList.add('flagged'); btn.innerHTML = '🚩 Flagged'; }
}
function renderReviewPage() {
  const flags = appState.flags;
  setText('rev-total', flags.length);
  setText('rev-pending', flags.filter(f => f.status === 'pending').length);
  setText('rev-resolved', flags.filter(f => f.status === 'resolved').length);
  const list = el('flags-list'); if (!list) return;
  if (!flags.length) {
    list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted);font-size:13px">No flagged questions yet.<br>Use the 🚩 button during tests to report incorrect questions.</div>';
    return;
  }
  const rLabels = { wrong_answer:'Wrong Answer Marked', outdated:'Outdated Information', confusing:'Confusing/Ambiguous', typo:'Spelling/Typo Error' };
  list.innerHTML = '';
  [...flags].reverse().forEach((f, ri) => {
    const realIdx = flags.length - 1 - ri;
    const d = document.createElement('div');
    d.className = 'review-flag-item';
    d.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">
        <div class="rf-q">${f.q}</div>
        <div style="flex-shrink:0;background:#FEE2E2;color:#DC2626;font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px">🚩 ${f.votes||1} votes</div>
      </div>
      <div class="rf-meta">Chapter: ${f.ch} · Reported: ${f.date} · Reason: <b>${rLabels[f.reason]||f.reason}</b></div>
      ${f.note ? `<div style="font-size:12px;color:var(--muted);margin:4px 0;font-style:italic">"${f.note}"</div>` : ''}
      <div style="font-size:12px;margin:6px 0"><b>Marked Correct Answer:</b> ${f.ans}</div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span class="rf-status ${f.status==='resolved'?'rf-resolved':'rf-pending'}">${f.status==='resolved'?'✓ Resolved':'⏳ Pending Review'}</span>
        ${f.status==='pending'?`<button onclick="markResolved(${realIdx})" style="background:var(--success);color:#fff;border:none;border-radius:6px;padding:5px 12px;font-size:11px;cursor:pointer;font-weight:600">✓ Mark Resolved</button>`:''}
        <button onclick="deleteFlag(${realIdx})" style="background:none;border:1px solid #FCA5A5;color:var(--danger);border-radius:6px;padding:5px 12px;font-size:11px;cursor:pointer">Delete</button>
      </div>`;
    list.appendChild(d);
  });
}
function markResolved(idx) { appState.flags[idx].status = 'resolved'; saveState(); updateFlagBadge(); renderReviewPage(); showToast('Marked as resolved ✓', '#15803D'); }
function deleteFlag(idx) { appState.flags.splice(idx, 1); saveState(); updateFlagBadge(); renderReviewPage(); showToast('Flag deleted', '#DC2626'); }

// ── INIT ───────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  loadState();
  renderDashboard();
  initChipFilters();
  renderPYQPracticeSection();
  // Update nav badge with Q count
  const testBadges = document.querySelectorAll('.nav-item .nav-badge');
  testBadges.forEach(b => {
    if (b.closest('.nav-item') && (b.closest('.nav-item').textContent || '').includes('MCQ')) {
      b.textContent = Q.length;
    }
  });
});
