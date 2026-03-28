// ═══════════════════════════════════════════════════════════════════════════════
// auth.js — FINAL FIXED VERSION
// Fixes: trial countdown, admin review tab, real-time timer
// ═══════════════════════════════════════════════════════════════════════════════

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
const TRIAL_DAYS = 7;

// Admin emails loaded from Firestore — never hardcoded here
let ADMIN_EMAILS = [];

let currentUser = null;
let firebaseAuth = null;
let firestoreDb = null;
let firebaseInitialized = false;
let trialTimerInterval = null;

// ── INITIALIZE FIREBASE ──────────────────────────────────────────────────────
async function initFirebase() {
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js");
    const { getAuth, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js");
    const { getFirestore, doc, getDoc } = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js");

    const app = initializeApp(FIREBASE_CONFIG);
    firebaseAuth = getAuth(app);
    firestoreDb = getFirestore(app);
    firebaseInitialized = true;

    // ── FIX: Load admin emails from Firestore safely ──
    // In Firebase Console → Firestore → collection "config" → document "admins"
    // → field "emails" (array) → add your email strings there
    try {
      const snap = await getDoc(doc(firestoreDb, "config", "admins"));
      if (snap.exists() && snap.data().emails) {
        ADMIN_EMAILS = snap.data().emails;
        console.log('✅ Admin list loaded:', ADMIN_EMAILS.length, 'admins');
      }
    } catch(e) { console.warn('Could not load admin list:', e.message); }

    onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        currentUser = user;
        // ── FIX: startTrialIfNew on EVERY login, not just register ──
        startTrialIfNew(user.uid);
        saveUserLocally(user);
        onUserLoggedIn(user);
      } else {
        currentUser = null;
        stopTrialTimer();
      }
    });

  } catch (error) {
    console.error('Firebase init error:', error.message);
    setTimeout(initFirebase, 2000);
  }
}

// ── ADMIN CHECK ───────────────────────────────────────────────────────────────
function isAdmin() {
  const user = getLocalUser();
  if (!user || !user.email) return false;
  return ADMIN_EMAILS.includes(user.email);
}

// ── LOGIN SCREEN ──────────────────────────────────────────────────────────────
function showLoginScreen() {
  if (localStorage.getItem('mppsc_user')) return;
  if (document.getElementById('login-screen')) return;

  const el = document.createElement('div');
  el.id = 'login-screen';
  el.style.cssText = 'position:fixed;inset:0;background:#1A237E;z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto';
  el.innerHTML = `
    <div style="background:#fff;border-radius:24px;padding:36px 28px;max-width:360px;width:100%;text-align:center">
      <div style="width:72px;height:72px;border-radius:16px;margin:0 auto 16px;background:linear-gradient(135deg,#1A237E,#5E35B1);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:32px">MP</div>
      <div style="font-size:22px;font-weight:800;color:#1A237E;margin-bottom:6px">MP GK Portal</div>
      <div style="font-size:13px;color:#64748B;margin-bottom:20px">MPPSC 2026 — Complete Prep</div>

      <div style="background:#F0F4FF;border-radius:12px;padding:14px;margin-bottom:20px;text-align:left">
        <div style="font-size:13px;font-weight:700;color:#1A237E;margin-bottom:8px">🎁 Free 7-Day Trial Includes:</div>
        <div style="font-size:12px;color:#374151;line-height:2">
          ✅ All 421+ MCQs<br>
          ✅ Full PYQ papers access<br>
          ✅ Timed mock tests<br>
          ✅ Complete notes & flashcards<br>
          <span style="color:#1A237E;font-weight:600">After 7 days — only ₹100 / 6 months</span>
        </div>
      </div>

      <div style="display:flex;gap:8px;margin-bottom:16px">
        <button onclick="switchTab('login')" id="tab-login"
          style="flex:1;padding:8px;background:#1A237E;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:13px">Login</button>
        <button onclick="switchTab('register')" id="tab-register"
          style="flex:1;padding:8px;background:#F1F5F9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:13px">Register</button>
      </div>

      <input id="auth-email" type="email" placeholder="Email address"
        style="width:100%;padding:12px;border:1.5px solid #E5E7EB;border-radius:10px;font-size:14px;margin-bottom:10px;box-sizing:border-box;outline:none">
      <input id="auth-password" type="password" placeholder="Password"
        style="width:100%;padding:12px;border:1.5px solid #E5E7EB;border-radius:10px;font-size:14px;margin-bottom:10px;box-sizing:border-box;outline:none">
      <input id="auth-name" type="text" placeholder="Your name"
        style="width:100%;padding:12px;border:1.5px solid #E5E7EB;border-radius:10px;font-size:14px;margin-bottom:14px;box-sizing:border-box;outline:none;display:none">

      <button onclick="handleAuth()" id="auth-btn"
        style="width:100%;padding:14px;background:#1A237E;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;margin-bottom:10px">
        Login
      </button>

      <div id="forgot-link" style="font-size:12px;color:#1A237E;cursor:pointer;margin-bottom:8px" onclick="handleForgotPassword()">
        Forgot password?
      </div>

      <div id="login-error" style="color:#DC2626;font-size:12px;margin-top:6px;display:none"></div>
      <div style="font-size:11px;color:#9CA3AF;margin-top:12px">By continuing you agree to our <a href="privacy.html" style="color:#1A237E">Privacy Policy</a></div>
    </div>
  `;
  document.body.appendChild(el);
}

let currentTab = 'login';

function switchTab(tab) {
  currentTab = tab;
  const nameField = document.getElementById('auth-name');
  const btn = document.getElementById('auth-btn');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const forgot = document.getElementById('forgot-link');
  if (tab === 'login') {
    nameField.style.display = 'none';
    btn.textContent = 'Login';
    tabLogin.style.cssText += ';background:#1A237E;color:#fff';
    tabRegister.style.cssText += ';background:#F1F5F9;color:#374151';
    forgot.style.display = 'block';
  } else {
    nameField.style.display = 'block';
    btn.textContent = 'Create Account';
    tabRegister.style.cssText += ';background:#1A237E;color:#fff';
    tabLogin.style.cssText += ';background:#F1F5F9;color:#374151';
    forgot.style.display = 'none';
  }
  document.getElementById('login-error').style.display = 'none';
}

async function handleAuth() {
  if (!firebaseInitialized || !firebaseAuth) { showAuthError('Please wait, loading...'); return; }
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const name = document.getElementById('auth-name').value.trim();
  const btn = document.getElementById('auth-btn');
  if (!email || !password) { showAuthError('Please enter email and password.'); return; }
  if (currentTab === 'register' && !name) { showAuthError('Please enter your name.'); return; }
  if (password.length < 6) { showAuthError('Password must be at least 6 characters.'); return; }
  btn.disabled = true;
  btn.textContent = currentTab === 'login' ? 'Logging in...' : 'Creating account...';
  try {
    const { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } =
      await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js");
    if (currentTab === 'login') {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
    } else {
      const result = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      await updateProfile(result.user, { displayName: name });
    }
  } catch (error) {
    let msg = 'Something went wrong. Try again.';
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') msg = 'No account found with this email.';
    else if (error.code === 'auth/wrong-password') msg = 'Incorrect password.';
    else if (error.code === 'auth/email-already-in-use') msg = 'Email already registered. Please login.';
    else if (error.code === 'auth/invalid-email') msg = 'Invalid email address.';
    else if (error.code === 'auth/too-many-requests') msg = 'Too many attempts. Try later.';
    showAuthError(msg);
    btn.disabled = false;
    btn.textContent = currentTab === 'login' ? 'Login' : 'Create Account';
  }
}

async function handleForgotPassword() {
  const email = document.getElementById('auth-email').value.trim();
  if (!email) { showAuthError('Enter your email first.'); return; }
  try {
    const { sendPasswordResetEmail } = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js");
    await sendPasswordResetEmail(firebaseAuth, email);
    showAuthError('✅ Reset email sent! Check your inbox.', '#15803D');
  } catch (e) { showAuthError('Could not send reset email. Check the address.'); }
}

function showAuthError(msg, color) {
  const el = document.getElementById('login-error');
  if (el) { el.textContent = msg; el.style.color = color || '#DC2626'; el.style.display = 'block'; }
}

// ── USER HELPERS ──────────────────────────────────────────────────────────────
function saveUserLocally(user) {
  localStorage.setItem('mppsc_user', JSON.stringify({
    uid: user.uid,
    name: user.displayName || user.email.split('@')[0],
    email: user.email,
    photo: user.photoURL || null
  }));
}
function getLocalUser() {
  try { return JSON.parse(localStorage.getItem('mppsc_user')); } catch { return null; }
}
function removeLoginScreen() { document.getElementById('login-screen')?.remove(); }

// ── TRIAL SYSTEM ──────────────────────────────────────────────────────────────
function startTrialIfNew(uid) {
  const key = 'trial_start_' + uid;
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, Date.now().toString());
    showToastSafe('🎁 7-day free trial started!', '#15803D');
  }
}

function getTrialMsLeft(uid) {
  const start = parseInt(localStorage.getItem('trial_start_' + uid) || '0');
  if (!start) return TRIAL_DAYS * 86400000;
  const elapsed = Date.now() - start;
  return Math.max(0, TRIAL_DAYS * 86400000 - elapsed);
}

function getTrialDaysLeft(uid) {
  return Math.ceil(getTrialMsLeft(uid) / 86400000);
}

function isTrialActive(uid) { return getTrialMsLeft(uid) > 0; }

// ── REAL-TIME TRIAL TIMER ─────────────────────────────────────────────────────
function startTrialTimer(uid) {
  stopTrialTimer();
  updateTrialTimerDisplay(uid);
  trialTimerInterval = setInterval(() => updateTrialTimerDisplay(uid), 1000);
}

function stopTrialTimer() {
  if (trialTimerInterval) { clearInterval(trialTimerInterval); trialTimerInterval = null; }
}

function updateTrialTimerDisplay(uid) {
  const msLeft = getTrialMsLeft(uid);
  const el = document.getElementById('trial-timer');
  if (!el) return;

  if (msLeft <= 0) {
    el.textContent = 'Trial expired';
    el.style.color = '#DC2626';
    stopTrialTimer();
    return;
  }

  const days = Math.floor(msLeft / 86400000);
  const hours = Math.floor((msLeft % 86400000) / 3600000);
  const mins = Math.floor((msLeft % 3600000) / 60000);
  const secs = Math.floor((msLeft % 60000) / 1000);

  if (days > 0) {
    el.textContent = `${days}d ${hours}h ${mins}m ${secs}s`;
  } else {
    el.textContent = `${hours}h ${mins}m ${secs}s`;
  }
}

// ── PREMIUM SYSTEM ────────────────────────────────────────────────────────────
function isPremium() {
  const user = getLocalUser();
  if (!user) return false;
  if (ADMIN_EMAILS.includes(user.email)) return true; // admins always premium
  return parseInt(localStorage.getItem('premium_expiry_' + user.uid) || '0') > Date.now();
}

function setPremium(uid, months) {
  localStorage.setItem('premium_expiry_' + uid, (Date.now() + months * 30 * 86400000).toString());
}

function getPremiumDaysLeft() {
  const user = getLocalUser();
  if (!user) return 0;
  if (ADMIN_EMAILS.includes(user.email)) return 9999;
  const expiry = parseInt(localStorage.getItem('premium_expiry_' + user.uid) || '0');
  return Math.max(0, Math.ceil((expiry - Date.now()) / 86400000));
}

// ── ON USER LOGGED IN ─────────────────────────────────────────────────────────
function onUserLoggedIn(user) {
  removeLoginScreen();
  updateUserBadge();
  updateReviewTabVisibility();

  const u = getLocalUser() || { uid: user.uid };
  if (!isPremium() && isTrialActive(u.uid)) {
    startTrialTimer(u.uid);
    const daysLeft = getTrialDaysLeft(u.uid);
    if (daysLeft <= 2) {
      setTimeout(() => showToastSafe(`⚠️ Trial ends in ${daysLeft} day${daysLeft > 1 ? 's' : ''}!`, '#D97706'), 3000);
    }
  }
}

// ── FIX: ADMIN REVIEW TAB VISIBILITY ─────────────────────────────────────────
function updateReviewTabVisibility() {
  // Uses id="nav-review" set in index.html
  const reviewTab = document.getElementById('nav-review');
  if (reviewTab) reviewTab.style.display = isAdmin() ? '' : 'none';
  // Also check by onclick for safety
  document.querySelectorAll('.nav-item').forEach(item => {
    const onclick = item.getAttribute('onclick') || '';
    if (onclick.includes("'review'")) {
      item.style.display = isAdmin() ? '' : 'none';
    }
  });
}

// ── USER BADGE ────────────────────────────────────────────────────────────────
function updateUserBadge() {
  const user = getLocalUser();
  if (!user) return;
  let badge = document.getElementById('user-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'user-badge';
    badge.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;padding:6px 10px;background:#fff;border:1px solid #E2E8F0;border-radius:10px;font-size:12px;font-weight:600;color:#1E293B';
    badge.onclick = showAccountModal;
    document.querySelector('.topbar-right')?.prepend(badge);
  }
  const premium = isPremium();
  const admin = isAdmin();
  const daysLeft = getTrialDaysLeft(user.uid);
  badge.innerHTML = `
    👤
    <span style="max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${user.name ? user.name.split(' ')[0] : 'User'}</span>
    ${admin
      ? `<span style="background:#7C3AED;color:#fff;font-size:10px;padding:2px 7px;border-radius:20px">ADMIN</span>`
      : premium
        ? `<span style="background:#15803D;color:#fff;font-size:10px;padding:2px 7px;border-radius:20px">PRO</span>`
        : daysLeft > 0
          ? `<span style="background:#D97706;color:#fff;font-size:10px;padding:2px 7px;border-radius:20px">${daysLeft}d left</span>`
          : `<span style="background:#DC2626;color:#fff;font-size:10px;padding:2px 7px;border-radius:20px">Expired</span>`}
  `;
}

// ── ACCOUNT MODAL ─────────────────────────────────────────────────────────────
function showAccountModal() {
  if (document.getElementById('account-modal')) { document.getElementById('account-modal').remove(); stopTrialTimer(); return; }
  const user = getLocalUser();
  if (!user) return;
  const premium = isPremium();
  const admin = isAdmin();
  const premiumDays = getPremiumDaysLeft();
  const trialActive = isTrialActive(user.uid);

  const features = [
    { icon:'📚', label:'421+ MCQs', detail:'Full MP GK question bank, all 15 chapters' },
    { icon:'📄', label:'PYQ Papers 2021–24', detail:'4 years of real MPPSC papers with answers' },
    { icon:'⏱️', label:'Timed Mock Tests', detail:'Exam-style simulation with full scoring' },
    { icon:'🃏', label:'Flashcard Revision', detail:'Smart cards for every topic & subtopic' },
    { icon:'📊', label:'Weak Area Tracker', detail:'Pinpoint exactly where you need to improve' },
    { icon:'📈', label:'Progress Analytics', detail:'Streaks, accuracy charts & detailed stats' },
    { icon:'🗺️', label:'MP Map Quiz', detail:'Interactive geography questions on the map' },
    { icon:'🔔', label:'Daily 10 Challenge', detail:'10 fresh questions daily to build the habit' },
  ];

  const statusColor = admin ? '#7C3AED' : premium ? '#15803D' : trialActive ? '#D97706' : '#DC2626';
  const statusBg = admin ? 'linear-gradient(135deg,#F5F3FF,#EDE9FE)' : premium ? 'linear-gradient(135deg,#F0FDF4,#DCFCE7)' : trialActive ? 'linear-gradient(135deg,#FFFBEB,#FEF3C7)' : 'linear-gradient(135deg,#FEF2F2,#FEE2E2)';
  const statusBorder = admin ? '#C4B5FD' : premium ? '#86EFAC' : trialActive ? '#FCD34D' : '#FCA5A5';

  const featRows = features.map(f => {
    const locked = !premium && !admin && !trialActive;
    return `<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #F1F5F9">
      <span style="font-size:18px;width:26px;text-align:center;flex-shrink:0">${f.icon}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:12.5px;font-weight:700;color:${locked ? '#94A3B8' : '#1E293B'}">${f.label}</div>
        <div style="font-size:11px;color:${locked ? '#CBD5E1' : '#64748B'}">${f.detail}</div>
      </div>
      <span style="font-size:15px;flex-shrink:0">${locked ? '🔒' : '✅'}</span>
    </div>`;
  }).join('');

  const modal = document.createElement('div');
  modal.id = 'account-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:99999;display:flex;align-items:flex-end;justify-content:center';

  modal.innerHTML = `
  <div style="background:#fff;border-radius:24px 24px 0 0;width:100%;max-width:480px;max-height:92vh;overflow-y:auto;padding-bottom:24px">

    <!-- Drag handle -->
    <div style="display:flex;justify-content:center;padding:10px 0 0"><div style="width:36px;height:4px;background:#E2E8F0;border-radius:2px"></div></div>

    <!-- Profile header -->
    <div style="background:linear-gradient(135deg,#1A237E 0%,#5E35B1 100%);padding:22px 24px 20px;margin:12px 16px 0;border-radius:16px;text-align:center">
      <div style="width:60px;height:60px;border-radius:50%;margin:0 auto 10px;border:3px solid rgba(255,255,255,0.5);background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-size:24px;overflow:hidden">
        ${user.photo ? `<img src="${user.photo}" style="width:100%;height:100%;object-fit:cover">` : '👤'}
      </div>
      <div style="font-size:17px;font-weight:800;color:#fff">${user.name || 'User'}</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.65);margin-top:2px">${user.email || ''}</div>
    </div>

    <div style="padding:16px 16px 0">

      <!-- Status card -->
      <div style="background:${statusBg};border:2px solid ${statusBorder};border-radius:14px;padding:14px 16px;margin-bottom:14px;text-align:center">
        <div style="font-size:13px;font-weight:800;color:${statusColor};letter-spacing:0.3px">
          ${admin ? '🛡️ ADMIN ACCOUNT — FULL ACCESS' : premium ? `✅ PREMIUM ACTIVE — ${premiumDays} DAYS LEFT` : trialActive ? '⏳ FREE TRIAL ACTIVE' : '❌ TRIAL EXPIRED — UPGRADE TO CONTINUE'}
        </div>
        ${!premium && !admin && trialActive ? `
          <div style="font-size:11px;color:#92400E;margin:6px 0 4px">Time remaining in your free trial:</div>
          <div id="trial-timer" style="font-size:24px;font-weight:800;color:#1A237E;font-variant-numeric:tabular-nums;letter-spacing:1.5px">--</div>
          <div style="font-size:10px;color:#92400E;margin-top:4px">⚠️ Everything locks when this hits zero</div>
        ` : ''}
        ${!premium && !admin && !trialActive ? `
          <div style="font-size:12px;color:#991B1B;margin-top:6px">All features are locked. Upgrade now to keep studying!</div>
        ` : ''}
      </div>

      <!-- Features section title -->
      <div style="font-size:11px;font-weight:800;color:#94A3B8;letter-spacing:1px;margin-bottom:6px;text-transform:uppercase">
        ${premium || admin ? '✨ Your Included Features' : trialActive ? '🎁 Trial Access — All Features Active' : '🔒 Locked — Upgrade to Unlock Everything'}
      </div>

      <!-- Features list -->
      <div style="background:#F8FAFF;border-radius:12px;padding:4px 12px;margin-bottom:14px">
        ${featRows}
      </div>

      <!-- Value proposition for non-premium -->
      ${!premium && !admin ? `
        <div style="background:linear-gradient(135deg,#1A237E,#5E35B1);border-radius:16px;padding:16px;margin-bottom:14px;text-align:center">
          <div style="font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:0.5px;margin-bottom:6px">UNLOCK EVERYTHING FOR</div>
          <div style="display:flex;align-items:baseline;justify-content:center;gap:6px;margin-bottom:4px">
            <span style="font-size:36px;font-weight:900;color:#fff">₹100</span>
            <span style="font-size:14px;color:rgba(255,255,255,0.7)">/6 months</span>
          </div>
          <div style="font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:14px">That's less than ₹17/month • Less than 1 chai ☕</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;text-align:left">
            <div style="background:rgba(255,255,255,0.12);border-radius:8px;padding:8px 10px;font-size:11px;color:rgba(255,255,255,0.9)">✅ No subscription</div>
            <div style="background:rgba(255,255,255,0.12);border-radius:8px;padding:8px 10px;font-size:11px;color:rgba(255,255,255,0.9)">✅ One-time payment</div>
            <div style="background:rgba(255,255,255,0.12);border-radius:8px;padding:8px 10px;font-size:11px;color:rgba(255,255,255,0.9)">✅ Instant activation</div>
            <div style="background:rgba(255,255,255,0.12);border-radius:8px;padding:8px 10px;font-size:11px;color:rgba(255,255,255,0.9)">✅ All 8 features</div>
          </div>
          <button onclick="document.getElementById('account-modal').remove();openPayment()"
            style="width:100%;padding:15px;background:#fff;color:#1A237E;border:none;border-radius:12px;font-size:16px;font-weight:800;cursor:pointer;box-shadow:0 4px 15px rgba(0,0,0,0.2)">
            🔓 Get Premium — ₹100
          </button>
        </div>
      ` : ''}

      <!-- Bottom actions -->
      <button onclick="showPage('donate');document.getElementById('account-modal').remove()"
        style="width:100%;padding:12px;background:#FFF7ED;color:#C2410C;border:1.5px solid #FED7AA;border-radius:12px;font-size:13px;font-weight:600;cursor:pointer;margin-bottom:8px">
        ❤️ Support Us — Donate
      </button>
      <button onclick="signOut()"
        style="width:100%;padding:10px;background:transparent;color:#DC2626;border:1.5px solid #FCA5A5;border-radius:12px;font-size:13px;cursor:pointer;margin-bottom:4px">
        Sign Out
      </button>
      <button onclick="document.getElementById('account-modal').remove()"
        style="width:100%;padding:8px;background:transparent;color:#9CA3AF;border:none;font-size:12px;cursor:pointer">
        Close
      </button>
    </div>
  </div>`;

  modal.addEventListener('click', e => { if (e.target === modal) { modal.remove(); stopTrialTimer(); } });
  document.body.appendChild(modal);
  if (!premium && !admin && trialActive) startTrialTimer(user.uid);
}


// ── SIGN OUT ──────────────────────────────────────────────────────────────────
async function signOut() {
  try { if (firebaseAuth) await firebaseAuth.signOut(); } catch(e) {}
  stopTrialTimer();
  localStorage.removeItem('mppsc_user');
  document.getElementById('account-modal')?.remove();
  document.getElementById('user-badge')?.remove();
  showLoginScreen();
}

// ── PAYWALL ───────────────────────────────────────────────────────────────────
function showPaywall(msg) {
  if (document.getElementById('paywall-modal')) return;
  const user = getLocalUser();
  if (!user || isPremium()) return;
  const el = document.createElement('div');
  el.id = 'paywall-modal';
  el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  el.innerHTML = `
    <div style="background:linear-gradient(135deg,#1A237E,#5E35B1);border-radius:20px;padding:40px 28px;max-width:380px;width:100%;text-align:center;color:#fff">
      <div style="font-size:48px;margin-bottom:12px">🔒</div>
      <div style="font-size:18px;font-weight:800;margin-bottom:8px">Trial Expired</div>
      <div style="font-size:14px;opacity:0.9;margin-bottom:8px">Unlock ${msg} with premium</div>
      <div style="font-size:12px;opacity:0.75;margin-bottom:20px">Your 7-day free trial has ended</div>
      <div style="background:rgba(255,255,255,0.15);border-radius:12px;padding:16px;margin-bottom:24px">
        <div style="font-size:28px;font-weight:800;margin-bottom:4px">₹100</div>
        <div style="font-size:13px">6 months full access</div>
      </div>
      <button onclick="openPayment()" id="pay-btn" style="width:100%;padding:14px;background:#fff;color:#1A237E;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;margin-bottom:10px">🔓 Unlock for ₹100</button>
      <button onclick="document.getElementById('paywall-modal').remove()" style="width:100%;padding:12px;background:rgba(255,255,255,0.2);color:#fff;border:none;border-radius:10px;font-size:14px;cursor:pointer">Continue as Guest</button>
    </div>
  `;
  document.body.appendChild(el);
}

// ── PAYMENT ───────────────────────────────────────────────────────────────────
async function openPayment() {
  const user = getLocalUser();
  if (!user) { showToastSafe('Please log in first', '#DC2626'); return; }
  if (typeof Razorpay === 'undefined') { showToastSafe('Payment gateway not loaded.', '#DC2626'); return; }
  const btn = document.getElementById('pay-btn');
  if (btn) { btn.textContent = 'Opening...'; btn.disabled = true; }
  const options = {
    key: RAZORPAY_KEY, amount: PREMIUM_PRICE, currency: 'INR',
    name: 'MP GK Portal', description: '6 Months Premium Access', image: 'icon.png',
    prefill: { name: user.name || '', email: user.email || '', contact: '' },
    notes: { uid: user.uid, months: PREMIUM_MONTHS },
    theme: { color: '#1A237E' },
    handler: function(response) {
      setPremium(user.uid, PREMIUM_MONTHS);
      stopTrialTimer();
      document.getElementById('paywall-modal')?.remove();
      updateUserBadge();
      showToastSafe('🎉 Premium unlocked for 6 months!', '#15803D');
    },
    modal: { ondismiss: function() { if (btn) { btn.textContent = '🔓 Unlock for ₹100'; btn.disabled = false; } } }
  };
  const rzp = new Razorpay(options);
  rzp.on('payment.failed', () => { showToastSafe('Payment failed. Try again.', '#DC2626'); });
  rzp.open();
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
function showToastSafe(msg, color) {
  if (typeof showToast === 'function') { showToast(msg, color); return; }
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:${color||'#1A237E'};color:#fff;padding:10px 20px;border-radius:20px;font-size:13px;z-index:999999;font-weight:600;pointer-events:none`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ── INIT ──────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  await initFirebase();
  setTimeout(() => {
    const user = getLocalUser();
    if (!user) {
      showLoginScreen();
    } else {
      updateUserBadge();
      updateReviewTabVisibility();
      if (!isPremium() && !isTrialActive(user.uid)) {
        setTimeout(() => showPaywall('full app access'), 1500);
      } else if (!isPremium()) {
        startTrialTimer(user.uid);
      }
    }
  }, 500);
});

console.log('✅ auth.js loaded');
