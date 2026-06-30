'use strict';
const Stars = {
  init() {
    const w = document.getElementById('stars');
    const em = ['✨','⭐','💫','🌟','💖'];
    for (let i = 0; i < 18; i++) {
      const s = document.createElement('span');
      s.className = 'star';
      s.textContent = em[i % em.length];
      s.style.left = (Math.random() * 100) + '%';
      s.style.top = (Math.random() * 100) + '%';
      s.style.animationDelay = (Math.random() * 2) + 's';
      w.appendChild(s);
    }
  }
};

const Splash = {
  run(cb) {
    const fill = document.getElementById('splashFill');
    requestAnimationFrame(() => { if (fill) fill.style.width = '100%'; });
    setTimeout(() => {
      document.getElementById('splash').classList.add('hide');
      cb();
    }, 1600);
  }
};

const Install = {
  _deferredPrompt: null,
  maybeShow() {
    if (localStorage.getItem('deepony_install_dismiss') || localStorage.getItem('dpc_install_dismissed')) return;
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const android = /Android/.test(navigator.userAgent);
    if (!standalone && (ios || android)) {
      const hint = document.getElementById('installHint');
      if (hint) {
        const p = hint.querySelector('p');
        if (p) p.innerHTML = android
          ? '<strong>Install DeePonyCap</strong> — Chrome menu → <strong>Add to Home screen</strong> or <strong>Install app</strong>'
          : '<strong>Install DeePonyCap</strong> — tap Share → <strong>Add to Home Screen</strong> for the full magical app experience!';
        hint.classList.add('show');
      }
    }
    // PWA install prompt for supporting browsers (Chrome, Edge on Android/desktop)
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      if (localStorage.getItem('dpc_install_dismissed') || localStorage.getItem('deepony_install_dismiss')) return;
      setTimeout(() => {
        const b = document.createElement('div');
        b.id = 'installBanner';
        b.setAttribute('role', 'region');
        b.setAttribute('aria-label', 'Install DeePonyCap');
        b.style.cssText = 'position:fixed;bottom:calc(72px + env(safe-area-inset-bottom,0px));left:12px;right:12px;z-index:8500;background:var(--cap-surface-2,#1f0a14);border:1px solid var(--cap-pink,#FF6B9D);border-radius:16px;padding:14px 16px;display:flex;align-items:center;gap:12px;box-shadow:0 8px 24px rgba(0,0,0,0.4)';
        b.innerHTML = '<div style="font-size:28px;flex-shrink:0" aria-hidden="true">🦄</div><div style="flex:1"><div style="font-size:13px;font-weight:700">Install DeePonyCap</div><div style="font-size:12px;opacity:.7;margin-top:2px">Works offline. Your collection, always.</div></div><button type="button" style="padding:7px 14px;background:var(--cap-pink,#FF6B9D);color:#fff;border:none;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer" aria-label="Install app" onclick="Install._doInstall()">Install</button><button type="button" style="background:none;border:none;font-size:18px;color:inherit;opacity:.5;cursor:pointer;padding:4px 8px" aria-label="Dismiss install banner" onclick="Install._dismiss()">✕</button>';
        document.body.appendChild(b);
        Install._deferredPrompt = e;
      }, 10000);
    });
  },
  _doInstall() {
    if (!Install._deferredPrompt) return;
    Install._deferredPrompt.prompt();
    Install._deferredPrompt.userChoice.then(() => { Install._dismiss(); });
  },
  _dismiss() {
    localStorage.setItem('dpc_install_dismissed', '1');
    const b = document.getElementById('installBanner');
    if (b) b.remove();
  },
  dismiss() {
    localStorage.setItem('deepony_install_dismiss', '1');
    const hint = document.getElementById('installHint');
    if (hint) hint.classList.remove('show');
  }
};

const DemoUI = {
  maybeShow() {
    const demo = new URLSearchParams(location.search).get('demo') === '1';
    if (!demo || sessionStorage.getItem('deepony_demo_dismiss')) return;
    const b = document.getElementById('demoBanner');
    if (b) b.style.display = 'block';
    document.getElementById('main')?.classList.add('demo-active');
  },
  dismissBanner() {
    sessionStorage.setItem('deepony_demo_dismiss', '1');
    const b = document.getElementById('demoBanner');
    if (b) b.style.display = 'none';
    document.getElementById('main')?.classList.remove('demo-active');
  }
};
