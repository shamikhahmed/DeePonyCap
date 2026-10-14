'use strict';
const Haptic = {
  enabled() { return S.settings?.hapticsEnabled !== false; },
  /** Chromium blocks vibrate until a prior user activation (§7.5 / DPY-V3-2). */
  canVibrate() {
    if (!this.enabled() || typeof navigator.vibrate !== 'function') return false;
    const ua = navigator.userActivation;
    if (ua && !ua.hasBeenActive) return false;
    return true;
  },
  tap() { if (this.canVibrate()) navigator.vibrate(8); },
  success() { if (this.canVibrate()) navigator.vibrate([10, 35, 18]); },
};

const Seasonal = {
  hasAnniversaryToday() {
    const today = new Date();
    return S.ponies.some(p => {
      if (!p.acquiredDate) return false;
      const d = new Date(p.acquiredDate);
      return d.getMonth() === today.getMonth() && d.getDate() === today.getDate() && d.getFullYear() < today.getFullYear();
    });
  },
  apply() {
    const m = new Date().getMonth();
    const el = document.documentElement;
    el.classList.toggle('season-winter', m === 11 || m === 0);
    el.classList.toggle('season-spring', m >= 2 && m <= 4);
    el.classList.toggle('season-birthday', this.hasAnniversaryToday());
  },
};
