'use strict';
const StorageHealth = {
  _est: null,
  _idb: false,
  async refreshEstimate() {
    if (window.DataStore) {
      this._est = await DataStore.estimateUsage();
    }
    return this._est;
  },
  bytes() {
    if (this._est?.used) return this._est.used;
    try { return new Blob([localStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY_LEGACY) || '']).size; } catch { return 0; }
  },
  quota() {
    if (this._est?.quota) return this._est.quota;
    if (this.usesIdb()) return 500 * 1024 * 1024;
    return STORAGE_LIMIT;
  },
  pct() {
    const q = this.quota();
    if (!q) return 0;
    return Math.min(100, Math.round(this.bytes() / q * 100));
  },
  mb() { return (this.bytes() / (1024 * 1024)).toFixed(2); },
  usesIdb() { return this._idb || !!(window.DataStore && (localStorage.getItem(DataStore.LS_POINTER) || (S && S.version >= 4))); },
  photoBytes() {
    return S.ponies.reduce((sum, p) => {
      const photos = p.photos?.length ? p.photos : (p.photo ? [p.photo] : []);
      return sum + photos.reduce((n, ph) => n + (typeof ph === 'string' ? ph.length : 0), 0);
    }, 0);
  },
  label() {
    const idb = this.usesIdb();
    const mb = this.mb();
    const qMb = (this.quota() / (1024 * 1024)).toFixed(0);
    if (idb) {
      const p = this.pct();
      if (p >= 90) return { level: 'warn', text: `${mb} MB used · IndexedDB ${qMb} MB quota — export a backup soon` };
      if (p >= 75) return { level: 'warn', text: `${mb} MB used · IndexedDB storage (${p}% of quota)` };
      return { level: 'ok', text: `${mb} MB used · IndexedDB (no 5 MB limit) ✨` };
    }
    const p = this.pct();
    if (p >= 95) return { level: 'critical', text: `${mb} MB / 5 MB — storage critical; export backup & remove photos now` };
    if (p >= 85) return { level: 'critical', text: `${mb} MB / 5 MB — near limit; compress or delete photos soon` };
    if (p >= 75) return { level: 'warn', text: `${mb} MB / 5 MB — photos filling storage; consider compressing` };
    if (p >= 60) return { level: 'warn', text: `${mb} MB / 5 MB — monitor photo sizes as collection grows` };
    return { level: 'ok', text: `${mb} MB / 5 MB — storage healthy` };
  },
  photoWarning() {
    if (this.usesIdb()) return '';
    const inline = StorageHealth.photoBytes();
    if (inline >= STORAGE_LIMIT * 0.85) return 'Inline photos are using most of your 5 MB quota — export a backup before adding more.';
    if (inline >= STORAGE_LIMIT * 0.65) return 'Photo data is growing — use Compress all photos or export a backup.';
    return '';
  }
};
