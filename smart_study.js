// ═══════════════════════════════════════════════
//  smart_study.js
//  1. Full Syllabus renderer (matches testindex exactly)
//  2. Spaced Repetition System (SRS) — Smart Review
//  3. Hooks into app.js showResults to capture wrong answers
// ═══════════════════════════════════════════════

// ══════════════════════════════════════════════
//  FULL SYLLABUS
// ══════════════════════════════════════════════

function renderSyllabus() {
  const tree = document.getElementById('syllabus-tree');
  if (!tree || typeof SYLLABUS === 'undefined') return;

  tree.innerHTML = SYLLABUS.map((paper, pi) => {
    const subjects = paper.subjects.map((subj, si) => {
      const topicsHtml = subj.topics.map(t =>
        `<div style="display:flex;align-items:flex-start;gap:8px;padding:7px 0;border-bottom:1px solid var(--border)">
          <span style="color:var(--saff);flex-shrink:0;margin-top:1px">▸</span>
          <span style="font-size:12.5px;color:var(--muted);line-height:1.5">${t}</span>
        </div>`
      ).join('');

      return `
        <div style="margin-bottom:6px">
          <div onclick="ssSylToggleSubject(${pi},${si})"
            style="display:flex;align-items:center;justify-content:space-between;background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px 16px;cursor:pointer;margin-left:12px;transition:all .15s"
            id="syl-subj-${pi}-${si}">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:16px">${subj.icon}</span>
              <span style="font-size:13px;font-weight:600;color:var(--text)">${subj.name}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:11px;color:var(--muted);background:var(--bg);padding:2px 8px;border-radius:10px;font-weight:600">${subj.topics.length} topics</span>
              <span id="syl-sarrow-${pi}-${si}" style="font-size:12px;color:var(--muted);transition:transform .2s">▶</span>
            </div>
          </div>
          <div id="syl-topics-${pi}-${si}" style="display:none;margin:6px 0 6px 24px;background:var(--card);border:1px solid var(--border);border-radius:10px;padding:4px 16px;overflow:hidden">
            ${topicsHtml}
          </div>
        </div>`;
    }).join('');

    return `
      <div style="margin-bottom:10px">
        <div onclick="ssSylTogglePaper(${pi})"
          style="display:flex;align-items:center;justify-content:space-between;background:var(--card);border:1px solid var(--border);border-left:4px solid ${paper.color};border-radius:12px;padding:14px 18px;cursor:pointer;user-select:none">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:20px">${paper.icon}</span>
            <div>
              <div style="font-family:'Syne',sans-serif;font-size:14px;font-weight:800;color:var(--text)">${paper.paper}</div>
              <div style="font-size:11px;color:var(--muted);margin-top:1px">${paper.subjects.length} subjects · ${paper.subjects.reduce((s,sub)=>s+sub.topics.length,0)} topics</div>
            </div>
          </div>
          <span id="syl-parrow-${pi}" style="font-size:14px;color:var(--muted);transition:transform .2s">▼</span>
        </div>
        <div id="syl-paper-${pi}" style="padding:8px 0 2px">
          ${subjects}
        </div>
      </div>`;
  }).join('');
}

function ssSylTogglePaper(pi) {
  const el = document.getElementById('syl-paper-' + pi);
  const arrow = document.getElementById('syl-parrow-' + pi);
  if (!el) return;
  const open = el.style.display !== 'none';
  el.style.display = open ? 'none' : 'block';
  if (arrow) arrow.style.transform = open ? 'rotate(-90deg)' : 'rotate(0)';
}

function ssSylToggleSubject(pi, si) {
  const el = document.getElementById('syl-topics-' + pi + '-' + si);
  const arrow = document.getElementById('syl-sarrow-' + pi + '-' + si);
  const header = document.getElementById('syl-subj-' + pi + '-' + si);
  if (!el) return;
  const open = el.style.display !== 'none';
  el.style.display = open ? 'none' : 'block';
  if (arrow) arrow.style.transform = open ? 'rotate(0)' : 'rotate(90deg)';
  if (header) {
    header.style.background = open ? 'var(--card)' : '#EEF0FF';
    header.style.borderColor = open ? 'var(--border)' : '#C5CAE9';
  }
}

// ══════════════════════════════════════════════
//  SRS — SPACED REPETITION SYSTEM
// ══════════════════════════════════════════════

const SRS_INTERVALS_DAYS = [1, 3, 7, 14, 30]; // review intervals
const LABS = ['A','B','C','D'];

function _srsGet() {
  try { return JSON.parse(localStorage.getItem('mppsc_srs') || '{}'); } catch { return {}; }
}
function _srsSave(data) {
  localStorage.setItem('mppsc_srs', JSON.stringify(data));
  _srsUpdateBadge();
}
function _srsKey(q) { return (q.q || '').slice(0, 100); }

// Add a wrong question to SRS — called by showResults hook
function srsAddWrong(q) {
  if (!q || !q.q) return;
  const data = _srsGet();
  const key = _srsKey(q);
  if (!data[key]) {
    // Brand new — start at level 0
    data[key] = { q: { q: q.q, o: q.o, a: q.a, c: q.c || '', e: q.e || '' }, level: 0, nextReview: Date.now(), added: Date.now() };
  } else {
    // Already exists — reset to level 0 (got it wrong again)
    data[key].level = 0;
    data[key].nextReview = Date.now();
  }
  _srsSave(data);
}

function _srsUpdateBadge() {
  const data = _srsGet();
  const now = Date.now();
  const due = Object.values(data).filter(d => d.nextReview <= now).length;
  const badge = document.getElementById('srs-count-badge');
  if (badge) {
    badge.textContent = due;
    badge.style.display = due > 0 ? 'inline-flex' : 'none';
  }
}

// ── RENDER SRS PAGE ───────────────────────────
function renderSRS() {
  _srsRenderStats();
  _srsRenderReview();
}

function _srsRenderStats() {
  const grid = document.getElementById('srs-stats-grid');
  if (!grid) return;
  const data = _srsGet();
  const all = Object.values(data);
  const now = Date.now();
  const due = all.filter(d => d.nextReview <= now).length;
  const mastered = all.filter(d => d.level >= SRS_INTERVALS_DAYS.length - 1).length;
  const learning = all.length - mastered;

  grid.innerHTML = [
    { label: 'Due Today',     value: due,            color: 'var(--danger)',  bg: '#FEF2F2' },
    { label: 'Total in SRS',  value: all.length,     color: 'var(--navy)',    bg: '#EEF2FF' },
    { label: 'Mastered',      value: mastered,        color: 'var(--success)', bg: '#ECFDF5' },
    { label: 'In Progress',   value: learning,        color: 'var(--warn)',    bg: '#FFFBEB' },
  ].map(s => `
    <div style="background:${s.bg};border-radius:12px;padding:14px 16px;box-shadow:var(--shadow)">
      <div style="font-size:11px;color:${s.color};font-weight:600;margin-bottom:4px">${s.label}</div>
      <div style="font-family:'Syne',sans-serif;font-size:28px;font-weight:800;color:${s.color}">${s.value}</div>
    </div>`).join('');
}

function _srsRenderReview() {
  const area = document.getElementById('srs-review-area');
  if (!area) return;
  const data = _srsGet();
  const now = Date.now();
  const dueItems = Object.entries(data)
    .filter(([, d]) => d.nextReview <= now)
    .map(([k, d]) => ({ key: k, ...d }));

  if (!dueItems.length) {
    // Nothing due — show empty state
    const total = Object.keys(data).length;
    area.innerHTML = `
      <div class="card" style="text-align:center;padding:36px 24px">
        <div style="font-size:48px;margin-bottom:14px">${total === 0 ? '🧠' : '✅'}</div>
        <div style="font-family:'Syne',sans-serif;font-size:17px;font-weight:800;margin-bottom:8px;color:var(--text)">
          ${total === 0 ? 'No questions in Smart Review yet' : 'All caught up for today! 🎉'}
        </div>
        <div style="font-size:13px;color:var(--muted);margin-bottom:20px;line-height:1.6">
          ${total === 0
            ? 'When you answer questions wrong in MCQ tests, they are automatically added here for spaced repetition review.'
            : `You have reviewed all ${total} question(s) for today. Come back tomorrow for the next batch.`}
        </div>
        <button class="btn-primary" style="width:auto;padding:10px 28px" onclick="showPage('test')">
          Practice MCQs →
        </button>
      </div>`;
    return;
  }

  const item = dueItems[0];
  const m = item.q;
  const remaining = dueItems.length;

  area.innerHTML = `
    <div style="margin-bottom:10px;display:flex;align-items:center;justify-content:space-between">
      <div style="font-size:12px;color:var(--muted);font-weight:600">
        ${remaining} question${remaining > 1 ? 's' : ''} due for review
      </div>
      <div style="display:flex;gap:4px">
        ${SRS_INTERVALS_DAYS.map((_, i) =>
          `<div style="width:8px;height:8px;border-radius:50%;background:${i <= item.level ? '#7C3AED' : '#E2E8F0'}"></div>`
        ).join('')}
      </div>
    </div>
    <div class="card" style="margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
        <span style="background:#EDE9FE;color:#7C3AED;font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px">REVIEW</span>
        ${m.c ? `<span style="background:#EEF0FF;color:var(--navy);font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px">${m.c}</span>` : ''}
        <span style="margin-left:auto;font-size:11px;color:var(--muted)">Level ${item.level + 1}/${SRS_INTERVALS_DAYS.length}</span>
      </div>
      <div style="font-size:15px;font-weight:600;color:var(--text);line-height:1.55;margin-bottom:18px">${m.q}</div>
      <div id="srs-opts" style="display:flex;flex-direction:column;gap:10px">
        ${(m.o || []).map((opt, j) => `
          <button class="opt" onclick="srsAnswer('${item.key.replace(/'/g, "\\'")}', ${j})" id="srs-opt-${j}">
            <span class="opt-lbl">${LABS[j]}</span>
            <span>${opt}</span>
          </button>`).join('')}
      </div>
      <div id="srs-result" style="display:none;margin-top:14px"></div>
    </div>
    <div style="display:flex;align-items:center;gap:10px;font-size:12px;color:var(--muted)">
      <span>🔄</span>
      <span>Wrong answers reset to day 1 · Correct answers advance the schedule</span>
    </div>`;
}

function srsAnswer(key, choice) {
  // Disable all option buttons
  document.querySelectorAll('#srs-opts .opt').forEach(b => { b.disabled = true; b.style.cursor = 'default'; });

  const data = _srsGet();
  const item = data[key];
  if (!item) return;
  const m = item.q;
  const correct = choice === m.a;

  // Colour the options
  (m.o || []).forEach((_, j) => {
    const btn = document.getElementById('srs-opt-' + j);
    if (!btn) return;
    if (j === m.a) { btn.classList.add('right'); }
    else if (j === choice && !correct) { btn.classList.add('wrong'); }
  });

  // Advance or reset level
  if (correct) {
    item.level = Math.min(item.level + 1, SRS_INTERVALS_DAYS.length - 1);
  } else {
    item.level = 0;
  }
  const nextDays = SRS_INTERVALS_DAYS[item.level];
  item.nextReview = Date.now() + nextDays * 86400000;
  item.lastReview = Date.now();
  data[key] = item;
  _srsSave(data);

  const resultEl = document.getElementById('srs-result');
  if (!resultEl) return;
  resultEl.style.display = 'block';
  resultEl.innerHTML = `
    <div style="background:${correct ? '#F0FDF4' : '#FEF2F2'};border:1px solid ${correct ? '#BBF7D0' : '#FCA5A5'};border-radius:10px;padding:14px 16px;margin-bottom:12px">
      <div style="font-weight:700;color:${correct ? '#15803D' : '#DC2626'};margin-bottom:4px;font-size:14px">
        ${correct ? '✅ Correct!' : '❌ Incorrect'}
      </div>
      <div style="font-size:13px;color:var(--text);font-weight:600;margin-bottom:4px">
        Correct answer: ${LABS[m.a]}) ${(m.o || [])[m.a] || ''}
      </div>
      ${m.e ? `<div style="font-size:12px;color:var(--muted);line-height:1.5;margin-top:4px">${m.e}</div>` : ''}
      <div style="font-size:11px;color:var(--muted);margin-top:8px;padding-top:8px;border-top:1px solid ${correct ? '#BBF7D0' : '#FCA5A5'}">
        ${correct ? `Next review in <b>${nextDays} day${nextDays > 1 ? 's' : ''}</b> · Level ${item.level + 1}/${SRS_INTERVALS_DAYS.length}` : 'Reset to Day 1 — keep practising!'}
      </div>
    </div>
    <button class="btn-primary" onclick="renderSRS()" style="width:auto;padding:10px 28px">
      Next →
    </button>`;
}

// ══════════════════════════════════════════════
//  HOOK INTO app.js showResults
//  Capture wrong answers after every test
// ══════════════════════════════════════════════

// Patch showResults to add SRS capture + best score tracking
(function() {
  function patchShowResults() {
    if (typeof showResults !== 'function') {
      setTimeout(patchShowResults, 300);
      return;
    }
    const _orig = showResults;
    window.showResults = function() {
      _orig.apply(this, arguments);
      // Capture wrong answers into SRS
      if (typeof appState !== 'undefined' && appState.pool && appState.ans) {
        appState.ans.forEach((a, i) => {
          const m = appState.pool[i];
          if (!m) return;
          const isWrong = a !== null && a !== -1 && !appState.revArr[i] && a !== m.a;
          if (isWrong) srsAddWrong(m);
        });
      }
      // Save best score for leaderboard
      if (typeof appState !== 'undefined' && appState.pool && appState.pool.length > 0) {
        try {
          let c = 0;
          appState.ans.forEach((a, i) => { if (a === appState.pool[i].a) c++; });
          const pct = Math.round(c / appState.pool.length * 100);
          const uid = typeof getLocalUser === 'function' ? (getLocalUser() || {}).uid : null;
          if (uid && typeof firebase !== 'undefined') {
            const ref = firebase.firestore().collection('users').doc(uid);
            ref.get().then(snap => {
              const prev = snap.exists ? (snap.data().bestScore || 0) : 0;
              const total = snap.exists ? (snap.data().totalQuestions || 0) : 0;
              const updates = { totalQuestions: total + appState.pool.length };
              if (pct > prev) updates.bestScore = pct;
              ref.set(updates, { merge: true });
            }).catch(() => {});
          }
        } catch(e) {}
      }
      _srsUpdateBadge();
    };
  }
  patchShowResults();
})();

// ══════════════════════════════════════════════
//  BOOKMARKS SYSTEM
// ══════════════════════════════════════════════

function _bmGet() { try { return JSON.parse(localStorage.getItem('mppsc_bookmarks') || '[]'); } catch { return []; } }
function _bmSave(bms) {
  localStorage.setItem('mppsc_bookmarks', JSON.stringify(bms));
  _bmUpdateBadge();
}
function _bmUpdateBadge() {
  const bms = _bmGet();
  const badge = document.getElementById('bookmark-count-badge');
  if (badge) { badge.textContent = bms.length; badge.style.display = bms.length ? 'inline-flex' : 'none'; }
  const total = document.getElementById('bookmark-total-count');
  if (total) total.textContent = bms.length + ' saved';
}

function toggleQBookmark() {
  if (typeof appState === 'undefined' || !appState.pool) return;
  const m = appState.pool[appState.cur];
  if (!m) return;
  const bms = _bmGet();
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
  _bmSave(bms);
}

function updateBookmarkBtnState() {
  if (typeof appState === 'undefined' || !appState.pool) return;
  const m = appState.pool[appState.cur];
  if (!m) return;
  const bms = _bmGet();
  const isBookmarked = bms.some(b => b.q === m.q);
  const btn = document.getElementById('btn-bookmark');
  if (btn) { btn.style.background = isBookmarked ? '#FCD34D' : '#FFF7ED'; btn.style.color = isBookmarked ? '#92400E' : '#D97706'; }
}

function renderBookmarks() {
  const list = document.getElementById('bookmarks-list');
  const total = document.getElementById('bookmark-total-count');
  if (!list) return;
  const bms = _bmGet();
  if (total) total.textContent = bms.length + ' saved';
  if (!bms.length) {
    list.innerHTML = '<div style="text-align:center;padding:32px;color:var(--muted);font-size:13px;line-height:1.8">No bookmarks yet.<br>Tap 🔖 while answering any question to save it here.</div>';
    return;
  }
  list.innerHTML = bms.map((b, i) => `
    <div style="padding:14px 0;border-bottom:1px solid var(--border)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:10px">
        <div style="font-size:13px;font-weight:600;color:var(--text);line-height:1.5;flex:1">${b.q}</div>
        <button onclick="removeBookmark(${i})" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:16px;flex-shrink:0;padding:0;line-height:1">🗑</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px">
        ${(b.o || []).map((opt, j) => `
          <div style="font-size:12.5px;padding:7px 12px;border-radius:8px;border:1.5px solid ${j === b.a ? '#16A34A' : 'var(--border)'};background:${j === b.a ? '#F0FDF4' : 'var(--bg)'};color:${j === b.a ? '#15803D' : 'var(--muted)'};font-weight:${j === b.a ? '700' : '400'}">
            ${LABS[j]}) ${opt} ${j === b.a ? '✓' : ''}
          </div>`).join('')}
      </div>
      ${b.e ? `<div class="ans-box show" style="display:block"><div class="ans-expl">${b.e}</div></div>` : ''}
      <div style="font-size:11px;color:var(--muted);margin-top:6px">${b.c || ''} · Saved ${new Date(b.saved).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'})}</div>
    </div>`).join('');
}

function removeBookmark(idx) {
  const bms = _bmGet();
  bms.splice(idx, 1);
  _bmSave(bms);
  renderBookmarks();
}

function clearAllBookmarks() {
  if (!confirm('Clear all bookmarks? This cannot be undone.')) return;
  _bmSave([]);
  renderBookmarks();
  if (typeof showToast === 'function') showToast('All bookmarks cleared', '#64748B');
}

// ══════════════════════════════════════════════
//  CURRENT AFFAIRS DATA + RENDER
// ══════════════════════════════════════════════

const CA_DATA = [
  { title: 'MPPSC 2026 Prelims Notification Released', desc: 'MPPSC has released the official notification for Prelims 2026. Total vacancies: 350. Application window opens March 15 – April 15, 2026. Exam date: June 2026.', tag: 'mp', date: 'March 2026' },
  { title: 'MP Budget 2026-27 — ₹3.65 Lakh Crore', desc: 'Chief Minister Mohan Yadav presented MP\'s largest ever budget with 35% increase in education, ₹18,000 crore for roads, and expansion of Ladli Behna Yojana.', tag: 'mp', date: 'March 2026' },
  { title: 'India GDP Growth Q3 FY2026 — 7.2%', desc: 'India\'s GDP grew at 7.2% in Q3 FY2026, remaining the world\'s fastest-growing major economy. Services sector led at 8.1%, manufacturing at 6.8%.', tag: 'national', date: 'March 2026' },
  { title: 'RBI Keeps Repo Rate at 6.25%', desc: 'RBI\'s Monetary Policy Committee kept repo rate unchanged at 6.25% for third consecutive meeting, maintaining accommodative stance to support growth while controlling inflation.', tag: 'national', date: 'February 2026' },
  { title: 'India-ASEAN Enhanced Trade Framework Signed', desc: 'India signed an enhanced trade and investment framework with ASEAN nations at the India-ASEAN Summit, targeting bilateral trade of $300 billion by 2030.', tag: 'international', date: 'February 2026' },
  { title: 'Indore Wins Cleanest City Award — 7th Consecutive Year', desc: 'Indore (MP) won the Swachh Survekshan 2025 award as India\'s cleanest city for the 7th consecutive year, followed by Surat and Navi Mumbai.', tag: 'mp', date: 'January 2026' },
  { title: 'India Launches NISAR Satellite with NASA', desc: 'ISRO launched NISAR (NASA-ISRO Synthetic Aperture Radar) — the most expensive Earth observation satellite at $1.5 billion — from Sriharikota.', tag: 'national', date: 'January 2026' },
  { title: 'G20 Summit 2026 — South Africa', desc: 'South Africa hosted G20 Summit in Johannesburg. India played key role in agenda-setting on climate finance, AI governance, and debt relief for Global South nations.', tag: 'international', date: 'January 2026' },
  { title: 'India Becomes World\'s 3rd Largest Economy (PPP)', desc: 'World Bank report confirmed India overtook Japan to become 3rd largest economy by Purchasing Power Parity (PPP), trailing only USA and China.', tag: 'national', date: 'December 2025' },
  { title: 'Kuno National Park — 30 Cheetahs Established', desc: 'Kuno National Park (MP) reached milestone of 30 African cheetahs after latest batch from Namibia and South Africa. India\'s cheetah reintroduction project continues successfully.', tag: 'mp', date: 'December 2025' },
  { title: 'COP30 — Brazil Climate Summit Outcomes', desc: 'COP30 in Belem, Brazil concluded with updated NDCs. India pledged 500 GW renewable energy by 2030 and reaffirmed 2070 net-zero target. Loss and damage fund operationalised.', tag: 'international', date: 'November 2025' },
  { title: 'Chandrayaan-4 Mission Approved', desc: 'ISRO\'s Chandrayaan-4 mission received government approval with budget of ₹2,104 crore. Mission aims to bring lunar samples back to Earth — India\'s first sample return mission.', tag: 'national', date: 'November 2025' },
];

let _caFilter = 'all';

function filterCA(tag) {
  _caFilter = tag;
  ['all','national','mp','international'].forEach(t => {
    const btn = document.getElementById('ca-tab-' + t);
    if (!btn) return;
    btn.style.background = t === tag ? '#1A237E' : '#F1F5F9';
    btn.style.color = t === tag ? '#fff' : '#64748B';
  });
  _renderCA();
}

function renderCurrentAffairs() {
  const title = document.getElementById('ca-month-title');
  if (title) title.textContent = 'Current Affairs — March 2026';
  _renderCA();
}

function _renderCA() {
  const list = document.getElementById('current-affairs-list');
  if (!list) return;
  const items = _caFilter === 'all' ? CA_DATA : CA_DATA.filter(d => d.tag === _caFilter);
  if (!items.length) {
    list.innerHTML = '<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px">No items in this category.</div>';
    return;
  }
  const tagStyle = { national: ['#EEF2FF','#3730A3','🏛 National'], mp: ['#FFF7ED','#C2410C','🏙 MP Special'], international: ['#F0FDF4','#166534','🌍 International'] };
  list.innerHTML = items.map(item => {
    const [bg, color, label] = tagStyle[item.tag] || ['#F1F5F9','#374151', item.tag];
    return `<div class="card" style="margin-bottom:10px;padding:16px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="display:inline-block;font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;background:${bg};color:${color}">${label}</span>
        <span style="font-size:11px;color:var(--muted);font-weight:600">${item.date}</span>
      </div>
      <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:6px;line-height:1.4">${item.title}</div>
      <div style="font-size:12.5px;color:var(--muted);line-height:1.6">${item.desc}</div>
    </div>`;
  }).join('');
}

// ══════════════════════════════════════════════
//  SETTINGS — NOTIFICATIONS
// ══════════════════════════════════════════════

function toggleNotifications(enabled) {
  if (enabled && 'Notification' in window) {
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') {
        localStorage.setItem('notifications_enabled', '1');
        if (typeof showToast === 'function') showToast('🔔 Daily reminders enabled!', '#059669');
      } else {
        document.getElementById('setting-notifications') && (document.getElementById('setting-notifications').checked = false);
        if (typeof showToast === 'function') showToast('Notifications blocked in browser settings', '#DC2626');
      }
    });
  } else {
    localStorage.removeItem('notifications_enabled');
    if (typeof showToast === 'function') showToast('Notifications disabled', '#64748B');
  }
}

// ══════════════════════════════════════════════
//  INIT — hook into showPage
// ══════════════════════════════════════════════

(function() {
  function patchShowPage() {
    if (typeof showPage !== 'function') { setTimeout(patchShowPage, 300); return; }
    const _orig = showPage;
    window.showPage = function(id, skipTestReset) {
      _orig.apply(this, arguments);
      if (id === 'syllabus')       { renderSyllabus(); }
      if (id === 'srsreview')      { renderSRS(); }
      if (id === 'bookmarkspage')  { renderBookmarks(); }
      if (id === 'currentaffairs') { renderCurrentAffairs(); }
    };
  }
  patchShowPage();
})();

// Init badges on load
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    _srsUpdateBadge();
    _bmUpdateBadge();
    // Restore notification toggle state
    const notifEl = document.getElementById('setting-notifications');
    if (notifEl) notifEl.checked = localStorage.getItem('notifications_enabled') === '1';
  }, 800);
});
