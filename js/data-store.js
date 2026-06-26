'use strict';
/**
 * IndexedDB-first app state — removes the 5 MB localStorage ceiling.
 * Photos stay in PhotoIDB references; full metadata lives in IDB `state` store.
 */
const DataStore = (() => {
  const DB_NAME = 'deeponycap-data-v1';
  const STATE = 'state';
  const RECOVERY = 'recovery';
  const MAIN_KEY = 'main';
  const LS_POINTER = 'deeponycap_idb_pointer';

  let dbp = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STATE)) db.createObjectStore(STATE);
        if (!db.objectStoreNames.contains(RECOVERY)) db.createObjectStore(RECOVERY);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbp;
  }

  function tx(store, mode) {
    return open().then(db => db.transaction(store, mode).objectStore(store));
  }

  async function getState(store, key) {
    const os = await tx(store, 'readonly');
    return new Promise((res, rej) => {
      const r = os.get(key);
      r.onsuccess = () => res(r.result ?? null);
      r.onerror = () => rej(r.error);
    });
  }

  async function putState(store, key, val) {
    const os = await tx(store, 'readwrite');
    return new Promise((res, rej) => {
      const r = os.put(val, key);
      r.onsuccess = () => res();
      r.onerror = () => rej(r.error);
    });
  }

  async function load() {
    try {
      const raw = await getState(STATE, MAIN_KEY);
      if (!raw) return null;
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return null;
    }
  }

  async function save(state) {
    const payload = { ...state, savedAt: Date.now(), storageEngine: 'idb' };
    await putState(STATE, MAIN_KEY, payload);
    try {
      localStorage.setItem(LS_POINTER, JSON.stringify({
        engine: 'idb', version: payload.version || 4, at: payload.savedAt,
      }));
    } catch {}
  }

  async function saveRecovery(state) {
    const key = 'rec_' + Date.now();
    try {
      await putState(RECOVERY, key, JSON.stringify(state));
      const db = await open();
      const keys = await new Promise((res, rej) => {
        const tx = db.transaction(RECOVERY, 'readonly');
        const r = tx.objectStore(RECOVERY).getAllKeys();
        r.onsuccess = () => res(r.result.map(String).filter(k => k.startsWith('rec_')).sort());
        r.onerror = () => rej(r.error);
      });
      while (keys.length > 3) {
        const old = keys.shift();
        await new Promise((res, rej) => {
          const tx = db.transaction(RECOVERY, 'readwrite');
          tx.objectStore(RECOVERY).delete(old);
          tx.oncomplete = () => res();
          tx.onerror = () => rej(tx.error);
        });
      }
    } catch {}
  }

  async function latestRecovery() {
    try {
      const db = await open();
      const keys = await new Promise((res, rej) => {
        const tx = db.transaction(RECOVERY, 'readonly');
        const r = tx.objectStore(RECOVERY).getAllKeys();
        r.onsuccess = () => res(r.result.map(String).filter(k => k.startsWith('rec_')).sort().reverse());
        r.onerror = () => rej(r.error);
      });
      if (!keys.length) return null;
      const raw = await getState(RECOVERY, keys[0]);
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return null;
    }
  }

  async function estimateUsage() {
    if (navigator.storage?.estimate) {
      try {
        const est = await navigator.storage.estimate();
        return { used: est.usage || 0, quota: est.quota || 0 };
      } catch {}
    }
    return { used: 0, quota: 0 };
  }

  function formatBytes(n) {
    if (!n) return '0 MB';
    if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB';
    return (n / (1024 * 1024)).toFixed(1) + ' MB';
  }

  return { load, save, saveRecovery, latestRecovery, estimateUsage, formatBytes, LS_POINTER };
})();

window.DataStore = DataStore;
