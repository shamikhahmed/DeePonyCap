'use strict';
/** IndexedDB photo store — keeps pony metadata in localStorage, photos offline in IDB */
const PhotoIDB = (() => {
  const DB = 'deepony-photos-v1';
  const STORE = 'photos';
  let dbp = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbp;
  }

  async function put(key, dataUrl) {
    const db = await open();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(dataUrl, key);
      tx.oncomplete = () => res(key);
      tx.onerror = () => rej(tx.error);
    });
  }

  async function get(key) {
    const db = await open();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readonly');
      const r = tx.objectStore(STORE).get(key);
      r.onsuccess = () => res(r.result || null);
      r.onerror = () => rej(r.error);
    });
  }

  async function del(key) {
    const db = await open();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  }

  function key(ponyId, idx) { return `${ponyId}:${idx}`; }

  async function stripForSave(ponies) {
    const out = [];
    for (const p of ponies) {
      const photos = p.photos || [];
      const photoKeys = [];
      for (let i = 0; i < photos.length; i++) {
        const ph = photos[i];
        if (!ph || typeof ph !== 'string') continue;
        if (ph.startsWith('idb:')) { photoKeys.push(ph); continue; }
        const k = 'idb:' + key(p.id, i);
        await put(k.slice(4), ph);
        photoKeys.push(k);
      }
      out.push({ ...p, photos: [], photo: null, photoKeys });
    }
    return out;
  }

  async function hydrate(ponies) {
    for (const p of ponies) {
      const keys = p.photoKeys || [];
      const photos = [];
      for (const k of keys) {
        const id = k.startsWith('idb:') ? k.slice(4) : k;
        const data = await get(id);
        if (data) photos.push(data);
      }
      if (!photos.length && p.photos?.length) photos.push(...p.photos.filter(Boolean));
      if (!photos.length && p.photo) photos.push(p.photo);
      p.photos = photos;
      p.photo = photos[0] || null;
      delete p.photoKeys;
    }
    return ponies;
  }

  async function migrateFromLegacy(ponies) {
    const needs = ponies.some(p => (p.photos?.length && !p.photoKeys) || (p.photo && !p.photos?.length));
    if (!needs) return hydrate(ponies);
    const stripped = await stripForSave(ponies.map(p => ({
      ...p,
      photos: p.photos?.length ? p.photos : (p.photo ? [p.photo] : [])
    })));
    return hydrate(stripped);
  }

  return { put, get, del, stripForSave, hydrate, migrateFromLegacy };
})();
window.PhotoIDB = PhotoIDB;
