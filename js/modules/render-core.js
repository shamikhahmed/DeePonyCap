'use strict';
// Core Render object with shared helpers, stable, wishlist, filteredPonies, shelfOrganize
let filter = { chip:'all', q:'', sort:'name', page:0 };
let logFilter = { logSection:'g1', logSort:'name', logView:'register', mcdCountry:'all' };
let accFilter = { q:'', cat:'all', sort:'name' };

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
    try {
    const el = document.getElementById('tab-stable');
    if (el && !S.ponies) { el.innerHTML = '<div class="pony-skel" style="height:120px;margin-bottom:12px"></div>'.repeat(3); return; }
    const n = S.ponies.length;
    const name = S.collector.name || 'Collector';
    const gens = [1,2,3,4,5].map(g => ({g, c: S.ponies.filter(p=>p.generation===g).length}));
    const total = n || 1;
    const bars = gens.map(x => `<span style="width:${(x.c/total*100)||0}%;background:var(--g${x.g})"></span>`).join('');
    const pills = gens.map(x => `<button type="button" class="pill g${x.g}" onclick="Nav.goLog('g${x.g}')">G${x.g} ${GEN_EMOJI[x.g]} ${x.c}</button>`).join('');
    const otherN = S.ponies.filter(p => (p.category || 'mlp') === 'other').length;
    const mcdN = S.ponies.filter(p => (p.category || '') === 'mcdonalds' || p.mcdCountry).length;
    const extraPills = `${otherN ? `<button type="button" class="pill" style="background:var(--coral);color:#fff" onclick="Nav.goLog('other')">🐴 Other ${otherN}</button>` : ''}${mcdN ? `<button type="button" class="pill" style="background:#F59E0B;color:#1F2937" onclick="Nav.goLog('mcd')">🍟 McD ${mcdN}</button>` : ''}`;
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
        <button type="button" class="btn-g" style="width:100%;margin-top:8px" onclick="ParentGate.run('Export backup',Backup.export)">Export Backup Now</button>
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
      ${!n ? `<div style="text-align:center;padding:48px 24px"><div style="font-size:64px;margin-bottom:16px">🦄</div><div style="font-size:20px;font-weight:800;margin-bottom:8px">Your Stable is Empty</div><div style="font-size:14px;color:var(--text-soft);max-width:280px;margin:0 auto 24px">Start building your collection — add your first pony or try a demo to see how it works.</div><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><button type="button" class="btn-g" onclick="UI.openAddPony()">+ Add Pony</button><button type="button" class="btn-d" onclick="DemoSeed.load()">Try Demo ✨</button></div></div>` : ''}`;
    Anim.countUp(document.getElementById('counterNum'), n);
    } catch (err) {
      console.error('[DeePonyCap] render error (stable)', err);
      const el = document.getElementById('tab-stable');
      if (el) el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text-soft)">Something went wrong loading your stable.<br><button type="button" class="btn-g" style="margin-top:12px" onclick="Render.all()">Try again</button></div>';
    }
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
    try {
    const el = document.getElementById('tab-logs');
    if (el && !S.ponies) { el.innerHTML = '<div class="pony-skel" style="height:120px;margin-bottom:12px"></div>'.repeat(3); return; }
    if (!window.CollectorSuite) {
      if (el) el.innerHTML = '<div class="empty"><span>📋</span><p>Loading logs…</p></div>';
      return;
    }
    const merged = { ...filter, ...logFilter };
    CollectorSuite.renderLogs(document.getElementById('tab-logs'), S, merged, (p) => this.ponyCard(p));
    } catch (err) {
      console.error('[DeePonyCap] render error (logs)', err);
      const el = document.getElementById('tab-logs');
      if (el) el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text-soft)">Something went wrong loading logs.<br><button type="button" class="btn-g" style="margin-top:12px" onclick="Render.all()">Try again</button></div>';
    }
  },
  ponyMap() {
    if (!window.CollectorSuite) return;
    CollectorSuite.renderPonyMap(document.getElementById('tab-map'), S, ponyPhoto);
  },
  collection() { this.logs(); },
  wishlist() {
    const groups = {must:[],want:[],someday:[]};
    S.wishlist.forEach(w => (groups[w.priority]||groups.someday).push(w));
    const emptyState = S.wishlist.length === 0 ? `<div class="wish-empty-state"><div class="wish-empty-icon">🦄</div><div class="wish-empty-text">✨ Your dream stable awaits ✨</div><div class="wish-empty-sub">Add ponies you'd love to have!</div></div>` : '';
    const renderGroup = (title, key, items) => items.length ? `<div class="section-title">${title}</div>`+
      items.map(w=>{
        const ph = w.photo || (w.photos && w.photos[0]) || '';
        const target = w.targetPrice != null ? `$${Number(w.targetPrice).toLocaleString()}` : '';
        return `<div class="wish-item ${key}">
        ${ph ? `<div class="pony-img" style="height:120px;margin-bottom:10px;border-radius:16px;overflow:hidden"><img src="${ph}" alt="" style="width:100%;height:100%;object-fit:cover"></div>` : ''}
        <div style="font-weight:800;margin-bottom:4px">${this.esc(w.name)} <span class="badge ${GEN_COLORS[w.generation]||'g5'}">G${w.generation}</span>${target ? ` <span class="badge" style="background:var(--mint);color:#1F2937">🎯 ${target}</span>` : ''}</div>
        <div style="font-size:.8rem;color:var(--text-soft);margin-bottom:8px">${TYPE_LABELS[w.type]||w.type} ${w.notes? '· '+this.esc(w.notes):''}</div>
        <div style="display:flex;gap:8px">
          <button type="button" class="btn-g" onclick="UI.gotWish('${w.id}')">Got it! 🎉</button>
          <button type="button" class="btn-d" onclick="UI.delWish('${w.id}')">Delete</button>
        </div></div>`;
      }).join('') : '';
    document.getElementById('tab-wishlist').innerHTML = `
      <h1 class="greet">💫 My Wishlist</h1>
      <p class="sub">Ponies you dream of having · ${S.wishlist.length} on your list ✨</p>
      ${renderGroup('🔴 Must Have','must',groups.must)}
      ${renderGroup('🟡 Want','want',groups.want)}
      ${renderGroup('🟢 Someday','someday',groups.someday)}
      ${emptyState}
      <details style="margin-top:16px"><summary class="btn-p" style="cursor:pointer;display:block;text-align:center;padding:12px;border-radius:12px;list-style:none">➕ Add to Wishlist</summary>
      <div class="card" style="margin-top:8px">
        <div class="fg"><label class="fl">Pony name</label><input class="inp" id="wName" list="wishNames" placeholder="Dream pony name..." oninput="UI.updateWishSuggest(this.value)"></div>
        <datalist id="wishNames"></datalist>
        <div id="wishDbHint" style="font-size:.75rem;color:var(--text-soft);margin:-6px 0 8px"></div>
        <div class="fg"><label class="fl">Generation</label><select class="sel" id="wGen" onchange="UI.updateWishSuggest(document.getElementById('wName').value)">${[1,2,3,4,5].map(g=>`<option value="${g}">G${g}</option>`).join('')}</select></div>
        <div class="fg"><label class="fl">Type</label><select class="sel" id="wType">${TYPE_KEYS.map(t=>`<option value="${t}">${TYPE_LABELS[t]}</option>`).join('')}</select></div>
        <div class="fg"><label class="fl">Priority</label><select class="sel" id="wPri"><option value="must">🔴 Must Have</option><option value="want">🟡 Want</option><option value="someday">🟢 Someday</option></select></div>
        <div class="fg-row">
          <div class="fg"><label class="fl">Target price ($)</label><input class="inp" type="number" step="0.01" id="wTarget" placeholder="optional"></div>
        </div>
        <div class="fg"><label class="fl">Reference photo</label>${PhotoPicker.html('wishPhoto', '', { multiple: false })}</div>
        <div class="fg"><label class="fl">Notes</label><input class="inp" id="wNotes" placeholder="Where to find, etc."></div>
        <button type="button" class="btn-p" onclick="UI.addWish()">Add to Wishlist ✨</button>
      </div></details>`;
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
      html += `<div class="shelf-sec shelf-drop" data-shelf="${this.esc(s)}" ondragover="UI.shelfDragOver(event)" ondragleave="UI.shelfDragLeave(event)" ondrop="UI.shelfDrop(event,'${js}')"><div class="shelf-hdr"><span role="button" tabindex="0" aria-label="Filter by shelf ${this.esc(s)}" onclick="UI.filterShelf('${js}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();UI.filterShelf('${js}')}">🗄️ ${this.esc(s)} — ${shelves[s].length} ponies</span>
        <span class="shelf-actions">
          <button type="button" class="btn-g shelf-btn" onclick="UI.shareShelf('${js}')">Share</button>
          <button type="button" class="btn-g shelf-btn" onclick="UI.renameShelf('${js}')">Rename</button>
        </span></div>
        <div class="row-scroll">${shelves[s].map(p=>this.shelfPonyCard(p)).join('')}</div></div>`;
    });
    if (shelves.__unshelved__) {
      html += `<div class="shelf-sec shelf-drop" data-shelf="" ondragover="UI.shelfDragOver(event)" ondragleave="UI.shelfDragLeave(event)" ondrop="UI.shelfDrop(event,'')"><div class="shelf-hdr">📦 Unshelved — ${shelves.__unshelved__.length}</div>
        <div class="row-scroll">${shelves.__unshelved__.map(p=>this.shelfPonyCard(p)).join('')}</div></div>`;
    }
    if (!S.ponies.length) {
      html += `<div style="text-align:center;padding:48px 24px"><div style="font-size:48px;margin-bottom:12px">🗂️</div><div style="font-size:17px;font-weight:700;margin-bottom:8px">No Shelves Yet</div><div style="font-size:14px;color:var(--text-soft);max-width:260px;margin:0 auto">Set a shelf name when you add or edit a pony to organize your collection.</div></div>`;
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
      <button type="button" class="share-card-btn" onclick="Render.exportShareCard()">🖼️ Save Collection Card (PNG)</button>`;
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
      return `<div class="card" style="margin-bottom:12px;cursor:pointer" role="button" tabindex="0" aria-label="${this.esc(a.name)} — ${this.esc(a.category||'accessory')}" onclick="UI.openAccessory('${a.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();UI.openAccessory('${a.id}')}">
        ${ph ? `<div style="height:140px;border-radius:16px;overflow:hidden;margin-bottom:10px"><img src="${ph}" alt="${this.esc(a.name)}" style="width:100%;height:100%;object-fit:cover"></div>` : `<div style="height:100px;border-radius:16px;background:linear-gradient(135deg,var(--pink-lighter),var(--purple-light));display:flex;align-items:center;justify-content:center;font-size:2rem;margin-bottom:10px" aria-hidden="true">🎀</div>`}
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
        <div class="fg"><label class="fl">Photo</label>${PhotoPicker.html('accPhoto', '', { multiple: false })}</div>
        <button type="button" class="btn-p" onclick="UI.addAccessoryFromGallery()">Add Accessory ✨</button>
      </div>
      ${items.length ? cards : '<div style="text-align:center;padding:32px 24px"><div style="font-size:48px;margin-bottom:12px">🎀</div><div style="font-size:17px;font-weight:700;margin-bottom:8px">No Accessories Yet</div><div style="font-size:14px;color:var(--text-soft);max-width:260px;margin:0 auto">Add playsets, vehicles, and accessories to link them to your ponies above.</div></div>'}`;
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
        <button type="button" class="btn-g" style="width:100%;margin-top:8px" onclick="UI.compressAllPhotos()">Compress all photos</button>
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
        <button type="button" class="btn-g" style="width:100%;margin-bottom:8px" onclick="ParentGate.setup()">${pinOn ? 'Change PIN' : 'Set Parent PIN'}</button>
        ${pinOn ? '<button type="button" class="btn-d" style="width:100%" onclick="ParentGate.disable()">Remove Parent Lock</button>' : ''}
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
        <button type="button" class="btn-g" style="width:100%;margin-bottom:8px" onclick="UI.bulkMoveShelf()">Move shelf → shelf</button>
        <button type="button" class="btn-g" style="width:100%;margin-bottom:8px" onclick="UI.bulkFavoriteShelf()">Favorite all on a shelf</button>
        <button type="button" class="btn-g" style="width:100%;margin-bottom:8px" onclick="UI.bulkArchiveShelf()">Mark shelf as extras (not originals)</button>
        <button type="button" class="btn-g" style="width:100%" onclick="document.getElementById('g4BulkSettings').click()">📦 G4 bulk photo import</button>
        <input type="file" id="g4BulkSettings" accept="image/*" multiple style="display:none" onchange="UI.runG4BulkImport([...this.files]);this.value=''">
      </div>
      <div class="card">
        <div class="section-title">Backup & Restore 💾</div>
        <p style="font-size:.85rem;color:var(--text-soft);margin-bottom:12px">Export your full collection to move to a new device. Import merges into this app.</p>
        <button type="button" class="btn-p" onclick="ParentGate.run('Export backup',Backup.export)">Export Backup</button>
        <button type="button" class="btn-g" style="width:100%;margin-top:10px" onclick="ParentGate.run('Import backup',()=>document.getElementById('importIn').click())">Import Backup</button>
        <input type="file" id="importIn" accept=".deepony,.json,application/json" style="display:none" onchange="if(this.files[0])Backup.import(this.files[0]);this.value=''">
        <button type="button" class="btn-g" style="width:100%;margin-top:10px" onclick="ParentGate.run('Export CSV',Csv.export)">Export CSV (no photos)</button>
        <button type="button" class="btn-g" style="width:100%;margin-top:10px" onclick="ParentGate.run('Import CSV',()=>document.getElementById('csvIn').click())">Import CSV</button>
        <input type="file" id="csvIn" accept=".csv,text/csv" style="display:none" onchange="UI.importCsv(this.files[0]);this.value=''">
        <button type="button" class="btn-g" style="width:100%;margin-top:10px" onclick="UI.restoreRecovery()">Recover auto-snapshot</button>
      </div>
      <div class="card">
        <div class="section-title">About</div>
        <p style="font-size:.85rem;color:var(--text-soft)">DeePonyCap v${ver} · ${S.ponies.length} ponies</p>
        <button type="button" class="btn-g" style="margin-top:10px" onclick="if(confirm('Replay onboarding?')){S.onboardingDone=false;Store.save();location.reload()}">Replay Onboarding</button>
      </div>`;
  }
};
