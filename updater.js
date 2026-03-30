// ═══════════════════════════════════════════════
//  MPPSC APP — UPDATER + PERMISSIONS
//  Auto-update: checks GitHub version.json
//  Permissions: asked once on first app open
// ═══════════════════════════════════════════════

const APP_CURRENT_VERSION = "1.0.4"; // ← Change this to NEW version each release
const VERSION_URL = "https://raw.githubusercontent.com/PadhleYrr/MPPSC/main/version.json";

// ── PERMISSIONS (asked once on first open) ──────
function requestPermissionsOnFirstOpen() {
  const asked = localStorage.getItem('permissions_asked');
  if (asked) return;

  // Show custom permission intro dialog first
  showPermissionIntroDialog();
}

function showPermissionIntroDialog() {
  const el = document.createElement('div');
  el.id = 'perm-dialog';
  el.innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px">
      <div style="background:#fff;border-radius:20px;padding:28px;max-width:340px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.35);text-align:center">
        <div style="font-size:44px;margin-bottom:12px">🎓</div>
        <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;margin-bottom:8px;color:#1E3A8A">Welcome to MPPSC App!</div>
        <div style="font-size:13px;color:#6B7280;margin-bottom:20px;line-height:1.6">
          To give you the best experience, this app needs a couple of permissions:
        </div>
        <div style="text-align:left;background:#F0F4FF;border-radius:12px;padding:14px;margin-bottom:20px">
          <div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:12px">
            <span style="font-size:20px">🔔</span>
            <div>
              <div style="font-size:13px;font-weight:700;color:#1E3A8A">Notifications</div>
              <div style="font-size:12px;color:#6B7280">Get daily reminders & new update alerts</div>
            </div>
          </div>
          <div style="display:flex;gap:10px;align-items:flex-start">
            <span style="font-size:20px">📦</span>
            <div>
              <div style="font-size:13px;font-weight:700;color:#1E3A8A">Storage</div>
              <div style="font-size:12px;color:#6B7280">Required to download & install app updates</div>
            </div>
          </div>
        </div>
        <button onclick="grantPermissions()"
          style="width:100%;padding:14px;background:#1E3A8A;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;margin-bottom:10px;font-family:'DM Sans',sans-serif">
          Allow Permissions
        </button>
        <button onclick="skipPermissions()"
          style="width:100%;padding:10px;background:transparent;color:#9CA3AF;border:none;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">
          Skip for now
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(el);
}

async function grantPermissions() {
  // Close dialog
  const d = document.getElementById('perm-dialog');
  if (d) d.remove();

  localStorage.setItem('permissions_asked', 'true');

  // Request notification permission (works in Android WebView)
  if ('Notification' in window) {
    try {
      await Notification.requestPermission();
    } catch(e) {}
  }

  // For Capacitor native permissions
  if (window.Capacitor && Capacitor.Plugins) {
    try {
      if (Capacitor.Plugins.PushNotifications) {
        await Capacitor.Plugins.PushNotifications.requestPermissions();
      }
    } catch(e) {}
  }

  showToastUpdate('✅ Permissions granted!', '#15803D');

  // Now check for updates
  setTimeout(checkForUpdate, 1500);
}

function skipPermissions() {
  const d = document.getElementById('perm-dialog');
  if (d) d.remove();
  localStorage.setItem('permissions_asked', 'true');
  setTimeout(checkForUpdate, 1000);
}

// ── VERSION CHECKER ─────────────────────────────
function isNewerVersion(remote, current) {
  const r = remote.split('.').map(Number);
  const c = current.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((r[i] || 0) > (c[i] || 0)) return true;
    if ((r[i] || 0) < (c[i] || 0)) return false;
  }
  return false;
}

async function checkForUpdate() {
  try {
    const res = await fetch(VERSION_URL + "?t=" + Date.now());
    if (!res.ok) return;
    const data = await res.json();
    if (isNewerVersion(data.version, APP_CURRENT_VERSION)) {
      showUpdateDialog(data.version, data.apk_url, data.changelog);
    }
  } catch (e) {
    console.log("Update check failed:", e);
  }
}

// ── UPDATE DIALOG ───────────────────────────────
function showUpdateDialog(version, apkUrl, changelog) {
  const old = document.getElementById('update-dialog');
  if (old) old.remove();

  const el = document.createElement('div');
  el.id = 'update-dialog';
  el.innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px">
      <div style="background:#fff;border-radius:20px;padding:28px;max-width:340px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.35);text-align:center">
        <div style="font-size:44px;margin-bottom:10px">🚀</div>
        <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;margin-bottom:4px;color:#1E3A8A">New Update Available!</div>
        <div style="font-size:12px;color:#9CA3AF;margin-bottom:14px">Version ${version} is ready to install</div>
        <div style="background:#F0F4FF;border-radius:12px;padding:12px 14px;font-size:12px;color:#374151;margin-bottom:20px;text-align:left;line-height:1.6">
          📋 <b>What's new:</b><br>${changelog}
        </div>

        <!-- Progress bar (hidden by default) -->
        <div id="update-progress-wrap" style="display:none;margin-bottom:16px">
          <div style="font-size:12px;color:#6B7280;margin-bottom:6px" id="update-status-text">Downloading update...</div>
          <div style="background:#E5E7EB;border-radius:999px;height:8px;overflow:hidden">
            <div id="update-progress-bar" style="height:100%;background:#1E3A8A;border-radius:999px;width:0%;transition:width 0.3s ease"></div>
          </div>
        </div>

        <button id="update-now-btn" onclick="startUpdate('${apkUrl}')"
          style="width:100%;padding:14px;background:#1E3A8A;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;margin-bottom:10px;font-family:'DM Sans',sans-serif">
          ⬇️ Download & Install
        </button>
        <button onclick="document.getElementById('update-dialog').remove()"
          style="width:100%;padding:10px;background:transparent;color:#9CA3AF;border:none;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">
          Remind me later
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(el);
}

// ── DOWNLOAD & INSTALL ──────────────────────────
async function startUpdate(apkUrl) {
  const btn = document.getElementById('update-now-btn');
  const progressWrap = document.getElementById('update-progress-wrap');
  const progressBar = document.getElementById('update-progress-bar');
  const statusText = document.getElementById('update-status-text');

  btn.style.display = 'none';
  progressWrap.style.display = 'block';

  try {
    statusText.textContent = 'Downloading update...';

    // Fetch APK with progress tracking
    const response = await fetch(apkUrl);
    if (!response.ok) throw new Error('Download failed');

    const contentLength = response.headers.get('Content-Length');
    const total = contentLength ? parseInt(contentLength) : 0;
    const reader = response.body.getReader();
    let received = 0;
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      if (total > 0) {
        const pct = Math.round((received / total) * 100);
        progressBar.style.width = pct + '%';
        statusText.textContent = `Downloading... ${pct}%`;
      } else {
        // No content-length, animate bar
        progressBar.style.width = Math.min((received / 5000000) * 100, 90) + '%';
        statusText.textContent = `Downloading... ${(received / 1024 / 1024).toFixed(1)} MB`;
      }
    }

    progressBar.style.width = '100%';
    statusText.textContent = '✅ Download complete! Installing...';

    // Create blob and trigger install
    const blob = new Blob(chunks, { type: 'application/vnd.android.package-archive' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MPPSC-update.apk';
    a.click();
    URL.revokeObjectURL(url);

    statusText.textContent = '📲 Open the downloaded APK to install';

  } catch (err) {
    statusText.textContent = '❌ Download failed. Tap to retry.';
    progressBar.style.width = '0%';
    btn.style.display = 'block';
    btn.textContent = '🔁 Retry Download';
    console.error('Update error:', err);
  }
}

// ── TOAST HELPER (for updater) ──────────────────
function showToastUpdate(msg, color) {
  // Use existing showToast if available
  if (typeof showToast === 'function') {
    showToast(msg, color);
    return;
  }
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:${color||'#1E3A8A'};color:#fff;padding:10px 20px;border-radius:20px;font-size:13px;z-index:99999;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,0.2)`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ── INIT ────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Small delay so main app loads first
  setTimeout(() => {
    requestPermissionsOnFirstOpen();
    // If permissions already asked before, just check for update
    const asked = localStorage.getItem('permissions_asked');
    if (asked) {
      setTimeout(checkForUpdate, 3000);
    }
  }, 1500);
});
