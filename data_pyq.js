// ═══════════════════════════════════════════════════════════════════
//  data_pyq.js  —  Master PYQ loader + PYQ_PAPERS builder
//  Converts raw pyq_YYYY_pN objects → PYQ_PAPERS array used by app.js
//  Format bridge: {opts, ans, exp} → {o, a, n, c:'PYQ'}
// ═══════════════════════════════════════════════════════════════════

// ── Raw paper list (loaded from individual paper files) ────────────
const pyqData = [
  pyq_2024_p1,
  pyq_2024_p2,
  pyq_2023_p1,
  pyq_2023_p2,
  pyq_2022_p1,
  pyq_2022_p2,
  pyq_2021_p1,
  pyq_2021_p2,
];

// ── Convert a raw PYQ paper object → PYQ_PAPERS entry ─────────────
function buildPYQEntry(raw) {
  const mcqs = (raw.questions || [])
    .filter(q => q && q.opts && q.opts.length === 4 && typeof q.ans === 'number')
    .map(q => ({
      q: q.q,
      o: q.opts,
      a: q.ans,
      n: q.exp || '',
      c: raw.year + ' ' + raw.paper,
      pyq: true
    }));

  return {
    year:    raw.year,
    paper:   raw.paper,
    paperId: raw.paperId,
    name:    raw.title,
    date:    raw.year,
    duration: raw.duration || '120 min',
    totalQ:  raw.totalQ || 100,
    pdfUrl:  raw.pdfUrl  || '',
    tags:    [raw.paper, raw.year, raw.duration || '120 min'],
    mcqs
  };
}

// ── Global PYQ_PAPERS array used throughout app.js ─────────────────
const PYQ_PAPERS = pyqData.map(buildPYQEntry);
