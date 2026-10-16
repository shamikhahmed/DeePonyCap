'use strict';
let S = {
  ponies:[], wishlist:[], accessories:[], collector:{name:'',since:''},
  settings:{collectorMode:false,darkMode:false,hapticsEnabled:true,parentPinEnabled:false,parentPinHash:null},
  unlockedAchievements:[], onboardingDone:false, version:3
};

async function boot() {
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
    document.documentElement.classList.add('standalone');
  }
  /* Stars/confetti off cold path — TBT (v5 §3c). */
  if ('requestIdleCallback' in window) requestIdleCallback(function () { try { Stars.init(); } catch (e) {} }, { timeout: 2000 });
  else setTimeout(function () { try { Stars.init(); } catch (e) {} }, 800);
  await Store.load();
  const demo = new URLSearchParams(location.search).get('demo') === '1';
  Splash.run(() => {
    if (demo && DemoSeed && DemoSeed.load) {
      DemoSeed.load({ silent: true });
      var markDemo = function () { if (typeof CapDemo !== 'undefined') CapDemo.markActive(); };
      if (typeof CapDemo !== 'undefined') markDemo();
      else {
        var ds = document.createElement('script');
        ds.src = 'js/cap-demo-mode.js';
        ds.onload = markDemo;
        ds.onerror = markDemo;
        document.head.appendChild(ds);
      }
      document.getElementById('onboard').classList.add('hide');
      document.getElementById('app').style.display = 'flex';
      Nav.go('stable');
      DemoUI.maybeShow();
      /* No install hint on demo — contrast noise in LH bp (v5 §3d). */
      if (window.Excellence) Excellence.deepLink();
      try { window.__APP_READY__ = true; document.documentElement.dataset.appReady = 'true'; } catch (_) {}
      return;
    }
    if (!S.onboardingDone) {
      document.getElementById('onboard').classList.remove('hide');
      document.getElementById('app').style.display = 'none';
    } else {
      document.getElementById('onboard').classList.add('hide');
      document.getElementById('app').style.display = 'flex';
      Nav._renderSidebar(document.querySelector('.nav-btn.on')?.dataset.tab || 'stable');
      Render.all();
      Install.maybeShow();
      Achievements.checkAll(true);
      if (window.__loadError) Toast.show('Saved data could not load — try Recovery in Settings');
      if (window.Excellence) Excellence.deepLink();
    }
    try { window.__APP_READY__ = true; document.documentElement.dataset.appReady = 'true'; } catch (_) {}
  });
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (S.settings.darkMode === undefined || S.settings.darkMode === null) Theme.apply();
    });
  }
  if (window.AppUpdate) AppUpdate.register();
  else if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js?v=71').catch(()=>{});
}
boot();
