'use strict';
/**
 * Quiet PWA updates — SW registers for offline; no reload banners or forced refresh.
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

  function showBanner() {}

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
    } catch {}
  }

  async function checkForUpdate() {
    localStorage.removeItem('deepony_update_later');
    if (!registration) await register();
    if (!registration) { Toast.show('Updates not supported in this browser'); return false; }
    try {
      await registration.update();
      Toast.show('Updates install quietly in the background ✨');
      return !!(registration.waiting && registration.active);
    } catch {
      Toast.show('Could not check for updates');
      return false;
    }
  }

  function applyNow() {}

  function dismiss() {
    localStorage.setItem('deepony_update_later', '1');
    hideBanner();
  }

  function setPolicy(mode) {
    S.settings = S.settings || {};
    S.settings.updatePolicy = mode === 'auto' ? 'auto' : 'ask';
    Store.save();
    Render.settings();
    Toast.show('Updates install quietly in the background');
  }

  function settingsHtml() {
    const ver = currentVersion();
    const pol = policy();
    return `<div class="card">
      <div class="section-title">App version</div>
      <p style="font-size:.85rem;margin-bottom:8px"><strong>Running v${ver}</strong></p>
      <p style="font-size:.8rem;color:var(--text-soft);line-height:1.5">Collection data is saved in IndexedDB on this device — updating the app shell does not erase your ponies. New versions install quietly; reopen the app anytime to pick them up.</p>
      <button class="btn-p" style="width:100%;margin-top:10px" onclick="AppUpdate.checkForUpdate()">Check for updates</button>
      <div class="setting-row" style="margin-top:14px">
        <div><strong>Auto-update</strong><br><span style="font-size:.75rem;color:var(--text-soft)">When on, updates apply in the background without prompts</span></div>
        <button type="button" class="toggle${pol==='auto'?' on':''}" role="switch" aria-checked="${pol==='auto'}" aria-label="Auto update" onclick="AppUpdate.setPolicy('${pol==='auto'?'ask':'auto'}')">${pol==='auto'?'ON':'OFF'}</button>
      </div>
      <p style="font-size:.75rem;color:var(--text-soft);margin-top:12px;line-height:1.5">Prefer an older UI? Archived releases live at <strong>/releases/vX.Y.Z/</strong> on the same site — your collection data is shared because it's stored per device, not per app version.</p>
    </div>`;
  }

  return {
    register, checkForUpdate, applyNow, dismiss, setPolicy, policy,
    settingsHtml, currentVersion,
  };
})();

window.AppUpdate = AppUpdate;
