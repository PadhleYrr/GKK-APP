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
  // Check remote app config (banner, maintenance, force-update)
  _checkAppConfig();
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
    const snap = await firebase.firestore().collection('config').doc('admins').get();
    if (snap.exists) {
      const adminEmails = snap.data().emails || [];
      _isAdmin = adminEmails.map(e => e.trim().toLowerCase()).includes((email||'').trim().toLowerCase());
    }
  } catch(e) { console.warn('Admin check failed:', e); }
  _setReviewNavVisible(_isAdmin);
  updateUserBadge(); // refresh badge now that admin status is known
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
  const email = (firebase.auth().currentUser?.email || '').trim().toLowerCase();
  try {
    const db  = firebase.firestore();
    const ref = db.collection('users').doc(uid);
    const snap = await ref.get();
    const authUser = firebase.auth().currentUser;
    const authName = authUser?.displayName || '';
    if (snap.exists && snap.data().trialStart) {
      // ✅ Normal case — load from Firestore
      const d = snap.data();
      _userRecord = { trialStart: d.trialStart, premiumExpiry: d.premiumExpiry||0 };
      // Refresh live fields every login
      const liveUpdate = { lastSeen: Date.now(), sessionCount: firebase.firestore.FieldValue.increment(1) };
      if ((d.email||'').trim().toLowerCase() !== email) liveUpdate.email = email;
      if (authName && !d.name) liveUpdate.name = authName;
      ref.set(liveUpdate, { merge: true });
      _writeEmailIndex(db, email, uid);
    } else {
      // Doc missing or trialStart missing — first login for this account
      const cached = localStorage.getItem('userRecord_' + uid);
      const oldTrialKey = localStorage.getItem('trial_start_' + uid);
      let trialStart;
      if (cached) {
        const parsed = JSON.parse(cached);
        trialStart = parsed.trialStart || Date.now();
      } else if (oldTrialKey) {
        trialStart = parseInt(oldTrialKey); // migrate from old system
      } else {
        trialStart = Date.now(); // truly new user
        showToastSafe('🎁 7-day free trial started!', '#15803D');
      }
      _userRecord = { trialStart, premiumExpiry: snap.exists ? (snap.data().premiumExpiry||0) : 0 };
      // Write user doc + email index — no composite index required
      const registeredAt = snap.exists ? (snap.data().registeredAt || trialStart) : trialStart;
      await ref.set({ trialStart, premiumExpiry: _userRecord.premiumExpiry, email,
                      name: authName, registeredAt, lastSeen: Date.now() }, { merge: true });
      _writeEmailIndex(db, email, uid);
    }
  } catch(e) {
    console.warn('Firestore error:', e);
    // Offline fallback — use cache, never reset trial
    const cached = localStorage.getItem('userRecord_' + uid);
    const oldTrialKey = localStorage.getItem('trial_start_' + uid);
    if (cached) _userRecord = JSON.parse(cached);
    else if (oldTrialKey) _userRecord = { trialStart: parseInt(oldTrialKey), premiumExpiry: 0 };
    else _userRecord = { trialStart: Date.now(), premiumExpiry: 0 };
  }
  localStorage.setItem('userRecord_' + uid, JSON.stringify(_userRecord));
}

// ── EMAIL → UID INDEX ─────────────────────────────────────
// Stores emailIndex/{sanitisedEmail} = { uid } so admin lookup
// never needs a Firestore composite index (no .where() query).
function _emailKey(email) {
  // Firestore doc IDs can't contain '/' — replace @ and . safely
  return (email||'').trim().toLowerCase().replace(/[.@]/g, '_');
}
function _writeEmailIndex(db, email, uid) {
  if (!email || !uid) return;
  db.collection('emailIndex').doc(_emailKey(email)).set({ uid, email }, { merge: true }).catch(() => {});
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
  // Note: updateUserBadge() is called at end of _checkAdmin with correct _isAdmin value
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
// ── ADMIN PANEL ───────────────────────────────────────────
// Tab state
let _adminTab = 'user';   // 'user' | 'stats'

function showAdminPanel() {
  document.getElementById('account-modal')?.remove();
  document.getElementById('admin-panel')?.remove();

  const el = document.createElement('div');
  el.id = 'admin-panel';
  el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:999999;display:flex;align-items:flex-end;justify-content:center;padding:0';
  el.innerHTML = `
    <div id="admin-sheet" style="background:#F8FAFF;border-radius:24px 24px 0 0;max-width:480px;width:100%;max-height:95vh;overflow-y:auto">
      <div style="background:linear-gradient(135deg,#3730A3,#6D28D9);border-radius:24px 24px 0 0;padding:20px 24px 0;color:#fff">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div>
            <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800">⚙️ Admin Panel</div>
            <div style="font-size:11px;opacity:.65;margin-top:2px">MP GK Portal — Control Centre</div>
          </div>
          <button onclick="document.getElementById('admin-panel').remove()"
            style="background:rgba(255,255,255,.15);border:none;color:#fff;border-radius:10px;padding:7px 13px;cursor:pointer;font-size:13px">✕</button>
        </div>
        <div style="display:flex;gap:4px;background:rgba(0,0,0,.2);border-radius:12px;padding:4px">
          <button id="atab-user"     onclick="adminSwitchTab('user')"     style="flex:1;padding:7px 4px;border:none;border-radius:9px;font-size:11px;font-weight:700;cursor:pointer;background:#fff;color:#3730A3;font-family:'DM Sans',sans-serif">👤 User</button>
          <button id="atab-stats"    onclick="adminSwitchTab('stats')"    style="flex:1;padding:7px 4px;border:none;border-radius:9px;font-size:11px;font-weight:700;cursor:pointer;background:transparent;color:rgba(255,255,255,.7);font-family:'DM Sans',sans-serif">📊 Stats</button>
          <button id="atab-tools"    onclick="adminSwitchTab('tools')"    style="flex:1;padding:7px 4px;border:none;border-radius:9px;font-size:11px;font-weight:700;cursor:pointer;background:transparent;color:rgba(255,255,255,.7);font-family:'DM Sans',sans-serif">🛠 Tools</button>
          <button id="atab-settings" onclick="adminSwitchTab('settings')" style="flex:1;padding:7px 4px;border:none;border-radius:9px;font-size:11px;font-weight:700;cursor:pointer;background:transparent;color:rgba(255,255,255,.7);font-family:'DM Sans',sans-serif">⚙️ App</button>
        </div>
        <div style="height:16px"></div>
      </div>

      <!-- User Tab -->
      <div id="atab-content-user" style="padding:16px">
        <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
          <div style="font-size:12px;font-weight:700;color:#6D28D9;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px">🔍 User Lookup</div>
          <div style="display:flex;gap:8px">
            <input id="admin-email-input" type="text" placeholder="Email or name…"
              onkeydown="if(event.key==='Enter')adminLookupUser()"
              style="flex:1;padding:10px 12px;border:2px solid #E2E8F0;border-radius:10px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;box-sizing:border-box">
            <button onclick="adminLookupUser()"
              style="padding:10px 16px;background:#3730A3;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap">Look up</button>
          </div>
          <div id="admin-user-info" style="margin-top:10px;display:none"></div>
        </div>
        <div id="admin-profile-card" style="display:none;background:#fff;border-radius:14px;overflow:hidden;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
          <div id="admin-profile-header" style="background:linear-gradient(135deg,#3730A3,#6D28D9);padding:16px 16px 14px;color:#fff">
            <div style="display:flex;align-items:center;gap:12px">
              <div id="admin-profile-avatar" style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;flex-shrink:0">?</div>
              <div>
                <div id="admin-profile-name" style="font-family:'Syne',sans-serif;font-size:15px;font-weight:800">—</div>
                <div id="admin-profile-email" style="font-size:11px;opacity:.75">—</div>
              </div>
              <div id="admin-profile-badge" style="margin-left:auto;font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;background:rgba(255,255,255,.2)">—</div>
            </div>
          </div>
          <div style="padding:12px 16px;display:grid;grid-template-columns:1fr 1fr;gap:8px" id="admin-profile-stats"></div>
        </div>
        <div id="admin-actions" style="display:none">
          <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:10px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
            <div style="font-size:11px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px">💎 Premium Access</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:8px">
              <button onclick="adminAction('premium1')"  style="padding:9px;background:#ECFDF5;color:#065F46;border:1.5px solid #6EE7B7;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer">+1 Month</button>
              <button onclick="adminAction('premium3')"  style="padding:9px;background:#ECFDF5;color:#065F46;border:1.5px solid #6EE7B7;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer">+3 Months</button>
              <button onclick="adminAction('premium6')"  style="padding:9px;background:#ECFDF5;color:#065F46;border:1.5px solid #6EE7B7;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer">+6 Months</button>
              <button onclick="adminAction('premium12')" style="padding:9px;background:#ECFDF5;color:#065F46;border:1.5px solid #6EE7B7;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer">+12 Months</button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px">
              <button onclick="adminAction('premiumCustom')" style="padding:9px;background:#EFF6FF;color:#1E40AF;border:1.5px solid #93C5FD;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer">Custom Days…</button>
              <button onclick="adminAction('revokePremium')" style="padding:9px;background:#FEF2F2;color:#991B1B;border:1.5px solid #FCA5A5;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer">🚫 Revoke</button>
            </div>
          </div>
          <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:10px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
            <div style="font-size:11px;font-weight:700;color:#D97706;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px">⏳ Trial Control</div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-bottom:8px">
              <button onclick="adminAction('trial3')"  style="padding:9px;background:#FFFBEB;color:#92400E;border:1.5px solid #FCD34D;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer">+3 Days</button>
              <button onclick="adminAction('trial7')"  style="padding:9px;background:#FFFBEB;color:#92400E;border:1.5px solid #FCD34D;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer">+7 Days</button>
              <button onclick="adminAction('trial30')" style="padding:9px;background:#FFFBEB;color:#92400E;border:1.5px solid #FCD34D;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer">+30 Days</button>
            </div>
            <button onclick="adminAction('resetTrial')" style="width:100%;padding:9px;background:#F0F4FF;color:#3730A3;border:1.5px solid #A5B4FC;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer">↺ Reset to Fresh 7-Day Trial</button>
          </div>
          <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:10px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
            <div style="font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px">🔧 Account Actions</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px">
              <button onclick="adminAction('addNote')"   style="padding:9px;background:#F8FAFF;color:#3730A3;border:1.5px solid #C7D2FE;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer">📝 Add Note</button>
              <button onclick="adminAction('copyUID')"   style="padding:9px;background:#F8FAFF;color:#3730A3;border:1.5px solid #C7D2FE;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer">📋 Copy UID</button>
              <button onclick="adminAction('banUser')"   style="padding:9px;background:#FEF2F2;color:#991B1B;border:1.5px solid #FCA5A5;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer">🚫 Ban User</button>
              <button onclick="adminAction('unbanUser')" style="padding:9px;background:#F0FDF4;color:#166534;border:1.5px solid #86EFAC;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer">✅ Unban</button>
            </div>
          </div>
          <div id="admin-action-result" style="font-size:13px;font-weight:600;padding:10px 14px;border-radius:10px;display:none;margin-bottom:8px"></div>
        </div>
      </div>

      <!-- Stats Tab -->
      <div id="atab-content-stats" style="padding:16px;display:none">
        <div id="admin-stats-loading" style="text-align:center;padding:40px 0;color:#64748B;font-size:13px">Loading stats…</div>
        <div id="admin-stats-content" style="display:none"></div>
      </div>

      <!-- Tools Tab -->
      <div id="atab-content-tools" style="padding:16px;display:none">
        <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
          <div style="font-size:11px;font-weight:700;color:#7C3AED;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px">🎟 Coupon Codes</div>
          <div style="display:flex;gap:8px;margin-bottom:8px">
            <input id="coupon-code-input" placeholder="Code e.g. DIWALI50" style="flex:1;padding:9px 11px;border:2px solid #E2E8F0;border-radius:9px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;text-transform:uppercase">
            <input id="coupon-days-input" type="number" placeholder="Days" min="1" max="365" style="width:70px;padding:9px 11px;border:2px solid #E2E8F0;border-radius:9px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none">
          </div>
          <button onclick="adminCreateCoupon()" style="width:100%;padding:9px;background:#7C3AED;color:#fff;border:none;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;margin-bottom:8px">+ Create Coupon</button>
          <div id="coupon-list" style="font-size:12px;color:#64748B">Loading…</div>
        </div>
        <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
          <div style="font-size:11px;font-weight:700;color:#0891B2;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px">🔗 Referral Tracking</div>
          <div id="referral-stats" style="font-size:12px;color:#64748B">Loading…</div>
        </div>
        <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
          <div style="font-size:11px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px">💰 Revenue Tracker</div>
          <div style="display:flex;gap:8px;margin-bottom:8px">
            <input id="rev-amount" type="number" placeholder="Amount ₹" min="1" style="flex:1;padding:9px 11px;border:2px solid #E2E8F0;border-radius:9px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none">
            <input id="rev-note" placeholder="Note" style="flex:1;padding:9px 11px;border:2px solid #E2E8F0;border-radius:9px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none">
          </div>
          <button onclick="adminAddRevenue()" style="width:100%;padding:9px;background:#059669;color:#fff;border:none;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;margin-bottom:8px">+ Log Payment</button>
          <div id="revenue-summary" style="font-size:12px;color:#64748B">Loading…</div>
        </div>
        <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
          <div style="font-size:11px;font-weight:700;color:#DC2626;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px">📬 Feedback Inbox</div>
          <div id="feedback-inbox" style="font-size:12px;color:#64748B">Loading…</div>
        </div>
        <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
          <div style="font-size:11px;font-weight:700;color:#D97706;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px">🚩 Flagged Questions</div>
          <div id="flagged-questions" style="font-size:12px;color:#64748B">Loading…</div>
        </div>
        <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
          <div style="font-size:11px;font-weight:700;color:#3730A3;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px">🏆 Quiz Leaderboard</div>
          <div id="quiz-leaderboard" style="font-size:12px;color:#64748B">Loading…</div>
        </div>
        <div style="height:8px"></div>
      </div>

      <!-- App Settings Tab -->
      <div id="atab-content-settings" style="padding:16px;display:none">
        <div id="settings-loading" style="text-align:center;padding:40px;color:#64748B;font-size:13px">Loading…</div>
        <div id="settings-content" style="display:none"></div>
      </div>
    </div>
  `;
  document.body.appendChild(el);
  el.addEventListener('click', e => { if (e.target === el) el.remove(); });
  adminSwitchTab('user');
}

function adminSwitchTab(tab) {
  _adminTab = tab;
  ['user','stats','tools','settings'].forEach(t => {
    const btn  = document.getElementById('atab-' + t);
    const cont = document.getElementById('atab-content-' + t);
    if (!btn || !cont) return;
    const active = t === tab;
    btn.style.background = active ? '#fff' : 'transparent';
    btn.style.color       = active ? '#3730A3' : 'rgba(255,255,255,.7)';
    cont.style.display    = active ? 'block' : 'none';
  });
  if (tab === 'stats')    adminLoadStats();
  if (tab === 'settings') adminLoadSettings();
  if (tab === 'tools')    _loadToolsData();
}

let _adminTargetUid   = null;
let _adminTargetEmail = null;
let _adminTargetData  = null;

async function adminLookupUser() {
  const rawEmail = document.getElementById('admin-email-input').value.trim();
  if (!rawEmail) return;
  const email     = rawEmail.toLowerCase();
  const infoEl    = document.getElementById('admin-user-info');
  const actionsEl = document.getElementById('admin-actions');
  const profileEl = document.getElementById('admin-profile-card');
  infoEl.style.display    = 'block';
  actionsEl.style.display = 'none';
  profileEl.style.display = 'none';
  infoEl.innerHTML = '<div style="font-size:13px;color:#64748B;display:flex;align-items:center;gap:6px"><span style="display:inline-block;width:14px;height:14px;border:2px solid #6D28D9;border-top-color:transparent;border-radius:50%;animation:spin .7s linear infinite"></span> Looking up…</div>';
  _adminTargetUid = null; _adminTargetData = null;

  try {
    const db = firebase.firestore();
    const idxSnap = await db.collection('emailIndex').doc(_emailKey(email)).get();
    if (!idxSnap.exists) {
      infoEl.innerHTML = `<div style="font-size:13px;color:#DC2626;background:#FEF2F2;padding:10px 12px;border-radius:10px">
        ❌ No user found with <b>${email}</b><br>
        <span style="font-size:11px;opacity:.7">User must log in at least once to appear here.</span>
      </div>`;
      return;
    }
    const uid = idxSnap.data().uid;
    const userSnap = await db.collection('users').doc(uid).get();
    const data = userSnap.exists ? userSnap.data() : {};
    _adminTargetUid   = uid;
    _adminTargetEmail = email;
    _adminTargetData  = data;

    infoEl.style.display = 'none';
    _renderAdminProfile(uid, email, data);
    document.getElementById('admin-target-email') && (document.getElementById('admin-target-email').textContent = email);
    actionsEl.style.display = 'block';
    profileEl.style.display = 'block';
    const resultEl = document.getElementById('admin-action-result');
    if (resultEl) resultEl.style.display = 'none';
  } catch(e) {
    infoEl.innerHTML = `<div style="font-size:13px;color:#DC2626;background:#FEF2F2;padding:10px 12px;border-radius:10px">❌ Error: ${e.message}</div>`;
  }
}

function _renderAdminProfile(uid, email, data) {
  const now          = Date.now();
  const name         = data.name || email.split('@')[0];
  const initial      = name.charAt(0).toUpperCase();
  const trialDays    = data.trialStart ? Math.max(0, Math.ceil((data.trialStart + 7*86400000 - now)/86400000)) : 0;
  const premiumDays  = (data.premiumExpiry||0) > now ? Math.ceil((data.premiumExpiry - now)/86400000) : 0;
  const isBanned     = data.banned === true;
  const status       = isBanned ? 'banned' : premiumDays > 0 ? 'premium' : trialDays > 0 ? 'trial' : 'expired';
  const badgeMap     = { premium:'💎 PREMIUM', trial:'⏳ TRIAL', expired:'🔴 EXPIRED', banned:'🚫 BANNED' };
  const badgeBgMap   = { premium:'#059669', trial:'#D97706', expired:'#DC2626', banned:'#1E293B' };
  const regDate      = data.registeredAt ? new Date(data.registeredAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';
  const lastSeenDate = data.lastSeen     ? _timeAgo(data.lastSeen) : '—';

  document.getElementById('admin-profile-avatar').textContent = initial;
  document.getElementById('admin-profile-name').textContent   = name;
  document.getElementById('admin-profile-email').textContent  = email;
  const badge = document.getElementById('admin-profile-badge');
  badge.textContent        = badgeMap[status];
  badge.style.background   = badgeBgMap[status];

  const statsGrid = document.getElementById('admin-profile-stats');
  statsGrid.innerHTML = [
    { label:'Registered', value: regDate },
    { label:'Last Seen',  value: lastSeenDate },
    { label:'Trial Left', value: trialDays > 0 ? `${trialDays} days` : 'Expired', color: trialDays > 0 ? '#D97706' : '#DC2626' },
    { label:'Premium',    value: premiumDays > 0 ? `${premiumDays} days` : 'None', color: premiumDays > 0 ? '#059669' : '#94A3B8' },
    { label:'UID',        value: uid.slice(0,10)+'…', mono: true },
    { label:'Note',       value: data.adminNote || '—', small: true },
  ].map(s => `
    <div style="background:#F8FAFF;border-radius:9px;padding:9px 10px">
      <div style="font-size:10px;color:#94A3B8;font-weight:600;text-transform:uppercase;letter-spacing:.4px">${s.label}</div>
      <div style="font-size:12px;font-weight:700;color:${s.color||'#1E293B'};margin-top:2px;${s.mono?'font-family:monospace':''}${s.small?'font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis':''}">${s.value}</div>
    </div>`).join('');
}

function _timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000)       return 'Just now';
  if (diff < 3600000)     return Math.floor(diff/60000) + 'm ago';
  if (diff < 86400000)    return Math.floor(diff/3600000) + 'h ago';
  if (diff < 2592000000)  return Math.floor(diff/86400000) + 'd ago';
  return new Date(ts).toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
}

async function adminAction(action) {
  if (!_adminTargetUid && !['copyUID'].includes(action)) return;
  const resultEl = document.getElementById('admin-action-result');
  resultEl.style.display    = 'block';
  resultEl.style.background = '#EFF6FF';
  resultEl.style.color      = '#1E40AF';
  resultEl.textContent      = '⏳ Processing…';

  try {
    const ref  = firebase.firestore().collection('users').doc(_adminTargetUid);
    const snap = await ref.get();
    const data = snap.exists ? snap.data() : {};
    const now  = Date.now();

    if (action === 'premium1')       await ref.set({ premiumExpiry: Math.max(data.premiumExpiry||now,now) + 1*30*86400000  }, { merge:true });
    else if (action === 'premium3')  await ref.set({ premiumExpiry: Math.max(data.premiumExpiry||now,now) + 3*30*86400000  }, { merge:true });
    else if (action === 'premium6')  await ref.set({ premiumExpiry: Math.max(data.premiumExpiry||now,now) + 6*30*86400000  }, { merge:true });
    else if (action === 'premium12') await ref.set({ premiumExpiry: Math.max(data.premiumExpiry||now,now) + 12*30*86400000 }, { merge:true });
    else if (action === 'revokePremium') await ref.set({ premiumExpiry: 0 }, { merge:true });
    else if (action === 'trial3')    await ref.set({ trialStart: (data.trialStart||now) - 3*86400000  }, { merge:true });
    else if (action === 'trial7')    await ref.set({ trialStart: (data.trialStart||now) - 7*86400000  }, { merge:true });
    else if (action === 'trial30')   await ref.set({ trialStart: (data.trialStart||now) - 30*86400000 }, { merge:true });
    else if (action === 'resetTrial') await ref.set({ trialStart: now }, { merge:true });
    else if (action === 'banUser')   await ref.set({ banned: true,  bannedAt: now }, { merge:true });
    else if (action === 'unbanUser') await ref.set({ banned: false }, { merge:true });
    else if (action === 'premiumCustom') {
      const days = parseInt(prompt('Enter number of days to add:'));
      if (isNaN(days) || days <= 0) { resultEl.textContent = '⚠️ Cancelled.'; return; }
      await ref.set({ premiumExpiry: Math.max(data.premiumExpiry||now,now) + days*86400000 }, { merge:true });
    }
    else if (action === 'addNote') {
      const note = prompt('Enter admin note for this user:', data.adminNote || '');
      if (note === null) { resultEl.textContent = '⚠️ Cancelled.'; return; }
      await ref.set({ adminNote: note }, { merge:true });
    }
    else if (action === 'copyUID') {
      if (!_adminTargetUid) return;
      navigator.clipboard?.writeText(_adminTargetUid).catch(()=>{});
      resultEl.style.background = '#F0FDF4'; resultEl.style.color = '#166534';
      resultEl.textContent = '📋 UID copied to clipboard!';
      return;
    }

    resultEl.style.background = '#F0FDF4'; resultEl.style.color = '#166534';
    resultEl.textContent = '✅ Done! User will see changes on next app open.';
    await adminLookupUser();
  } catch(e) {
    resultEl.style.background = '#FEF2F2'; resultEl.style.color = '#DC2626';
    resultEl.textContent = '❌ Error: ' + e.message;
  }
}




// ── TOOLS TAB HTML ────────────────────────────────────────
function _toolsTabHTML() {
  return `
    <!-- Coupon Codes -->
    <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
      <div style="font-size:11px;font-weight:700;color:#7C3AED;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px">🎟 Coupon Codes</div>
      <div style="display:flex;gap:8px;margin-bottom:8px">
        <input id="coupon-code-input" placeholder="Code e.g. DIWALI50"
          style="flex:1;padding:9px 11px;border:2px solid #E2E8F0;border-radius:9px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;text-transform:uppercase">
        <input id="coupon-days-input" type="number" placeholder="Days" min="1" max="365"
          style="width:70px;padding:9px 11px;border:2px solid #E2E8F0;border-radius:9px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none">
      </div>
      <button onclick="adminCreateCoupon()"
        style="width:100%;padding:9px;background:#7C3AED;color:#fff;border:none;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;margin-bottom:8px">+ Create Coupon</button>
      <div id="coupon-list" style="font-size:12px;color:#64748B">Loading…</div>
    </div>

    <!-- Referral Tracking -->
    <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
      <div style="font-size:11px;font-weight:700;color:#0891B2;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px">🔗 Referral Tracking</div>
      <div id="referral-stats" style="font-size:12px;color:#64748B">Loading…</div>
    </div>

    <!-- Revenue Tracker -->
    <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
      <div style="font-size:11px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px">💰 Revenue Tracker</div>
      <div style="display:flex;gap:8px;margin-bottom:8px">
        <input id="rev-amount" type="number" placeholder="Amount ₹" min="1"
          style="flex:1;padding:9px 11px;border:2px solid #E2E8F0;border-radius:9px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none">
        <input id="rev-note" placeholder="Note"
          style="flex:1;padding:9px 11px;border:2px solid #E2E8F0;border-radius:9px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none">
      </div>
      <button onclick="adminAddRevenue()"
        style="width:100%;padding:9px;background:#059669;color:#fff;border:none;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;margin-bottom:8px">+ Log Payment</button>
      <div id="revenue-summary" style="font-size:12px;color:#64748B">Loading…</div>
    </div>

    <!-- User Feedback Inbox -->
    <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
      <div style="font-size:11px;font-weight:700;color:#DC2626;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px">📬 Feedback Inbox</div>
      <div id="feedback-inbox" style="font-size:12px;color:#64748B">Loading…</div>
    </div>

    <!-- Question Flags -->
    <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
      <div style="font-size:11px;font-weight:700;color:#D97706;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px">🚩 Flagged Questions</div>
      <div id="flagged-questions" style="font-size:12px;color:#64748B">Loading…</div>
    </div>

    <!-- Quiz Leaderboard -->
    <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
      <div style="font-size:11px;font-weight:700;color:#3730A3;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px">🏆 Quiz Leaderboard</div>
      <div id="quiz-leaderboard" style="font-size:12px;color:#64748B">Loading…</div>
    </div>

    <div style="height:8px"></div>
  `;
}

// ── STATS TAB (enhanced) ──────────────────────────────────
async function adminLoadStats() {
  const loadEl    = document.getElementById('admin-stats-loading');
  const contentEl = document.getElementById('admin-stats-content');
  if (!loadEl || !contentEl) return;
  loadEl.style.display    = 'block';
  contentEl.style.display = 'none';

  try {
    const db  = firebase.firestore();
    const now = Date.now();
    const snap = await db.collection('users').get();
    const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const total    = users.length;
    const premium  = users.filter(u => (u.premiumExpiry||0) > now).length;
    const trial    = users.filter(u => u.trialStart && (u.trialStart + 7*86400000) > now && (u.premiumExpiry||0) <= now).length;
    const expired  = total - premium - trial;
    const banned   = users.filter(u => u.banned === true).length;
    const today    = users.filter(u => u.lastSeen && (now - u.lastSeen) < 86400000).length;
    const week     = users.filter(u => u.lastSeen && (now - u.lastSeen) < 7*86400000).length;
    const newToday = users.filter(u => u.registeredAt && (now - u.registeredAt) < 86400000).length;
    const newWeek  = users.filter(u => u.registeredAt && (now - u.registeredAt) < 7*86400000).length;

    // Revenue total
    let revTotal = 0;
    try {
      const revSnap = await db.collection('config').doc('revenue').get();
      if (revSnap.exists) revTotal = (revSnap.data().entries||[]).reduce((s,e) => s + (e.amount||0), 0);
    } catch(e) {}

    // Daily active for last 7 days bar chart
    const dayLabels = [], dayValues = [];
    for (let i = 6; i >= 0; i--) {
      const d0 = now - i * 86400000, d1 = d0 + 86400000;
      const label = new Date(d0).toLocaleDateString('en-IN',{weekday:'short'});
      dayLabels.push(label);
      dayValues.push(users.filter(u => u.lastSeen && u.lastSeen >= d0 && u.lastSeen < d1).length);
    }
    const maxVal = Math.max(...dayValues, 1);

    loadEl.style.display    = 'none';
    contentEl.style.display = 'block';
    contentEl.innerHTML = `
      <!-- Overview -->
      <div style="font-size:11px;font-weight:700;color:#6D28D9;text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px">👥 User Overview</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
        ${[
          { label:'Total Users',   value:total,   color:'#3730A3', bg:'#EEF2FF' },
          { label:'Active Today',  value:today,   color:'#059669', bg:'#ECFDF5' },
          { label:'💎 Premium',    value:premium, color:'#059669', bg:'#ECFDF5' },
          { label:'⏳ On Trial',   value:trial,   color:'#D97706', bg:'#FFFBEB' },
          { label:'🔴 Expired',    value:expired, color:'#DC2626', bg:'#FEF2F2' },
          { label:'🚫 Banned',     value:banned,  color:'#64748B', bg:'#F1F5F9' },
        ].map(s=>`<div style="background:${s.bg};border-radius:12px;padding:12px 14px">
          <div style="font-size:11px;color:${s.color};font-weight:600">${s.label}</div>
          <div style="font-family:'Syne',sans-serif;font-size:26px;font-weight:800;color:${s.color}">${s.value}</div>
        </div>`).join('')}
      </div>

      <!-- Revenue + Conversion -->
      <div style="font-size:11px;font-weight:700;color:#6D28D9;text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px">💰 Revenue & Growth</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
        ${[
          { label:'Total Revenue',  value:'₹'+revTotal, color:'#059669', bg:'#ECFDF5' },
          { label:'Conversion',     value:total>0?Math.round(premium/total*100)+'%':'—', color:'#D97706', bg:'#FFFBEB' },
          { label:'New Today',      value:newToday,  color:'#3730A3', bg:'#EEF2FF' },
          { label:'New This Week',  value:newWeek,   color:'#3730A3', bg:'#EEF2FF' },
          { label:'Active (7d)',    value:week,      color:'#059669', bg:'#ECFDF5' },
          { label:'Avg Session/User', value: total>0 ? (users.reduce((s,u)=>s+(u.sessionCount||0),0)/total).toFixed(1) : '—', color:'#7C3AED', bg:'#F5F3FF' },
        ].map(s=>`<div style="background:${s.bg};border-radius:12px;padding:12px 14px">
          <div style="font-size:11px;color:${s.color};font-weight:600">${s.label}</div>
          <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:${s.color}">${s.value}</div>
        </div>`).join('')}
      </div>

      <!-- Daily Active Bar Chart -->
      <div style="font-size:11px;font-weight:700;color:#6D28D9;text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px">📈 Daily Active Users (7d)</div>
      <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:14px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
        <div style="display:flex;align-items:flex-end;gap:6px;height:70px;margin-bottom:6px">
          ${dayValues.map((v,i)=>`
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px">
              <div style="font-size:9px;color:#6D28D9;font-weight:700">${v||''}</div>
              <div style="width:100%;background:${v===maxVal?'#6D28D9':'#C4B5FD'};border-radius:5px 5px 0 0;height:${Math.max(4,Math.round(v/maxVal*50))}px;transition:height .3s"></div>
            </div>`).join('')}
        </div>
        <div style="display:flex;gap:6px">
          ${dayLabels.map(l=>`<div style="flex:1;text-align:center;font-size:9px;color:#94A3B8;font-weight:600">${l}</div>`).join('')}
        </div>
      </div>

      <!-- Recent signups -->
      <div style="font-size:11px;font-weight:700;color:#6D28D9;text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px">🕐 Recent Signups</div>
      <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06)">
        ${users.filter(u=>u.registeredAt).sort((a,b)=>b.registeredAt-a.registeredAt).slice(0,8).map(u=>{
          const isPrem=(u.premiumExpiry||0)>now, isTrial=u.trialStart&&(u.trialStart+7*86400000)>now;
          const dot=isPrem?'💎':isTrial?'⏳':'🔴';
          return `<div style="display:flex;align-items:center;padding:9px 12px;border-bottom:1px solid #F1F5F9;gap:8px">
            <span>${dot}</span>
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:700;color:#1E293B;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${u.name||(u.email||'').split('@')[0]}</div>
              <div style="font-size:11px;color:#94A3B8">${u.email||'—'}</div>
            </div>
            <div style="font-size:11px;color:#94A3B8;white-space:nowrap">${_timeAgo(u.registeredAt)}</div>
          </div>`;
        }).join('')||'<div style="padding:16px;text-align:center;color:#94A3B8;font-size:13px">No data yet</div>'}
      </div>
      <div style="height:12px"></div>
    `;

    // Also load tools tab data
    _loadToolsData();
  } catch(e) {
    loadEl.innerHTML = `<div style="color:#DC2626;font-size:13px">❌ ${e.message}</div>`;
  }
}

// ── TOOLS TAB DATA LOADER ─────────────────────────────────
async function _loadToolsData() {
  _loadCoupons();
  _loadReferrals();
  _loadRevenueSummary();
  _loadFeedbackInbox();
  _loadFlaggedQuestions();
  _loadLeaderboard();
}

// ── COUPONS ───────────────────────────────────────────────
async function _loadCoupons() {
  const el = document.getElementById('coupon-list'); if (!el) return;
  try {
    const snap = await firebase.firestore().collection('config').doc('coupons').get();
    const codes = snap.exists ? (snap.data().codes || []) : [];
    if (!codes.length) { el.innerHTML = '<div style="color:#94A3B8;padding:4px 0">No coupons yet.</div>'; return; }
    el.innerHTML = codes.map(c => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid #F1F5F9">
        <div>
          <span style="font-family:monospace;font-weight:700;color:#7C3AED;font-size:13px">${c.code}</span>
          <span style="font-size:11px;color:#94A3B8;margin-left:6px">→ ${c.days}d premium</span>
          ${c.usedBy ? `<span style="font-size:10px;background:#FEF2F2;color:#DC2626;padding:1px 6px;border-radius:10px;margin-left:4px">Used</span>` : `<span style="font-size:10px;background:#ECFDF5;color:#059669;padding:1px 6px;border-radius:10px;margin-left:4px">Active</span>`}
        </div>
        <button onclick="adminDeleteCoupon('${c.code}')" style="background:none;border:none;color:#DC2626;cursor:pointer;font-size:14px">🗑</button>
      </div>`).join('');
  } catch(e) { el.innerHTML = `<span style="color:#DC2626">${e.message}</span>`; }
}

async function adminCreateCoupon() {
  const code = (document.getElementById('coupon-code-input')?.value||'').trim().toUpperCase();
  const days = parseInt(document.getElementById('coupon-days-input')?.value||'0');
  if (!code || !days) { showToastSafe('Enter code and days', '#DC2626'); return; }
  try {
    const ref  = firebase.firestore().collection('config').doc('coupons');
    const snap = await ref.get();
    const codes = snap.exists ? (snap.data().codes||[]) : [];
    if (codes.find(c => c.code === code)) { showToastSafe('Code already exists!', '#DC2626'); return; }
    codes.push({ code, days, createdAt: Date.now(), usedBy: null });
    await ref.set({ codes }, { merge: true });
    showToastSafe('✅ Coupon created!', '#7C3AED');
    document.getElementById('coupon-code-input').value = '';
    document.getElementById('coupon-days-input').value = '';
    _loadCoupons();
  } catch(e) { showToastSafe('❌ ' + e.message, '#DC2626'); }
}

async function adminDeleteCoupon(code) {
  if (!confirm('Delete coupon ' + code + '?')) return;
  try {
    const ref  = firebase.firestore().collection('config').doc('coupons');
    const snap = await ref.get();
    const codes = (snap.data()?.codes||[]).filter(c => c.code !== code);
    await ref.set({ codes });
    _loadCoupons();
  } catch(e) { showToastSafe('❌ ' + e.message, '#DC2626'); }
}

// Client-side coupon redemption (called from account modal)
async function redeemCoupon() {
  const code = prompt('Enter your coupon code:');
  if (!code) return;
  const user = getLocalUser(); if (!user) return;
  try {
    const ref  = firebase.firestore().collection('config').doc('coupons');
    const snap = await ref.get();
    const codes = snap.data()?.codes || [];
    const idx   = codes.findIndex(c => c.code === code.trim().toUpperCase());
    if (idx === -1)              { showToastSafe('❌ Invalid coupon code.', '#DC2626'); return; }
    if (codes[idx].usedBy)       { showToastSafe('❌ Coupon already used.', '#DC2626'); return; }
    const days = codes[idx].days;
    codes[idx].usedBy = user.uid;
    await ref.set({ codes });
    await setPremium(user.uid, 0); // grant days not months — patch:
    const expiry = Math.max(_userRecord.premiumExpiry||Date.now(), Date.now()) + days*86400000;
    _userRecord.premiumExpiry = expiry;
    localStorage.setItem('userRecord_' + user.uid, JSON.stringify(_userRecord));
    await firebase.firestore().collection('users').doc(user.uid).set({ premiumExpiry: expiry }, { merge: true });
    updateUserBadge();
    showToastSafe(`🎉 Coupon applied! ${days} days premium unlocked.`, '#7C3AED');
  } catch(e) { showToastSafe('❌ ' + e.message, '#DC2626'); }
}

// ── REFERRAL TRACKING ─────────────────────────────────────
async function _loadReferrals() {
  const el = document.getElementById('referral-stats'); if (!el) return;
  try {
    const snap = await firebase.firestore().collection('users').get();
    const users = snap.docs.map(d => d.data());
    const referred = users.filter(u => u.referredBy);
    const topRefs = {};
    referred.forEach(u => { topRefs[u.referredBy] = (topRefs[u.referredBy]||0) + 1; });
    const sorted = Object.entries(topRefs).sort((a,b) => b[1]-a[1]).slice(0,5);
    el.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
        <div style="background:#EFF6FF;border-radius:10px;padding:10px">
          <div style="font-size:10px;color:#1E40AF;font-weight:600">Total Referred</div>
          <div style="font-size:22px;font-weight:800;color:#1E40AF">${referred.length}</div>
        </div>
        <div style="background:#F0FDF4;border-radius:10px;padding:10px">
          <div style="font-size:10px;color:#166534;font-weight:600">Top Referrers</div>
          <div style="font-size:22px;font-weight:800;color:#166534">${sorted.length}</div>
        </div>
      </div>
      ${sorted.length ? sorted.map((r,i)=>`
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #F1F5F9;font-size:12px">
          <span style="color:#1E293B">${['🥇','🥈','🥉','4️⃣','5️⃣'][i]} ${r[0]}</span>
          <span style="font-weight:700;color:#059669">${r[1]} referrals</span>
        </div>`).join('') : '<div style="color:#94A3B8;font-size:11px;padding-top:4px">No referrals yet. Add referredBy field to user docs.</div>'}
    `;
  } catch(e) { el.innerHTML = `<span style="color:#DC2626">${e.message}</span>`; }
}

// ── REVENUE TRACKER ───────────────────────────────────────
async function adminAddRevenue() {
  const amount = parseInt(document.getElementById('rev-amount')?.value||'0');
  const note   = document.getElementById('rev-note')?.value||'';
  if (!amount) { showToastSafe('Enter an amount', '#DC2626'); return; }
  try {
    const ref  = firebase.firestore().collection('config').doc('revenue');
    const snap = await ref.get();
    const entries = snap.exists ? (snap.data().entries||[]) : [];
    entries.push({ amount, note, date: Date.now() });
    await ref.set({ entries }, { merge: true });
    document.getElementById('rev-amount').value = '';
    document.getElementById('rev-note').value   = '';
    showToastSafe('✅ Payment logged!', '#059669');
    _loadRevenueSummary();
  } catch(e) { showToastSafe('❌ ' + e.message, '#DC2626'); }
}

async function _loadRevenueSummary() {
  const el = document.getElementById('revenue-summary'); if (!el) return;
  try {
    const snap = await firebase.firestore().collection('config').doc('revenue').get();
    const entries = snap.exists ? (snap.data().entries||[]) : [];
    const total = entries.reduce((s,e)=>s+(e.amount||0),0);
    const now = Date.now();
    const thisMonth = entries.filter(e => (now - e.date) < 30*86400000).reduce((s,e)=>s+(e.amount||0),0);
    el.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
        <div style="background:#ECFDF5;border-radius:10px;padding:10px">
          <div style="font-size:10px;color:#166534;font-weight:600">Total</div>
          <div style="font-size:20px;font-weight:800;color:#166534">₹${total}</div>
        </div>
        <div style="background:#F0FDF4;border-radius:10px;padding:10px">
          <div style="font-size:10px;color:#166534;font-weight:600">This Month</div>
          <div style="font-size:20px;font-weight:800;color:#166534">₹${thisMonth}</div>
        </div>
      </div>
      ${entries.slice().reverse().slice(0,5).map(e=>`
        <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #F1F5F9;font-size:12px">
          <span style="color:#64748B">${e.note||'Payment'} · ${_timeAgo(e.date)}</span>
          <span style="font-weight:700;color:#059669">₹${e.amount}</span>
        </div>`).join('')||'<div style="color:#94A3B8;font-size:11px">No entries yet.</div>'}
    `;
  } catch(e) { el.innerHTML = `<span style="color:#DC2626">${e.message}</span>`; }
}

// ── FEEDBACK INBOX ────────────────────────────────────────
async function _loadFeedbackInbox() {
  const el = document.getElementById('feedback-inbox'); if (!el) return;
  try {
    const snap = await firebase.firestore().collection('feedback').orderBy('date','desc').limit(10).get();
    if (snap.empty) { el.innerHTML = '<div style="color:#94A3B8">No feedback yet.</div>'; return; }
    el.innerHTML = snap.docs.map(d => {
      const f = d.data();
      return `<div style="background:#F8FAFF;border-radius:10px;padding:10px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span style="font-size:11px;font-weight:700;color:#1E293B">${f.name||f.email||'User'}</span>
          <span style="font-size:10px;color:#94A3B8">${_timeAgo(f.date)}</span>
        </div>
        <div style="font-size:12px;color:#374151;line-height:1.5">${f.message||'—'}</div>
        ${f.rating ? `<div style="font-size:11px;color:#D97706;margin-top:4px">${'⭐'.repeat(f.rating)}</div>` : ''}
        <button onclick="adminMarkFeedbackRead('${d.id}')" style="margin-top:6px;padding:3px 10px;background:#EEF2FF;color:#3730A3;border:none;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer">Mark Read</button>
      </div>`;
    }).join('');
  } catch(e) {
    // feedback collection might not exist or no index — show gracefully
    el.innerHTML = '<div style="color:#94A3B8;font-size:11px">No feedback collection found.<br>Submit feedback from app to populate.</div>';
  }
}

async function adminMarkFeedbackRead(id) {
  try {
    await firebase.firestore().collection('feedback').doc(id).set({ read: true }, { merge: true });
    _loadFeedbackInbox();
  } catch(e) {}
}

// ── FLAGGED QUESTIONS ─────────────────────────────────────
async function _loadFlaggedQuestions() {
  const el = document.getElementById('flagged-questions'); if (!el) return;
  try {
    const snap = await firebase.firestore().collection('flags').orderBy('date','desc').limit(10).get();
    if (snap.empty) { el.innerHTML = '<div style="color:#94A3B8">No flags yet.</div>'; return; }
    el.innerHTML = snap.docs.map(d => {
      const f = d.data();
      const statusColor = f.status === 'resolved' ? '#059669' : '#D97706';
      return `<div style="background:#FFFBEB;border-radius:10px;padding:10px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px">
          <div style="font-size:11px;font-weight:700;color:#92400E;flex:1;line-height:1.4">${(f.q||'').slice(0,80)}…</div>
          <span style="font-size:10px;background:${f.status==='resolved'?'#ECFDF5':'#FFFBEB'};color:${statusColor};padding:2px 7px;border-radius:10px;white-space:nowrap;font-weight:700;border:1px solid ${statusColor}30">${f.status||'pending'}</span>
        </div>
        <div style="font-size:11px;color:#64748B;margin-top:3px">Reason: ${f.reason||'—'} · ${f.votes||1} vote(s)</div>
        ${f.status !== 'resolved' ? `<button onclick="adminResolveFlag('${d.id}')" style="margin-top:6px;padding:3px 10px;background:#ECFDF5;color:#059669;border:none;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer">✅ Mark Resolved</button>` : ''}
      </div>`;
    }).join('');
  } catch(e) {
    el.innerHTML = '<div style="color:#94A3B8;font-size:11px">No flags collection found. Flags submitted in the app will appear here.</div>';
  }
}

async function adminResolveFlag(id) {
  try {
    await firebase.firestore().collection('flags').doc(id).set({ status: 'resolved' }, { merge: true });
    _loadFlaggedQuestions();
  } catch(e) {}
}

// ── QUIZ LEADERBOARD ─────────────────────────────────────
async function _loadLeaderboard() {
  const el = document.getElementById('quiz-leaderboard'); if (!el) return;
  try {
    const snap = await firebase.firestore().collection('users').get();
    const users = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(u => u.bestScore > 0 || u.totalQuestions > 0)
      .sort((a,b) => (b.bestScore||0) - (a.bestScore||0))
      .slice(0, 10);
    if (!users.length) { el.innerHTML = '<div style="color:#94A3B8;font-size:11px">No quiz scores yet. Scores are stored when users complete quizzes.</div>'; return; }
    el.innerHTML = `
      <div style="background:#fff;border-radius:10px;overflow:hidden">
        ${users.map((u,i) => `
          <div style="display:flex;align-items:center;gap:8px;padding:9px 12px;border-bottom:1px solid #F1F5F9">
            <span style="font-size:14px;width:20px">${['🥇','🥈','🥉'][i]||'#'+(i+1)}</span>
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:700;color:#1E293B;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${u.name||(u.email||'').split('@')[0]}</div>
              <div style="font-size:10px;color:#94A3B8">${u.totalQuestions||0} Qs attempted</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:14px;font-weight:800;color:#3730A3">${u.bestScore||0}%</div>
              <div style="font-size:10px;color:#94A3B8">best</div>
            </div>
          </div>`).join('')}
      </div>`;
  } catch(e) { el.innerHTML = `<span style="color:#DC2626;font-size:11px">${e.message}</span>`; }
}

// ── SETTINGS TAB ──────────────────────────────────────────
async function adminLoadSettings() {
  const loadEl    = document.getElementById('settings-loading');
  const contentEl = document.getElementById('settings-content');
  if (!loadEl || !contentEl || contentEl.dataset.loaded) return;
  loadEl.style.display    = 'block';
  contentEl.style.display = 'none';

  try {
    const db   = firebase.firestore();
    const snap = await db.collection('config').doc('appSettings').get();
    const cfg  = snap.exists ? snap.data() : {};

    loadEl.style.display    = 'none';
    contentEl.style.display = 'block';
    contentEl.dataset.loaded = '1';

    contentEl.innerHTML = `
      <!-- Announcement Banner -->
      <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
        <div style="font-size:11px;font-weight:700;color:#0891B2;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px">📢 Announcement Banner</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="font-size:12px;color:#374151;font-weight:600">Show banner</span>
          <label style="position:relative;width:40px;height:22px;cursor:pointer">
            <input type="checkbox" id="cfg-banner-on" ${cfg.bannerEnabled?'checked':''} onchange="adminSaveSetting('bannerEnabled',this.checked)"
              style="opacity:0;width:0;height:0;position:absolute">
            <div id="cfg-banner-track" style="position:absolute;inset:0;border-radius:11px;background:${cfg.bannerEnabled?'#3730A3':'#CBD5E1'};transition:background .2s"></div>
            <div style="position:absolute;top:3px;left:${cfg.bannerEnabled?'21px':'3px'};width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)" id="cfg-banner-thumb"></div>
          </label>
        </div>
        <input id="cfg-banner-text" value="${cfg.bannerText||''}" placeholder="Banner message…"
          style="width:100%;padding:9px 11px;border:2px solid #E2E8F0;border-radius:9px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;box-sizing:border-box;margin-bottom:8px">
        <div style="display:flex;gap:8px">
          <input id="cfg-banner-color" type="color" value="${cfg.bannerColor||'#1A237E'}" title="Banner color"
            style="width:40px;height:36px;border:2px solid #E2E8F0;border-radius:8px;cursor:pointer;padding:2px">
          <button onclick="adminSaveBanner()"
            style="flex:1;padding:9px;background:#0891B2;color:#fff;border:none;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer">Save Banner</button>
        </div>
      </div>

      <!-- Maintenance Mode -->
      <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
        <div style="font-size:11px;font-weight:700;color:#DC2626;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px">🚧 Maintenance Mode</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="font-size:12px;color:#374151;font-weight:600">Enable maintenance</span>
          <label style="position:relative;width:40px;height:22px;cursor:pointer">
            <input type="checkbox" id="cfg-maint-on" ${cfg.maintenanceMode?'checked':''} onchange="adminSaveSetting('maintenanceMode',this.checked)"
              style="opacity:0;width:0;height:0;position:absolute">
            <div style="position:absolute;inset:0;border-radius:11px;background:${cfg.maintenanceMode?'#DC2626':'#CBD5E1'};transition:background .2s" id="cfg-maint-track"></div>
            <div style="position:absolute;top:3px;left:${cfg.maintenanceMode?'21px':'3px'};width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s" id="cfg-maint-thumb"></div>
          </label>
        </div>
        <input id="cfg-maint-msg" value="${cfg.maintenanceMessage||''}" placeholder="Message shown to users…"
          style="width:100%;padding:9px 11px;border:2px solid #E2E8F0;border-radius:9px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;box-sizing:border-box;margin-bottom:8px">
        <button onclick="adminSaveMaintenance()"
          style="width:100%;padding:9px;background:#DC2626;color:#fff;border:none;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer">Save</button>
      </div>

      <!-- Force Update -->
      <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
        <div style="font-size:11px;font-weight:700;color:#D97706;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px">📦 Force Update</div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <input id="cfg-min-version" value="${cfg.minVersion||''}" placeholder="Min version e.g. 1.0.3"
            style="flex:1;padding:9px 11px;border:2px solid #E2E8F0;border-radius:9px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none">
          <input id="cfg-update-url" value="${cfg.updateUrl||''}" placeholder="APK URL"
            style="flex:1;padding:9px 11px;border:2px solid #E2E8F0;border-radius:9px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none">
        </div>
        <button onclick="adminSaveForceUpdate()"
          style="width:100%;padding:9px;background:#D97706;color:#fff;border:none;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer">Save Force Update</button>
        <div style="font-size:11px;color:#94A3B8;margin-top:6px">Users on versions below minVersion will see a mandatory update screen.</div>
      </div>

      <!-- A/B Test Flags -->
      <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
        <div style="font-size:11px;font-weight:700;color:#7C3AED;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px">🧪 A/B Test Flags</div>
        ${['newOnboarding','timerVariant','paywallV2','darkModeTest'].map(flag => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid #F8FAFF">
            <span style="font-size:12px;font-family:monospace;color:#374151">${flag}</span>
            <label style="position:relative;width:36px;height:20px;cursor:pointer">
              <input type="checkbox" ${(cfg.abFlags||{})[flag]?'checked':''} onchange="adminToggleABFlag('${flag}',this.checked)"
                style="opacity:0;width:0;height:0;position:absolute">
              <div style="position:absolute;inset:0;border-radius:10px;background:${(cfg.abFlags||{})[flag]?'#7C3AED':'#CBD5E1'};transition:background .2s"></div>
              <div style="position:absolute;top:2px;left:${(cfg.abFlags||{})[flag]?'18px':'2px'};width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)"></div>
            </label>
          </div>`).join('')}
        <div style="font-size:11px;color:#94A3B8;margin-top:8px">Read via <code>config/appSettings.abFlags.flagName</code> in app.</div>
      </div>

      <!-- Trial Expiry Reminder -->
      <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
        <div style="font-size:11px;font-weight:700;color:#0891B2;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px">⏰ Trial Expiry Reminders</div>
        <div style="font-size:12px;color:#374151;margin-bottom:10px;line-height:1.6">
          Send a Firestore notification document to users whose trial expires within 2 days.
          The app reads <code>notifications/{uid}</code> and shows a toast on next open.
        </div>
        <button onclick="adminSendTrialReminders()"
          style="width:100%;padding:10px;background:#0891B2;color:#fff;border:none;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer">
          🔔 Send Trial Expiry Reminders Now
        </button>
        <div id="reminder-result" style="margin-top:8px;font-size:12px"></div>
      </div>

      <!-- Featured Question Editor -->
      <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
        <div style="font-size:11px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px">⭐ Featured Question of the Day</div>
        <textarea id="cfg-featured-q" placeholder="Question text…" rows="2"
          style="width:100%;padding:9px 11px;border:2px solid #E2E8F0;border-radius:9px;font-size:12px;font-family:'DM Sans',sans-serif;outline:none;box-sizing:border-box;resize:vertical;margin-bottom:6px">${cfg.featuredQuestion?.q||''}</textarea>
        <input id="cfg-featured-ans" value="${cfg.featuredQuestion?.ans||''}" placeholder="Correct answer"
          style="width:100%;padding:9px 11px;border:2px solid #E2E8F0;border-radius:9px;font-size:12px;font-family:'DM Sans',sans-serif;outline:none;box-sizing:border-box;margin-bottom:8px">
        <button onclick="adminSaveFeaturedQuestion()"
          style="width:100%;padding:9px;background:#059669;color:#fff;border:none;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer">Save Featured Question</button>
      </div>
      <div style="height:12px"></div>
    `;
  } catch(e) {
    loadEl.innerHTML = `<div style="color:#DC2626;font-size:13px">❌ ${e.message}</div>`;
  }
}

// ── SETTINGS SAVERS ───────────────────────────────────────
async function adminSaveSetting(key, value) {
  try {
    await firebase.firestore().collection('config').doc('appSettings').set({ [key]: value }, { merge: true });
    // update toggle visuals
    const trackId = key === 'bannerEnabled' ? 'cfg-banner-track' : key === 'maintenanceMode' ? 'cfg-maint-track' : null;
    const thumbId = key === 'bannerEnabled' ? 'cfg-banner-thumb' : key === 'maintenanceMode' ? 'cfg-maint-thumb' : null;
    if (trackId) {
      const color = key === 'maintenanceMode' ? '#DC2626' : '#3730A3';
      document.getElementById(trackId).style.background = value ? color : '#CBD5E1';
      document.getElementById(thumbId).style.left = value ? '21px' : '3px';
    }
    showToastSafe(value ? '✅ Enabled' : '✅ Disabled', '#059669');
  } catch(e) { showToastSafe('❌ ' + e.message, '#DC2626'); }
}

async function adminSaveBanner() {
  const text  = document.getElementById('cfg-banner-text')?.value||'';
  const color = document.getElementById('cfg-banner-color')?.value||'#1A237E';
  const on    = document.getElementById('cfg-banner-on')?.checked || false;
  try {
    await firebase.firestore().collection('config').doc('appSettings').set(
      { bannerText: text, bannerColor: color, bannerEnabled: on }, { merge: true });
    showToastSafe('✅ Banner saved!', '#0891B2');
  } catch(e) { showToastSafe('❌ ' + e.message, '#DC2626'); }
}

async function adminSaveMaintenance() {
  const msg = document.getElementById('cfg-maint-msg')?.value||'';
  const on  = document.getElementById('cfg-maint-on')?.checked || false;
  try {
    await firebase.firestore().collection('config').doc('appSettings').set(
      { maintenanceMode: on, maintenanceMessage: msg }, { merge: true });
    showToastSafe('✅ Maintenance settings saved!', '#DC2626');
  } catch(e) { showToastSafe('❌ ' + e.message, '#DC2626'); }
}

async function adminSaveForceUpdate() {
  const minVersion = document.getElementById('cfg-min-version')?.value||'';
  const updateUrl  = document.getElementById('cfg-update-url')?.value||'';
  try {
    await firebase.firestore().collection('config').doc('appSettings').set(
      { minVersion, updateUrl }, { merge: true });
    showToastSafe('✅ Force update saved!', '#D97706');
  } catch(e) { showToastSafe('❌ ' + e.message, '#DC2626'); }
}

async function adminToggleABFlag(flag, value) {
  try {
    const ref  = firebase.firestore().collection('config').doc('appSettings');
    const snap = await ref.get();
    const abFlags = (snap.data()?.abFlags) || {};
    abFlags[flag] = value;
    await ref.set({ abFlags }, { merge: true });
    showToastSafe(`🧪 ${flag} = ${value}`, '#7C3AED');
  } catch(e) { showToastSafe('❌ ' + e.message, '#DC2626'); }
}

async function adminSendTrialReminders() {
  const resultEl = document.getElementById('reminder-result');
  if (resultEl) { resultEl.style.color='#0891B2'; resultEl.textContent = 'Sending…'; }
  try {
    const db  = firebase.firestore();
    const now = Date.now();
    const snap = await db.collection('users').get();
    const expiringSoon = snap.docs
      .map(d => ({ uid: d.id, ...d.data() }))
      .filter(u => {
        if ((u.premiumExpiry||0) > now) return false; // already premium
        const left = (u.trialStart||0) + 7*86400000 - now;
        return left > 0 && left < 2*86400000; // expires within 2 days
      });
    const batch = db.batch();
    expiringSoon.forEach(u => {
      const ref = db.collection('notifications').doc(u.uid);
      batch.set(ref, {
        type: 'trialExpiry',
        message: `⚠️ Your free trial expires in less than 2 days! Upgrade to keep access.`,
        createdAt: now, read: false
      }, { merge: true });
    });
    await batch.commit();
    const msg = `✅ Sent to ${expiringSoon.length} user(s)`;
    if (resultEl) { resultEl.style.color='#059669'; resultEl.textContent = msg; }
    showToastSafe(msg, '#0891B2');
  } catch(e) {
    if (resultEl) { resultEl.style.color='#DC2626'; resultEl.textContent = '❌ ' + e.message; }
  }
}

async function adminSaveFeaturedQuestion() {
  const q   = document.getElementById('cfg-featured-q')?.value||'';
  const ans = document.getElementById('cfg-featured-ans')?.value||'';
  if (!q) { showToastSafe('Enter a question', '#DC2626'); return; }
  try {
    await firebase.firestore().collection('config').doc('appSettings').set(
      { featuredQuestion: { q, ans, date: Date.now() } }, { merge: true });
    showToastSafe('✅ Featured question saved!', '#059669');
  } catch(e) { showToastSafe('❌ ' + e.message, '#DC2626'); }
}

// ── APP STARTUP: read banner + maintenance + force-update ─
async function _checkAppConfig() {
  try {
    const db   = firebase.firestore();
    const snap = await db.collection('config').doc('appSettings').get();
    if (!snap.exists) return;
    const cfg = snap.data();

    // Maintenance mode — skip for admin
    const currentEmail = (firebase.auth().currentUser?.email || '').toLowerCase();
    try {
      const adminSnap = await db.collection('config').doc('admins').get();
      const adminEmails = adminSnap.exists ? (adminSnap.data().emails || []).map(e => e.trim().toLowerCase()) : [];
      if (adminEmails.includes(currentEmail)) return; // admin bypasses everything
    } catch(e) {}
    if (cfg.maintenanceMode) {
      _showMaintenanceScreen(cfg.maintenanceMessage || 'App is under maintenance. Please check back soon.');
      return;
    }

    // Force update check
    if (cfg.minVersion && typeof APP_CURRENT_VERSION !== 'undefined') {
      const toNum = v => v.split('.').map(n=>parseInt(n)).reduce((a,b)=>a*1000+b, 0);
      if (toNum(APP_CURRENT_VERSION) < toNum(cfg.minVersion)) {
        _showForceUpdateScreen(cfg.updateUrl || '');
        return;
      }
    }

    // Announcement banner
    if (cfg.bannerEnabled && cfg.bannerText) {
      _showAnnouncementBanner(cfg.bannerText, cfg.bannerColor || '#1A237E');
    }

    // Notification toast for current user
    const user = getLocalUser();
    if (user) {
      const notifSnap = await db.collection('notifications').doc(user.uid).get();
      if (notifSnap.exists && !notifSnap.data().read) {
        setTimeout(() => {
          showToastSafe(notifSnap.data().message, '#0891B2');
          db.collection('notifications').doc(user.uid).set({ read: true }, { merge: true });
        }, 2000);
      }
    }
  } catch(e) { console.warn('Config check failed:', e); }
}

function _showMaintenanceScreen(msg) {
  if (document.getElementById('maintenance-screen')) return;
  const el = document.createElement('div');
  el.id = 'maintenance-screen';
  el.style.cssText = 'position:fixed;inset:0;background:#1A237E;z-index:9999999;display:flex;align-items:center;justify-content:center;padding:30px;text-align:center';
  el.innerHTML = `
    <div style="color:#fff">
      <div style="font-size:56px;margin-bottom:20px">🚧</div>
      <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;margin-bottom:12px">Under Maintenance</div>
      <div style="font-size:14px;opacity:.8;max-width:280px;line-height:1.6">${msg}</div>
      <div style="font-size:12px;opacity:.5;margin-top:20px">MP GK Portal</div>
    </div>`;
  document.body.appendChild(el);
}

function _showForceUpdateScreen(url) {
  if (document.getElementById('force-update-screen')) return;
  const el = document.createElement('div');
  el.id = 'force-update-screen';
  el.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:9999999;display:flex;align-items:center;justify-content:center;padding:30px;text-align:center';
  el.innerHTML = `
    <div>
      <div style="font-size:56px;margin-bottom:20px">📦</div>
      <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#1A237E;margin-bottom:12px">Update Required</div>
      <div style="font-size:14px;color:#64748B;margin-bottom:24px;line-height:1.6">A new version of the app is required to continue. Please update to the latest version.</div>
      ${url ? `<a href="${url}" style="display:block;padding:14px;background:#1A237E;color:#fff;border-radius:12px;font-weight:700;text-decoration:none;font-size:15px">⬇️ Download Update</a>` : ''}
    </div>`;
  document.body.appendChild(el);
}

function _showAnnouncementBanner(text, color) {
  if (document.getElementById('announcement-banner')) return;
  const el = document.createElement('div');
  el.id = 'announcement-banner';
  el.style.cssText = `position:fixed;top:0;left:0;right:0;z-index:99998;background:${color};color:#fff;padding:10px 44px 10px 14px;font-size:13px;font-weight:600;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.2)`;
  el.innerHTML = `${text}<button onclick="document.getElementById('announcement-banner').remove()" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:#fff;font-size:18px;cursor:pointer;padding:0;line-height:1">×</button>`;
  document.body.prepend(el);
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
      // Reload Firestore record + admin check, then update UI
      _loadAndInitUser(user.uid).then(() => {
        return _checkAdmin(user.email); // _checkAdmin calls updateUserBadge at end
      }).then(() => {
        if (!isPremium() && !_isAdmin && !isTrialActive()) {
          setTimeout(() => showPaywall('full app access'), 1500);
        }
      });
    }
  }, 500);
});
