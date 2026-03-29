// ═══════════════════════════════════════════════════════
//  MPPSC APP — AUTH + TRIAL + PREMIUM SYSTEM
//  Email/Password login → 7-day free trial → ₹100 / 6 months
// ═══════════════════════════════════════════════════════

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAJoOz73MrNt2pEVPf5Gh9BQ5r7yWz2l-Y",
  authDomain: "mpgk-9496d.firebaseapp.com",
  projectId: "mpgk-9496d",
  storageBucket: "mpgk-9496d.firebasestorage.app",
  messagingSenderId: "77589429691",
  appId: "1:77589429691:android:bc9b1754c40d5510c0589e"
};

const RAZORPAY_KEY = "YOUR_RAZORPAY_KEY_ID";
const PREMIUM_PRICE = 10000;
const PREMIUM_MONTHS = 6;

const FEATURES = [
  { icon: '📚', label: 'All 421+ MCQ Questions' },
  { icon: '📄', label: 'PYQ Papers 2021–2024' },
  { icon: '⏱️', label: 'Unlimited Timed Mocks' },
  { icon: '🔁', label: 'Smart Revision Mode' },
  { icon: '📖', label: 'Complete Study Notes' },
  { icon: '🃏', label: 'Flashcard Mode' },
  { icon: '📊', label: 'Progress Analytics' },
  { icon: '🗺️', label: 'Map Quiz — MP & India' },
];

let currentUser = null;
let firebaseAuth = null;
let _isAdmin = false;
let _timerInterval = null;

// ── INIT FIREBASE ────────────────────────────────────────
function initFirebase() {
  if (typeof firebase === 'undefined') { setTimeout(initFirebase, 500); return; }
  if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
  firebaseAuth = firebase.auth();
  _setReviewNavVisible(false);
  firebaseAuth.onAuthStateChanged(async user => {
    if (user) {
      currentUser = user;
      saveUserLocally(user);
      await _loadAndInitUser(user.uid);
      await _checkAdmin(user.email);
      onUserLoggedIn(user);
    } else {
      currentUser = null;
      _isAdmin = false;
      _setReviewNavVisible(false);
      showLoginScreen();
    }
  });
}

async function _checkAdmin(email) {
  _isAdmin = false;
  try {
    if (typeof firebase.firestore !== 'function') return;
    const snap = await firebase.firestore().collection('config').doc('admins').get();
    if (snap.exists) _isAdmin = (snap.data().emails || []).includes(email);
  } catch(e) {}
  _setReviewNavVisible(_isAdmin);
}

function _setReviewNavVisible(show) {
  const nav = document.querySelector('[onclick="showPage(\'review\')"]');
  if (nav) nav.style.display = show ? 'flex' : 'none';
}

function isAdmin() { return _isAdmin; }

// ── LOGIN SCREEN ─────────────────────────────────────────
function showLoginScreen() {
  if (localStorage.getItem('mppsc_user')) return;
  if (document.getElementById('login-screen')) return;
  const el = document.createElement('div');
  el.id = 'login-screen';
  el.style.cssText = 'position:fixed;inset:0;background:#1A237E;z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px';
  el.innerHTML = `
    <div style="background:#fff;border-radius:24px;padding:36px 28px;max-width:360px;width:100%;text-align:center">
      <img src="icon.png" onerror="this.style.display='none'" style="width:72px;height:72px;border-radius:16px;margin-bottom:16px;object-fit:cover">
      <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#1A237E;margin-bottom:4px">MP GK Portal</div>
      <div style="font-size:13px;color:#64748B;margin-bottom:20px">MPPSC 2026 — Complete Prep</div>
      <div style="background:#F0F4FF;border-radius:12px;padding:14px;margin-bottom:20px;text-align:left">
        <div style="font-size:13px;font-weight:700;color:#1A237E;margin-bottom:8px">🎁 Free Trial Includes:</div>
        <div style="font-size:12px;color:#374151;line-height:2">
          ✅ All 421+ MCQs for 7 days<br>✅ Full PYQ papers access<br>✅ Timed mock tests<br>✅ Complete notes &amp; flashcards
        </div>
      </div>
      <div id="auth-tabs" style="display:flex;gap:8px;margin-bottom:16px">
        <button id="tab-login" onclick="_switchTab('login')"
          style="flex:1;padding:9px;background:#1A237E;color:#fff;border:none;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif">Login</button>
        <button id="tab-register" onclick="_switchTab('register')"
          style="flex:1;padding:9px;background:#F1F5F9;color:#64748B;border:none;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif">Register</button>
      </div>
      <input id="auth-name" type="text" placeholder="Your name" autocomplete="name"
        style="display:none;width:100%;padding:12px 14px;border:2px solid #E5E7EB;border-radius:10px;font-size:14px;margin-bottom:10px;box-sizing:border-box;font-family:'DM Sans',sans-serif;outline:none">
      <input id="auth-email" type="email" placeholder="Email address" autocomplete="email"
        style="width:100%;padding:12px 14px;border:2px solid #E5E7EB;border-radius:10px;font-size:14px;margin-bottom:10px;box-sizing:border-box;font-family:'DM Sans',sans-serif;outline:none">
      <input id="auth-pass" type="password" placeholder="Password" autocomplete="current-password"
        style="width:100%;padding:12px 14px;border:2px solid #E5E7EB;border-radius:10px;font-size:14px;margin-bottom:14px;box-sizing:border-box;font-family:'DM Sans',sans-serif;outline:none">
      <button id="auth-btn" onclick="_handleAuth()"
        style="width:100%;padding:14px;background:#1A237E;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;margin-bottom:10px">Login</button>
      <div id="forgot-link" style="font-size:12px;color:#1A237E;cursor:pointer;margin-bottom:6px" onclick="_forgotPassword()">Forgot password?</div>
      <div id="login-error" style="color:#DC2626;font-size:12px;margin-top:6px;min-height:16px"></div>
      <div style="font-size:11px;color:#9CA3AF;margin-top:12px">By continuing you agree to our <a href="privacy.html" style="color:#1A237E">Privacy Policy</a></div>
    </div>
  `;
  document.body.appendChild(el);
}

let _currentTab = 'login';
function _switchTab(tab) {
  _currentTab = tab;
  const nameEl = document.getElementById('auth-name');
  const btn = document.getElementById('auth-btn');
  const tl = document.getElementById('tab-login');
  const tr = document.getElementById('tab-register');
  const forgot = document.getElementById('forgot-link');
  if (tab === 'login') {
    nameEl.style.display = 'none'; btn.textContent = 'Login';
    tl.style.background = '#1A237E'; tl.style.color = '#fff';
    tr.style.background = '#F1F5F9'; tr.style.color = '#64748B';
    if (forgot) forgot.style.display = 'block';
  } else {
    nameEl.style.display = 'block'; btn.textContent = 'Create Account';
    tr.style.background = '#1A237E'; tr.style.color = '#fff';
    tl.style.background = '#F1F5F9'; tl.style.color = '#64748B';
    if (forgot) forgot.style.display = 'none';
  }
  document.getElementById('login-error').textContent = '';
}

async function _handleAuth() {
  if (!firebaseAuth) return;
  const email = document.getElementById('auth-email').value.trim();
  const pass  = document.getElementById('auth-pass').value;
  const name  = document.getElementById('auth-name').value.trim();
  const btn   = document.getElementById('auth-btn');
  const errEl = document.getElementById('login-error');
  errEl.textContent = ''; errEl.style.color = '#DC2626';
  if (!email || !pass) { errEl.textContent = 'Enter email and password.'; return; }
  if (pass.length < 6)  { errEl.textContent = 'Password must be 6+ characters.'; return; }
  if (_currentTab === 'register' && !name) { errEl.textContent = 'Enter your name.'; return; }
  btn.disabled = true;
  btn.textContent = _currentTab === 'login' ? 'Logging in…' : 'Creating account…';
  try {
    if (_currentTab === 'login') {
      await firebaseAuth.signInWithEmailAndPassword(email, pass);
    } else {
      const res = await firebaseAuth.createUserWithEmailAndPassword(email, pass);
      await res.user.updateProfile({ displayName: name });
      // trial started automatically by _loadAndInitUser via onAuthStateChanged
    }
  } catch(e) {
    console.error('Firebase auth error:', e.code, e.message);
    let msg = 'Something went wrong. Try again. (' + (e.code || 'unknown') + ')';
    if (['auth/user-not-found','auth/wrong-password','auth/invalid-credential','auth/invalid-login-credentials'].includes(e.code)) msg = 'Wrong email or password.';
    else if (e.code === 'auth/email-already-in-use') msg = 'Email already registered. Login instead.';
    else if (e.code === 'auth/invalid-email') msg = 'Invalid email address.';
    else if (e.code === 'auth/too-many-requests') msg = 'Too many attempts. Try later.';
    else if (e.code === 'auth/operation-not-allowed') msg = 'Email/Password login not enabled. Enable it in Firebase Console → Authentication → Sign-in Providers.';
    else if (e.code === 'auth/network-request-failed') msg = 'Network error. Check your internet connection.';
    else if (e.code === 'auth/weak-password') msg = 'Password too weak. Use at least 6 characters.';
    else if (e.code === 'auth/configuration-not-found') msg = 'Firebase config error. Check your API key and project ID.';
    errEl.textContent = msg;
    btn.disabled = false;
    btn.textContent = _currentTab === 'login' ? 'Login' : 'Create Account';
  }
}

async function _forgotPassword() {
  const email = document.getElementById('auth-email').value.trim();
  const errEl = document.getElementById('login-error');
  if (!email) { errEl.style.color='#DC2626'; errEl.textContent = 'Enter your email above first.'; return; }
  try {
    await firebaseAuth.sendPasswordResetEmail(email);
    errEl.style.color = '#15803D'; errEl.textContent = '✅ Reset email sent! Check your inbox.';
  } catch(e) { errEl.style.color='#DC2626'; errEl.textContent = 'Could not send reset email.'; }
}

// ── USER HELPERS ──────────────────────────────────────────
function saveUserLocally(user) {
  localStorage.setItem('mppsc_user', JSON.stringify({
    uid: user.uid, name: user.displayName || user.email.split('@')[0],
    email: user.email, photo: user.photoURL || null
  }));
}
function getLocalUser() { try { return JSON.parse(localStorage.getItem('mppsc_user')); } catch { return null; } }
function removeLoginScreen() { document.getElementById('login-screen')?.remove(); }

// ── FIRESTORE USER RECORD ────────────────────────────────
// All trial/premium lives in Firestore: users/{uid}
// trialStart (ms) — set once, never reset by user
// premiumExpiry (ms) — admin can set/revoke

let _userRecord = { trialStart: 0, premiumExpiry: 0 };

async function _loadAndInitUser(uid) {
  try {
    const ref = firebase.firestore().collection('users').doc(uid);
    const snap = await ref.get();
    if (snap.exists) {
      const d = snap.data();
      _userRecord = { trialStart: d.trialStart||0, premiumExpiry: d.premiumExpiry||0 };
      // Save email for admin lookup
      if (!d.email) await ref.set({ email: firebase.auth().currentUser.email }, { merge: true });
    } else {
      // First ever login — create record + start trial
      const now = Date.now();
      _userRecord = { trialStart: now, premiumExpiry: 0 };
      await ref.set({ trialStart: now, premiumExpiry: 0, email: firebase.auth().currentUser.email });
      showToastSafe('🎁 7-day free trial started!', '#15803D');
    }
  } catch(e) {
    console.warn('Firestore error:', e);
    // Fallback to localStorage if offline
    const cached = localStorage.getItem('userRecord_' + uid);
    if (cached) _userRecord = JSON.parse(cached);
    else _userRecord = { trialStart: Date.now(), premiumExpiry: 0 };
  }
  localStorage.setItem('userRecord_' + uid, JSON.stringify(_userRecord));
}

// ── TRIAL SYSTEM ──────────────────────────────────────────
function getTrialMsLeft() {
  const start = _userRecord.trialStart;
  if (!start) return 0;
  return Math.max(0, start + 7 * 86400000 - Date.now());
}
function getTrialDaysLeft()  { return Math.ceil(getTrialMsLeft() / 86400000); }
function isTrialActive()     { return getTrialMsLeft() > 0; }

// ── PREMIUM SYSTEM ────────────────────────────────────────
function isPremium() { return (_userRecord.premiumExpiry||0) > Date.now(); }
function getPremiumDaysLeft() {
  return Math.max(0, Math.ceil((_userRecord.premiumExpiry - Date.now()) / 86400000));
}
async function setPremium(uid, months) {
  const expiry = Date.now() + months * 30 * 86400000;
  _userRecord.premiumExpiry = expiry;
  localStorage.setItem('userRecord_' + uid, JSON.stringify(_userRecord));
  try { await firebase.firestore().collection('users').doc(uid).set({ premiumExpiry: expiry }, { merge: true }); } catch(e) {}
}

// ── ACCESS CHECK ──────────────────────────────────────────
function hasAccess() {
  if (!getLocalUser()) return false;
  return isPremium() || _isAdmin || isTrialActive();
}
function checkAccessOrShowPaywall(featureName) {
  if (hasAccess()) return true; showPaywall(featureName); return false;
}

// ── PAYWALL ───────────────────────────────────────────────
function showPaywall(featureName) {
  if (document.getElementById('paywall-modal')) return;
  const user = getLocalUser();
  const el = document.createElement('div');
  el.id = 'paywall-modal';
  el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
  el.innerHTML = `
    <div style="background:#fff;border-radius:24px;padding:32px 28px;max-width:360px;width:100%;text-align:center">
      <div style="font-size:44px;margin-bottom:12px">🔒</div>
      <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:#1A237E;margin-bottom:6px">Premium Required</div>
      <div style="font-size:13px;color:#64748B;margin-bottom:20px">${user ? 'Your 7-day free trial has ended.' : 'Sign in to start your free trial.'}</div>
      <div style="background:#F0F4FF;border-radius:14px;padding:16px;margin-bottom:20px">
        <div style="font-family:'Syne',sans-serif;font-size:28px;font-weight:800;color:#1A237E">₹100</div>
        <div style="font-size:13px;color:#64748B">for 6 months full access</div>
        <div style="font-size:11px;color:#9CA3AF;margin-top:4px">That's just ₹17/month!</div>
        <div style="margin-top:12px;font-size:12px;color:#374151;line-height:1.8;text-align:left">
          ✅ All 421+ MCQ questions<br>✅ All PYQ papers 2021–2024<br>✅ Unlimited timed mocks<br>✅ Smart revision mode<br>✅ Full notes &amp; flashcards
        </div>
      </div>
      <button onclick="openPayment()" id="pay-btn"
        style="width:100%;padding:14px;background:#1A237E;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;margin-bottom:10px;font-family:'DM Sans',sans-serif">
        🔓 Unlock for ₹100
      </button>
      <button onclick="document.getElementById('paywall-modal').remove()"
        style="width:100%;padding:10px;background:transparent;color:#9CA3AF;border:none;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">
        Maybe later
      </button>
    </div>
  `;
  document.body.appendChild(el);
}

// ── RAZORPAY PAYMENT ──────────────────────────────────────
function openPayment() {
  const user = getLocalUser(); if (!user) { showLoginScreen(); return; }
  if (typeof Razorpay === 'undefined') {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'; s.onload = () => openPayment();
    document.head.appendChild(s); return;
  }
  const btn = document.getElementById('pay-btn');
  if (btn) { btn.textContent = 'Opening payment…'; btn.disabled = true; }
  const rzp = new Razorpay({
    key: RAZORPAY_KEY, amount: PREMIUM_PRICE, currency: 'INR',
    name: 'MP GK Portal', description: '6 Months Premium Access', image: 'icon.png',
    prefill: { name: user.name || '', email: user.email || '', contact: '' },
    notes: { uid: user.uid, months: PREMIUM_MONTHS },
    theme: { color: '#1A237E' },
    handler: function(response) {
      setPremium(user.uid, PREMIUM_MONTHS);
      document.getElementById('paywall-modal')?.remove();
      document.getElementById('account-modal')?.remove();
      updateUserBadge();
      showToastSafe('🎉 Premium unlocked for 6 months!', '#15803D');
      localStorage.setItem('last_payment_' + user.uid, response.razorpay_payment_id);
    },
    modal: { ondismiss: () => { if (btn) { btn.textContent = '🔓 Unlock for ₹100'; btn.disabled = false; } } }
  });
  rzp.on('payment.failed', () => { showToastSafe('Payment failed. Try again.', '#DC2626'); if (btn) { btn.textContent = '🔓 Unlock for ₹100'; btn.disabled = false; } });
  rzp.open();
}

// ── ON USER LOGGED IN ─────────────────────────────────────
function onUserLoggedIn(user) {
  removeLoginScreen();
  updateUserBadge();
  const daysLeft = getTrialDaysLeft();
  if (!isPremium() && !_isAdmin && daysLeft > 0 && daysLeft <= 2) {
    setTimeout(() => showToastSafe(`⚠️ Trial ends in ${daysLeft} day${daysLeft > 1 ? 's' : ''}!`, '#D97706'), 3000);
  }
  if (!isPremium() && !_isAdmin && !isTrialActive()) {
    setTimeout(() => showPaywall('full app access'), 1500);
  }
}

// ── USER BADGE ────────────────────────────────────────────
function updateUserBadge() {
  const user = getLocalUser(); if (!user) return;
  let badge = document.getElementById('user-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'user-badge';
    badge.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;padding:6px 10px;background:#fff;border:1px solid #E2E8F0;border-radius:10px;font-size:12px;font-weight:600;color:#1E293B';
    badge.onclick = showAccountModal;
    document.querySelector('.topbar-right')?.prepend(badge);
  }
  const premium = isPremium(); const daysLeft = getTrialDaysLeft();
  badge.innerHTML = `
    ${user.photo ? `<img src="${user.photo}" style="width:24px;height:24px;border-radius:50%;object-fit:cover">` : '👤'}
    <span style="max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${(user.name||'User').split(' ')[0]}</span>
    ${_isAdmin ? `<span style="background:#5E35B1;color:#fff;font-size:10px;padding:2px 7px;border-radius:20px">ADMIN</span>`
      : premium ? `<span style="background:#15803D;color:#fff;font-size:10px;padding:2px 7px;border-radius:20px">PRO</span>`
      : daysLeft > 0 ? `<span style="background:#D97706;color:#fff;font-size:10px;padding:2px 7px;border-radius:20px">${daysLeft}d trial</span>`
      : `<span style="background:#DC2626;color:#fff;font-size:10px;padding:2px 7px;border-radius:20px">Expired</span>`}
  `;
}

// ── ACCOUNT MODAL ─────────────────────────────────────────
function showAccountModal() {
  document.getElementById('account-modal')?.remove();
  if (_timerInterval) { clearInterval(_timerInterval); _timerInterval = null; }
  const user = getLocalUser(); if (!user) return;

  const premium = isPremium();
  const trialMs = getTrialMsLeft();
  const trialActive = trialMs > 0;
  let state = 'expired';
  if (_isAdmin) state = 'admin';
  else if (premium) state = 'premium';
  else if (trialActive) state = 'trial';

  const headerBg = {
    trial:   'background:linear-gradient(135deg,#4527A0,#7B1FA2)',
    expired: 'background:linear-gradient(135deg,#B71C1C,#C62828)',
    premium: 'background:linear-gradient(135deg,#1B5E20,#2E7D32)',
    admin:   'background:linear-gradient(135deg,#4527A0,#6A1B9A)',
  }[state];

  const headerBadge = {
    trial:   `<span style="background:rgba(255,255,255,.2);border-radius:20px;padding:4px 14px;font-size:12px;font-weight:700">⏳ TRIAL ACTIVE</span>`,
    expired: `<span style="background:rgba(255,255,255,.2);border-radius:20px;padding:4px 14px;font-size:11px;font-weight:700">🔴 TRIAL EXPIRED — UPGRADE TO CONTINUE</span>`,
    premium: `<span style="background:rgba(255,255,255,.2);border-radius:20px;padding:4px 14px;font-size:12px;font-weight:700">✅ PREMIUM ACTIVE — ${getPremiumDaysLeft()} DAYS LEFT</span>`,
    admin:   `<span style="background:rgba(255,255,255,.2);border-radius:20px;padding:4px 14px;font-size:12px;font-weight:700">🛡️ ADMIN ACCOUNT — FULL ACCESS</span>`,
  }[state];

  const timerHTML = trialActive ? `
    <div style="background:rgba(0,0,0,.2);border-radius:10px;padding:10px 14px;margin-top:12px;font-size:12px;color:rgba(255,255,255,.8)">
      Time remaining: <span id="modal-timer" style="font-family:'Syne',sans-serif;font-weight:700;color:#fff;font-size:13px">--</span>
      <div style="font-size:11px;color:rgba(255,255,255,.55);margin-top:2px">everything locks when this hits zero</div>
    </div>` : '';

  const featuresHTML = FEATURES.map(f => {
    const locked = state === 'expired';
    return `<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #F1F5F9">
      <span style="font-size:16px">${f.icon}</span>
      <span style="flex:1;font-size:13px;color:${locked?'#94A3B8':'#1E293B'}">${f.label}</span>
      <span style="font-size:14px">${locked?'🔒':'✅'}</span>
    </div>`;
  }).join('');

  const upgradeCard = (state === 'trial' || state === 'expired') ? `
    <div style="background:linear-gradient(135deg,#1A237E,#283593);border-radius:14px;padding:18px;margin-bottom:16px;text-align:center;color:#fff">
      <div style="font-family:'Syne',sans-serif;font-size:26px;font-weight:800">₹100 <span style="font-size:14px;opacity:.7">/ 6 months</span></div>
      <div style="font-size:12px;opacity:.8;margin-top:2px">less than ₹17/month — less than 1 chai ☕</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:12px">
        ${['No subscription','One-time payment','Instant activation','All 8 features'].map(t =>
          `<div style="background:rgba(255,255,255,.1);border-radius:8px;padding:6px 8px;font-size:11px;font-weight:600">${t}</div>`
        ).join('')}
      </div>
    </div>
    <button onclick="document.getElementById('account-modal').remove();openPayment()" id="upgrade-btn"
      style="width:100%;padding:15px;background:#1A237E;color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:800;cursor:pointer;margin-bottom:12px;font-family:'Syne',sans-serif">
      🔓 Get Premium — ₹100
    </button>` : '';

  const adminBtn = _isAdmin ? `
    <button onclick="document.getElementById('account-modal').remove();showAdminPanel()"
      style="width:100%;padding:10px;background:#EEF2FF;color:#1A237E;border:1px solid #C7D7FD;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;margin-bottom:8px;font-family:'DM Sans\'sans-serif">
      🔧 Admin Panel
    </button>` : '';

  const el = document.createElement('div');
  el.id = 'account-modal';
  el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:99999;display:flex;align-items:flex-end;justify-content:center;padding:0';
  el.innerHTML = `
    <div style="background:#fff;border-radius:24px 24px 0 0;max-width:480px;width:100%;max-height:92vh;overflow-y:auto">
      <div style="${headerBg};border-radius:24px 24px 0 0;padding:24px 24px 20px;color:#fff;text-align:center">
        <div style="width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,.2);margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:28px;overflow:hidden">
          ${user.photo ? `<img src="${user.photo}" style="width:64px;height:64px;object-fit:cover">` : '👤'}
        </div>
        <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;margin-bottom:4px">${user.name||'User'}</div>
        <div style="font-size:12px;opacity:.7;margin-bottom:12px">${user.email}</div>
        ${headerBadge}${timerHTML}
      </div>
      <div style="padding:20px 20px 8px">
        <div style="font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px">Features</div>
        <div style="margin-bottom:16px">${featuresHTML}</div>
        ${upgradeCard}${adminBtn}
        <button onclick="showPage('donate');document.getElementById('account-modal').remove()"
          style="width:100%;padding:10px;background:#FFF7ED;color:#C2410C;border:1px solid #FED7AA;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;margin-bottom:8px;font-family:'DM Sans',sans-serif">
          ❤️ Support Us — Donate
        </button>
        <button onclick="_signOut()"
          style="width:100%;padding:10px;background:transparent;color:#DC2626;border:1px solid #FCA5A5;border-radius:10px;font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;margin-bottom:8px">
          Sign Out
        </button>
        <button onclick="document.getElementById('account-modal').remove()"
          style="width:100%;padding:8px;background:transparent;color:#9CA3AF;border:none;font-size:12px;cursor:pointer;margin-bottom:12px">
          Close
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(el);
  el.addEventListener('click', e => { if (e.target === el) { el.remove(); clearInterval(_timerInterval); } });

  if (trialActive) {
    function _tick() {
      const ms = getTrialMsLeft();
      const t = document.getElementById('modal-timer');
      if (!t) { clearInterval(_timerInterval); return; }
      if (ms <= 0) { t.textContent = 'EXPIRED'; clearInterval(_timerInterval); return; }
      const d=Math.floor(ms/86400000), h=Math.floor((ms%86400000)/3600000),
            m=Math.floor((ms%3600000)/60000), s=Math.floor((ms%60000)/1000);
      t.textContent = `${d}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
    }
    _tick();
    _timerInterval = setInterval(_tick, 1000);
  }
}


// ── ADMIN PANEL ───────────────────────────────────────────
function showAdminPanel() {
  document.getElementById('account-modal')?.remove();
  document.getElementById('admin-panel')?.remove();

  const el = document.createElement('div');
  el.id = 'admin-panel';
  el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:999999;display:flex;align-items:flex-end;justify-content:center;padding:0';
  el.innerHTML = `
    <div style="background:#fff;border-radius:24px 24px 0 0;max-width:480px;width:100%;max-height:95vh;overflow-y:auto">
      <div style="background:linear-gradient(135deg,#4527A0,#6A1B9A);border-radius:24px 24px 0 0;padding:20px 24px;color:#fff;display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800">🔧 Admin Panel</div>
          <div style="font-size:12px;opacity:.7;margin-top:2px">Manage users, trial & premium</div>
        </div>
        <button onclick="document.getElementById('admin-panel').remove()" style="background:rgba(255,255,255,.2);border:none;color:#fff;border-radius:8px;padding:6px 12px;cursor:pointer;font-size:13px">✕</button>
      </div>
      <div style="padding:20px">

        <div style="background:#F8FAFF;border-radius:12px;padding:16px;margin-bottom:16px">
          <div style="font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:#1A237E;margin-bottom:10px">🔍 Lookup User by Email</div>
          <div style="display:flex;gap:8px">
            <input id="admin-email-input" type="email" placeholder="user@email.com"
              style="flex:1;padding:10px 12px;border:2px solid #E2E8F0;border-radius:8px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;box-sizing:border-box">
            <button onclick="adminLookupUser()" style="padding:10px 16px;background:#1A237E;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap">Look up</button>
          </div>
          <div id="admin-user-info" style="margin-top:12px;display:none"></div>
        </div>

        <div id="admin-actions" style="display:none">
          <div style="font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:#1A237E;margin-bottom:10px">⚡ Actions for <span id="admin-target-email" style="color:#5E35B1"></span></div>

          <div style="background:#F0FDF4;border-radius:10px;padding:14px;margin-bottom:10px">
            <div style="font-size:13px;font-weight:700;color:#15803D;margin-bottom:8px">💎 Premium</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button onclick="adminAction('premium1')"  style="padding:8px 12px;background:#15803D;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">+1 Month</button>
              <button onclick="adminAction('premium3')"  style="padding:8px 12px;background:#15803D;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">+3 Months</button>
              <button onclick="adminAction('premium6')"  style="padding:8px 12px;background:#15803D;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">+6 Months</button>
              <button onclick="adminAction('premium12')" style="padding:8px 12px;background:#15803D;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">+12 Months</button>
              <button onclick="adminAction('revokePremium')" style="padding:8px 12px;background:#DC2626;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">Revoke</button>
            </div>
          </div>

          <div style="background:#FFFBEB;border-radius:10px;padding:14px;margin-bottom:10px">
            <div style="font-size:13px;font-weight:700;color:#D97706;margin-bottom:8px">⏳ Trial</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button onclick="adminAction('trial3')"    style="padding:8px 12px;background:#D97706;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">+3 Days</button>
              <button onclick="adminAction('trial7')"    style="padding:8px 12px;background:#D97706;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">+7 Days</button>
              <button onclick="adminAction('trial30')"   style="padding:8px 12px;background:#D97706;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">+30 Days</button>
              <button onclick="adminAction('resetTrial')" style="padding:8px 12px;background:#1A237E;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">Reset to 7d</button>
            </div>
          </div>

          <div id="admin-action-result" style="font-size:13px;font-weight:600;padding:10px;border-radius:8px;display:none;margin-top:4px"></div>
        </div>

      </div>
    </div>
  `;
  document.body.appendChild(el);
  el.addEventListener('click', e => { if (e.target === el) el.remove(); });
}

let _adminTargetUid   = null;
let _adminTargetEmail = null;

async function adminLookupUser() {
  const email = document.getElementById('admin-email-input').value.trim();
  if (!email) return;
  const infoEl    = document.getElementById('admin-user-info');
  const actionsEl = document.getElementById('admin-actions');
  infoEl.style.display = 'block';
  infoEl.innerHTML = '<div style="font-size:13px;color:#64748B">Looking up…</div>';
  actionsEl.style.display = 'none';
  _adminTargetUid = null;

  try {
    const snap = await firebase.firestore().collection('users').where('email','==',email).limit(1).get();
    if (snap.empty) {
      infoEl.innerHTML = '<div style="font-size:13px;color:#DC2626">❌ No user found with that email.</div>';
      return;
    }
    const doc  = snap.docs[0];
    const data = doc.data();
    _adminTargetUid   = doc.id;
    _adminTargetEmail = email;

    const now = Date.now();
    const trialDays   = data.trialStart   ? Math.max(0, Math.ceil((data.trialStart + 7*86400000 - now)/86400000)) : 0;
    const premiumDays = (data.premiumExpiry||0) > now ? Math.ceil((data.premiumExpiry - now)/86400000) : 0;

    infoEl.innerHTML = `
      <div style="background:#fff;border-radius:8px;padding:12px;border:1px solid #E2E8F0;font-size:13px">
        <div style="font-weight:700;color:#1E293B;margin-bottom:6px">${email}</div>
        <div style="color:#64748B">Trial: ${trialDays > 0 ? `<b style="color:#D97706">${trialDays} days left</b>` : '<b style="color:#DC2626">Expired</b>'}</div>
        <div style="color:#64748B;margin-top:2px">Premium: ${premiumDays > 0 ? `<b style="color:#15803D">${premiumDays} days left</b>` : '<b style="color:#DC2626">None</b>'}</div>
      </div>`;

    document.getElementById('admin-target-email').textContent = email;
    actionsEl.style.display = 'block';
  } catch(e) {
    infoEl.innerHTML = `<div style="font-size:13px;color:#DC2626">Error: ${e.message}</div>`;
  }
}

async function adminAction(action) {
  if (!_adminTargetUid) return;
  const resultEl = document.getElementById('admin-action-result');
  resultEl.style.display = 'block';
  resultEl.style.background = '#F0F4FF'; resultEl.style.color = '#1A237E';
  resultEl.textContent = 'Processing…';

  try {
    const ref  = firebase.firestore().collection('users').doc(_adminTargetUid);
    const snap = await ref.get();
    const data = snap.exists ? snap.data() : {};
    const now  = Date.now();

    if      (action === 'premium1')       await ref.set({ premiumExpiry: Math.max(data.premiumExpiry||now,now) + 1*30*86400000  }, { merge:true });
    else if (action === 'premium3')       await ref.set({ premiumExpiry: Math.max(data.premiumExpiry||now,now) + 3*30*86400000  }, { merge:true });
    else if (action === 'premium6')       await ref.set({ premiumExpiry: Math.max(data.premiumExpiry||now,now) + 6*30*86400000  }, { merge:true });
    else if (action === 'premium12')      await ref.set({ premiumExpiry: Math.max(data.premiumExpiry||now,now) + 12*30*86400000 }, { merge:true });
    else if (action === 'revokePremium')  await ref.set({ premiumExpiry: 0 }, { merge:true });
    else if (action === 'trial3')         await ref.set({ trialStart: (data.trialStart||now) - 3*86400000  }, { merge:true });
    else if (action === 'trial7')         await ref.set({ trialStart: (data.trialStart||now) - 7*86400000  }, { merge:true });
    else if (action === 'trial30')        await ref.set({ trialStart: (data.trialStart||now) - 30*86400000 }, { merge:true });
    else if (action === 'resetTrial')     await ref.set({ trialStart: now }, { merge:true });

    resultEl.style.background = '#F0FDF4'; resultEl.style.color = '#15803D';
    resultEl.textContent = '✅ Done! User sees changes on next app open.';
    await adminLookupUser(); // refresh display
  } catch(e) {
    resultEl.style.background = '#FEF2F2'; resultEl.style.color = '#DC2626';
    resultEl.textContent = '❌ Error: ' + e.message;
  }
}
// ── SIGN OUT ──────────────────────────────────────────────
async function _signOut() {
  try { if (firebaseAuth) await firebaseAuth.signOut(); } catch(e) {}
  localStorage.removeItem('mppsc_user');
  _isAdmin = false; _userRecord = { trialStart: 0, premiumExpiry: 0 }; _setReviewNavVisible(false);
  document.getElementById('account-modal')?.remove();
  document.getElementById('user-badge')?.remove();
  if (_timerInterval) { clearInterval(_timerInterval); _timerInterval = null; }
  showLoginScreen();
}
function signOut() { _signOut(); }

// ── TOAST ─────────────────────────────────────────────────
function showToastSafe(msg, color) {
  if (typeof showToast === 'function') { showToast(msg, color); return; }
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:${color||'#1A237E'};color:#fff;padding:10px 20px;border-radius:20px;font-size:13px;z-index:999999;font-weight:600;pointer-events:none`;
  document.body.appendChild(t); setTimeout(() => t.remove(), 3000);
}

// ── INIT ──────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initFirebase();
    const user = getLocalUser();
    if (!user) { setTimeout(showLoginScreen, 800); }
    else {
      // Reload Firestore record in case of cached login
      _loadAndInitUser(user.uid).then(() => {
        updateUserBadge();
        if (!isPremium() && !_isAdmin && !isTrialActive()) {
          setTimeout(() => showPaywall('full app access'), 1500);
        }
      });
    }
  }, 500);
});
