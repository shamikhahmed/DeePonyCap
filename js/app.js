'use strict';
const STORAGE_KEY = 'deeponycap_v2';
const STORAGE_KEY_LEGACY = 'deePonyOS_v2';
const STORAGE_KEY_V1 = 'deePonyOS_v1';
const STORAGE_KEY_V1_LEGACY = 'deeponycap_v1';
const PAGE_SIZE = 40;
const GEN_COLORS = {1:'g1',2:'g2',3:'g3',4:'g4',5:'g5'};
const GEN_EMOJI = {1:'💜',2:'💚',3:'💙',4:'💛',5:'🩷'};
const TYPE_LABELS = {mlp:'🦄 MLP',filly:'🎀 Filly',velvet:'🧸 Velvet',palace_pet:'🏰 Palace',special:'✨ Special',mcdonalds:'🍟 McDonald\'s',other_brand:'🐴 Other brand'};
const TYPE_KEYS = ['mlp','filly','velvet','palace_pet','special'];
const CATEGORY_LABELS = {mlp:'My Little Pony',other:'Other pony brand',mcdonalds:"McDonald's pony"};
const COND_LABELS = {mint:'✨ Mint',good:'👍 Good',played:'🎮 Played',loved:'💕 Loved'};
const SIZE_LABELS = {mini:'Mini',standard:'Standard',large:'Large',extra_large:'XL'};
const SHELF_SUGGEST = ['Shelf 1','Shelf 2','Windowsill','Display Case','Box'];

let S = {
  ponies:[], wishlist:[], accessories:[], collector:{name:'',since:''},
  settings:{collectorMode:false,darkMode:false,hapticsEnabled:true,parentPinEnabled:false,parentPinHash:null},
  unlockedAchievements:[], onboardingDone:false, version:3
};
const STORAGE_LIMIT = 5 * 1024 * 1024;
let filter = { chip:'all', q:'', sort:'name', page:0 };
let logFilter = { logSection:'g1', logSort:'name', logView:'register' };
let accFilter = { q:'', cat:'all', sort:'name' };
let editingId = null;
let detailId = null;
let formState = {};

const uid = () => Math.random().toString(36).slice(2,10);

function ponyPhoto(p) {
  if (!p) return null;
  if (p.photos?.length) return p.photos[0];
  return p.photo || null;
}

function normalizePony(p) {
  const photos = Array.isArray(p.photos) ? p.photos.filter(Boolean) : [];
  if (!photos.length && p.photo) photos.push(p.photo);
  const soldComps = Array.isArray(p.soldComps) ? p.soldComps.filter(c => c && c.amount > 0) : [];
  const category = p.category || (p.mcdCountry || p.type === 'mcdonalds' ? 'mcdonalds' : (p.brand || p.generation === 0 ? 'other' : 'mlp'));
  return {
    ...p, photos, photo: photos[0] || null,
    category,
    catalogNumber: p.catalogNumber || '',
    hairColour: p.hairColour || '',
    cutieMark: p.cutieMark || '',
    brand: p.brand || '',
    mcdCountry: p.mcdCountry || '',
    mcdYear: p.mcdYear != null ? String(p.mcdYear) : '',
    purchaseValue: p.purchaseValue != null ? Number(p.purchaseValue) : null,
    estimatedValue: p.estimatedValue != null ? Number(p.estimatedValue) : null,
    soldComps,
  };
}

function ponyBadgeLabel(p) {
  return window.CollectorSuite ? CollectorSuite.ponyBadge(p) : `G${p.generation || '?'}`;
}

function pinHash(pin) {
  let h = 0;
  for (let i = 0; i < pin.length; i++) h = ((h << 5) - h + pin.charCodeAt(i)) | 0;
  return 'dp_' + Math.abs(h).toString(36);
}

function guessNameFromFile(filename) {
  const base = (filename || '').replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!base) return '';
  return base.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function matchG4PonyByName(name) {
  const nl = (name || '').trim().toLowerCase();
  if (!nl) return null;
  const exact = S.ponies.find(p => p.generation === 4 && p.name.trim().toLowerCase() === nl);
  if (exact) return exact;
  const db = (window.PONY_DB && window.PONY_DB[4]) || [];
  const dbMatch = db.find(n => n.toLowerCase() === nl || n.toLowerCase().includes(nl) || nl.includes(n.toLowerCase()));
  if (dbMatch) {
    const owned = S.ponies.find(p => p.generation === 4 && p.name.trim().toLowerCase() === dbMatch.toLowerCase());
    if (owned) return owned;
    return { suggestName: dbMatch };
  }
  const partial = S.ponies.filter(p => p.generation === 4 && (p.name.toLowerCase().includes(nl) || nl.includes(p.name.toLowerCase())));
  if (partial.length === 1) return partial[0];
  return null;
}

function ponyValue(p) {
  return p.estimatedValue ?? p.purchaseValue ?? null;
}

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

function findDuplicate(name, gen, excludeId) {
  const nl = (name || '').trim().toLowerCase();
  if (!nl) return null;
  return S.ponies.find(p => p.id !== excludeId && p.name.trim().toLowerCase() === nl && p.generation === gen);
}

function findSimilarPonies(name, gen, excludeId) {
  const nl = (name || '').trim().toLowerCase();
  if (!nl || nl.length < 2) return [];
  return S.ponies.filter(p => {
    if (p.id === excludeId || p.generation !== gen) return false;
    const pn = p.name.trim().toLowerCase();
    if (pn === nl) return false;
    return pn.startsWith(nl) || nl.startsWith(pn) || pn.includes(nl) || nl.includes(pn);
  }).slice(0, 3);
}

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
    return names.map((n, i) => ({
      id: uid(),
      name: n[0], generation: n[1], type: n[2], colour: n[3],
      size: n[1] === 1 ? 'mini' : 'standard', shelf: n[4],
      isOriginal: true, condition: n[5],
      isFavourite: i < 4, isMostPlayed: i === 5,
      photos: [], photo: null,
      acquiredDate: new Date(Date.now() - (i + 1) * 86400000 * 30).toISOString().slice(0, 10),
      notes: 'Demo pony — fictional collection data',
      purchaseValue: 8 + i, estimatedValue: 12 + i * 2,
      createdAt: Date.now() - (i + 1) * 86400000,
    }));
  },
  wishlist() {
    return [
      { id: uid(), name: 'Princess Luna', generation: 4, type: 'special', priority: 'must', targetPrice: 45, notes: 'Night version — display case grail', photo: null },
      { id: uid(), name: 'Starshine', generation: 1, type: 'mlp', priority: 'must', targetPrice: 120, notes: 'Rare G1 — watch eBay', photo: null },
      { id: uid(), name: 'Posey', generation: 1, type: 'mlp', priority: 'want', targetPrice: 35, notes: 'Complete with brush', photo: null },
      { id: uid(), name: 'Sunny Starscout', generation: 5, type: 'mlp', priority: 'want', targetPrice: 18, notes: 'G5 movie set', photo: null },
      { id: uid(), name: 'Meadowbrook', generation: 3, type: 'mlp', priority: 'want', targetPrice: 28, notes: '', photo: null },
      { id: uid(), name: 'G1 Baby Surprise', generation: 1, type: 'mlp', priority: 'someday', targetPrice: 55, notes: 'Mint in box if possible', photo: null },
      { id: uid(), name: 'Ponyville Train Set', generation: 4, type: 'special', priority: 'someday', targetPrice: 80, notes: 'Playset — not a pony but dream item', photo: null },
    ];
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

const Theme = {
  apply() {
    document.documentElement.classList.toggle('collector-mode', !!S.settings?.collectorMode);
    document.documentElement.classList.toggle('dark-mode', !!S.settings?.darkMode);
    if (window.CollectorSuite) CollectorSuite.applyAccent(S.settings?.accentTheme || 'pink');
    if (window.Seasonal) Seasonal.apply();
    const meta = document.getElementById('themeMeta');
    if (meta) meta.content = S.settings?.darkMode ? '#1F2937' : (S.settings?.collectorMode ? '#6D28D9' : '#FF6B9D');
  },
  setAccent(id) {
    S.settings.accentTheme = id;
    Store.save();
    Theme.apply();
    Render.settings();
    Toast.show('Theme updated ✨');
  },
  toggle() {
    S.settings.collectorMode = !S.settings.collectorMode;
    Store.save();
    Theme.apply();
    Render.all();
    Toast.show(S.settings.collectorMode ? 'Collector mode on 📋' : 'Magical mode on ✨');
  },
  toggleDark() {
    S.settings.darkMode = !S.settings.darkMode;
    Store.save();
    Theme.apply();
    Render.all();
    Toast.show(S.settings.darkMode ? 'Dark mode on 🌙' : 'Light mode on ☀️');
  }
};

const Csv = {
  export() {
    const header = 'name,category,generation,catalogNumber,type,colour,hairColour,size,shelf,brand,mcdCountry,mcdYear,cutieMark,acquiredDate,condition,isOriginal,purchaseValue,estimatedValue,notes';
    const rows = S.ponies.map(p => [
      `"${(p.name||'').replace(/"/g,'""')}"`, p.category || 'mlp', p.generation, `"${(p.catalogNumber||'').replace(/"/g,'""')}"`, p.type,
      `"${(p.colour||'').replace(/"/g,'""')}"`, `"${(p.hairColour||'').replace(/"/g,'""')}"`, p.size,
      `"${(p.shelf||'').replace(/"/g,'""')}"`, `"${(p.brand||'').replace(/"/g,'""')}"`, `"${(p.mcdCountry||'').replace(/"/g,'""')}"`, p.mcdYear || '',
      `"${(p.cutieMark||'').replace(/"/g,'""')}"`, p.acquiredDate || '',
      p.condition, p.isOriginal ? 1 : 0,
      ponyValue(p) ?? '', p.estimatedValue ?? '', `"${(p.notes||'').replace(/"/g,'""')}"`
    ].join(','));
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `deepony-collection-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    Toast.show('CSV exported 📊');
  },
  import(text) {
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) throw new Error('empty');
    let added = 0;
    for (let i = 1; i < lines.length; i++) {
      const cols = Csv._parseLine(lines[i]);
      if (!cols[0]) continue;
      S.ponies.push(normalizePony({
        id: uid(), name: cols[0], generation: parseInt(cols[1]) || 4, type: cols[2] || 'mlp',
        colour: cols[3] || '', size: cols[4] || 'standard', shelf: cols[5] || 'Shelf 1',
        condition: cols[6] || 'good', isOriginal: cols[7] !== '0',
        purchaseValue: cols[8] ? parseFloat(cols[8]) : null,
        estimatedValue: cols[9] ? parseFloat(cols[9]) : null,
        notes: cols[10] || '', photos: [], isFavourite: false, isMostPlayed: false,
        acquiredDate: '', createdAt: Date.now()
      }));
      added++;
    }
    Store.save();
    Render.all();
    Toast.show(`Imported ${added} ponies from CSV ✨`);
  },
  _parseLine(line) {
    const out = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQ = !inQ; continue; }
      if (c === ',' && !inQ) { out.push(cur); cur = ''; continue; }
      cur += c;
    }
    out.push(cur);
    return out;
  }
};

const Backup = {
  export() {
    const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `deepony-backup-${new Date().toISOString().slice(0,10)}.deepony`;
    a.click();
    URL.revokeObjectURL(a.href);
    Toast.show('Backup downloaded 💾');
  },
  import(file) {
    if (!file) return;
    ParentGate.run('Import backup', () => {
      const r = new FileReader();
      r.onload = () => {
        try {
          const data = JSON.parse(r.result);
          if (window.Excellence) {
            const v = Excellence.validateBackup(data);
            if (!v.ok) throw new Error(v.err || 'invalid');
          } else if (!data.ponies && !data.wishlist) throw new Error('invalid');
          S = {
            ...S, ...data,
            settings: {
              collectorMode: false, darkMode: false, hapticsEnabled: true,
              parentPinEnabled: false, parentPinHash: null,
              ...(data.settings || {}),
            },
            ponies: (data.ponies || []).map(normalizePony),
            unlockedAchievements: data.unlockedAchievements || [],
            onboardingDone: true,
          };
          Store.save();
          Theme.apply();
          document.getElementById('onboard').classList.add('hide');
          document.getElementById('app').style.display = 'flex';
          Render.all();
          Confetti.burst();
          Haptic.success();
          Achievements.checkAll(true);
          Toast.show('Collection restored! 🦄');
        } catch (err) {
          Toast.show(err?.message && err.message !== 'invalid' ? err.message : 'Could not read backup file');
        }
      };
      r.readAsText(file);
    });
  }
};

const Photo = {
  async compress(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        const img = new Image();
        img.onload = () => {
          let w = img.width, h = img.height;
          const max = 800;
          if (w > max) { h = h * max / w; w = max; }
          const draw = (quality) => {
            const c = document.createElement('canvas');
            c.width = w; c.height = h;
            c.getContext('2d').drawImage(img, 0, 0, w, h);
            const url = c.toDataURL('image/jpeg', quality);
            if (url.length > 680000 && quality > 0.4) draw(quality - 0.15);
            else resolve(url);
          };
          draw(0.85);
        };
        img.onerror = reject;
        img.src = r.result;
      };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }
};

const Toast = {
  show(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(Toast._tm);
    Toast._tm = setTimeout(() => t.classList.remove('show'), 2600);
  }
};

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

const ParentGate = {
  _pending: null,
  _setupPin: '',
  isEnabled() { return !!(S.settings?.parentPinEnabled && S.settings?.parentPinHash); },
  verify(pin) { return pinHash(String(pin || '')) === S.settings.parentPinHash; },
  run(label, fn) {
    if (!this.isEnabled()) { fn(); return; }
    this._pending = fn;
    this._openSheet('verify', label);
  },
  setup() {
    this._setupPin = '';
    this._openSheet('setup', 'Set Parent PIN');
  },
  disable() {
    this.run('Remove parent lock', () => {
      S.settings.parentPinEnabled = false;
      S.settings.parentPinHash = null;
      Store.save();
      Render.settings();
      Toast.show('Parent lock removed');
    });
  },
  _openSheet(mode, title) {
    const E = Render.esc;
    const sub = mode === 'setup'
      ? (ParentGate._setupPin ? 'Confirm your PIN' : 'Choose a 4–6 digit PIN for export & delete')
      : (mode === 'confirm' ? 'Confirm your PIN' : E(title || 'Parent PIN required'));
    UI.openSheet(`${Render.sheetHdr('🔒 Parent Lock', 'ParentGate.cancel()')}
      <div class="pin-sheet">
        <p class="pin-sub">${sub}</p>
        <label class="fl" for="pinInput">PIN</label>
        <input type="password" id="pinInput" class="inp pin-inp" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" aria-label="Parent PIN" onkeydown="if(event.key==='Enter')ParentGate.submitPin()">
        <p class="pin-hint">Parents only — keeps little hands from deleting your collection</p>
        <div class="form-actions">
          <button type="button" class="btn-g" onclick="ParentGate.cancel()">Cancel</button>
          <button type="button" class="btn-p" onclick="ParentGate.submitPin()">Continue</button>
        </div>
      </div>`);
    setTimeout(() => {
      const el = document.getElementById('pinInput');
      if (el) { el.value = ''; el.focus(); }
    }, 120);
    ParentGate._mode = mode;
  },
  cancel() {
    ParentGate._pending = null;
    ParentGate._setupPin = '';
    ParentGate._mode = null;
    UI.closeSheet();
  },
  submitPin() {
    const pin = document.getElementById('pinInput')?.value?.trim() || '';
    const mode = ParentGate._mode;
    if (mode === 'setup' || mode === 'confirm') {
      if (pin.length < 4) { Toast.show('PIN must be at least 4 digits'); return; }
      if (!ParentGate._setupPin) {
        ParentGate._setupPin = pin;
        ParentGate._openSheet('confirm', 'Confirm PIN');
        return;
      }
      if (pin !== ParentGate._setupPin) {
        Toast.show('PINs did not match — try again');
        ParentGate._setupPin = '';
        ParentGate._openSheet('setup', 'Set Parent PIN');
        return;
      }
      S.settings.parentPinEnabled = true;
      S.settings.parentPinHash = pinHash(pin);
      Store.save();
      ParentGate._setupPin = '';
      UI.closeSheet();
      Render.settings();
      Toast.show('Parent lock enabled 🔒');
      return;
    }
    if (mode === 'verify') {
      if (!ParentGate.verify(pin)) {
        Toast.show('Wrong PIN — ask a parent 🔒');
        const el = document.getElementById('pinInput');
        if (el) { el.value = ''; el.focus(); }
        return;
      }
      const fn = ParentGate._pending;
      ParentGate._pending = null;
      UI.closeSheet();
      if (fn) fn();
    }
  },
};

const Achievements = {
  defs: [
    { id: 'first', ic: '🏆', t: 'First Pony!', test: () => S.ponies.length >= 1 },
    { id: 'g1fan', ic: '💜', t: 'Generation 1 Fan — 5+ G1', test: () => S.ponies.filter(p => p.generation === 1).length >= 5 },
    { id: 'rainbow', ic: '🌈', t: 'Rainbow Collector — 1 of each gen', test: () => [1, 2, 3, 4, 5].every(g => S.ponies.some(p => p.generation === g)) },
    { id: 'lover', ic: '❤️', t: 'Pony Lover — 10+ favourites', test: () => S.ponies.filter(p => p.isFavourite).length >= 10 },
    { id: 'shelf', ic: '📚', t: 'Shelf Master — 3+ shelves', test: () => new Set(S.ponies.map(p => p.shelf).filter(Boolean)).size >= 3 },
    { id: 'big50', ic: '🌟', t: 'Big Collection — 50+ ponies', test: () => S.ponies.length >= 50 },
    { id: 'big100', ic: '💎', t: 'Serious Collector — 100+ ponies', test: () => S.ponies.length >= 100 },
    { id: 'big250', ic: '👑', t: 'Pony Royalty — 250+ ponies', test: () => S.ponies.length >= 250 },
    { id: 'wish5', ic: '💫', t: 'Dreamer — 5+ wishlist items', test: () => S.wishlist.length >= 5 },
  ],
  checkAll(silent) {
    const fresh = [];
    this.defs.forEach(a => {
      if (!a.test() || S.unlockedAchievements.includes(a.id)) return;
      S.unlockedAchievements.push(a.id);
      fresh.push(a);
    });
    if (fresh.length) {
      Store.save();
      if (!silent && !S.settings?.collectorMode) {
        Confetti.burst();
        Haptic.success();
        Toast.show(`Unlocked: ${fresh.map(x => x.t).join(' · ')} 🎉`);
      }
    }
    return fresh;
  },
};

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
  maybeShow() {
    if (localStorage.getItem('deepony_install_dismiss')) return;
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
  },
  dismiss() {
    localStorage.setItem('deepony_install_dismiss', '1');
    document.getElementById('installHint').classList.remove('show');
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

const OB = {
  next(n) {
    ['ob1','ob2','ob3'].forEach((id,i) => {
      document.getElementById(id).style.display = (i+1)===n ? 'block' : 'none';
    });
    Haptic.tap();
    if (n===3) Confetti.burst();
  },
  back(n) {
    OB.next(n);
  },
  finish(skipAdd) {
    S.collector.name = document.getElementById('obName').value.trim() || 'Collector';
    S.collector.since = document.getElementById('obSince').value || '';
    S.onboardingDone = true;
    Store.save();
    document.getElementById('onboard').classList.add('hide');
    document.getElementById('app').style.display = 'flex';
    Confetti.burst();
    Render.all();
    Install.maybeShow();
    if (!skipAdd) UI.openAdd();
    else Toast.show('Welcome to your stable! 🦄');
  }
};

const Confetti = {
  burst() {
    if (S.settings?.collectorMode) return;
    const w = document.getElementById('confetti');
    const colors = ['#FF6B9D','#C084FC','#FCD34D','#6EE7B7','#93C5FD'];
    for (let i = 0; i < 40; i++) {
      const d = document.createElement('div');
      d.className = 'confetti';
      d.style.left = Math.random()*100+'%';
      d.style.top = '-10px';
      d.style.background = colors[i%colors.length];
      d.style.animationDelay = (Math.random()*0.8)+'s';
      d.style.animationDuration = (2+Math.random()*2)+'s';
      w.appendChild(d);
      setTimeout(() => d.remove(), 5000);
    }
  }
};

const Nav = {
  go(tab) {
    if (tab === 'collection') tab = 'logs';
    if (tab === 'shelves') tab = 'map';
    Haptic.tap();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('on'));
    document.getElementById('tab-'+tab).classList.add('on');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('on', b.dataset.tab===tab));
    const gear = document.querySelector('.app-settings-btn');
    if (gear) gear.hidden = tab === 'settings';
    Render.all();
  },
  goLog(section) {
    if (section) logFilter.logSection = section;
    Nav.go('logs');
  }
};

const Render = {
  all() {
    const on = document.querySelector('.screen.on')?.id?.replace('tab-','');
    if (on==='stable') this.stable();
    if (on==='logs' || on==='collection') this.logs();
    if (on==='wishlist') this.wishlist();
    if (on==='map' || on==='shelves') this.ponyMap();
    if (on==='stats') this.stats();
    if (on==='accessories') this.accessoryGallery();
    if (on==='settings') this.settings();
  },
  esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); },
  sheetHdr(title, closeFn) {
    return `<div class="sheet-hdr"><h2 id="sheetTitle">${title}</h2><button type="button" class="sheet-close" aria-label="Close" onclick="event.stopPropagation();${closeFn}">✕</button></div>`;
  },
  ponyCard(p, mini) {
    const g = GEN_COLORS[p.generation]||'g5';
    const ph = ponyPhoto(p);
    const emoji = GEN_EMOJI[p.generation] || '🦄';
    const cls = mini ? 'mini-card' : 'pony-card pop-in';
    const photoCount = (p.photos?.length || (p.photo ? 1 : 0));
    const openFn = `Excellence.openPassport('${p.id}')`;
    return `<div class="${cls}" role="button" tabindex="0" onclick="${openFn}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();${openFn}}">
      ${ph ? `<div class="pony-img"><img src="${ph}" alt="" loading="lazy"></div>` : `<div class="pony-img" style="background:linear-gradient(135deg,var(--${g}),var(--pink-lighter))">${emoji}</div>`}
      <div class="pony-body">
        <div class="pony-name">${this.esc(p.name)} ${p.isFavourite?'❤️':''}${p.isMostPlayed?'🎮':''}${photoCount>1?` 📷${photoCount}`:''}</div>
        <div class="badges">
          <span class="badge ${g}">${this.esc(ponyBadgeLabel(p))}</span>
          <span class="badge" style="background:var(--pink-light);color:var(--text)">${TYPE_LABELS[p.type]||p.type}</span>
          ${(S.settings?.collectorMode && ponyValue(p)) ? `<span class="badge" style="background:var(--mint);color:#1F2937">$${ponyValue(p)}</span>` : ''}
        </div>
      </div>
    </div>`;
  },
  shelfPonyCard(p) {
    const g = GEN_COLORS[p.generation]||'g5';
    const ph = ponyPhoto(p);
    const emoji = GEN_EMOJI[p.generation] || '🦄';
    const id = p.id;
    return `<div class="mini-card shelf-pony" draggable="true" data-pony-id="${id}"
      ondragstart="UI.shelfDragStart(event,'${id}')" ondragend="UI.shelfDragEnd(event)"
      onclick="UI.openMoveShelf('${id}')">
      <button type="button" class="shelf-move-btn" aria-label="Move ${this.esc(p.name)}" onclick="event.stopPropagation();UI.openMoveShelf('${id}')">↕</button>
      ${ph ? `<div class="pony-img"><img src="${ph}" alt="" loading="lazy"></div>` : `<div class="pony-img" style="background:linear-gradient(135deg,var(--${g}),var(--pink-lighter))">${emoji}</div>`}
      <div class="pony-body"><div class="pony-name">${this.esc(p.name)}</div></div>
    </div>`;
  },
  stable() {
    const n = S.ponies.length;
    const name = S.collector.name || 'Collector';
    const gens = [1,2,3,4,5].map(g => ({g, c: S.ponies.filter(p=>p.generation===g).length}));
    const total = n || 1;
    const bars = gens.map(x => `<span style="width:${(x.c/total*100)||0}%;background:var(--g${x.g})"></span>`).join('');
    const pills = gens.map(x => `<button class="pill g${x.g}" onclick="Nav.goLog('g${x.g}')">G${x.g} ${GEN_EMOJI[x.g]} ${x.c}</button>`).join('');
    const otherN = S.ponies.filter(p => (p.category || 'mlp') === 'other').length;
    const mcdN = S.ponies.filter(p => (p.category || '') === 'mcdonalds' || p.mcdCountry).length;
    const extraPills = `${otherN ? `<button class="pill" style="background:var(--coral);color:#fff" onclick="Nav.goLog('other')">🐴 Other ${otherN}</button>` : ''}${mcdN ? `<button class="pill" style="background:#F59E0B;color:#1F2937" onclick="Nav.goLog('mcd')">🍟 McD ${mcdN}</button>` : ''}`;
    const types = TYPE_KEYS.map(t => `<div class="type-card"><span>${TYPE_LABELS[t].split(' ')[0]}</span>${t.replace('_',' ')}<br><strong>${S.ponies.filter(p=>p.type===t).length}</strong></div>`).join('');
    const recent = [...S.ponies].sort((a,b)=>b.createdAt-a.createdAt).slice(0,5);
    const faves = S.ponies.filter(p=>p.isFavourite).slice(0,8);
    const collValue = S.ponies.reduce((s,p) => s + (ponyValue(p) || 0), 0);
    const today = new Date();
    const anniv = S.ponies.filter(p => {
      if (!p.acquiredDate) return false;
      const d = new Date(p.acquiredDate);
      return d.getMonth() === today.getMonth() && d.getDate() === today.getDate() && d.getFullYear() < today.getFullYear();
    });
    const annivHtml = anniv.length
      ? `<div class="card season-sparkle" style="margin-top:14px;border-color:var(--pink)"><div class="section-title">🎂 Collection anniversaries today</div>${anniv.map(p=>`<div style="padding:6px 0">${this.esc(p.name)} · G${p.generation} · ${new Date(p.acquiredDate).getFullYear()}</div>`).join('')}</div>`
      : '';
    const storPct = StorageHealth.pct();
    const backupNudge = storPct >= 75
      ? `<div class="card backup-nudge storage-${StorageHealth.label().level}">
        <div class="section-title">💾 Backup reminder</div>
        <p style="font-size:.85rem;color:var(--text-soft)">Storage is ${storPct}% full — export a backup before adding more photos.</p>
        <button class="btn-g" style="width:100%;margin-top:8px" onclick="ParentGate.run('Export backup',Backup.export)">Export Backup Now</button>
      </div>` : '';
    const goalsHtml = window.collectionGoalProgress ? ['g4_mane6', 'g1_babies'].map(gid => {
      const g = collectionGoalProgress(gid, S.ponies);
      if (!g || !g.total) return '';
      return `<div style="margin:10px 0">
        <div style="display:flex;justify-content:space-between;font-size:.85rem"><span>${g.emoji} ${g.title}</span><strong>${g.have}/${g.total} (${g.pct}%)</strong></div>
        <div class="progress-bar" style="margin-top:6px"><span style="width:${g.pct}%;background:var(--g${g.generation})"></span></div>
        ${g.missing.length ? `<div style="font-size:.75rem;color:var(--text-soft);margin-top:4px">Still need: ${g.missing.map(n => this.esc(n)).join(', ')}</div>` : ''}
      </div>`;
    }).join('') : '';
    document.getElementById('tab-stable').innerHTML = `
      <h1 class="greet">✨ ${this.esc(name)}'s Stable</h1>
      <p class="sub">${n ? `You have ${n} magical ponies! 🎉` : 'Your stable awaits its first pony!'}${collValue ? ` · Est. $${collValue.toLocaleString()}` : ''}</p>
      ${backupNudge}
      ${annivHtml}
      <div class="card">
        <div class="big-num" id="counterNum">0</div>
        <div class="big-label">ponies in your collection</div>
        <div class="progress-bar">${bars}</div>
        <div class="rainbow-note">Rainbow spread across all generations</div>
      </div>
      ${goalsHtml ? `<div class="card"><div class="section-title">Collection goals 🎯</div>${goalsHtml}</div>` : ''}
      ${window.Excellence ? Excellence.suggestionsHtml() : ''}
      <div class="row-scroll">${pills}${extraPills}</div>
      <div class="premium-views">
        <button type="button" class="btn-g" onclick="Nav.goLog('g1')">📋 Generation logs</button>
        <button type="button" class="btn-g" onclick="Nav.go('map')">🗺️ Pony Map</button>
        <button type="button" class="btn-g" onclick="Nav.go('stats')">🌈 Stats</button>
      </div>
      <div class="type-grid">${types}</div>
      ${recent.length?`<div class="section-title">Recently Added 🆕</div><div class="row-scroll">${recent.map(p=>this.ponyCard(p,true)).join('')}</div>`:''}
      ${faves.length?`<div class="section-title">Most Loved 💕</div><div class="row-scroll">${faves.map(p=>this.ponyCard(p,true)).join('')}</div>`:''}
      ${!n ? `<div class="empty"><span>🦄</span><p>Your stable is empty — tap <strong>+</strong> to add a pony, or try a demo collection.</p><button class="btn-p" style="margin-top:12px" onclick="DemoSeed.load()">Try demo collection ✨</button></div>` : ''}`;
    Anim.countUp(document.getElementById('counterNum'), n);
  },
  filteredPonies() {
    let list = [...S.ponies];
    const q = filter.q.toLowerCase();
    if (q) list = list.filter(p => (window.Excellence ? Excellence.matchPony(p, q) : (
      p.name.toLowerCase().includes(q) || (p.colour||'').toLowerCase().includes(q) || (p.shelf||'').toLowerCase().includes(q)
    )));
    const c = filter.chip;
    if (c.startsWith('g')) list = list.filter(p => p.generation === parseInt(c.slice(1)));
    else if (TYPE_KEYS.includes(c)) list = list.filter(p => p.type === c);
    else if (c==='faves') list = list.filter(p => p.isFavourite);
    else if (c==='played') list = list.filter(p => p.isMostPlayed);
    else if (c==='originals') list = list.filter(p => p.isOriginal);
    else if (c==='extras') list = list.filter(p => !p.isOriginal);
    if (filter.sort==='name') list.sort((a,b)=>a.name.localeCompare(b.name));
    else if (filter.sort==='gen') list.sort((a,b)=>a.generation-b.generation||a.name.localeCompare(b.name));
    else if (filter.sort==='recent') list.sort((a,b)=>b.createdAt-a.createdAt);
    else if (filter.sort==='condition') { const o={mint:0,good:1,played:2,loved:3}; list.sort((a,b)=>(o[a.condition]||0)-(o[b.condition]||0)); }
    return list;
  },
  logs() {
    if (!window.CollectorSuite) {
      document.getElementById('tab-logs').innerHTML = '<div class="empty"><span>📋</span><p>Loading logs…</p></div>';
      return;
    }
    const merged = { ...filter, ...logFilter };
    CollectorSuite.renderLogs(document.getElementById('tab-logs'), S, merged, (p) => this.ponyCard(p));
  },
  ponyMap() {
    if (!window.CollectorSuite) return;
    CollectorSuite.renderPonyMap(document.getElementById('tab-map'), S, ponyPhoto);
  },
  collection() { this.logs(); },
  wishlist() {
    const groups = {must:[],want:[],someday:[]};
    S.wishlist.forEach(w => (groups[w.priority]||groups.someday).push(w));
    const renderGroup = (title, key, items) => items.length ? `<div class="section-title">${title}</div>`+
      items.map(w=>{
        const ph = w.photo || (w.photos && w.photos[0]) || '';
        const target = w.targetPrice != null ? `$${Number(w.targetPrice).toLocaleString()}` : '';
        return `<div class="wish-item ${key}">
        ${ph ? `<div class="pony-img" style="height:120px;margin-bottom:10px;border-radius:16px;overflow:hidden"><img src="${ph}" alt="" style="width:100%;height:100%;object-fit:cover"></div>` : ''}
        <div style="font-weight:800;margin-bottom:4px">${this.esc(w.name)} <span class="badge ${GEN_COLORS[w.generation]||'g5'}">G${w.generation}</span>${target ? ` <span class="badge" style="background:var(--mint);color:#1F2937">🎯 ${target}</span>` : ''}</div>
        <div style="font-size:.8rem;color:var(--text-soft);margin-bottom:8px">${TYPE_LABELS[w.type]||w.type} ${w.notes? '· '+this.esc(w.notes):''}</div>
        <div style="display:flex;gap:8px">
          <button class="btn-g" onclick="UI.gotWish('${w.id}')">Got it! 🎉</button>
          <button class="btn-d" onclick="UI.delWish('${w.id}')">Delete</button>
        </div></div>`;
      }).join('') : '';
    document.getElementById('tab-wishlist').innerHTML = `
      <h1 class="greet">💫 My Wishlist</h1>
      <p class="sub">Ponies you dream of having · ${S.wishlist.length} on your list ✨</p>
      <div class="card">
        <div class="fg"><label class="fl">Pony name</label><input class="inp" id="wName" list="wishNames" placeholder="Dream pony name..." oninput="UI.updateWishSuggest(this.value)"></div>
        <datalist id="wishNames"></datalist>
        <div id="wishDbHint" style="font-size:.75rem;color:var(--text-soft);margin:-6px 0 8px"></div>
        <div class="fg"><label class="fl">Generation</label><select class="sel" id="wGen" onchange="UI.updateWishSuggest(document.getElementById('wName').value)">${[1,2,3,4,5].map(g=>`<option value="${g}">G${g}</option>`).join('')}</select></div>
        <div class="fg"><label class="fl">Type</label><select class="sel" id="wType">${TYPE_KEYS.map(t=>`<option value="${t}">${TYPE_LABELS[t]}</option>`).join('')}</select></div>
        <div class="fg"><label class="fl">Priority</label><select class="sel" id="wPri"><option value="must">🔴 Must Have</option><option value="want">🟡 Want</option><option value="someday">🟢 Someday</option></select></div>
        <div class="fg-row">
          <div class="fg"><label class="fl">Target price ($)</label><input class="inp" type="number" step="0.01" id="wTarget" placeholder="optional"></div>
          <div class="fg"><label class="fl">Reference photo</label><input type="file" id="wPhoto" accept="image/*" style="font-size:.75rem"></div>
        </div>
        <div class="fg"><label class="fl">Notes</label><input class="inp" id="wNotes" placeholder="Where to find, etc."></div>
        <button class="btn-p" onclick="UI.addWish()">Add to Wishlist ✨</button>
      </div>
      ${renderGroup('🔴 Must Have','must',groups.must)}
      ${renderGroup('🟡 Want','want',groups.want)}
      ${renderGroup('🟢 Someday','someday',groups.someday)}`;
  },
  shelves() { this.ponyMap(); },
  shelfOrganize() {
    const shelves = {};
    S.ponies.forEach(p => {
      const s = (p.shelf||'').trim() || '__unshelved__';
      if (!shelves[s]) shelves[s] = [];
      shelves[s].push(p);
    });
    const keys = Object.keys(shelves).filter(k=>k!=='__unshelved__').sort();
    let html = `<button type="button" class="btn-g" style="margin-bottom:12px" onclick="Render.ponyMap()">← Back to Pony Map</button>
      <h1 class="greet">🗂️ Organize Shelves</h1><p class="sub">Tap ↕ or drag ponies between shelves</p>`;
    keys.forEach(s => {
      const js = String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
      html += `<div class="shelf-sec shelf-drop" data-shelf="${this.esc(s)}" ondragover="UI.shelfDragOver(event)" ondragleave="UI.shelfDragLeave(event)" ondrop="UI.shelfDrop(event,'${js}')"><div class="shelf-hdr"><span onclick="UI.filterShelf('${js}')">🗄️ ${this.esc(s)} — ${shelves[s].length} ponies</span>
        <span class="shelf-actions">
          <button class="btn-g shelf-btn" onclick="UI.shareShelf('${js}')">Share</button>
          <button class="btn-g shelf-btn" onclick="UI.renameShelf('${js}')">Rename</button>
        </span></div>
        <div class="row-scroll">${shelves[s].map(p=>this.shelfPonyCard(p)).join('')}</div></div>`;
    });
    if (shelves.__unshelved__) {
      html += `<div class="shelf-sec shelf-drop" data-shelf="" ondragover="UI.shelfDragOver(event)" ondragleave="UI.shelfDragLeave(event)" ondrop="UI.shelfDrop(event,'')"><div class="shelf-hdr">📦 Unshelved — ${shelves.__unshelved__.length}</div>
        <div class="row-scroll">${shelves.__unshelved__.map(p=>this.shelfPonyCard(p)).join('')}</div></div>`;
    }
    if (!S.ponies.length) {
      html += `<div class="empty"><span>🗂️</span><p>Set a shelf name when you add or edit a pony.</p></div>`;
    }
    document.getElementById('tab-map').innerHTML = html;
  },
  stats() {
    const n = S.ponies.length;
    const gens = [1,2,3,4,5].map(g=>({g,c:S.ponies.filter(p=>p.generation===g).length}));
    const maxG = gens.reduce((a,b)=>b.c>a.c?b:a,{g:0,c:0});
    const maxBubble = Math.max(...gens.map(x=>x.c),1);
    const types = TYPE_KEYS.map(t=>({t,c:S.ponies.filter(p=>p.type===t).length}));
    const conds = ['mint','good','played','loved'].map(c=>({c,n:S.ponies.filter(p=>p.condition===c).length}));
    const condTotal = conds.reduce((a,x)=>a+x.n,0)||1;
    const orig = S.ponies.filter(p=>p.isOriginal).length;
    const sizes = ['mini','standard','large','extra_large'].map(s=>({s,n:S.ponies.filter(p=>p.size===s).length}));
    const collValue = S.ponies.reduce((s,p) => s + (ponyValue(p) || 0), 0);
    const achs = Achievements.defs.map(a => ({ ...a, ok: a.test() }));
    document.getElementById('tab-stats').innerHTML = `
      <h1 class="greet">🌈 My Stats</h1>
      <div class="stat-grid">
        <div class="stat-box"><div class="n">${n}</div><div class="l">Total Ponies</div></div>
        <div class="stat-box"><div class="n">${S.wishlist.length}</div><div class="l">Wishlist</div></div>
        <div class="stat-box"><div class="n">${S.ponies.filter(p=>p.isFavourite).length}</div><div class="l">Favourites</div></div>
        <div class="stat-box"><div class="n">${(S.accessories||[]).length}</div><div class="l">Accessories</div></div>
        ${collValue ? `<div class="stat-box" style="grid-column:1/-1"><div class="n">$${collValue.toLocaleString()}</div><div class="l">Est. Collection Value</div></div>` : ''}
      </div>
      <div class="card" style="margin-top:14px">
        <div class="section-title">Generation checklist</div>
        ${gens.map(x=>{
          const db = (window.PONY_DB && window.PONY_DB[x.g]) ? window.PONY_DB[x.g].length : 0;
          const owned = new Set(S.ponies.filter(p=>p.generation===x.g).map(p=>p.name.toLowerCase())).size;
          const pct = db ? Math.min(100, Math.round((owned/db)*100)) : 0;
          return `<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;font-size:.85rem"><span>G${x.g} ${GEN_EMOJI[x.g]}</span><strong>${x.c} owned · ${owned} unique names${db ? ` / ~${db} in db` : ''}</strong></div>
            <div class="progress-bar" style="margin-top:6px"><span style="width:${pct}%;background:var(--g${x.g})"></span></div></div>`;
        }).join('')}
      </div>
      <div class="card" style="margin-top:14px">
        <div class="section-title">By Generation</div>
        <div class="bubble-chart">${gens.map(x=>{
          const sz = 50 + (x.c/maxBubble)*70;
          return `<div class="bubble g${x.g}" style="width:${sz}px;height:${sz}px;background:var(--g${x.g});color:${x.g===2||x.g===3||x.g===4?'#1F2937':'#fff'}">G${x.g}<br><strong>${x.c}</strong></div>`;
        }).join('')}</div>
        ${maxG.c?`<p class="rainbow-note">Gen ${maxG.g} is your largest generation! ${GEN_EMOJI[maxG.g]}</p>`:''}
      </div>
      <div class="card">
        <div class="section-title">By Type</div>
        ${types.map(x=>`<div style="display:flex;justify-content:space-between;padding:8px 0"><span>${TYPE_LABELS[x.t]}</span><strong>${x.c} (${n?Math.round(x.c/n*100):0}%)</strong></div>`).join('')}
      </div>
      <div class="card">
        <div class="section-title">Collection Health 💕</div>
        <div class="progress-bar">${conds.map(x=>`<span style="width:${x.n/condTotal*100}%;background:${x.c==='mint'?'var(--mint)':x.c==='good'?'var(--blue)':x.c==='played'?'var(--yellow)':'var(--pink)'}"></span>`).join('')}</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;font-size:.8rem">${conds.map(x=>`${COND_LABELS[x.c]} ${x.n}`).join(' · ')}</div>
        <p style="margin-top:12px;font-size:.85rem">Originals: ${orig} (${n?Math.round(orig/n*100):0}%) · Extras: ${n-orig}</p>
        <p style="font-size:.85rem;margin-top:6px">${sizes.map(x=>`${SIZE_LABELS[x.s]}: ${x.n}`).join(' · ')}</p>
      </div>
      ${window.Excellence ? Excellence.insightsHtml() : ''}
      <div class="premium-views">
        <button type="button" class="btn-g" onclick="Excellence.renderTimeline()">📅 Collection Timeline</button>
        <button type="button" class="btn-g" onclick="Excellence.renderStorybook()">📖 Storybook Mode</button>
      </div>
      <div class="section-title">Achievements</div>
      ${achs.map(a=>`<div class="ach${a.ok?' unlocked':''}"><span class="ic">${a.ic}</span><span>${a.t}</span></div>`).join('')}
      <button class="share-card-btn" onclick="Render.exportShareCard()">🖼️ Save Collection Card (PNG)</button>`;
  },
  exportShareCard() {
    const n = S.ponies.length;
    const collValue = S.ponies.reduce((s,p) => s + (ponyValue(p) || 0), 0);
    const favs = S.ponies.filter(p => p.isFavourite).length;
    const name = S.collector?.name || 'My Collection';
    const canvas = document.createElement('canvas');
    canvas.width = 600; canvas.height = 340;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 600, 340);
    grad.addColorStop(0, '#FFF5F8'); grad.addColorStop(1, '#E9D5FF');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 600, 340);
    ctx.fillStyle = '#EC4899'; ctx.font = 'bold 28px Nunito, sans-serif';
    ctx.fillText('🦄 DeePonyCap', 32, 52);
    ctx.fillStyle = '#1F2937'; ctx.font = 'bold 22px Nunito, sans-serif';
    ctx.fillText(name, 32, 88);
    ctx.font = '16px Nunito, sans-serif'; ctx.fillStyle = '#6B7280';
    ctx.fillText(`${n} ponies · ${favs} favourites · ${S.wishlist.length} wishlist`, 32, 118);
    if (collValue) { ctx.fillStyle = '#9333EA'; ctx.font = 'bold 20px Nunito, sans-serif'; ctx.fillText(`Est. value $${collValue.toLocaleString()}`, 32, 152); }
    [1,2,3,4,5].forEach((g,i) => {
      const c = S.ponies.filter(p => p.generation === g).length;
      const x = 32 + i * 108;
      ctx.fillStyle = ['#9333EA','#86EFAC','#93C5FD','#FDE047','#F9A8D4'][i];
      ctx.beginPath(); ctx.arc(x + 36, 230, 36, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = g === 2 || g === 3 || g === 4 ? '#1F2937' : '#fff';
      ctx.font = 'bold 14px Nunito, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`G${g}`, x + 36, 224); ctx.fillText(String(c), x + 36, 242);
    });
    ctx.textAlign = 'left'; ctx.fillStyle = '#9CA3AF'; ctx.font = '12px Nunito, sans-serif';
    ctx.fillText(new Date().toLocaleDateString(), 32, 310);
    canvas.toBlob(blob => {
      if (!blob) { Toast.show('Could not create image'); return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `deeponycap-stats-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      Toast.show('Collection card saved ✨');
    }, 'image/png');
  },
  accessoryGallery() {
    let items = [...(S.accessories || [])];
    const q = (accFilter.q || '').toLowerCase();
    if (q) items = items.filter(a => (a.name || '').toLowerCase().includes(q) || (a.category || '').includes(q));
    if (accFilter.cat && accFilter.cat !== 'all') items = items.filter(a => (a.category || 'accessory') === accFilter.cat);
    if (accFilter.sort === 'recent') items.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    else if (accFilter.sort === 'linked') items.sort((a, b) => (b.ponyIds?.length || 0) - (a.ponyIds?.length || 0));
    else items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    const total = (S.accessories || []).length;
    const cats = ['all', 'playset', 'vehicle', 'accessory', 'other'];
    const cards = items.map(a => {
      const linked = (a.ponyIds || []).map(id => S.ponies.find(p => p.id === id)).filter(Boolean);
      const ph = a.photo || (a.photos && a.photos[0]) || '';
      return `<div class="card" style="margin-bottom:12px;cursor:pointer" onclick="UI.openAccessory('${a.id}')">
        ${ph ? `<div style="height:140px;border-radius:16px;overflow:hidden;margin-bottom:10px"><img src="${ph}" alt="" style="width:100%;height:100%;object-fit:cover"></div>` : `<div style="height:100px;border-radius:16px;background:linear-gradient(135deg,var(--pink-lighter),var(--purple-light));display:flex;align-items:center;justify-content:center;font-size:2rem;margin-bottom:10px">🎀</div>`}
        <div style="font-weight:800;font-size:1rem">${this.esc(a.name)} <span class="badge" style="font-size:.65rem">${this.esc(a.category || 'accessory')}</span></div>
        ${linked.length ? `<div style="font-size:.8rem;color:var(--text-soft);margin-top:6px">${linked.length} pony${linked.length > 1 ? 'ies' : ''}: ${linked.map(p => `🦄 ${this.esc(p.name)}`).join(' · ')}</div>` : '<div style="font-size:.8rem;color:var(--text-soft);margin-top:6px">No pony linked</div>'}
      </div>`;
    }).join('');
    document.getElementById('tab-accessories').innerHTML = `
      <h1 class="greet">🎀 Extras & Playsets</h1>
      <p class="sub">${total ? `${total} accessories & playsets` : 'Photos of playsets linked to your ponies'}${q || accFilter.cat !== 'all' ? ` · showing ${items.length}` : ''}</p>
      <div class="search-wrap"><input class="search" type="search" aria-label="Search accessories" placeholder="Search accessories..." value="${this.esc(accFilter.q)}" oninput="accFilter.q=this.value;Render.accessoryGallery()"></div>
      <div class="chips">${cats.map(c => `<button type="button" class="chip${accFilter.cat===c?' on':''}" onclick="accFilter.cat='${c}';Render.accessoryGallery()">${c === 'all' ? 'All' : c}</button>`).join('')}</div>
      <div class="sort-row"><label for="accSort" style="white-space:nowrap">Sort</label><select id="accSort" class="sort-select" onchange="accFilter.sort=this.value;Render.accessoryGallery()">
        <option value="name"${accFilter.sort==='name'?' selected':''}>Name</option>
        <option value="recent"${accFilter.sort==='recent'?' selected':''}>Recently added</option>
        <option value="linked"${accFilter.sort==='linked'?' selected':''}>Most linked</option>
      </select></div>
      <div class="card">
        <div class="fg"><label class="fl">Name</label><input class="inp" id="accNameGal" placeholder="e.g. Ponyville Playset"></div>
        <div class="fg"><label class="fl">Category</label><select class="sel" id="accCatGal"><option value="playset">Playset</option><option value="vehicle">Vehicle</option><option value="accessory" selected>Accessory</option><option value="other">Other</option></select></div>
        <div class="fg"><label class="fl">Link to pony</label><select class="sel" id="accPonyGal"><option value="">— none —</option>${S.ponies.map(p => `<option value="${p.id}">${this.esc(p.name)}</option>`).join('')}</select></div>
        <div class="fg"><label class="fl">Photo</label><input type="file" id="accPhotoGal" accept="image/*" capture="environment"></div>
        <button class="btn-p" onclick="UI.addAccessoryFromGallery()">Add Accessory ✨</button>
      </div>
      ${items.length ? cards : '<div class="empty"><span>🎀</span>No extras yet — add one above</div>'}`;
  },
  async settings() {
    await StorageHealth.refreshEstimate();
    const cm = S.settings?.collectorMode;
    const dm = S.settings?.darkMode;
    const hx = S.settings?.hapticsEnabled !== false;
    const pinOn = ParentGate.isEnabled();
    const stor = StorageHealth.label();
    const storPct = StorageHealth.pct();
    const photoWarn = StorageHealth.photoWarning();
    const ver = window.APP_VERSION || '3.0.0';
    document.getElementById('tab-settings').innerHTML = `
      <button type="button" class="btn-g" style="margin-bottom:12px;min-height:44px" onclick="Nav.go('stable')">← Back</button>
      <h1 class="greet">⚙️ Settings</h1>
      <p class="sub">Backup, display & tools</p>
      ${window.AppUpdate ? AppUpdate.settingsHtml() : ''}
      <div class="card">
        <div class="section-title">Personalisation 🎨</div>
        <p style="font-size:.85rem;color:var(--text-soft);margin-bottom:10px">Pick a colourful theme for your private collection log.</p>
        <div class="accent-swatches">${window.CollectorSuite ? CollectorSuite.accentPickerHtml(S.settings?.accentTheme || 'pink', 'Theme.setAccent') : ''}</div>
      </div>
      <div class="card storage-card storage-${stor.level}">
        <div class="section-title">Storage</div>
        <div class="storage-bar"><span style="width:${storPct}%"></span></div>
        <p style="font-size:.85rem;margin-top:8px">${storPct}% used · ${stor.text}</p>
        ${photoWarn ? `<p style="font-size:.8rem;margin-top:8px;color:var(--yellow);font-weight:700">${photoWarn}</p>` : ''}
        <button class="btn-g" style="width:100%;margin-top:8px" onclick="UI.compressAllPhotos()">Compress all photos</button>
      </div>
      <div class="card">
        <div class="section-title">Display</div>
        <div class="setting-row">
          <div><strong>Collector Mode</strong><br><span style="font-size:.8rem;color:var(--text-soft)">Clean catalog view — less sparkle, more data</span></div>
          <button type="button" class="toggle${cm?' on':''}" role="switch" aria-checked="${cm?'true':'false'}" aria-label="Collector mode" onclick="Theme.toggle()">${cm?'ON':'OFF'}</button>
        </div>
        <div class="setting-row">
          <div><strong>Dark Mode</strong><br><span style="font-size:.8rem;color:var(--text-soft)">Easier on eyes at night</span></div>
          <button type="button" class="toggle${dm?' on':''}" role="switch" aria-checked="${dm?'true':'false'}" aria-label="Dark mode" onclick="Theme.toggleDark()">${dm?'ON':'OFF'}</button>
        </div>
      </div>
      <div class="card">
        <div class="section-title">Collector Profile</div>
        <div class="fg"><label class="fl">Name</label><input class="inp" id="setName" value="${this.esc(S.collector.name)}" onchange="S.collector.name=this.value;Store.save()"></div>
        <div class="fg"><label class="fl">Collecting since</label><input class="inp" type="date" id="setSince" value="${S.collector.since||''}" onchange="S.collector.since=this.value;Store.save()"></div>
      </div>
      <div class="card">
        <div class="section-title">Sound & Feel</div>
        <div class="setting-row">
          <div><strong>Haptic feedback</strong><br><span style="font-size:.8rem;color:var(--text-soft)">Gentle vibration on taps & celebrations</span></div>
          <button type="button" class="toggle${hx?' on':''}" role="switch" aria-checked="${hx?'true':'false'}" aria-label="Haptic feedback" onclick="UI.toggleHaptics()">${hx?'ON':'OFF'}</button>
        </div>
      </div>
      <div class="card">
        <div class="section-title">Parent Lock 🔒</div>
        <p style="font-size:.85rem;color:var(--text-soft);margin-bottom:10px">Optional PIN for export, import, and delete — keeps little hands from wiping the collection.</p>
        <p style="font-size:.85rem;margin-bottom:10px">${pinOn ? '🔒 Parent lock is <strong>ON</strong>' : '🔓 No parent lock set'}</p>
        <button class="btn-g" style="width:100%;margin-bottom:8px" onclick="ParentGate.setup()">${pinOn ? 'Change PIN' : 'Set Parent PIN'}</button>
        ${pinOn ? '<button class="btn-d" style="width:100%" onclick="ParentGate.disable()">Remove Parent Lock</button>' : ''}
      </div>
      <div class="card">
        <div class="section-title">Privacy & Safety</div>
        <p style="font-size:.85rem;color:var(--text-soft);margin-bottom:10px">100% on-device — no accounts, no ads, no analytics. Safe for kids.</p>
        <a class="btn-g" style="display:block;text-align:center;text-decoration:none;margin-bottom:8px" href="privacy.html">Privacy Policy</a>
        <a class="btn-g" style="display:block;text-align:center;text-decoration:none" href="changelog.html">What's New</a>
      </div>
      <div class="card">
        <div class="section-title">Try demo</div>
        <p style="font-size:.85rem;color:var(--text-soft);margin-bottom:0">Open with <strong>?demo=1</strong> for a sample collection — your stable is not replaced from Settings.</p>
      </div>
      <div class="card">
        <div class="section-title">Collection tools</div>
        <p style="font-size:.85rem;color:var(--text-soft);margin-bottom:10px">Bulk organize without leaving the app.</p>
        <button class="btn-g" style="width:100%;margin-bottom:8px" onclick="UI.bulkMoveShelf()">Move shelf → shelf</button>
        <button class="btn-g" style="width:100%;margin-bottom:8px" onclick="UI.bulkFavoriteShelf()">Favorite all on a shelf</button>
        <button class="btn-g" style="width:100%;margin-bottom:8px" onclick="UI.bulkArchiveShelf()">Mark shelf as extras (not originals)</button>
        <button class="btn-g" style="width:100%" onclick="document.getElementById('g4BulkSettings').click()">📦 G4 bulk photo import</button>
        <input type="file" id="g4BulkSettings" accept="image/*" multiple style="display:none" onchange="UI.runG4BulkImport([...this.files]);this.value=''">
      </div>
      <div class="card">
        <div class="section-title">Backup & Restore 💾</div>
        <p style="font-size:.85rem;color:var(--text-soft);margin-bottom:12px">Export your full collection to move to a new device. Import merges into this app.</p>
        <button class="btn-p" onclick="ParentGate.run('Export backup',Backup.export)">Export Backup</button>
        <button class="btn-g" style="width:100%;margin-top:10px" onclick="ParentGate.run('Import backup',()=>document.getElementById('importIn').click())">Import Backup</button>
        <input type="file" id="importIn" accept=".deepony,.json,application/json" style="display:none" onchange="if(this.files[0])Backup.import(this.files[0]);this.value=''">
        <button class="btn-g" style="width:100%;margin-top:10px" onclick="ParentGate.run('Export CSV',Csv.export)">Export CSV (no photos)</button>
        <button class="btn-g" style="width:100%;margin-top:10px" onclick="ParentGate.run('Import CSV',()=>document.getElementById('csvIn').click())">Import CSV</button>
        <input type="file" id="csvIn" accept=".csv,text/csv" style="display:none" onchange="UI.importCsv(this.files[0]);this.value=''">
        <button class="btn-g" style="width:100%;margin-top:10px" onclick="UI.restoreRecovery()">Recover auto-snapshot</button>
      </div>
      <div class="card">
        <div class="section-title">About</div>
        <p style="font-size:.85rem;color:var(--text-soft)">DeePonyCap v${ver} · ${S.ponies.length} ponies</p>
        <button class="btn-g" style="margin-top:10px" onclick="if(confirm('Replay onboarding?')){S.onboardingDone=false;Store.save();location.reload()}">Replay Onboarding</button>
      </div>`;
  }
};

const Anim = {
  countUp(el, target) {
    if (!el) return;
    let cur = 0;
    const step = Math.max(1, Math.ceil(target / 30));
    const t = setInterval(() => {
      cur = Math.min(target, cur + step);
      el.textContent = cur;
      if (cur >= target) clearInterval(t);
    }, 30);
  }
};

const UI = {
  openSheet(html) {
    document.getElementById('sheetBody').innerHTML = html;
    document.getElementById('sheetBg').classList.add('on');
    document.getElementById('sheet').classList.add('on');
  },
  closeSheet() {
    document.getElementById('sheetBg').classList.remove('on');
    document.getElementById('sheet').classList.remove('on');
    editingId = null; detailId = null;
  },
  defaultForm(p) {
    const photos = p?.photos?.length ? [...p.photos] : (p?.photo ? [p.photo] : []);
    const category = p?.category || 'mlp';
    return {
      name: p?.name||'', category, generation: p?.generation||4, type: p?.type||'mlp',
      catalogNumber: p?.catalogNumber||'', colour: p?.colour||'', hairColour: p?.hairColour||'',
      cutieMark: p?.cutieMark||'', brand: p?.brand||'', mcdCountry: p?.mcdCountry||'', mcdYear: p?.mcdYear||'',
      size: p?.size||'standard', shelf: p?.shelf||'Shelf 1',
      isOriginal: p?.isOriginal!==false, condition: p?.condition||'good',
      isFavourite: p?.isFavourite||false, isMostPlayed: p?.isMostPlayed||false,
      photos, photo: photos[0]||null, acquiredDate: p?.acquiredDate||'', notes: p?.notes||'',
      purchaseValue: p?.purchaseValue ?? null, estimatedValue: p?.estimatedValue ?? null
    };
  },
  nameDatalist(gen, q) {
    if (!window.ponyNameSuggestions) return '';
    return window.ponyNameSuggestions(gen, q).map(n=>`<option value="${Render.esc(n)}">`).join('');
  },
  openAdd(prefill) {
    editingId = null;
    formState = this.defaultForm(prefill);
    if (!prefill && logFilter.logSection) {
      const sec = logFilter.logSection;
      if (sec.startsWith('g')) formState = { ...formState, category: 'mlp', generation: parseInt(sec.slice(1), 10) };
      else if (sec === 'other') formState = { ...formState, category: 'other', type: 'other_brand' };
      else if (sec === 'mcd') formState = { ...formState, category: 'mcdonalds', type: 'mcdonalds' };
    }
    this.renderForm('Add Pony 🦄');
  },
  openEdit(id) {
    const p = S.ponies.find(x=>x.id===id);
    if (!p) return;
    editingId = id;
    formState = this.defaultForm(p);
    this.renderForm('Edit Pony');
  },
  renderForm(title) {
    const f = formState;
    const cat = f.category || 'mlp';
    const catOpts = Object.keys(CATEGORY_LABELS).map(c =>
      `<button type="button" class="opt${cat===c?' on':''}" onclick="UI.setForm('category','${c}')">${CATEGORY_LABELS[c]}</button>`
    ).join('');
    const gOpts = [1,2,3,4,5].map(g=>`<button type="button" class="opt g${g}${f.generation===g?' on':''}" onclick="UI.setForm('generation',${g})">G${g}</button>`).join('');
    const tOpts = TYPE_KEYS.map(t=>`<button type="button" class="opt${f.type===t?' on':''}" onclick="UI.setForm('type','${t}')">${TYPE_LABELS[t]}</button>`).join('');
    const sOpts = ['mini','standard','large','extra_large'].map(s=>`<button type="button" class="opt${f.size===s?' on':''}" onclick="UI.setForm('size','${s}')">${SIZE_LABELS[s]}</button>`).join('');
    const cOpts = Object.keys(COND_LABELS).map(c=>`<button type="button" class="opt${f.condition===c?' on':''}" onclick="UI.setForm('condition','${c}')">${COND_LABELS[c]}</button>`).join('');
    const shelfList = [...new Set([...SHELF_SUGGEST, ...S.ponies.map(p=>p.shelf).filter(Boolean)])].map(s=>`<option value="${Render.esc(s)}"${f.shelf===s?' selected':''}>`).join('');
    const mcdCountries = (window.CollectorSuite?.MCD_COUNTRIES || ['USA','UK','Canada','Other']).map(c =>
      `<option value="${c}"${f.mcdCountry===c?' selected':''}>${c}</option>`).join('');
    const photos = f.photos || [];
    const photoGrid = photos.map((ph,i)=>`<div class="photo-thumb${i===0?' primary':''}" onclick="UI.setPrimaryPhoto(${i})"><img src="${ph}" alt=""><button type="button" class="photo-rm" onclick="event.stopPropagation();UI.removePhoto(${i})">✕</button></div>`).join('');
    const mlpFields = cat === 'mlp' ? `
      <div class="fg"><label class="fl">Generation</label><div class="sel-row">${gOpts}</div></div>
      <div class="fg"><label class="fl">Type</label><div class="sel-row">${tOpts}</div></div>` : '';
    const otherFields = cat === 'other' ? `
      <div class="fg"><label class="fl">Brand name</label><input class="inp" value="${Render.esc(f.brand)}" placeholder="e.g. Lisa Frank, Schleich…" oninput="formState.brand=this.value"></div>
      <div class="fg"><label class="fl">Type</label><div class="sel-row">${tOpts}</div></div>` : '';
    const mcdFields = cat === 'mcdonalds' ? `
      <div class="fg-row">
        <div class="fg"><label class="fl">Country</label><select class="sel" onchange="formState.mcdCountry=this.value">${mcdCountries}</select></div>
        <div class="fg"><label class="fl">Release year</label><input class="inp" type="number" min="1980" max="2030" value="${Render.esc(f.mcdYear)}" placeholder="e.g. 2012" oninput="formState.mcdYear=this.value"></div>
      </div>` : '';
    this.openSheet(`${Render.sheetHdr(title, 'UI.closeSheet()')}
      <div class="photo-row">${photoGrid}<div class="photo-upload small" onclick="document.getElementById('photoIn').click()">${photos.length?'+':'📸'}</div></div>
      <input type="file" id="photoIn" accept="image/*" capture="environment" style="display:none" onchange="UI.onPhoto(event)" multiple>
      ${cat === 'mlp' && f.generation === 4 ? `<div class="g4-bulk-panel"><label><input type="file" id="g4BulkIn" accept="image/*" multiple style="display:none" onchange="UI.onG4Bulk(event)"><span onclick="document.getElementById('g4BulkIn').click()">📦 G4 bulk photo import</span></label><p style="margin:6px 0 0;font-size:.75rem;color:var(--text-soft)">Select multiple G4 photos — matches names from filenames or creates new ponies.</p></div>` : ''}
      <p class="photo-hint">${photos.length?`${photos.length} photo(s) — tap star photo to set primary`:'Tap to add photos (up to 5)'}</p>
      <div class="fg"><label class="fl">Category</label><div class="sel-row">${catOpts}</div></div>
      <div class="fg"><label class="fl">Log number</label><input class="inp" value="${Render.esc(f.catalogNumber)}" placeholder="Your collection # (optional)" oninput="formState.catalogNumber=this.value"></div>
      <div class="fg"><label class="fl">Name *</label><input class="inp" list="ponyNames" value="${Render.esc(f.name)}" oninput="formState.name=this.value;UI.refreshNameList()"><datalist id="ponyNames">${this.nameDatalist(f.generation, f.name)}</datalist></div>
      ${mlpFields}${otherFields}${mcdFields}
      <div class="fg-row">
        <div class="fg"><label class="fl">Body colour</label><input class="inp" value="${Render.esc(f.colour)}" placeholder="Pink with purple mane" oninput="formState.colour=this.value"></div>
        <div class="fg"><label class="fl">Hair colour</label><input class="inp" value="${Render.esc(f.hairColour)}" placeholder="Purple, rainbow…" oninput="formState.hairColour=this.value"></div>
      </div>
      <div class="fg"><label class="fl">Size</label><div class="sel-row">${sOpts}</div></div>
      <div class="fg"><label class="fl">Cutie mark</label><input class="inp" value="${Render.esc(f.cutieMark)}" placeholder="Stars, balloons, or none" oninput="formState.cutieMark=this.value"></div>
      <div class="fg"><label class="fl">Shelf / divider location</label><input class="inp" list="shelfDL" value="${Render.esc(f.shelf)}" oninput="formState.shelf=this.value"><datalist id="shelfDL">${shelfList}</datalist></div>
      <div class="fg"><label class="fl">Original or Extra</label><div class="toggle-row">
        <button type="button" class="opt${f.isOriginal?' on':''}" onclick="UI.setForm('isOriginal',true)">Original ✓</button>
        <button type="button" class="opt${!f.isOriginal?' on':''}" onclick="UI.setForm('isOriginal',false)">Extra 📦</button></div></div>
      <div class="fg"><label class="fl">Condition</label><div class="sel-row">${cOpts}</div></div>
      <div class="fg"><label class="fl">Favourite?</label><div class="toggle-row">
        <button type="button" class="opt${f.isFavourite?' on':''}" onclick="UI.setForm('isFavourite',true)">❤️ Yes</button>
        <button type="button" class="opt${!f.isFavourite?' on':''}" onclick="UI.setForm('isFavourite',false)">No</button></div></div>
      <div class="fg"><label class="fl">Most Played?</label><div class="toggle-row">
        <button type="button" class="opt${f.isMostPlayed?' on':''}" onclick="UI.setForm('isMostPlayed',true)">🎮 Yes</button>
        <button type="button" class="opt${!f.isMostPlayed?' on':''}" onclick="UI.setForm('isMostPlayed',false)">No</button></div></div>
      <div class="fg"><label class="fl">Year acquired</label><input class="inp" type="date" value="${f.acquiredDate}" oninput="formState.acquiredDate=this.value"></div>
      <div class="fg-row">
        <div class="fg"><label class="fl">Paid ($)</label><input class="inp" type="number" step="0.01" value="${f.purchaseValue??''}" placeholder="optional" oninput="formState.purchaseValue=this.value?parseFloat(this.value):null"></div>
        <div class="fg"><label class="fl">Est. value ($)</label><input class="inp" type="number" step="0.01" value="${f.estimatedValue??''}" placeholder="optional" oninput="formState.estimatedValue=this.value?parseFloat(this.value):null"></div>
      </div>
      <div class="fg"><label class="fl">Notes</label><textarea class="ta" oninput="formState.notes=this.value">${Render.esc(f.notes)}</textarea></div>
      <div id="dupWarn"></div>
      <div class="form-actions">
        <button class="btn-g" onclick="UI.closeSheet()">Cancel</button>
        <button class="btn-p" onclick="UI.savePony()">Save Pony ✨</button>
      </div>`);
    setTimeout(() => UI.showDupWarn(), 0);
  },
  refreshNameList() {
    const dl = document.getElementById('ponyNames');
    if (dl) dl.innerHTML = this.nameDatalist(formState.generation, formState.name);
    this.showDupWarn();
  },
  showDupWarn() {
    const el = document.getElementById('dupWarn');
    if (!el) return;
    const dup = findDuplicate(formState.name, formState.generation, editingId);
    const similar = findSimilarPonies(formState.name, formState.generation, editingId);
    const inDb = window.ponyNameInDb ? ponyNameInDb(formState.generation, formState.name) : true;
    const nameTrim = (formState.name || '').trim();
    let html = '';
    if (dup) html += `<p class="dup-warn">⚠️ You already have <strong>${Render.esc(dup.name)}</strong> (G${dup.generation}) on ${Render.esc(dup.shelf||'unshelved')}</p>`;
    if (nameTrim.length >= 2 && !inDb) html += `<p class="dup-warn" style="background:#EDE9FE;color:#5B21B6">💡 "${Render.esc(nameTrim)}" isn't in our G${formState.generation} name list — custom names are OK!</p>`;
    if (similar.length) {
      html += `<div class="dup-variant">Similar in your collection: ${similar.map(p =>
        `<button type="button" onclick="UI.openDetail('${p.id}');UI.closeSheet()">${Render.esc(p.name)}</button>`
      ).join(' · ')}</div>`;
    }
    el.innerHTML = html;
  },
  async onG4Bulk(e) {
    const files = [...(e.target.files || [])];
    e.target.value = '';
    if (!files.length) return;
    if (editingId || (formState.name || '').trim()) {
      await this.onPhoto({ target: { files } });
      Toast.show(`Added ${Math.min(files.length, 5 - (formState.photos?.length || 0))} photo(s) to this pony`);
      return;
    }
    await this.runG4BulkImport(files);
  },
  async runG4BulkImport(files) {
    let created = 0, updated = 0, skipped = 0;
    Toast.show(`Importing ${files.length} G4 photo(s)…`);
    for (const file of files) {
      let url;
      try { url = await Photo.compress(file); } catch { skipped++; continue; }
      const guessed = guessNameFromFile(file.name);
      const match = matchG4PonyByName(guessed);
      if (match && match.id) {
        const photos = [...(match.photos || []), url].slice(0, 5);
        S.ponies = S.ponies.map(p => p.id === match.id ? normalizePony({ ...p, photos }) : p);
        updated++;
      } else {
        const name = (match && match.suggestName) || guessed || `G4 Import ${created + 1}`;
        S.ponies.push(normalizePony({
          id: uid(), name, generation: 4, type: 'mlp', colour: '', size: 'standard',
          shelf: 'Shelf 1', isOriginal: true, condition: 'good', isFavourite: false, isMostPlayed: false,
          photos: [url], photo: url, acquiredDate: new Date().toISOString().slice(0, 10),
          notes: 'Imported via G4 bulk', createdAt: Date.now(),
        }));
        created++;
      }
    }
    Store.save();
    this.closeSheet();
    Render.all();
    Achievements.checkAll(false);
    if (created || updated) { Confetti.burst(); Haptic.success(); }
    Toast.show(`G4 bulk: ${created} new · ${updated} updated${skipped ? ` · ${skipped} skipped` : ''} ✨`);
  },
  updateWishSuggest(q) {
    const dl = document.getElementById('wishNames');
    const gen = parseInt(document.getElementById('wGen')?.value || 4);
    if (dl && window.ponyNameSuggestions) dl.innerHTML = window.ponyNameSuggestions(gen, q).map(n=>`<option value="${n}">`).join('');
    const hint = document.getElementById('wishDbHint');
    if (hint && window.ponyNameInDb) {
      const name = (q || '').trim();
      if (name.length >= 2 && !ponyNameInDb(gen, name)) hint.textContent = `💡 Custom name — not in our G${gen} list (that's OK!)`;
      else hint.textContent = name.length >= 2 ? '✓ Known pony name' : '';
    }
  },
  setForm(k,v) { formState[k]=v; if (k==='generation') this.refreshNameList(); this.renderForm(editingId?'Edit Pony':'Add Pony 🦄'); },
  async onPhoto(e) {
    const files = [...(e.target.files || [])];
    if (!files.length) return;
    const max = 5;
    for (const file of files.slice(0, max - (formState.photos?.length || 0))) {
      try {
        const url = await Photo.compress(file);
        formState.photos = formState.photos || [];
        formState.photos.push(url);
      } catch {}
    }
    formState.photo = formState.photos[0] || null;
    this.renderForm(editingId?'Edit Pony':'Add Pony 🦄');
  },
  setPrimaryPhoto(i) {
    const ph = formState.photos;
    if (!ph?.[i]) return;
    const [p] = ph.splice(i, 1);
    ph.unshift(p);
    formState.photo = ph[0];
    this.renderForm(editingId?'Edit Pony':'Add Pony 🦄');
  },
  removePhoto(i) {
    formState.photos.splice(i, 1);
    formState.photo = formState.photos[0] || null;
    this.renderForm(editingId?'Edit Pony':'Add Pony 🦄');
  },
  savePony() {
    if (!formState.name.trim()) { Toast.show('Name is required 💕'); return; }
    const dup = findDuplicate(formState.name, formState.generation, editingId);
    if (dup && !editingId && !confirm(`You already have "${dup.name}" on ${dup.shelf||'unshelved'}. Add anyway?`)) return;
    const pony = normalizePony({
      ...formState, id: editingId||uid(), name: formState.name.trim(),
      createdAt: editingId?(S.ponies.find(p=>p.id===editingId)?.createdAt||Date.now()):Date.now()
    });
    if (editingId) S.ponies = S.ponies.map(p=>p.id===editingId?pony:p);
    else S.ponies.push(pony);
    Store.save(); this.closeSheet(); Render.all(); Toast.show(editingId ? 'Pony updated ✨' : 'New pony added 🦄');
    if (!editingId) { Confetti.burst(); Haptic.success(); }
    Achievements.checkAll(false);
  },
  detailPhotoPlaceholder(p) {
    const g = GEN_COLORS[p.generation] || 'g5';
    const emoji = GEN_EMOJI[p.generation] || '🦄';
    return `<div class="detail-photo detail-photo-gen g${p.generation}" style="background:linear-gradient(135deg,var(--${g}),var(--pink-lighter))" onclick="document.getElementById('photoIn2').click()">${emoji}</div>`;
  },
  openDetail(id) {
    const p = S.ponies.find(x=>x.id===id);
    if (!p) return;
    detailId = id;
    const photos = p.photos?.length ? p.photos : (p.photo ? [p.photo] : []);
    const gallery = photos.length
      ? `<div class="detail-gallery">${photos.map((ph,i)=>`<img src="${ph}" class="detail-photo${i===0?' main':''}" onclick="UI.openDetailPhoto(${i})" alt="">`).join('')}</div>`
      : this.detailPhotoPlaceholder(p);
    const comps = (p.soldComps || []).slice(-5).reverse();
    const compHtml = S.settings?.collectorMode ? `
      <div class="section-title" style="margin-top:12px">Market comps ($)</div>
      ${comps.length ? comps.map(c => `<div class="detail-row"><span>${c.source || 'Manual'} · ${c.date || '—'}</span><span>$${Number(c.amount).toLocaleString()}</span></div>`).join('') : '<p style="font-size:.85rem;color:var(--text-soft)">No sold comps logged yet</p>'}
      <button class="btn-g" style="width:100%;margin-top:8px" onclick="UI.addSoldComp('${id}')">+ Log sold comp</button>` : '';
    this.openSheet(`${Render.sheetHdr(Render.esc(p.name), 'UI.closeSheet()')}
      ${gallery}
      <input type="file" id="photoIn2" accept="image/*" style="display:none" onchange="UI.onDetailPhoto(event)">
      ${[['Generation',`G${p.generation} ${GEN_EMOJI[p.generation]}`],['Type',TYPE_LABELS[p.type]],['Colour',p.colour],['Size',SIZE_LABELS[p.size]],['Shelf',p.shelf||'—'],['Original',p.isOriginal?'Yes':'Extra'],['Condition',COND_LABELS[p.condition]],['Paid',p.purchaseValue!=null?`$${p.purchaseValue}`:'—'],['Est. Value',p.estimatedValue!=null?`$${p.estimatedValue}`:'—'],['Favourite',p.isFavourite?'❤️':'—'],['Most Played',p.isMostPlayed?'🎮':'—'],['Acquired',p.acquiredDate||'—'],['Notes',p.notes||'—']].map(([k,v])=>`<div class="detail-row"><span>${k}</span><span>${Render.esc(String(v))}</span></div>`).join('')}
      ${compHtml}
      <div class="detail-actions">
        <button class="btn-p" onclick="UI.openEdit('${id}')">Edit</button>
        <button class="btn-g" onclick="UI.sharePony('${id}')">Share</button>
        <button class="btn-d" onclick="UI.deletePony('${id}')">Delete</button>
      </div>`);
  },
  openDetailPhoto(i) {
    const p = S.ponies.find(x=>x.id===detailId);
    if (!p?.photos?.[i]) return;
    const ph = p.photos[i];
    this.openSheet(`${Render.sheetHdr('Photo', "UI.openDetail('"+detailId+"')")}
      <img src="${ph}" style="width:100%;border-radius:var(--r);margin-bottom:12px" alt="">`);
  },
  sharePony(id) {
    const p = S.ponies.find(x=>x.id===id);
    if (!p) return;
    const text = `🦄 ${p.name} — G${p.generation} ${TYPE_LABELS[p.type]} · ${p.colour||'My pony'} · DeePonyCap`;
    if (navigator.share) navigator.share({ title: p.name, text }).catch(()=>{});
    else { navigator.clipboard.writeText(text).then(()=>Toast.show('Copied to clipboard ✨')); }
  },
  shareShelf(shelfName) {
    const list = S.ponies.filter(p => (p.shelf || '').trim() === shelfName);
    if (!list.length) return;
    const preview = list.slice(0, 10).map(p => p.name).join(', ');
    const more = list.length > 10 ? ` +${list.length - 10} more` : '';
    const text = `🗄️ ${shelfName} (${list.length} ponies): ${preview}${more} · DeePonyCap`;
    if (navigator.share) navigator.share({ title: `${shelfName} shelf`, text }).catch(()=>{});
    else { navigator.clipboard.writeText(text).then(()=>Toast.show('Shelf copied to clipboard ✨')); }
  },
  renameShelf(oldName) {
    const n = prompt('New shelf name:', oldName);
    if (!n || !n.trim()) return;
    const nn = n.trim();
    S.ponies.forEach(p => { if ((p.shelf||'').trim() === oldName) p.shelf = nn; });
    Store.save(); Render.shelves(); Toast.show('Shelf renamed ✨');
  },
  _shelfDragId: null,
  shelfDragStart(e, id) {
    this._shelfDragId = id;
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('dragging');
  },
  shelfDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.shelf-drop.drag-over').forEach(el => el.classList.remove('drag-over'));
    this._shelfDragId = null;
  },
  shelfDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
  },
  shelfDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
  },
  shelfDrop(e, shelfName) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const id = e.dataTransfer.getData('text/plain') || this._shelfDragId;
    if (!id) return;
    this.movePonyToShelf(id, shelfName);
  },
  movePonyToShelf(id, shelfName) {
    const p = S.ponies.find(x => x.id === id);
    if (!p) return;
    const ns = (shelfName || '').trim();
    const cur = (p.shelf || '').trim();
    if (cur === ns) return;
    p.shelf = ns;
    Store.save();
    Render.shelves();
    Toast.show(ns ? `Moved to ${ns} 🗄️` : 'Moved to unshelved 📦');
    Haptic.tap();
  },
  openMoveShelf(id) {
    const p = S.ponies.find(x => x.id === id);
    if (!p) return;
    const shelves = [...new Set(S.ponies.map(x => (x.shelf || '').trim()).filter(Boolean))];
    const cur = (p.shelf || '').trim();
    const btns = [
      ...shelves.filter(s => s !== cur).map(s => {
        const js = String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        return `<button type="button" class="btn-g" onclick="UI.movePonyToShelf('${id}','${js}');UI.closeSheet()">🗄️ ${Render.esc(s)}</button>`;
      }),
      cur ? `<button type="button" class="btn-g" onclick="UI.movePonyToShelf('${id}','');UI.closeSheet()">📦 Unshelved</button>` : '',
      `<button type="button" class="btn-g" onclick="UI.promptNewShelf('${id}')">+ New shelf…</button>`
    ].filter(Boolean).join('');
    this.openSheet(`${Render.sheetHdr(`Move ${Render.esc(p.name)}`, 'UI.closeSheet()')}
      <p class="pin-sub">Tap a shelf or drag ponies on the Shelves tab</p>
      <div class="shelf-move-list">${btns || '<p style="font-size:.85rem;color:var(--text-soft)">No other shelves yet — create one below</p>'}</div>`);
  },
  promptNewShelf(id) {
    const n = prompt('New shelf name:');
    if (!n || !n.trim()) return;
    this.movePonyToShelf(id, n.trim());
    this.closeSheet();
  },
  async onDetailPhoto(e) {
    const files = [...(e.target.files || [])];
    if (!files.length || !detailId) return;
    const p = S.ponies.find(x=>x.id===detailId);
    const photos = [...(p.photos || [])];
    for (const file of files.slice(0, 5 - photos.length)) {
      photos.push(await Photo.compress(file));
    }
    S.ponies = S.ponies.map(x=>x.id===detailId?normalizePony({...x,photos}):x);
    Store.save(); this.openDetail(detailId);
  },
  deletePony(id) {
    ParentGate.run('Delete pony', () => {
      if (!confirm('Remove this pony from your stable?')) return;
      S.ponies = S.ponies.filter(p=>p.id!==id);
      Store.save(); this.closeSheet(); Render.all();
    });
  },
  clonePony(id) {
    const p = S.ponies.find(x => x.id === id);
    if (!p) return;
    const copy = normalizePony({
      ...p, id: uid(), name: `${p.name} (copy)`, createdAt: Date.now(),
      isFavourite: false, isMostPlayed: false, soldComps: [],
    });
    S.ponies.push(copy);
    Store.save(); Render.all(); Toast.show('Pony cloned ✨');
    Haptic.tap();
    if (window.Excellence) Excellence.openPassport(copy.id);
    else this.openDetail(copy.id);
  },
  bulkMoveShelf() {
    const from = prompt('Move ponies FROM shelf (blank = unshelved):', '');
    if (from === null) return;
    const to = prompt('Move TO shelf name:', '');
    if (!to || !to.trim()) return;
    const fromN = from.trim();
    const toN = to.trim();
    let n = 0;
    S.ponies.forEach(p => {
      const s = (p.shelf || '').trim();
      if ((fromN ? s === fromN : !s)) { p.shelf = toN; n++; }
    });
    if (!n) { Toast.show('No ponies matched that shelf'); return; }
    Store.save(); Render.all(); Toast.show(`Moved ${n} ponies to ${toN} ✨`);
  },
  bulkFavoriteShelf() {
    const shelf = prompt('Favorite all ponies on shelf (blank = unshelved):', '');
    if (shelf === null) return;
    const sn = shelf.trim();
    let n = 0;
    S.ponies.forEach(p => {
      const s = (p.shelf || '').trim();
      if ((sn ? s === sn : !s) && !p.isFavourite) { p.isFavourite = true; n++; }
    });
    if (!n) { Toast.show('No ponies to favorite on that shelf'); return; }
    Store.save(); Render.all(); Achievements.checkAll(false); Toast.show(`Favorited ${n} ponies ❤️`);
  },
  bulkArchiveShelf() {
    const shelf = prompt('Mark all on shelf as extras (not originals). Shelf name (blank = unshelved):', '');
    if (shelf === null) return;
    const sn = shelf.trim();
    let n = 0;
    S.ponies.forEach(p => {
      const s = (p.shelf || '').trim();
      if ((sn ? s === sn : !s) && p.isOriginal) { p.isOriginal = false; n++; }
    });
    if (!n) { Toast.show('No originals on that shelf'); return; }
    Store.save(); Render.all(); Toast.show(`Marked ${n} as extras 📦`);
  },
  restoreRecovery() {
    ParentGate.run('Restore recovery snapshot', async () => {
      let data = null;
      if (window.DataStore) {
        data = await DataStore.latestRecovery();
      }
      if (!data) {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('deeponycap_recovery_')).sort().reverse();
        if (keys.length) {
          try { data = JSON.parse(localStorage.getItem(keys[0])); } catch {}
        }
      }
      if (!data) { Toast.show('No recovery snapshots found'); return; }
      try {
        if (window.Excellence) {
          const v = Excellence.validateBackup(data);
          if (!v.ok) throw new Error(v.err);
        }
        S = { ...S, ...data, ponies: (data.ponies || []).map(normalizePony) };
        await Store._hydratePhotos();
        Store.save(); Render.all(); Toast.show('Recovery snapshot restored 💾');
      } catch {
        Toast.show('Recovery snapshot was invalid');
      }
    });
  },
  toggleHaptics() {
    S.settings.hapticsEnabled = !S.settings.hapticsEnabled;
    Store.save();
    if (S.settings.hapticsEnabled) Haptic.tap();
    Render.settings();
    Toast.show(S.settings.hapticsEnabled ? 'Haptics on ✨' : 'Haptics off');
  },
  addSoldComp(id) {
    const amount = parseFloat(prompt('Sold price ($):', ''));
    if (!amount || amount <= 0) return;
    const source = (prompt('Source (eBay, Mercari, local…):', 'eBay') || 'Manual').trim();
    const notes = (prompt('Notes (optional):', '') || '').trim();
    S.ponies = S.ponies.map(p => {
      if (p.id !== id) return p;
      const soldComps = [...(p.soldComps || []), { date: new Date().toISOString().slice(0, 10), amount, source, notes }];
      return normalizePony({ ...p, soldComps });
    });
    Store.save();
    this.openDetail(id);
    Toast.show('Sold comp logged 📊');
  },
  addWish() {
    const name = document.getElementById('wName').value.trim();
    if (!name) return;
    const file = document.getElementById('wPhoto')?.files?.[0];
    const targetRaw = document.getElementById('wTarget')?.value;
    const base = {
      id: uid(), name,
      generation: parseInt(document.getElementById('wGen').value),
      type: document.getElementById('wType').value,
      priority: document.getElementById('wPri').value,
      notes: document.getElementById('wNotes').value.trim(),
      targetPrice: targetRaw ? parseFloat(targetRaw) : null,
      photo: null, photos: [],
      addedAt: Date.now()
    };
    const finish = (item) => {
      S.wishlist.push(item);
      Store.save(); Render.wishlist(); Toast.show('Added to wishlist 💫');
      Haptic.tap();
    };
    if (file) {
      Photo.compress(file).then(url => finish({ ...base, photo: url, photos: [url] })).catch(() => finish(base));
    } else finish(base);
  },
  delWish(id) { S.wishlist = S.wishlist.filter(w=>w.id!==id); Store.save(); Render.wishlist(); },
  gotWish(id) {
    const w = S.wishlist.find(x=>x.id===id);
    if (!w) return;
    S.wishlist = S.wishlist.filter(x=>x.id!==id);
    Store.save();
    Confetti.burst();
    Haptic.success();
    Achievements.checkAll(false);
    this.openAdd({ name:w.name, generation:w.generation, type:w.type, notes:w.notes });
  },
  filterShelf(s) { filter.q=s; logFilter.logSection='g1'; Nav.goLog(); filter.q=s; Render.logs(); },
  addAccessory() {
    const name = document.getElementById('accName')?.value?.trim();
    if (!name) return;
    const ponyId = document.getElementById('accPony')?.value || '';
    S.accessories = S.accessories || [];
    S.accessories.push({ id: uid(), name, category: 'accessory', ponyIds: ponyId ? [ponyId] : [], photo: null, photos: [], addedAt: Date.now() });
    Store.save(); Render.settings(); Toast.show('Accessory added ✨');
  },
  async addAccessoryFromGallery() {
    const name = document.getElementById('accNameGal')?.value?.trim();
    if (!name) { Toast.show('Name required'); return; }
    const ponyId = document.getElementById('accPonyGal')?.value || '';
    const file = document.getElementById('accPhotoGal')?.files?.[0];
    let photo = null;
    if (file) {
      try { photo = await Photo.compress(file); } catch {}
    }
    const cat = document.getElementById('accCatGal')?.value || 'accessory';
    S.accessories = S.accessories || [];
    S.accessories.push({ id: uid(), name, category: cat, ponyIds: ponyId ? [ponyId] : [], photo, photos: photo ? [photo] : [], addedAt: Date.now() });
    Store.save(); Render.accessoryGallery(); Toast.show('Accessory added ✨');
  },
  openAccessory(id) {
    const a = (S.accessories || []).find(x => x.id === id);
    if (!a) return;
    const ph = a.photo || (a.photos && a.photos[0]) || '';
    const linked = (a.ponyIds || []).map(pid => S.ponies.find(p => p.id === pid)).filter(Boolean);
    this.openSheet(`${Render.sheetHdr(Render.esc(a.name), 'UI.closeSheet()')}
      ${ph ? `<img src="${ph}" style="width:100%;border-radius:var(--r);margin-bottom:12px" alt="">` : '<div style="text-align:center;font-size:3rem;padding:24px">🎀</div>'}
      ${linked.length ? `<div class="section-title">Linked ponies</div>${linked.map(p => `<div style="padding:8px 0;cursor:pointer" onclick="UI.closeSheet();UI.openDetail('${p.id}')">🦄 ${Render.esc(p.name)} · G${p.generation}</div>`).join('')}` : '<p style="font-size:.85rem;color:var(--text-soft)">No pony linked</p>'}
      <button class="btn-d" style="width:100%;margin-top:12px" onclick="UI.delAccessory('${a.id}');UI.closeSheet()">Remove</button>`);
  },
  delAccessory(id) {
    S.accessories = (S.accessories || []).filter(a=>a.id!==id);
    Store.save();
    const on = document.querySelector('.screen.on')?.id?.replace('tab-','');
    if (on === 'accessories') Render.accessoryGallery();
    else if (on === 'settings') Render.settings();
    else Render.all();
  },
  importCsv(file) {
    if (!file) return;
    ParentGate.run('Import CSV', () => {
      const r = new FileReader();
      r.onload = () => { try { Csv.import(r.result); } catch { Toast.show('Invalid CSV file'); } };
      r.readAsText(file);
    });
  },
  async compressAllPhotos() {
    let n = 0;
    for (const p of S.ponies) {
      if (!p.photos?.length) continue;
      const next = [];
      for (const ph of p.photos) {
        if (ph.length < 400000) { next.push(ph); continue; }
        try {
          const blob = await (await fetch(ph)).blob();
          const f = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
          next.push(await Photo.compress(f));
          n++;
        } catch { next.push(ph); }
      }
      Object.assign(p, normalizePony({ ...p, photos: next }));
    }
    Store.save();
    Render.all();
    Toast.show(n ? `Compressed ${n} photo(s) 💾` : 'Photos already optimized');
  }
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
      Render.all();
      Install.maybeShow();
      Achievements.checkAll(true);
      if (window.__loadError) Toast.show('Saved data could not load — try Recovery in Settings');
      if (window.Excellence) Excellence.deepLink();
    }
  });
  if (window.AppUpdate) AppUpdate.register();
  else if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js?v=42').catch(()=>{});
}
boot();
