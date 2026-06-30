'use strict';
let editingId = null;
let detailId = null;
let formState = {};

const UI = {
  _lastFocus: null,
  openSheet(html) {
    this._lastFocus = document.activeElement;
    document.getElementById('sheetBody').innerHTML = html;
    document.getElementById('sheetBg').classList.add('on');
    document.getElementById('sheet').classList.add('on');
    const sheetEl = document.getElementById('sheet');
    const firstFocusable = sheetEl.querySelector('button, input, select, [tabindex="0"]');
    if (firstFocusable) setTimeout(() => firstFocusable.focus(), 50);
  },
  closeSheet() {
    document.getElementById('sheetBg').classList.remove('on');
    document.getElementById('sheet').classList.remove('on');
    editingId = null; detailId = null;
    if (this._lastFocus && typeof this._lastFocus.focus === 'function') {
      setTimeout(() => this._lastFocus.focus(), 50);
    }
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
    const photoGrid = photos.map((ph,i)=>`<div class="photo-thumb${i===0?' primary':''}" onclick="UI.setPrimaryPhoto(${i})"><img src="${ph}" alt=""><button type="button" class="photo-rm" aria-label="Remove photo" onclick="event.stopPropagation();UI.removePhoto(${i})">✕</button></div>`).join('');
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
      <div class="photo-row">${photoGrid}</div>
      ${PhotoPicker.html('photoForm', 'UI.onPhoto(event)', { multiple: true })}
      ${cat === 'mlp' && f.generation === 4 ? `<div class="g4-bulk-panel"><label><input type="file" id="g4BulkIn" accept="image/*" multiple style="display:none" onchange="UI.onG4Bulk(event)"><span onclick="document.getElementById('g4BulkIn').click()">📦 G4 bulk photo import</span></label><p style="margin:6px 0 0;font-size:.75rem;color:var(--text-soft)">Select multiple G4 photos — matches names from filenames or creates new ponies.</p></div>` : ''}
      <p class="photo-hint">${photos.length?`${photos.length} photo(s) — tap star photo to set primary`:'Add up to 5 photos with camera or gallery'}</p>
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
        <button type="button" class="btn-g" onclick="UI.closeSheet()">Cancel</button>
        <button type="button" class="btn-p" onclick="UI.savePony()">Save Pony ✨</button>
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
    return `<div class="detail-photo detail-photo-gen g${p.generation}" style="background:linear-gradient(135deg,var(--${g}),var(--pink-lighter))">${emoji}</div>
      ${PhotoPicker.html('detailPhoto', 'UI.onDetailPhoto(event)', { multiple: true })}`;
  },
  openDetail(id) {
    const p = S.ponies.find(x=>x.id===id);
    if (!p) return;
    detailId = id;
    const photos = p.photos?.length ? p.photos : (p.photo ? [p.photo] : []);
    const gallery = photos.length
      ? `<div class="detail-gallery">${photos.map((ph,i)=>`<img src="${ph}" class="detail-photo${i===0?' main':''}" onclick="UI.openDetailPhoto(${i})" alt="">`).join('')}</div>
        <div style="margin-bottom:12px">${PhotoPicker.html('detailPhoto', 'UI.onDetailPhoto(event)', { multiple: true })}</div>`
      : this.detailPhotoPlaceholder(p);
    const comps = (p.soldComps || []).slice(-5).reverse();
    const compHtml = S.settings?.collectorMode ? `
      <div class="section-title" style="margin-top:12px">Market comps ($)</div>
      ${comps.length ? comps.map(c => `<div class="detail-row"><span>${c.source || 'Manual'} · ${c.date || '—'}</span><span>$${Number(c.amount).toLocaleString()}</span></div>`).join('') : '<p style="font-size:.85rem;color:var(--text-soft)">No sold comps logged yet</p>'}
      <button type="button" class="btn-g" style="width:100%;margin-top:8px" onclick="UI.addSoldComp('${id}')">+ Log sold comp</button>` : '';
    this.openSheet(`${Render.sheetHdr(Render.esc(p.name), 'UI.closeSheet()')}
      ${gallery}
      ${[['Generation',`G${p.generation} ${GEN_EMOJI[p.generation]}`],['Type',TYPE_LABELS[p.type]],['Colour',p.colour],['Size',SIZE_LABELS[p.size]],['Shelf',p.shelf||'—'],['Original',p.isOriginal?'Yes':'Extra'],['Condition',COND_LABELS[p.condition]],['Paid',p.purchaseValue!=null?`$${p.purchaseValue}`:'—'],['Est. Value',p.estimatedValue!=null?`$${p.estimatedValue}`:'—'],['Favourite',p.isFavourite?'❤️':'—'],['Most Played',p.isMostPlayed?'🎮':'—'],['Acquired',p.acquiredDate||'—'],['Notes',p.notes||'—']].map(([k,v])=>`<div class="detail-row"><span>${k}</span><span>${Render.esc(String(v))}</span></div>`).join('')}
      ${compHtml}
      <div class="detail-actions">
        <button type="button" class="btn-p" onclick="UI.openEdit('${id}')">Edit</button>
        <button type="button" class="btn-g" onclick="UI.sharePony('${id}')">Share</button>
        <button type="button" class="btn-d" onclick="UI.deletePony('${id}')">Delete</button>
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
    Store.save();
    if (window.Excellence) Excellence.openPassport(detailId);
    else this.openDetail(detailId);
  },
  async onPassportPhoto(e) { await this.onDetailPhoto(e); },
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
    if (!S.settings) S.settings = {};
    S.settings.hapticsEnabled = !S.settings.hapticsEnabled;
    Store.save();
    if (S.settings?.hapticsEnabled) Haptic.tap();
    Render.settings();
    Toast.show(S.settings?.hapticsEnabled ? 'Haptics on ✨' : 'Haptics off');
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
    const file = PhotoPicker.firstFile('wishPhoto');
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
    const file = PhotoPicker.firstFile('accPhoto');
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
      <button type="button" class="btn-d" style="width:100%;margin-top:12px" onclick="UI.delAccessory('${a.id}');UI.closeSheet()">Remove</button>`);
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
