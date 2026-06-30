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
    if (!S.onboardingDone && !S.ponies.length) {
      S.ponies = [
        {id:uid(),name:'Twilight Sparkle',generation:4,type:'mlp',colour:'Purple with pink streak',size:'standard',shelf:'Shelf 1',isOriginal:true,condition:'mint',isFavourite:true,isMostPlayed:false,photos:[],photo:null,acquiredDate:'',notes:'',createdAt:Date.now()-3},
        {id:uid(),name:'Pinkie Pie',generation:4,type:'mlp',colour:'Pink all over',size:'standard',shelf:'Shelf 1',isOriginal:true,condition:'good',isFavourite:true,isMostPlayed:true,photos:[],photo:null,acquiredDate:'',notes:'',createdAt:Date.now()-2},
        {id:uid(),name:'Baby Cotton Candy',generation:1,type:'mlp',colour:'Pink with purple hair',size:'mini',shelf:'Shelf 2',isOriginal:true,condition:'loved',isFavourite:false,isMostPlayed:false,photos:[],photo:null,acquiredDate:'',notes:'',createdAt:Date.now()-1}
      ];
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
  _palette: ['#9333ea', '#2563eb', '#eab308', '#f472b6', '#f97316', '#10b981', '#6366f1', '#ec4899', '#14b8a6', '#8b5cf6'],
  ponies() {
    const names = [
      ['Twilight Sparkle', 4, 'mlp', 'Purple', 'Shelf 1', 'mint'],
      ['Rainbow Dash', 4, 'mlp', 'Blue', 'Shelf 1', 'good'],
      ['Fluttershy', 4, 'mlp', 'Yellow', 'Shelf 1', 'mint'],
      ['Rarity', 4, 'mlp', 'White', 'Display Case', 'mint'],
      ['Applejack', 4, 'mlp', 'Orange', 'Shelf 2', 'good'],
      ['Pinkie Pie', 4, 'mlp', 'Pink', 'Shelf 1', 'played'],
      ['Princess Celestia', 4, 'special', 'White/gold', 'Display Case', 'mint'],
      ['Spike', 4, 'special', 'Purple/green', 'Shelf 2', 'good'],
      ['Baby Cotton Candy', 1, 'mlp', 'Pink', 'Shelf 3', 'loved'],
      ['Minty', 3, 'mlp', 'Green', 'Shelf 3', 'good'],
      ['Wysteria', 3, 'mlp', 'Purple', 'Shelf 3', 'mint'],
      ['Star Swirl', 2, 'mlp', 'Blue', 'Windowsill', 'played'],
      ['Firefly', 1, 'mlp', 'Pink', 'Box', 'loved'],
      ['Gusty', 1, 'mlp', 'White', 'Box', 'good'],
      ['Sunny Daze', 3, 'filly', 'Yellow', 'Shelf 2', 'mint'],
      ['Cuddles', 3, 'velvet', 'Pink', 'Shelf 2', 'good'],
      ['Twilight Sparkle (G5)', 5, 'mlp', 'Purple', 'Display Case', 'mint'],
      ['Izzy Moonbow', 5, 'mlp', 'Purple', 'Display Case', 'mint'],
    ];
    const base = names.map((n, i) => {
      const photo = i < 10 ? DemoSeed._photo(n[0], DemoSeed._palette[i % DemoSeed._palette.length]) : null;
      return normalizePony({
        id: uid(),
        name: n[0], generation: n[1], type: n[2], colour: n[3], category: 'mlp',
        size: n[1] === 1 ? 'mini' : 'standard', shelf: n[4],
        isOriginal: true, condition: n[5],
        isFavourite: i < 4, isMostPlayed: i === 5,
        photos: photo ? [photo] : [], photo,
        acquiredDate: new Date(Date.now() - (i + 1) * 86400000 * 30).toISOString().slice(0, 10),
        notes: 'Demo pony — fictional collection data',
        purchaseValue: 8 + i, estimatedValue: 12 + i * 2,
        createdAt: Date.now() - (i + 1) * 86400000,
      });
    });
    const mcd = [
      ['Happy Meal Twilight', 'USA', '2014', 'Purple', 'Shelf 4'],
      ['Happy Meal Rainbow Dash', 'USA', '2015', 'Blue', 'Shelf 4'],
      ['McDonald\'s Fluttershy', 'UK', '2012', 'Yellow', 'Shelf 4'],
      ['McDonald\'s Applejack', 'Canada', '2013', 'Orange', 'Box'],
      ['McDonald\'s Pinkie Pie', 'UK', '2012', 'Pink', 'Shelf 4'],
    ];
    const mcdPonies = mcd.map((n, i) => normalizePony({
      id: uid(), name: n[0], category: 'mcdonalds', type: 'mcdonalds', generation: 4,
      mcdCountry: n[1], mcdYear: n[2], colour: n[3], shelf: n[4],
      size: 'mini', isOriginal: true, condition: 'good',
      isFavourite: false, isMostPlayed: false, photos: [], photo: null,
      catalogNumber: String(100 + i), hairColour: n[3], cutieMark: 'Happy Meal cutie',
      acquiredDate: `${n[2]}-06-15`, notes: 'Demo McDonald\'s pony',
      purchaseValue: 3, estimatedValue: 8, createdAt: Date.now() - (20 + i) * 86400000,
    }));
    return base.concat(mcdPonies);
  },
  wishlist() {
    const items = [
      { name: 'Princess Luna', generation: 4, type: 'special', priority: 'must', targetPrice: 45, notes: 'Night version — display case grail', color: '#312e81' },
      { name: 'Starshine', generation: 1, type: 'mlp', priority: 'must', targetPrice: 120, notes: 'Rare G1 — watch eBay', color: '#be185d' },
      { name: 'Posey', generation: 1, type: 'mlp', priority: 'want', targetPrice: 35, notes: 'Complete with brush', color: '#059669' },
      { name: 'Sunny Starscout', generation: 5, type: 'mlp', priority: 'want', targetPrice: 18, notes: 'G5 movie set', color: '#d97706' },
      { name: 'Meadowbrook', generation: 3, type: 'mlp', priority: 'want', targetPrice: 28, notes: '', color: '#7c3aed' },
      { name: 'G1 Baby Surprise', generation: 1, type: 'mlp', priority: 'someday', targetPrice: 55, notes: 'Mint in box if possible', color: '#db2777' },
      { name: 'Ponyville Train Set', generation: 4, type: 'special', priority: 'someday', targetPrice: 80, notes: 'Playset — not a pony but dream item', color: '#0284c7' },
    ];
    return items.map(w => ({
      id: uid(),
      name: w.name,
      generation: w.generation,
      type: w.type,
      priority: w.priority,
      targetPrice: w.targetPrice,
      notes: w.notes,
      photo: DemoSeed._photo(w.name, w.color),
    }));
  },
  load(opts) {
    const silent = opts && opts.silent;
    if (!silent) {
      try { localStorage.setItem('deeponycap_pin_backup', JSON.stringify(S)); } catch (e) {}
    }
    if (!silent && !confirm('Load demo collection (18 ponies)? Replaces your current ponies.')) return;
    S.ponies = DemoSeed.ponies();
    S.wishlist = DemoSeed.wishlist();
    S.collector = { name: 'Demo Collector', since: '2020-01-01' };
    S.onboardingDone = true;
    Store.save();
    Render.all();
    if (!silent) Toast.show('Demo collection loaded ✨');
    setTimeout(() => Achievements.checkAll(false), 700);
    return true;
  }
};
