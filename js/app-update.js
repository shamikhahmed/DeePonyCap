'use strict';
/**
 * User-controlled PWA updates — never force skipWaiting without consent.
 * Collection data lives in IndexedDB and is independent of app shell version.
 */
const AppUpdate = (() => {
  let registration = null;
  let waitingWorker = null;

  function currentVersion() {
    return window.APP_VERSION || '0.0.0';
  }

  function policy() {
    return S.settings?.updatePolicy || 'ask';
  }

  function showBanner() {
    if (document.getElementById('updateBanner')) return;
    if (localStorage.getItem('deepony_update_later')) return;
    const b = document.createElement('div');
    b.id = 'updateBanner';
    b.className = 'update-banner';
    b.setAttribute('role', 'status');
    b.innerHTML = `
      <div class="update-banner-body">
        <strong>✨ App update available</strong>
        <p>Your ponies stay safe — collection data is stored separately on this device.</p>
        <div class="update-banner-actions">
          <button type="button" class="btn-p" onclick="AppUpdate.applyNow()">Update now</button>
          <button type="button" class="btn-g" onclick="AppUpdate.dismiss()">Not now</button>
        </div>
      </div>`;
    document.body.appendChild(b);
    requestAnimationFrame(() => b.classList.add('show'));
  }

  function hideBanner() {
    const b = document.getElementById('updateBanner');
    if (b) { b.classList.remove('show'); setTimeout(() => b.remove(), 300); }
  }

  function onWaiting(worker) {
    waitingWorker = worker;
    worker.addEventListener('statechange', () => {
      if (worker.state === 'activated') {
        waitingWorker = null;
        hideBanner();
      }
    });
    if (policy() === 'auto') {
      applyNow();
      return;
    }
    showBanner();
  }

  async function register() {
    if (!('serviceWorker' in navigator)) return;
    try {
      const v = window.SW_CACHE ? window.SW_CACHE.replace('deeponycap-v', '') : Date.now();
      registration = await navigator.serviceWorker.register('./sw.js?v=' + v);
      if (registration.waiting && registration.active) {
        onWaiting(registration.waiting);
      }
      registration.addEventListener('updatefound', () => {
        const nw = registration.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && registration.waiting && navigator.serviceWorker.controller) {
            onWaiting(registration.waiting);
          }
        });
      });
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (window.__appUpdateReloading) window.location.reload();
      });
    } catch {}
  }

  async function checkForUpdate() {
    localStorage.removeItem('deepony_update_later');
    if (!registration) await register();
    if (!registration) { Toast.show('Updates not supported in this browser'); return false; }
    try {
      await registration.update();
      if (registration.waiting && registration.active) {
        onWaiting(registration.waiting);
        Toast.show('Update ready — review the banner or Settings');
        return true;
      }
      Toast.show('You’re on the latest version ✨');
      return false;
    } catch {
      Toast.show('Could not check for updates');
      return false;
    }
  }

  function applyNow() {
    if (!waitingWorker && registration?.waiting) waitingWorker = registration.waiting;
    if (!waitingWorker) {
      Toast.show('No update waiting');
      return;
    }
    const doApply = () => {
      hideBanner();
      localStorage.removeItem('deepony_update_later');
      window.__appUpdateReloading = true;
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      Toast.show('Updating…');
      setTimeout(() => {
        if (window.__appUpdateReloading) {
          window.__appUpdateReloading = false;
          window.location.reload();
        }
      }, 3000);
    };
    if (S.ponies?.length && !sessionStorage.getItem('deepony_update_backup_ok')) {
      UI.openSheet(`${Render.sheetHdr('Before you update', 'UI.closeSheet()')}
        <p style="font-size:.9rem;color:var(--text-soft);line-height:1.5">Your collection stays on this device when you update — data is stored separately from the app.</p>
        <p style="font-size:.85rem;margin-top:10px">Optional: export a backup first for extra peace of mind.</p>
        <button class="btn-g" style="width:100%;margin-top:12px" onclick="ParentGate.run('Export backup',Backup.export)">Export backup</button>
        <button class="btn-p" style="width:100%;margin-top:10px" onclick="sessionStorage.setItem('deepony_update_backup_ok','1');UI.closeSheet();AppUpdate.applyNow()">Continue update</button>
        <button class="btn-g" style="width:100%;margin-top:8px" onclick="UI.closeSheet()">Cancel</button>`);
      return;
    }
    doApply();
  }

  function dismiss() {
    localStorage.setItem('deepony_update_later', '1');
    hideBanner();
    Toast.show('Staying on current version — tap Check for updates in Settings anytime');
  }

  function setPolicy(mode) {
    S.settings = S.settings || {};
    S.settings.updatePolicy = mode === 'auto' ? 'auto' : 'ask';
    Store.save();
    Render.settings();
    Toast.show(mode === 'auto' ? 'Updates will apply when ready' : 'You’ll choose when to update');
  }

  function settingsHtml() {
    const ver = currentVersion();
    const pol = policy();
    const pending = !!(waitingWorker || registration?.waiting);
    return `<div class="card">
      <div class="section-title">App version</div>
      <p style="font-size:.85rem;margin-bottom:8px"><strong>Running v${ver}</strong>${pending ? ' · <span style="color:var(--pink)">update ready</span>' : ''}</p>
      <p style="font-size:.8rem;color:var(--text-soft);line-height:1.5">Collection data is saved in IndexedDB on this device — updating the app shell does not erase your ponies.</p>
      <button class="btn-p" style="width:100%;margin-top:10px" onclick="AppUpdate.checkForUpdate()">Check for updates</button>
      ${pending ? '<button class="btn-g" style="width:100%;margin-top:8px" onclick="AppUpdate.applyNow()">Apply pending update</button>' : ''}
      <div class="setting-row" style="margin-top:14px">
        <div><strong>Auto-update</strong><br><span style="font-size:.75rem;color:var(--text-soft)">When off, you choose when to update</span></div>
        <button type="button" class="toggle${pol==='auto'?' on':''}" role="switch" aria-checked="${pol==='auto'}" aria-label="Auto update" onclick="AppUpdate.setPolicy('${pol==='auto'?'ask':'auto'}')">${pol==='auto'?'ON':'OFF'}</button>
      </div>
      <p style="font-size:.75rem;color:var(--text-soft);margin-top:12px;line-height:1.5">Prefer an older UI? Archived releases live at <strong>/releases/vX.Y.Z/</strong> on the same site — your collection data is shared because it’s stored per device, not per app version.</p>
    </div>`;
  }

  return {
    register, checkForUpdate, applyNow, dismiss, setPolicy, policy,
    settingsHtml, currentVersion,
  };
})();

window.AppUpdate = AppUpdate;
