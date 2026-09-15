'use strict';
function readStorageRaw() {
  let raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return raw;
  for (const lk of [STORAGE_KEY_LEGACY, STORAGE_KEY_V1, STORAGE_KEY_V1_LEGACY]) {
    raw = localStorage.getItem(lk);
    if (raw) {
      localStorage.setItem(STORAGE_KEY, raw);
      return raw;
    }
  }
  return null;
}

const Store = {
  _applyParsed(parsed) {
    const merged = {
      ...S, ...parsed,
      settings: {
        collectorMode: false, darkMode: false, hapticsEnabled: true,
        parentPinEnabled: false, parentPinHash: null, updatePolicy: 'ask',
        accentTheme: 'pink',
        ...(parsed.settings || {}),
      },
      accessories: parsed.accessories || [],
      unlockedAchievements: parsed.unlockedAchievements || [],
    };
    merged.ponies = (parsed.ponies || []).map(normalizePony);
    S = window.Migrations ? Migrations.run(merged) : merged;
  },
  migrateV1(raw) {
    try {
      const v1 = JSON.parse(raw);
      S = {
        ...S, ...v1,
        settings: { collectorMode: false, ...(v1.settings || {}) },
        accessories: v1.accessories || [],
        version: 2
      };
      S.ponies = (v1.ponies || []).map(normalizePony);
      return true;
    } catch { return false; }
  },
  /** Loads collection data from IndexedDB (or localStorage fallback) into the global S state object. */
  async load() {
    try {
      if (window.DataStore) {
        const fromIdb = await DataStore.load();
        if (fromIdb) {
          Store._applyParsed(fromIdb);
          StorageHealth._idb = true;
          await Store._hydratePhotos();
          await StorageHealth.refreshEstimate();
          return;
        }
      }
      let raw = readStorageRaw();
      if (!raw) {
        const v1 = localStorage.getItem(STORAGE_KEY_V1) || localStorage.getItem(STORAGE_KEY_V1_LEGACY);
        if (v1 && Store.migrateV1(v1)) { await Store._hydratePhotos(); await Store.save(); return; }
      }
      if (raw) {
        Store._applyParsed(JSON.parse(raw));
        await Store._hydratePhotos();
        StorageHealth._idb = !!window.DataStore;
        await Store.save();
      }
    } catch (e) {
      window.__loadError = true;
    }
    if (!S.settings) S.settings = { collectorMode: false, darkMode: false, hapticsEnabled: true, parentPinEnabled: false, parentPinHash: null };
    S.settings.darkMode = !!S.settings.darkMode;
    S.settings.hapticsEnabled = S.settings.hapticsEnabled !== false;
    if (!S.unlockedAchievements) S.unlockedAchievements = [];
    if (!S.seriesList) S.seriesList = [];
    if (typeof ensureSeriesList === 'function') ensureSeriesList(S);
    if (!S.onboardingDone && !S.ponies.length) {
      S.ponies = [];
    }
    Theme.apply();
  },
  async _hydratePhotos() {
    if (!window.PhotoIDB) return;
    S.ponies = await PhotoIDB.migrateFromLegacy(S.ponies);
  },
  /** Persists the current S state object to IndexedDB or localStorage. */
  save() {
    S.version = window.Migrations ? Migrations.CURRENT : 4;
    const persist = async () => {
      let ponies = S.ponies;
      if (window.PhotoIDB) {
        ponies = await PhotoIDB.stripForSave(S.ponies);
      }
      const payload = { ...S, ponies };
      if (window.DataStore) {
        await DataStore.save(payload);
        StorageHealth._idb = true;
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      }
      await StorageHealth.refreshEstimate();
    };
    persist().catch(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); } catch {}
    });
  }
};

const DemoSeed = {
  _photo(label, color) {
    const safe = String(label).replace(/[<>&"']/g, '').slice(0, 18);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${color}"/><stop offset="100%" stop-color="#ffffff55"/></linearGradient></defs><rect fill="url(#g)" width="240" height="240" rx="36"/><circle cx="120" cy="92" r="36" fill="#ffffff33"/><text x="120" y="178" text-anchor="middle" fill="#fff" font-size="12" font-family="system-ui,sans-serif" font-weight="600">${safe}</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  },
  _palette: [DPBrand.h_9333ea, DPBrand.h_2563eb, DPBrand.h_eab308, DPBrand.h_f472b6, DPBrand.h_f97316, DPBrand.h_10b981, DPBrand.h_6366f1, DPBrand.h_ec4899, DPBrand.h_14b8a6, DPBrand.h_8b5cf6],
  ponies() {
    const names = [
      ['Clover Gleam', 'Dawn Line', 1, 'mlp', 'Soft green', 'Shelf 1', 'mint'],
      ['Midnight Bloom', 'Dawn Line', 1, 'mlp', 'Deep violet', 'Shelf 1', 'good'],
      ['Sunny Pebble', 'Dawn Line', 1, 'mlp', 'Warm yellow', 'Shelf 1', 'mint'],
      ['River Soft', 'Meadow Line', 2, 'mlp', 'Sky blue', 'Display Case', 'mint'],
      ['Petal Drift', 'Meadow Line', 2, 'mlp', 'Blush pink', 'Shelf 2', 'good'],
      ['Honey Trail', 'Meadow Line', 2, 'mlp', 'Honey orange', 'Shelf 1', 'played'],
      ['Lumen Quill', 'Vintage Line', 3, 'special', 'Cream', 'Display Case', 'mint'],
      ['Tiny Dewdrop', 'Vintage Line', 3, 'mlp', 'Pale pink', 'Shelf 2', 'good'],
      ['Aurora Nest', 'Starlight Line', 4, 'mlp', 'Lavender', 'Shelf 3', 'loved'],
      ['Moss Lantern', 'Starlight Line', 4, 'mlp', 'Forest green', 'Shelf 3', 'good'],
      ['Cloud Thimble', 'Starlight Line', 4, 'mlp', 'Cloud white', 'Shelf 3', 'mint'],
      ['Bramble Song', 'Meadow Line', 2, 'mlp', 'Berry red', 'Windowsill', 'played'],
      ['Nimbus Pearl', 'Dawn Line', 1, 'mlp', 'Pearl grey', 'Box', 'loved'],
      ['Willow Flick', 'Vintage Line', 3, 'mlp', 'Willow green', 'Box', 'good'],
      ['Coral Wick', 'Dawn Line', 1, 'filly', 'Coral', 'Shelf 2', 'mint'],
      ['Velvet Ember', 'Meadow Line', 2, 'velvet', 'Ember rose', 'Shelf 2', 'good'],
      ['Starlit Cove', 'Starlight Line', 4, 'mlp', 'Night blue', 'Display Case', 'mint'],
      ['Glint Meadow', 'Meadow Line', 2, 'mlp', 'Meadow gold', 'Display Case', 'mint'],
    ];
    const base = names.map((n, i) => {
      const photo = i < 10 ? DemoSeed._photo(n[0], DemoSeed._palette[i % DemoSeed._palette.length]) : null;
      return normalizePony({
        id: uid(),
        name: n[0], series: n[1], generation: n[2], type: n[3], colour: n[4], category: 'mlp',
        size: 'standard', shelf: n[5],
        isOriginal: true, condition: n[6],
        isFavourite: i < 4, isMostPlayed: i === 5,
        photos: photo ? [photo] : [], photo,
        acquiredDate: new Date(Date.now() - (i + 1) * 86400000 * 30).toISOString().slice(0, 10),
        notes: 'Demo pony — fictional collection data',
        purchaseValue: 8 + i, estimatedValue: 12 + i * 2,
        createdAt: Date.now() - (i + 1) * 86400000,
      });
    });
    const promo = [
      ['Promo Clover', 'USA', '2014', 'Green', 'Shelf 4'],
      ['Promo Midnight', 'USA', '2015', 'Violet', 'Shelf 4'],
      ['Promo Sunny', 'UK', '2012', 'Yellow', 'Shelf 4'],
      ['Promo River', 'Canada', '2013', 'Blue', 'Box'],
      ['Promo Petal', 'UK', '2012', 'Pink', 'Shelf 4'],
    ];
    const promoPonies = promo.map((n, i) => normalizePony({
      id: uid(), name: n[0], category: 'mcdonalds', type: 'mcdonalds', series: '', generation: 0,
      mcdCountry: n[1], mcdYear: n[2], colour: n[3], shelf: n[4],
      size: 'mini', isOriginal: true, condition: 'good',
      isFavourite: false, isMostPlayed: false, photos: [], photo: null,
      catalogNumber: String(100 + i), hairColour: n[3], cutieMark: 'Promo mark',
      acquiredDate: `${n[2]}-06-15`, notes: 'Demo promo toy',
      purchaseValue: 3, estimatedValue: 8, createdAt: Date.now() - (20 + i) * 86400000,
    }));
    return base.concat(promoPonies);
  },
  wishlist() {
    const items = [
      { name: 'Silver Fern', series: 'Dawn Line', generation: 1, type: 'special', priority: 'must', targetPrice: 45, notes: 'Display case grail', color: DPBrand.h_312e81 },
      { name: 'Amber Quill', series: 'Vintage Line', generation: 3, type: 'mlp', priority: 'must', targetPrice: 120, notes: 'Watch listings', color: DPBrand.h_be185d },
      { name: 'Moss Bell', series: 'Vintage Line', generation: 3, type: 'mlp', priority: 'want', targetPrice: 35, notes: 'Complete with brush', color: DPBrand.h_059669 },
      { name: 'Nova Drift', series: 'Starlight Line', generation: 4, type: 'mlp', priority: 'want', targetPrice: 18, notes: 'New line set', color: DPBrand.h_d97706 },
      { name: 'Thistle Wren', series: 'Meadow Line', generation: 2, type: 'mlp', priority: 'want', targetPrice: 28, notes: '', color: DPBrand.h_7c3aed },
      { name: 'Tiny Marigold', series: 'Vintage Line', generation: 3, type: 'mlp', priority: 'someday', targetPrice: 55, notes: 'Mint in box if possible', color: DPBrand.h_db2777 },
      { name: 'Cottage Playset', series: 'Dawn Line', generation: 1, type: 'special', priority: 'someday', targetPrice: 80, notes: 'Playset — dream item', color: DPBrand.h_0284c7 },
    ];
    return items.map(w => ({
      id: uid(),
      name: w.name,
      series: w.series,
      generation: w.generation,
      type: w.type,
      priority: w.priority,
      targetPrice: w.targetPrice,
      notes: w.notes,
      photo: DemoSeed._photo(w.name, w.color),
    }));
  },
  async load(opts) {
    const silent = opts && opts.silent;
    if (!silent) {
      try { localStorage.setItem('deeponycap_pin_backup', JSON.stringify(S)); } catch (e) {}
    }
    if (!silent) {
      const ok = await CapConfirm({
        title: 'Load demo collection?',
        body: 'Replaces your current ponies.',
        confirmLabel: 'Load demo',
        destructive: true,
      });
      if (!ok) return;
    }
    S.seriesList = ['Dawn Line', 'Meadow Line', 'Starlight Line', 'Vintage Line'];
    S.ponies = DemoSeed.ponies();
    S.wishlist = DemoSeed.wishlist();
    S.collector = { name: 'Demo Collector', since: '2020-01-01' };
    S.onboardingDone = true;
    Store.save();
    Render.all();
    if (!silent) Toast.show('Demo collection loaded');
    setTimeout(() => Achievements.checkAll(false), 700);
    return true;
  }
};
