// ═══════════════════════════════════════════════════════
//  MPPSC APP — AUTH + TRIAL + PREMIUM SYSTEM
//  Google Sign-In → 7-day free trial → ₹100 / 6 months
// ═══════════════════════════════════════════════════════

// ── FIREBASE CONFIG ─────────────────────────────────────
// Replace these values with YOUR Firebase project config
// Get from: Firebase Console → Project Settings → Your Apps
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAJoOz73MrNt2pEVPf5Gh9BQ5r7yWz2l-Y",
  authDomain: "mpgk-9496d.firebaseapp.com",
  projectId: "mpgk-9496d",
  storageBucket: "mpgk-9496d.firebasestorage.app",
  messagingSenderId: "77589429691",
  appId: "1:77589429691:android:bc9b1754c40d5510c0589e"
  // NOTE: For web app, you may need to register a web app in Firebase Console
  // and get the specific web appId. The Android appId is shown above.
};

// ── RAZORPAY CONFIG ──────────────────────────────────────
const RAZORPAY_KEY = "YOUR_RAZORPAY_KEY_ID"; // Get from razorpay.com dashboard
const PREMIUM_PRICE = 10000; // ₹100 in paise
const PREMIUM_MONTHS = 6;

// ── STATE ────────────────────────────────────────────────
let currentUser = null;
let firebaseAuth = null;
let googleProvider = null;

// ── INIT FIREBASE ────────────────────────────────────────
function initFirebase() {
  if (typeof firebase === 'undefined') {
    console.log('Firebase not loaded yet, retrying...');
    setTimeout(initFirebase, 500);
    return;
  }
  if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
  }
  firebaseAuth = firebase.auth();
  googleProvider = new firebase.auth.GoogleAuthProvider();

  firebaseAuth.onAuthStateChanged(user => {
    if (user) {
      currentUser = user;
      onUserLoggedIn(user);
    } else {
      currentUser = null;
      showLoginScreen();
    }
  });
}

// ── LOGIN SCREEN ─────────────────────────────────────────
function showLoginScreen() {
  // Don't show if already logged in
  if (localStorage.getItem('mppsc_user')) return;

  const existing = document.getElementById('login-screen');
  if (existing) return;

  const el = document.createElement('div');
  el.id = 'login-screen';
  el.style.cssText = 'position:fixed;inset:0;background:#1A237E;z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px';
  el.innerHTML = `
    <div style="background:#fff;border-radius:24px;padding:36px 28px;max-width:360px;width:100%;text-align:center">
      <div style="width:72px;height:72px;border-radius:16px;margin-bottom:16px;margin-left:auto;margin-right:auto;background:linear-gradient(135deg,#1A237E 0%,#5E35B1 100%);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:32px">
        MP
      </div>
      <!-- Try loading logo image as fallback (optional) -->
      <img src="icon.png" onerror="this.style.display='none'" style="position:absolute;width:72px;height:72px;border-radius:16px;margin-bottom:16px;object-fit:cover;display:none">
      <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#1A237E;margin-bottom:6px">MP GK Portal</div>
      <div style="font-size:13px;color:#64748B;margin-bottom:6px">MPPSC 2026 — Complete Prep</div>

      <div style="background:#F0F4FF;border-radius:12px;padding:14px;margin:20px 0;text-align:left">
        <div style="font-size:13px;font-weight:700;color:#1A237E;margin-bottom:8px">🎁 Free Trial Includes:</div>
        <div style="font-size:12px;color:#374151;line-height:2">
          ✅ All 421+ MCQs for 7 days<br>
          ✅ Full PYQ papers access<br>
          ✅ Timed mock tests<br>
          ✅ Complete notes & flashcards
        </div>
      </div>

      <div style="font-size:12px;color:#64748B;margin-bottom:16px">After 7 days — only ₹100 for 6 months</div>

      <button onclick="signInWithGoogle()" id="google-btn"
        style="width:100%;padding:14px;background:#fff;color:#374151;border:2px solid #E5E7EB;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;font-family:'DM Sans',sans-serif;transition:all .2s">
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        Continue with Google
      </button>

      <div id="login-error" style="color:#DC2626;font-size:12px;margin-top:10px;display:none"></div>
      <div style="font-size:11px;color:#9CA3AF;margin-top:16px">By continuing you agree to our <a href="privacy.html" style="color:#1A237E">Privacy Policy</a></div>
    </div>
  `;
  document.body.appendChild(el);
}

// ── GOOGLE SIGN IN ────────────────────────────────────────
async function signInWithGoogle() {
  const btn = document.getElementById('google-btn');
  if (btn) { btn.textContent = 'Signing in...'; btn.disabled = true; }

  try {
    // Try popup first (works in browser), fallback to redirect (for WebView)
    let result;
    try {
      result = await firebaseAuth.signInWithPopup(googleProvider);
    } catch (popupErr) {
      await firebaseAuth.signInWithRedirect(googleProvider);
      return;
    }

    const user = result.user;
    saveUserLocally(user);
    startTrialIfNew(user.uid);
    removeLoginScreen();
    onUserLoggedIn(user);

  } catch (err) {
    const errEl = document.getElementById('login-error');
    if (errEl) { errEl.textContent = 'Sign in failed: ' + err.message; errEl.style.display = 'block'; }
    if (btn) { btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg> Continue with Google'; btn.disabled = false; }
  }
}

// ── USER HELPERS ──────────────────────────────────────────
function saveUserLocally(user) {
  localStorage.setItem('mppsc_user', JSON.stringify({
    uid: user.uid,
    name: user.displayName,
    email: user.email,
    photo: user.photoURL
  }));
}

function getLocalUser() {
  try { return JSON.parse(localStorage.getItem('mppsc_user')); } catch { return null; }
}

function removeLoginScreen() {
  const el = document.getElementById('login-screen');
  if (el) el.remove();
}

// ── TRIAL SYSTEM ──────────────────────────────────────────
function startTrialIfNew(uid) {
  const key = 'trial_start_' + uid;
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, Date.now().toString());
    showToastSafe('🎁 7-day free trial started!', '#15803D');
  }
}

function getTrialDaysLeft(uid) {
  const key = 'trial_start_' + uid;
  const start = parseInt(localStorage.getItem(key) || '0');
  if (!start) return 0;
  const daysPassed = (Date.now() - start) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(7 - daysPassed));
}

function isTrialActive(uid) {
  return getTrialDaysLeft(uid) > 0;
}

// ── PREMIUM SYSTEM ────────────────────────────────────────
function isPremium() {
  const user = getLocalUser();
  if (!user) return false;
  const key = 'premium_expiry_' + user.uid;
  const expiry = parseInt(localStorage.getItem(key) || '0');
  return expiry > Date.now();
}

function setPremium(uid, months) {
  const key = 'premium_expiry_' + uid;
  const expiry = Date.now() + (months * 30 * 24 * 60 * 60 * 1000);
  localStorage.setItem(key, expiry.toString());
}

function getPremiumDaysLeft() {
  const user = getLocalUser();
  if (!user) return 0;
  const key = 'premium_expiry_' + user.uid;
  const expiry = parseInt(localStorage.getItem(key) || '0');
  return Math.max(0, Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24)));
}

// ── ACCESS CHECK ──────────────────────────────────────────
function hasAccess() {
  const user = getLocalUser();
  if (!user) return false;
  if (isPremium()) return true;
  if (isTrialActive(user.uid)) return true;
  return false;
}

function checkAccessOrShowPaywall(featureName) {
  if (hasAccess()) return true;
  showPaywall(featureName);
  return false;
}

// ── PAYWALL ───────────────────────────────────────────────
function showPaywall(featureName) {
  const existing = document.getElementById('paywall-modal');
  if (existing) return;

  const user = getLocalUser();
  const trialMsg = user ? `Your 7-day free trial has ended.` : `Sign in to start your free trial.`;

  const el = document.createElement('div');
  el.id = 'paywall-modal';
  el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
  el.innerHTML = `
    <div style="background:#fff;border-radius:24px;padding:32px 28px;max-width:360px;width:100%;text-align:center">
      <div style="font-size:44px;margin-bottom:12px">🔒</div>
      <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:#1A237E;margin-bottom:6px">Premium Required</div>
      <div style="font-size:13px;color:#64748B;margin-bottom:4px">${trialMsg}</div>
      <div style="font-size:12px;color:#64748B;margin-bottom:20px">Unlock <b>${featureName || 'this feature'}</b> with Premium</div>

      <div style="background:#F0F4FF;border-radius:14px;padding:16px;margin-bottom:20px">
        <div style="font-family:'Syne',sans-serif;font-size:28px;font-weight:800;color:#1A237E">₹100</div>
        <div style="font-size:13px;color:#64748B">for 6 months full access</div>
        <div style="font-size:11px;color:#9CA3AF;margin-top:4px">That's just ₹17/month!</div>
        <div style="margin-top:12px;font-size:12px;color:#374151;line-height:1.8;text-align:left">
          ✅ All 421+ MCQ questions<br>
          ✅ All PYQ papers 2021–2024<br>
          ✅ Unlimited timed mocks<br>
          ✅ Smart revision mode<br>
          ✅ Full notes & flashcards
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
  const user = getLocalUser();
  if (!user) { showLoginScreen(); return; }

  if (typeof Razorpay === 'undefined') {
    // Load Razorpay script dynamically
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => openPayment();
    document.head.appendChild(script);
    return;
  }

  const btn = document.getElementById('pay-btn');
  if (btn) { btn.textContent = 'Opening payment...'; btn.disabled = true; }

  const options = {
    key: RAZORPAY_KEY,
    amount: PREMIUM_PRICE,
    currency: 'INR',
    name: 'MP GK Portal',
    description: '6 Months Premium Access',
    image: 'icon.png',
    prefill: {
      name: user.name || '',
      email: user.email || '',
      contact: ''
    },
    notes: {
      uid: user.uid,
      months: PREMIUM_MONTHS
    },
    theme: { color: '#1A237E' },
    handler: function(response) {
      // Payment successful
      setPremium(user.uid, PREMIUM_MONTHS);
      const modal = document.getElementById('paywall-modal');
      if (modal) modal.remove();
      updateUserBadge();
      showToastSafe('🎉 Premium unlocked for 6 months!', '#15803D');
      // Save payment ID for records
      localStorage.setItem('last_payment_' + user.uid, response.razorpay_payment_id);
    },
    modal: {
      ondismiss: function() {
        if (btn) { btn.textContent = '🔓 Unlock for ₹100'; btn.disabled = false; }
      }
    }
  };

  const rzp = new Razorpay(options);
  rzp.on('payment.failed', function(response) {
    showToastSafe('Payment failed. Please try again.', '#DC2626');
    if (btn) { btn.textContent = '🔓 Unlock for ₹100'; btn.disabled = false; }
  });
  rzp.open();
}

// ── ON USER LOGGED IN ─────────────────────────────────────
function onUserLoggedIn(user) {
  removeLoginScreen();
  updateUserBadge();

  const u = getLocalUser() || { uid: user.uid };
  const daysLeft = getTrialDaysLeft(u.uid);

  if (!isPremium() && daysLeft > 0 && daysLeft <= 2) {
    setTimeout(() => {
      showToastSafe(`⚠️ Trial ends in ${daysLeft} day${daysLeft > 1 ? 's' : ''}!`, '#D97706');
    }, 3000);
  }
}

// ── USER BADGE in topbar ──────────────────────────────────
function updateUserBadge() {
  const user = getLocalUser();
  if (!user) return;

  let badge = document.getElementById('user-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'user-badge';
    badge.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;padding:6px 10px;background:#fff;border:1px solid #E2E8F0;border-radius:10px;font-size:12px;font-weight:600;color:#1E293B';
    badge.onclick = showAccountModal;
    const topbarRight = document.querySelector('.topbar-right');
    if (topbarRight) topbarRight.prepend(badge);
  }

  const premium = isPremium();
  const u = getLocalUser();
  const daysLeft = u ? getTrialDaysLeft(u.uid) : 0;

  badge.innerHTML = `
    ${user.photo ? `<img src="${user.photo}" style="width:24px;height:24px;border-radius:50%;object-fit:cover">` : '👤'}
    <span style="max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${user.name ? user.name.split(' ')[0] : 'User'}</span>
    ${premium
      ? `<span style="background:#15803D;color:#fff;font-size:10px;padding:2px 7px;border-radius:20px">PRO</span>`
      : daysLeft > 0
        ? `<span style="background:#D97706;color:#fff;font-size:10px;padding:2px 7px;border-radius:20px">${daysLeft}d trial</span>`
        : `<span style="background:#DC2626;color:#fff;font-size:10px;padding:2px 7px;border-radius:20px">Expired</span>`
    }
  `;
}

// ── ACCOUNT MODAL ─────────────────────────────────────────
function showAccountModal() {
  const existing = document.getElementById('account-modal');
  if (existing) { existing.remove(); return; }

  const user = getLocalUser();
  if (!user) return;

  const premium = isPremium();
  const daysLeft = premium ? getPremiumDaysLeft() : getTrialDaysLeft(user.uid);

  const el = document.createElement('div');
  el.id = 'account-modal';
  el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
  el.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:28px;max-width:340px;width:100%;text-align:center">
      ${user.photo ? `<img src="${user.photo}" style="width:64px;height:64px;border-radius:50%;margin-bottom:12px;object-fit:cover">` : '<div style="font-size:48px;margin-bottom:12px">👤</div>'}
      <div style="font-family:\'Syne\',sans-serif;font-size:17px;font-weight:800;margin-bottom:4px">${user.name || 'User'}</div>
      <div style="font-size:12px;color:#64748B;margin-bottom:16px">${user.email || ''}</div>

      <div style="background:${premium ? '#F0FDF4' : daysLeft > 0 ? '#FFFBEB' : '#FEF2F2'};border-radius:12px;padding:14px;margin-bottom:16px">
        <div style="font-size:13px;font-weight:700;color:${premium ? '#15803D' : daysLeft > 0 ? '#D97706' : '#DC2626'}">
          ${premium ? `✅ Premium Active — ${daysLeft} days left` : daysLeft > 0 ? `⏳ Trial — ${daysLeft} days left` : '❌ Trial Expired'}
        </div>
        ${!premium ? `<div style="font-size:12px;color:#64748B;margin-top:4px">Unlock full access for ₹100 / 6 months</div>` : ''}
      </div>

      ${!premium ? `<button onclick="document.getElementById('account-modal').remove();openPayment()" style="width:100%;padding:12px;background:#1A237E;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:8px;font-family:\'DM Sans\',sans-serif">🔓 Upgrade to Premium — ₹100</button>` : ''}

      <button onclick="showPage('donate');document.getElementById('account-modal').remove()"
        style="width:100%;padding:10px;background:#FFF7ED;color:#C2410C;border:1px solid #FED7AA;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;margin-bottom:8px;font-family:\'DM Sans\',sans-serif">
        ❤️ Support Us — Donate
      </button>
      <button onclick="signOut()"
        style="width:100%;padding:10px;background:transparent;color:#DC2626;border:1px solid #FCA5A5;border-radius:10px;font-size:13px;cursor:pointer;font-family:\'DM Sans\',sans-serif">
        Sign Out
      </button>
      <button onclick="document.getElementById('account-modal').remove()"
        style="width:100%;padding:8px;background:transparent;color:#9CA3AF;border:none;font-size:12px;cursor:pointer;margin-top:4px">
        Close
      </button>
    </div>
  `;
  document.body.appendChild(el);
}

// ── SIGN OUT ──────────────────────────────────────────────
async function signOut() {
  try {
    if (firebaseAuth) await firebaseAuth.signOut();
  } catch(e) {}
  localStorage.removeItem('mppsc_user');
  const modal = document.getElementById('account-modal');
  if (modal) modal.remove();
  const badge = document.getElementById('user-badge');
  if (badge) badge.remove();
  showLoginScreen();
}

// ── TOAST HELPER ──────────────────────────────────────────
function showToastSafe(msg, color) {
  if (typeof showToast === 'function') { showToast(msg, color); return; }
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:${color||'#1A237E'};color:#fff;padding:10px 20px;border-radius:20px;font-size:13px;z-index:999999;font-weight:600;pointer-events:none`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ── INIT ──────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initFirebase();
    // Show login if no user saved
    const user = getLocalUser();
    if (!user) {
      setTimeout(showLoginScreen, 800);
    } else {
      updateUserBadge();
      // Check if trial expired
      if (!isPremium() && !isTrialActive(user.uid)) {
        setTimeout(() => showPaywall('full app access'), 1500);
      }
    }
  }, 500);
});
