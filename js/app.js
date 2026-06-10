'use strict';
const STORAGE_KEY = 'deePonyOS_v2';
const STORAGE_KEY_V1 = 'deePonyOS_v1';
const PAGE_SIZE = 40;
const GEN_COLORS = {1:'g1',2:'g2',3:'g3',4:'g4',5:'g5'};
const GEN_EMOJI = {1:'💜',2:'💚',3:'💙',4:'💛',5:'🩷'};
const TYPE_LABELS = {mlp:'🦄 MLP',filly:'🎀 Filly',velvet:'🧸 Velvet',palace_pet:'🏰 Palace',special:'✨ Special'};
const TYPE_KEYS = ['mlp','filly','velvet','palace_pet','special'];
const COND_LABELS = {mint:'✨ Mint',good:'👍 Good',played:'🎮 Played',loved:'💕 Loved'};
const SIZE_LABELS = {mini:'Mini',standard:'Standard',large:'Large',extra_large:'XL'};
const SHELF_SUGGEST = ['Shelf 1','Shelf 2','Windowsill','Display Case','Box'];

let S = {
  ponies:[], wishlist:[], accessories:[], collector:{name:'',since:''},
  settings:{collectorMode:false,darkMode:false}, onboardingDone:false, version:2
};
const STORAGE_LIMIT = 5 * 1024 * 1024;
let filter = { chip:'all', q:'', sort:'name', page:0 };
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
  return {
    ...p, photos, photo: photos[0] || null,
    purchaseValue: p.purchaseValue != null ? Number(p.purchaseValue) : null,
    estimatedValue: p.estimatedValue != null ? Number(p.estimatedValue) : null
  };
}

function ponyValue(p) {
  return p.estimatedValue ?? p.purchaseValue ?? null;
}

const StorageHealth = {
  bytes() { try { return new Blob([localStorage.getItem(STORAGE_KEY) || '']).size; } catch { return 0; } },
  pct() { return Math.min(100, Math.round(StorageHealth.bytes() / STORAGE_LIMIT * 100)); },
  label() {
    const p = StorageHealth.pct();
    if (p >= 90) return { level: 'critical', text: 'Storage almost full — export backup & remove photos' };
    if (p >= 70) return { level: 'warn', text: 'Storage getting full — consider fewer/lighter photos' };
    return { level: 'ok', text: 'Storage healthy' };
  }
};

function findDuplicate(name, gen, excludeId) {
  const nl = (name || '').trim().toLowerCase();
  if (!nl) return null;
  return S.ponies.find(p => p.id !== excludeId && p.name.trim().toLowerCase() === nl && p.generation === gen);
}

const Store = {
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(S));
      return true;
    } catch { return false; }
  },
  async load() {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const v1 = localStorage.getItem(STORAGE_KEY_V1);
        if (v1 && Store.migrateV1(v1)) { await Store._hydratePhotos(); return; }
      }
      if (raw) {
        const parsed = JSON.parse(raw);
        S = {
          ...S, ...parsed,
          settings: { collectorMode: false, ...(parsed.settings || {}) },
          accessories: parsed.accessories || []
        };
        S.ponies = (parsed.ponies || []).map(normalizePony);
        await Store._hydratePhotos();
      }
    } catch(e) {}
    if (!S.settings) S.settings = { collectorMode: false, darkMode: false };
    S.settings.darkMode = !!S.settings.darkMode;
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
    S.version = 2;
    if (window.PhotoIDB) {
      PhotoIDB.stripForSave(S.ponies).then(stripped => {
        const payload = { ...S, ponies: stripped };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      }).catch(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(S)));
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(S));
    }
  }
};

const Theme = {
  apply() {
    document.documentElement.classList.toggle('collector-mode', !!S.settings?.collectorMode);
    document.documentElement.classList.toggle('dark-mode', !!S.settings?.darkMode);
    const meta = document.getElementById('themeMeta');
    if (meta) meta.content = S.settings?.darkMode ? '#1F2937' : (S.settings?.collectorMode ? '#6D28D9' : '#FF6B9D');
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
    const header = 'name,generation,type,colour,size,shelf,condition,isOriginal,purchaseValue,estimatedValue,notes';
    const rows = S.ponies.map(p => [
      `"${(p.name||'').replace(/"/g,'""')}"`, p.generation, p.type,
      `"${(p.colour||'').replace(/"/g,'""')}"`, p.size,
      `"${(p.shelf||'').replace(/"/g,'""')}"`, p.condition, p.isOriginal ? 1 : 0,
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
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        if (!data.ponies && !data.wishlist) throw new Error('invalid');
        S = {
          ...S, ...data,
          settings: { collectorMode: false, ...(data.settings || {}) },
          ponies: (data.ponies || []).map(normalizePony),
          onboardingDone: true
        };
        Store.save();
        Theme.apply();
        document.getElementById('onboard').classList.add('hide');
        document.getElementById('app').style.display = 'flex';
        Render.all();
        Confetti.burst();
        Toast.show('Collection restored! 🦄');
      } catch {
        Toast.show('Could not read backup file');
      }
    };
    r.readAsText(file);
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

const Haptic = { tap() { if (navigator.vibrate) navigator.vibrate(8); } };

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
          ? '<strong>Install DeePonyOS</strong> — Chrome menu → <strong>Add to Home screen</strong> or <strong>Install app</strong>'
          : '<strong>Install DeePonyOS</strong> — tap Share → <strong>Add to Home Screen</strong> for the full magical app experience!';
        hint.classList.add('show');
      }
    }
  },
  dismiss() {
    localStorage.setItem('deepony_install_dismiss', '1');
    document.getElementById('installHint').classList.remove('show');
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
    Haptic.tap();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('on'));
    document.getElementById('tab-'+tab).classList.add('on');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('on', b.dataset.tab===tab));
    Render.all();
  }
};

const Render = {
  all() {
    const on = document.querySelector('.screen.on')?.id?.replace('tab-','');
    if (on==='stable') this.stable();
    if (on==='collection') this.collection();
    if (on==='wishlist') this.wishlist();
    if (on==='shelves') this.shelves();
    if (on==='stats') this.stats();
    if (on==='settings') this.settings();
  },
  esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); },
  sheetHdr(title, closeFn) {
    return `<div class="sheet-hdr"><h2>${title}</h2><button class="sheet-close" onclick="${closeFn}">✕</button></div>`;
  },
  ponyCard(p, mini) {
    const g = GEN_COLORS[p.generation]||'g5';
    const ph = ponyPhoto(p);
    const cls = mini ? 'mini-card' : 'pony-card pop-in';
    const photoCount = (p.photos?.length || (p.photo ? 1 : 0));
    return `<div class="${cls}" onclick="UI.openDetail('${p.id}')">
      ${ph ? `<div class="pony-img"><img src="${ph}" alt="" loading="lazy"></div>` : `<div class="pony-img" style="background:linear-gradient(135deg,var(--${g}),var(--pink-lighter))">🦄</div>`}
      <div class="pony-body">
        <div class="pony-name">${this.esc(p.name)} ${p.isFavourite?'❤️':''}${p.isMostPlayed?'🎮':''}${photoCount>1?` 📷${photoCount}`:''}</div>
        <div class="badges">
          <span class="badge ${g}">G${p.generation}</span>
          <span class="badge" style="background:var(--pink-light);color:var(--text)">${TYPE_LABELS[p.type]||p.type}</span>
          ${(S.settings?.collectorMode && ponyValue(p)) ? `<span class="badge" style="background:var(--mint);color:#1F2937">$${ponyValue(p)}</span>` : ''}
        </div>
      </div>
    </div>`;
  },
  stable() {
    const n = S.ponies.length;
    const name = S.collector.name || 'Collector';
    const gens = [1,2,3,4,5].map(g => ({g, c: S.ponies.filter(p=>p.generation===g).length}));
    const total = n || 1;
    const bars = gens.map(x => `<span style="width:${(x.c/total*100)||0}%;background:var(--g${x.g})"></span>`).join('');
    const pills = gens.map(x => `<button class="pill g${x.g}" onclick="filter.chip='g${x.g}';filter.page=0;Nav.go('collection')">G${x.g} ${GEN_EMOJI[x.g]} ${x.c}</button>`).join('');
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
      ? `<div class="card" style="margin-top:14px;border-color:var(--pink)"><div class="section-title">🎂 Collection anniversaries today</div>${anniv.map(p=>`<div style="padding:6px 0">${this.esc(p.name)} · G${p.generation} · ${new Date(p.acquiredDate).getFullYear()}</div>`).join('')}</div>`
      : '';
    document.getElementById('tab-stable').innerHTML = `
      <h1 class="greet">✨ ${this.esc(name)}'s Stable</h1>
      <p class="sub">${n ? `You have ${n} magical ponies! 🎉` : 'Your stable awaits its first pony!'}${collValue ? ` · Est. $${collValue.toLocaleString()}` : ''}</p>
      ${annivHtml}
      <div class="card">
        <div class="big-num" id="counterNum">0</div>
        <div class="big-label">ponies in your collection</div>
        <div class="progress-bar">${bars}</div>
        <div class="rainbow-note">Rainbow spread across all generations</div>
      </div>
      <div class="row-scroll">${pills}</div>
      <div class="type-grid">${types}</div>
      ${recent.length?`<div class="section-title">Recently Added 🆕</div><div class="row-scroll">${recent.map(p=>this.ponyCard(p,true)).join('')}</div>`:''}
      ${faves.length?`<div class="section-title">Most Loved 💕</div><div class="row-scroll">${faves.map(p=>this.ponyCard(p,true)).join('')}</div>`:''}`;
    Anim.countUp(document.getElementById('counterNum'), n);
  },
  filteredPonies() {
    let list = [...S.ponies];
    const q = filter.q.toLowerCase();
    if (q) list = list.filter(p => p.name.toLowerCase().includes(q) || (p.colour||'').toLowerCase().includes(q) || (p.shelf||'').toLowerCase().includes(q));
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
  collection() {
    const chips = [['all','All'],['g1','G1'],['g2','G2'],['g3','G3'],['g4','G4'],['g5','G5'],
      ...TYPE_KEYS.map(t=>[t,TYPE_LABELS[t]]),['faves','❤️ Faves'],['played','🎮 Most Played'],['originals','Originals'],['extras','Extras']];
    const list = this.filteredPonies();
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (filter.page >= pages) filter.page = pages - 1;
    if (filter.page < 0) filter.page = 0;
    const slice = list.slice(filter.page * PAGE_SIZE, (filter.page + 1) * PAGE_SIZE);
    const suggestions = window.ponyNameSuggestions ? '' : '';
    document.getElementById('tab-collection').innerHTML = `
      <div class="search-wrap"><input class="search" placeholder="Search ponies..." value="${this.esc(filter.q)}" oninput="filter.q=this.value;filter.page=0;Render.collection()"></div>
      <div class="chips">${chips.map(([k,l])=>`<button class="chip${filter.chip===k?' on':''}" onclick="filter.chip='${k}';filter.page=0;Render.collection()">${l}</button>`).join('')}</div>
      <div class="sort-row">Sort <select onchange="filter.sort=this.value;filter.page=0;Render.collection()">
        <option value="name"${filter.sort==='name'?' selected':''}>Name</option>
        <option value="gen"${filter.sort==='gen'?' selected':''}>Generation</option>
        <option value="recent"${filter.sort==='recent'?' selected':''}>Recently Added</option>
        <option value="condition"${filter.sort==='condition'?' selected':''}>Condition</option>
      </select> · ${list.length} ponies</div>
      <div class="grid">${slice.length?slice.map(p=>this.ponyCard(p)).join(''):'<div class="empty" style="grid-column:1/-1"><span>🦄</span>No ponies yet — tap + to add!</div>'}</div>
      ${pages>1?`<div class="pager">
        <button class="btn-g" ${filter.page<=0?'disabled':''} onclick="filter.page--;Render.collection()">← Prev</button>
        <span>Page ${filter.page+1} / ${pages}</span>
        <button class="btn-g" ${filter.page>=pages-1?'disabled':''} onclick="filter.page++;Render.collection()">Next →</button>
      </div>`:''}`;
  },
  wishlist() {
    const groups = {must:[],want:[],someday:[]};
    S.wishlist.forEach(w => (groups[w.priority]||groups.someday).push(w));
    const renderGroup = (title, key, items) => items.length ? `<div class="section-title">${title}</div>`+
      items.map(w=>`<div class="wish-item ${key}">
        <div style="font-weight:800;margin-bottom:4px">${this.esc(w.name)} <span class="badge ${GEN_COLORS[w.generation]||'g5'}">G${w.generation}</span></div>
        <div style="font-size:.8rem;color:var(--text-soft);margin-bottom:8px">${TYPE_LABELS[w.type]||w.type} ${w.notes? '· '+this.esc(w.notes):''}</div>
        <div style="display:flex;gap:8px">
          <button class="btn-g" onclick="UI.gotWish('${w.id}')">Got it! 🎉</button>
          <button class="btn-d" onclick="UI.delWish('${w.id}')">Delete</button>
        </div></div>`).join('') : '';
    document.getElementById('tab-wishlist').innerHTML = `
      <h1 class="greet">💫 My Wishlist</h1>
      <p class="sub">Ponies you dream of having · ${S.wishlist.length} on your list ✨</p>
      <div class="card">
        <div class="fg"><label class="fl">Pony name</label><input class="inp" id="wName" list="wishNames" placeholder="Dream pony name..." oninput="UI.updateWishSuggest(this.value)"></div>
        <datalist id="wishNames"></datalist>
        <div class="fg"><label class="fl">Generation</label><select class="sel" id="wGen" onchange="UI.updateWishSuggest(document.getElementById('wName').value)">${[1,2,3,4,5].map(g=>`<option value="${g}">G${g}</option>`).join('')}</select></div>
        <div class="fg"><label class="fl">Type</label><select class="sel" id="wType">${TYPE_KEYS.map(t=>`<option value="${t}">${TYPE_LABELS[t]}</option>`).join('')}</select></div>
        <div class="fg"><label class="fl">Priority</label><select class="sel" id="wPri"><option value="must">🔴 Must Have</option><option value="want">🟡 Want</option><option value="someday">🟢 Someday</option></select></div>
        <div class="fg"><label class="fl">Notes</label><input class="inp" id="wNotes" placeholder="Where to find, etc."></div>
        <button class="btn-p" onclick="UI.addWish()">Add to Wishlist ✨</button>
      </div>
      ${renderGroup('🔴 Must Have','must',groups.must)}
      ${renderGroup('🟡 Want','want',groups.want)}
      ${renderGroup('🟢 Someday','someday',groups.someday)}`;
  },
  shelves() {
    const shelves = {};
    S.ponies.forEach(p => {
      const s = (p.shelf||'').trim() || '__unshelved__';
      if (!shelves[s]) shelves[s] = [];
      shelves[s].push(p);
    });
    const keys = Object.keys(shelves).filter(k=>k!=='__unshelved__').sort();
    let html = `<h1 class="greet">🗂️ My Shelves</h1><p class="sub">Where your ponies live</p>`;
    keys.forEach(s => {
      const js = String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
      html += `<div class="shelf-sec"><div class="shelf-hdr" onclick="UI.filterShelf('${js}')">🗄️ ${this.esc(s)} — ${shelves[s].length} ponies
        <button class="btn-g" style="margin-left:8px;padding:4px 10px;font-size:.7rem" onclick="event.stopPropagation();UI.renameShelf('${js}')">Rename</button></div>
        <div class="row-scroll">${shelves[s].map(p=>this.ponyCard(p,true)).join('')}</div></div>`;
    });
    if (shelves.__unshelved__) {
      html += `<div class="shelf-sec"><div class="shelf-hdr">📦 Unshelved — ${shelves.__unshelved__.length}</div>
        <div class="row-scroll">${shelves.__unshelved__.map(p=>this.ponyCard(p,true)).join('')}</div></div>`;
    }
    if (!S.ponies.length) html += '<div class="empty"><span>🗂️</span>No shelves yet!</div>';
    document.getElementById('tab-shelves').innerHTML = html;
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
    const achs = [
      {id:'first',ic:'🏆',t:'First Pony!',ok:n>=1},
      {id:'g1fan',ic:'💜',t:'Generation 1 Fan — 5+ G1',ok:S.ponies.filter(p=>p.generation===1).length>=5},
      {id:'rainbow',ic:'🌈',t:'Rainbow Collector — 1 of each gen',ok:gens.every(x=>x.c>=1)},
      {id:'lover',ic:'❤️',t:'Pony Lover — 10+ favourites',ok:S.ponies.filter(p=>p.isFavourite).length>=10},
      {id:'shelf',ic:'📚',t:'Shelf Master — 3+ shelves',ok:new Set(S.ponies.map(p=>p.shelf).filter(Boolean)).size>=3},
      {id:'big50',ic:'🌟',t:'Big Collection — 50+ ponies',ok:n>=50},
      {id:'big100',ic:'💎',t:'Serious Collector — 100+ ponies',ok:n>=100},
      {id:'big250',ic:'👑',t:'Pony Royalty — 250+ ponies',ok:n>=250},
      {id:'wish5',ic:'💫',t:'Dreamer — 5+ wishlist items',ok:S.wishlist.length>=5}
    ];
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
          return `<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;font-size:.85rem"><span>G${x.g} ${GEN_EMOJI[x.g]}</span><strong>${x.c} owned · ${owned} unique names${db?` / ~${db} in db`:'')}</strong></div>
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
      <div class="section-title">Achievements</div>
      ${achs.map(a=>`<div class="ach${a.ok?' unlocked':''}"><span class="ic">${a.ic}</span><span>${a.t}</span></div>`).join('')}`;
  },
  settings() {
    const cm = S.settings?.collectorMode;
    const dm = S.settings?.darkMode;
    const stor = StorageHealth.label();
    const storPct = StorageHealth.pct();
    const ponyOpts = S.ponies.map(p => `<option value="${p.id}">${this.esc(p.name)}</option>`).join('');
    document.getElementById('tab-settings').innerHTML = `
      <h1 class="greet">⚙️ Settings</h1>
      <p class="sub">Backup, display & collector tools</p>
      <div class="card storage-card storage-${stor.level}">
        <div class="section-title">Storage</div>
        <div class="storage-bar"><span style="width:${storPct}%"></span></div>
        <p style="font-size:.85rem;margin-top:8px">${storPct}% used · ${stor.text}</p>
        <button class="btn-g" style="width:100%;margin-top:8px" onclick="UI.compressAllPhotos()">Compress all photos</button>
      </div>
      <div class="card">
        <div class="section-title">Display</div>
        <div class="setting-row">
          <div><strong>Collector Mode</strong><br><span style="font-size:.8rem;color:var(--text-soft)">Clean catalog view — less sparkle, more data</span></div>
          <button class="toggle${cm?' on':''}" onclick="Theme.toggle()">${cm?'ON':'OFF'}</button>
        </div>
        <div class="setting-row">
          <div><strong>Dark Mode</strong><br><span style="font-size:.8rem;color:var(--text-soft)">Easier on eyes at night</span></div>
          <button class="toggle${dm?' on':''}" onclick="Theme.toggleDark()">${dm?'ON':'OFF'}</button>
        </div>
      </div>
      <div class="card">
        <div class="section-title">Collector Profile</div>
        <div class="fg"><label class="fl">Name</label><input class="inp" id="setName" value="${this.esc(S.collector.name)}" onchange="S.collector.name=this.value;Store.save()"></div>
        <div class="fg"><label class="fl">Collecting since</label><input class="inp" type="date" id="setSince" value="${S.collector.since||''}" onchange="S.collector.since=this.value;Store.save()"></div>
      </div>
      <div class="card">
        <div class="section-title">Backup & Restore 💾</div>
        <p style="font-size:.85rem;color:var(--text-soft);margin-bottom:12px">Export your full collection to move to a new device. Import merges into this app.</p>
        <button class="btn-p" onclick="Backup.export()">Export Backup</button>
        <button class="btn-g" style="width:100%;margin-top:10px" onclick="document.getElementById('importIn').click()">Import Backup</button>
        <input type="file" id="importIn" accept=".deepony,.json,application/json" style="display:none" onchange="if(this.files[0])Backup.import(this.files[0]);this.value=''">
        <button class="btn-g" style="width:100%;margin-top:10px" onclick="Csv.export()">Export CSV (no photos)</button>
        <button class="btn-g" style="width:100%;margin-top:10px" onclick="document.getElementById('csvIn').click()">Import CSV</button>
        <input type="file" id="csvIn" accept=".csv,text/csv" style="display:none" onchange="UI.importCsv(this.files[0]);this.value=''">
      </div>
      <div class="card">
        <div class="section-title">Accessories & Playsets (optional)</div>
        <div class="fg"><label class="fl">Name</label><input class="inp" id="accName" placeholder="e.g. Ponyville Playset"></div>
        <div class="fg"><label class="fl">Link to pony (optional)</label><select class="sel" id="accPony"><option value="">— none —</option>${ponyOpts}</select></div>
        <button class="btn-g" onclick="UI.addAccessory()">Add</button>
        ${(S.accessories||[]).map(a=>{
          const linked = (a.ponyIds||[]).map(id => S.ponies.find(p=>p.id===id)?.name).filter(Boolean).join(', ');
          return `<div class="acc-item"><div><span>${this.esc(a.name)}</span>${linked?`<br><span style="font-size:.7rem;color:var(--text-soft)">🦄 ${this.esc(linked)}</span>`:''}</div><button class="btn-d" style="padding:4px 10px;font-size:.7rem" onclick="UI.delAccessory('${a.id}')">✕</button></div>`;
        }).join('') || '<p style="font-size:.85rem;color:var(--text-soft);margin-top:8px">No accessories logged yet</p>'}
      </div>
      <div class="card">
        <div class="section-title">About</div>
        <p style="font-size:.85rem;color:var(--text-soft)">DeePonyOS v2.1 · ${S.ponies.length} ponies · ${(StorageHealth.bytes()/1024).toFixed(0)} KB stored</p>
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
    return {
      name: p?.name||'', generation: p?.generation||4, type: p?.type||'mlp',
      colour: p?.colour||'', size: p?.size||'standard', shelf: p?.shelf||'Shelf 1',
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
    const gOpts = [1,2,3,4,5].map(g=>`<button type="button" class="opt g${g}${f.generation===g?' on':''}" onclick="UI.setForm('generation',${g})">G${g}</button>`).join('');
    const tOpts = TYPE_KEYS.map(t=>`<button type="button" class="opt${f.type===t?' on':''}" onclick="UI.setForm('type','${t}')">${TYPE_LABELS[t]}</button>`).join('');
    const sOpts = ['mini','standard','large','extra_large'].map(s=>`<button type="button" class="opt${f.size===s?' on':''}" onclick="UI.setForm('size','${s}')">${SIZE_LABELS[s]}</button>`).join('');
    const cOpts = Object.keys(COND_LABELS).map(c=>`<button type="button" class="opt${f.condition===c?' on':''}" onclick="UI.setForm('condition','${c}')">${COND_LABELS[c]}</button>`).join('');
    const shelfList = [...new Set([...SHELF_SUGGEST, ...S.ponies.map(p=>p.shelf).filter(Boolean)])].map(s=>`<option value="${Render.esc(s)}"${f.shelf===s?' selected':''}>`).join('');
    const photos = f.photos || [];
    const photoGrid = photos.map((ph,i)=>`<div class="photo-thumb${i===0?' primary':''}" onclick="UI.setPrimaryPhoto(${i})"><img src="${ph}" alt=""><button type="button" class="photo-rm" onclick="event.stopPropagation();UI.removePhoto(${i})">✕</button></div>`).join('');
    this.openSheet(`${Render.sheetHdr(title, 'UI.closeSheet()')}
      <div class="photo-row">${photoGrid}<div class="photo-upload small" onclick="document.getElementById('photoIn').click()">${photos.length?'+':'📸'}</div></div>
      <input type="file" id="photoIn" accept="image/*" capture="environment" style="display:none" onchange="UI.onPhoto(event)" multiple>
      <p class="photo-hint">${photos.length?`${photos.length} photo(s) — tap star photo to set primary`:'Tap to add photos (up to 5)'}</p>
      <div class="fg"><label class="fl">Name *</label><input class="inp" list="ponyNames" value="${Render.esc(f.name)}" oninput="formState.name=this.value;UI.refreshNameList()"><datalist id="ponyNames">${this.nameDatalist(f.generation, f.name)}</datalist></div>
      <div class="fg"><label class="fl">Generation</label><div class="sel-row">${gOpts}</div></div>
      <div class="fg"><label class="fl">Type</label><div class="sel-row">${tOpts}</div></div>
      <div class="fg"><label class="fl">Colour</label><input class="inp" value="${Render.esc(f.colour)}" placeholder="Pink with purple mane" oninput="formState.colour=this.value"></div>
      <div class="fg"><label class="fl">Size</label><div class="sel-row">${sOpts}</div></div>
      <div class="fg"><label class="fl">Shelf</label><input class="inp" list="shelfDL" value="${Render.esc(f.shelf)}" oninput="formState.shelf=this.value"><datalist id="shelfDL">${shelfList}</datalist></div>
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
      <div class="fg"><label class="fl">Acquired</label><input class="inp" type="date" value="${f.acquiredDate}" oninput="formState.acquiredDate=this.value"></div>
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
    el.innerHTML = dup ? `<p class="dup-warn">⚠️ You already have <strong>${Render.esc(dup.name)}</strong> (G${dup.generation}) on ${Render.esc(dup.shelf||'unshelved')}</p>` : '';
  },
  updateWishSuggest(q) {
    const dl = document.getElementById('wishNames');
    const gen = parseInt(document.getElementById('wGen')?.value || 4);
    if (dl && window.ponyNameSuggestions) dl.innerHTML = window.ponyNameSuggestions(gen, q).map(n=>`<option value="${n}">`).join('');
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
    if (!editingId) Confetti.burst();
  },
  openDetail(id) {
    const p = S.ponies.find(x=>x.id===id);
    if (!p) return;
    detailId = id;
    const photos = p.photos?.length ? p.photos : (p.photo ? [p.photo] : []);
    const gallery = photos.length
      ? `<div class="detail-gallery">${photos.map((ph,i)=>`<img src="${ph}" class="detail-photo${i===0?' main':''}" onclick="UI.openDetailPhoto(${i})" alt="">`).join('')}</div>`
      : `<div class="detail-photo" onclick="document.getElementById('photoIn2').click()">🦄</div>`;
    this.openSheet(`${Render.sheetHdr(Render.esc(p.name), 'UI.closeSheet()')}
      ${gallery}
      <input type="file" id="photoIn2" accept="image/*" style="display:none" onchange="UI.onDetailPhoto(event)">
      ${[['Generation',`G${p.generation} ${GEN_EMOJI[p.generation]}`],['Type',TYPE_LABELS[p.type]],['Colour',p.colour],['Size',SIZE_LABELS[p.size]],['Shelf',p.shelf||'—'],['Original',p.isOriginal?'Yes':'Extra'],['Condition',COND_LABELS[p.condition]],['Paid',p.purchaseValue!=null?`$${p.purchaseValue}`:'—'],['Est. Value',p.estimatedValue!=null?`$${p.estimatedValue}`:'—'],['Favourite',p.isFavourite?'❤️':'—'],['Most Played',p.isMostPlayed?'🎮':'—'],['Acquired',p.acquiredDate||'—'],['Notes',p.notes||'—']].map(([k,v])=>`<div class="detail-row"><span>${k}</span><span>${Render.esc(String(v))}</span></div>`).join('')}
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
    const text = `🦄 ${p.name} — G${p.generation} ${TYPE_LABELS[p.type]} · ${p.colour||'My pony'} · DeePonyOS`;
    if (navigator.share) navigator.share({ title: p.name, text }).catch(()=>{});
    else { navigator.clipboard.writeText(text).then(()=>Toast.show('Copied to clipboard ✨')); }
  },
  renameShelf(oldName) {
    const n = prompt('New shelf name:', oldName);
    if (!n || !n.trim()) return;
    const nn = n.trim();
    S.ponies.forEach(p => { if ((p.shelf||'').trim() === oldName) p.shelf = nn; });
    Store.save(); Render.shelves(); Toast.show('Shelf renamed ✨');
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
    if (!confirm('Remove this pony from your stable?')) return;
    S.ponies = S.ponies.filter(p=>p.id!==id);
    Store.save(); this.closeSheet(); Render.all();
  },
  addWish() {
    const name = document.getElementById('wName').value.trim();
    if (!name) return;
    S.wishlist.push({ id:uid(), name, generation:parseInt(document.getElementById('wGen').value), type:document.getElementById('wType').value, priority:document.getElementById('wPri').value, notes:document.getElementById('wNotes').value.trim(), addedAt:Date.now() });
    Store.save(); Render.wishlist(); Toast.show('Added to wishlist 💫');
  },
  delWish(id) { S.wishlist = S.wishlist.filter(w=>w.id!==id); Store.save(); Render.wishlist(); },
  gotWish(id) {
    const w = S.wishlist.find(x=>x.id===id);
    if (!w) return;
    S.wishlist = S.wishlist.filter(x=>x.id!==id);
    Store.save();
    Confetti.burst();
    this.openAdd({ name:w.name, generation:w.generation, type:w.type, notes:w.notes });
  },
  filterShelf(s) { filter.chip='all'; filter.q=s; filter.page=0; Nav.go('collection'); },
  addAccessory() {
    const name = document.getElementById('accName')?.value?.trim();
    if (!name) return;
    const ponyId = document.getElementById('accPony')?.value || '';
    S.accessories = S.accessories || [];
    S.accessories.push({ id: uid(), name, ponyIds: ponyId ? [ponyId] : [], addedAt: Date.now() });
    Store.save(); Render.settings(); Toast.show('Accessory added ✨');
  },
  delAccessory(id) {
    S.accessories = (S.accessories || []).filter(a=>a.id!==id);
    Store.save(); Render.settings();
  },
  importCsv(file) {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => { try { Csv.import(r.result); } catch { Toast.show('Invalid CSV file'); } };
    r.readAsText(file);
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
  Splash.run(() => {
    if (!S.onboardingDone) {
      document.getElementById('onboard').classList.remove('hide');
      document.getElementById('app').style.display = 'none';
    } else {
      document.getElementById('onboard').classList.add('hide');
      document.getElementById('app').style.display = 'flex';
      Render.all();
      Install.maybeShow();
    }
  });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js?v=6').catch(()=>{});
}
boot();
