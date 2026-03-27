// ═══════════════════════════════════════════════════════════════════════════════
// auth.js - NATIVE GOOGLE SIGN-IN FOR CAPACITOR ANDROID
// Uses @codetrix-studio/capacitor-google-auth for in-app Google login
// ═══════════════════════════════════════════════════════════════════════════════

// ── FIREBASE CONFIG ─────────────────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAJoOz73MrNt2pEVPf5Gh9BQ5r7yWz2l-Y",
  authDomain: "mpgk-9496d.firebaseapp.com",
  projectId: "mpgk-9496d",
  storageBucket: "mpgk-9496d.firebasestorage.app",
  messagingSenderId: "77589429691",
  appId: "1:77589429691:android:bc9b1754c40d5510c0589e"
};

// ── RAZORPAY CONFIG ─────────────────────────────────────────────────────────
const RAZORPAY_KEY = "YOUR_RAZORPAY_KEY_ID";
const PREMIUM_PRICE = 10000; // ₹100 in paise
const PREMIUM_MONTHS = 6;

// ── GLOBAL STATE ────────────────────────────────────────────────────────────
let currentUser = null;
let firebaseAuth = null;
let firebaseInitialized = false;

// ── INITIALIZE FIREBASE ──────────────────────────────────────────────────────
async function initFirebase() {
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js");
    const { getAuth, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js");

    console.log('🔧 Initializing Firebase...');
    const app = initializeApp(FIREBASE_CONFIG);
    firebaseAuth = getAuth(app);
    firebaseInitialized = true;
    console.log('✅ Firebase Auth initialized');

    onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        console.log('👤 User signed in:', user.email);
        currentUser = user;
        saveUserLocally(user);
        onUserLoggedIn(user);
      } else {
        console.log('👤 No user session');
        currentUser = null;
      }
    });

  } catch (error) {
    console.error('❌ Firebase init error:', error.message);
    showErrorModal('Firebase Error', error.message);
    setTimeout(initFirebase, 2000);
  }
}

// ── GOOGLE SIGN IN (NATIVE - NO CHROME REDIRECT) ────────────────────────────
async function signInWithGoogle() {
  if (!firebaseInitialized || !firebaseAuth) {
    showLoginError('Firebase not ready. Please wait...');
    return;
  }

  const btn = document.getElementById('google-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Signing in...'; }

  try {
    // ── Step 1: Get Google ID token using Capacitor plugin (native Android dialog)
    const { GoogleAuth } = await import("https://cdn.jsdelivr.net/npm/@codetrix-studio/capacitor-google-auth@3.3.3/dist/plugin.esm.js");

    await GoogleAuth.initialize({
      clientId: '77589429691-REPLACE_WITH_YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
      grantOfflineAccess: true,
    });

    const googleUser = await GoogleAuth.signIn();
    console.log('✅ Google native sign-in success');

    // ── Step 2: Sign into Firebase with the Google credential
    const { GoogleAuthProvider, signInWithCredential } = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js");

    const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
    const result = await signInWithCredential(firebaseAuth, credential);

    console.log('✅ Firebase sign-in success:', result.user.email);

    // Start trial for new users
    startTrialIfNew(result.user.uid);

  } catch (error) {
    console.error('❌ Sign-in error:', error.code, error.message);

    let msg = 'Sign in failed. Please try again.';
    if (error.code === 'auth/configuration-not-found') {
      msg = 'Firebase not configured. Check SHA-1 fingerprint in Firebase Console.';
    } else if (error.message && error.message.includes('cancelled')) {
      msg = 'Sign-in cancelled.';
    } else if (error.message) {
      msg = error.message;
    }

    showLoginError(msg);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg> Try Again`;
    }
  }
}

function showLoginError(msg) {
  const errEl = document.getElementById('login-error');
  if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
}

// ── ERROR MODAL ──────────────────────────────────────────────────────────────
function showErrorModal(title, message) {
  const existing = document.getElementById('error-modal');
  if (existing) return;

  const modal = document.createElement('div');
  modal.id = 'error-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px';
  modal.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:24px;max-width:360px;width:100%;text-align:center">
      <div style="font-size:40px;margin-bottom:12px">⚠️</div>
      <div style="font-weight:bold;font-size:16px;color:#DC2626;margin-bottom:8px">${title}</div>
      <div style="font-size:13px;color:#64748B;margin-bottom:16px;line-height:1.6">${message}</div>
      <button onclick="document.getElementById('error-modal').remove();location.reload()"
        style="width:100%;padding:12px;background:#DC2626;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer">
        Reload App
      </button>
    </div>
  `;
  document.body.appendChild(modal);
}

// ── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function showLoginScreen() {
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
        style="width:100%;padding:14px;background:#fff;color:#374151;border:2px solid #E5E7EB;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;font-family:'DM Sans',sans-serif">
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        Continue with Google
      </button>

      <div id="login-error" style="color:#DC2626;font-size:12px;margin-top:10px;display:none"></div>
      <div style="font-size:11px;color:#9CA3AF;margin-top:16px">By continuing you agree to our <a href="privacy.html" style="color:#1A237E">Privacy Policy</a></div>
    </div>
  `;
  document.body.appendChild(el);
}

// ── USER HELPERS ─────────────────────────────────────────────────────────────
function saveUserLocally(user) {
  localStorage.setItem('mppsc_user', JSON.stringify({
    uid: user.uid,
    name: user.displayName,
    email: user.email,
    photo: user.photoURL
  }));
}

function getLocalUser() {
  try { return JSON.parse(localStorage.getItem('mppsc_user')); }
  catch { return null; }
}

function removeLoginScreen() {
  const el = document.getElementById('login-screen');
  if (el) el.remove();
}

// ── TRIAL SYSTEM ─────────────────────────────────────────────────────────────
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

// ── PREMIUM SYSTEM ────────────────────────────────────────────────────────────
function isPremium() {
  const user = getLocalUser();
  if (!user) return false;
  const expiry = parseInt(localStorage.getItem('premium_expiry_' + user.uid) || '0');
  return expiry > Date.now();
}

function setPremium(uid, months) {
  const expiry = Date.now() + (months * 30 * 24 * 60 * 60 * 1000);
  localStorage.setItem('premium_expiry_' + uid, expiry.toString());
}

function getPremiumDaysLeft() {
  const user = getLocalUser();
  if (!user) return 0;
  const expiry = parseInt(localStorage.getItem('premium_expiry_' + user.uid) || '0');
  return Math.max(0, Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24)));
}

// ── PAYWALL ───────────────────────────────────────────────────────────────────
function showPaywall(msg) {
  const existing = document.getElementById('paywall-modal');
  if (existing) return;

  const user = getLocalUser();
  if (!user) return;

  const el = document.createElement('div');
  el.id = 'paywall-modal';
  el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:999;display:flex;align-items:center;justify-content:center;padding:20px';
  el.innerHTML = `
    <div style="background:linear-gradient(135deg,#1A237E 0%,#5E35B1 100%);border-radius:20px;padding:40px 28px;max-width:380px;width:100%;text-align:center;color:#fff">
      <div style="font-size:48px;margin-bottom:12px">🔒</div>
      <div style="font-size:18px;font-weight:800;margin-bottom:8px;font-family:'Syne',sans-serif">Trial Expired</div>
      <div style="font-size:14px;opacity:0.9;margin-bottom:24px">Unlock ${msg} with premium</div>
      <div style="background:rgba(255,255,255,0.15);border-radius:12px;padding:16px;margin-bottom:24px">
        <div style="font-size:28px;font-weight:800;margin-bottom:4px">₹100</div>
        <div style="font-size:13px">6 months access</div>
      </div>
      <button onclick="openPayment()" id="pay-btn"
        style="width:100%;padding:14px;background:#fff;color:#1A237E;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;margin-bottom:10px;font-family:'DM Sans',sans-serif">
        🔓 Unlock for ₹100
      </button>
      <button onclick="document.getElementById('paywall-modal').remove()"
        style="width:100%;padding:12px;background:rgba(255,255,255,0.2);color:#fff;border:none;border-radius:10px;font-size:14px;cursor:pointer;font-family:'DM Sans',sans-serif">
        Continue as Guest
      </button>
    </div>
  `;
  document.body.appendChild(el);
}

// ── PAYMENT ───────────────────────────────────────────────────────────────────
async function openPayment() {
  const user = getLocalUser();
  if (!user) { showToastSafe('Please log in first', '#DC2626'); return; }
  if (typeof Razorpay === 'undefined') { showToastSafe('Payment gateway not loaded. Try again.', '#DC2626'); return; }

  const btn = document.getElementById('pay-btn');
  if (btn) { btn.textContent = 'Opening payment...'; btn.disabled = true; }

  const options = {
    key: RAZORPAY_KEY,
    amount: PREMIUM_PRICE,
    currency: 'INR',
    name: 'MP GK Portal',
    description: '6 Months Premium Access',
    image: 'icon.png',
    prefill: { name: user.name || '', email: user.email || '', contact: '' },
    notes: { uid: user.uid, months: PREMIUM_MONTHS },
    theme: { color: '#1A237E' },
    handler: function(response) {
      setPremium(user.uid, PREMIUM_MONTHS);
      const modal = document.getElementById('paywall-modal');
      if (modal) modal.remove();
      updateUserBadge();
      showToastSafe('🎉 Premium unlocked for 6 months!', '#15803D');
      localStorage.setItem('last_payment_' + user.uid, response.razorpay_payment_id);
    },
    modal: {
      ondismiss: function() {
        if (btn) { btn.textContent = '🔓 Unlock for ₹100'; btn.disabled = false; }
      }
    }
  };

  const rzp = new Razorpay(options);
  rzp.on('payment.failed', function() {
    showToastSafe('Payment failed. Please try again.', '#DC2626');
    if (btn) { btn.textContent = '🔓 Unlock for ₹100'; btn.disabled = false; }
  });
  rzp.open();
}

// ── ON USER LOGGED IN ─────────────────────────────────────────────────────────
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

// ── ACCOUNT MODAL ─────────────────────────────────────────────────────────────
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
      <div style="font-family:'Syne',sans-serif;font-size:17px;font-weight:800;margin-bottom:4px">${user.name || 'User'}</div>
      <div style="font-size:12px;color:#64748B;margin-bottom:16px">${user.email || ''}</div>

      <div style="background:${premium ? '#F0FDF4' : daysLeft > 0 ? '#FFFBEB' : '#FEF2F2'};border-radius:12px;padding:14px;margin-bottom:16px">
        <div style="font-size:13px;font-weight:700;color:${premium ? '#15803D' : daysLeft > 0 ? '#D97706' : '#DC2626'}">
          ${premium ? `✅ Premium Active — ${daysLeft} days left` : daysLeft > 0 ? `⏳ Trial — ${daysLeft} days left` : '❌ Trial Expired'}
        </div>
        ${!premium ? `<div style="font-size:12px;color:#64748B;margin-top:4px">Unlock full access for ₹100 / 6 months</div>` : ''}
      </div>

      ${!premium ? `<button onclick="document.getElementById('account-modal').remove();openPayment()" style="width:100%;padding:12px;background:#1A237E;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:8px;font-family:'DM Sans',sans-serif">🔓 Upgrade to Premium — ₹100</button>` : ''}

      <button onclick="showPage('donate');document.getElementById('account-modal').remove()"
        style="width:100%;padding:10px;background:#FFF7ED;color:#C2410C;border:1px solid #FED7AA;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;margin-bottom:8px;font-family:'DM Sans',sans-serif">
        ❤️ Support Us — Donate
      </button>
      <button onclick="signOut()"
        style="width:100%;padding:10px;background:transparent;color:#DC2626;border:1px solid #FCA5A5;border-radius:10px;font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif">
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

// ── SIGN OUT ──────────────────────────────────────────────────────────────────
async function signOut() {
  try {
    if (firebaseAuth && firebaseAuth.signOut) {
      await firebaseAuth.signOut();
    }
    // Also sign out from Google native
    try {
      const { GoogleAuth } = await import("https://cdn.jsdelivr.net/npm/@codetrix-studio/capacitor-google-auth@3.3.3/dist/plugin.esm.js");
      await GoogleAuth.signOut();
    } catch(e) { /* ignore if plugin not available */ }
  } catch(e) {
    console.error('Sign out error:', e.message);
  }
  localStorage.removeItem('mppsc_user');
  document.getElementById('account-modal')?.remove();
  document.getElementById('user-badge')?.remove();
  showLoginScreen();
}

// ── TOAST HELPER ──────────────────────────────────────────────────────────────
function showToastSafe(msg, color) {
  if (typeof showToast === 'function') { showToast(msg, color); return; }
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:${color||'#1A237E'};color:#fff;padding:10px 20px;border-radius:20px;font-size:13px;z-index:999999;font-weight:600;pointer-events:none`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ── INIT ON PAGE LOAD ─────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 App initializing...');
  await initFirebase();

  setTimeout(() => {
    const user = getLocalUser();
    if (!user) {
      showLoginScreen();
    } else {
      updateUserBadge();
      if (!isPremium() && !isTrialActive(user.uid)) {
        setTimeout(() => showPaywall('full app access'), 1500);
      }
    }
  }, 500);
});

console.log('✅ auth.js loaded');
