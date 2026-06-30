'use strict';
const Haptic = {
  enabled() { return S.settings?.hapticsEnabled !== false; },
  tap() { if (this.enabled() && navigator.vibrate) navigator.vibrate(8); },
  success() { if (this.enabled() && navigator.vibrate) navigator.vibrate([10, 35, 18]); },
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
