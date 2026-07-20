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
  Stars.init();
  await Store.load();
  const demo = new URLSearchParams(location.search).get('demo') === '1';
  Splash.run(() => {
    if (demo && DemoSeed && DemoSeed.load) {
      DemoSeed.load({ silent: true });
      if (typeof CapDemo !== 'undefined') {
        CapDemo.markActive();
        CapDemo.showBanner('deeponycap', '<strong>Demo mode</strong> — sample pony collection on this device.');
      }
      document.getElementById('onboard').classList.add('hide');
      document.getElementById('app').style.display = 'flex';
      Nav.go('stable');
      DemoUI.maybeShow();
      Install.maybeShow();
      if (window.Excellence) Excellence.deepLink();
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
  });
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (S.settings.darkMode === undefined || S.settings.darkMode === null) Theme.apply();
    });
  }
  if (window.AppUpdate) AppUpdate.register();
  else if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js?v=58').catch(()=>{});
}
boot();
