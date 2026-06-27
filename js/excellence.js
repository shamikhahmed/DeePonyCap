'use strict';
/**
 * DeePonyCap Excellence — insights, search, premium views, extended achievements.
 * Loaded after app.js; extends globals without breaking the monolith.
 */
const Excellence = (() => {
  const ACC_CATEGORIES = ['playset', 'vehicle', 'accessory', 'other'];

  function fuzzyScore(query, text) {
    const q = (query || '').trim().toLowerCase();
    const t = (text || '').trim().toLowerCase();
    if (!q) return 1;
    if (!t) return 0;
    if (t.includes(q)) return 10 + (t.startsWith(q) ? 5 : 0);
    let qi = 0;
    for (let i = 0; i < t.length && qi < q.length; i++) {
      if (t[i] === q[qi]) qi++;
    }
    return qi === q.length ? 4 : 0;
  }

  function matchPony(p, q) {
    if (!q) return true;
    const fields = [p.name, p.colour, p.hairColour, p.cutieMark, p.brand, p.shelf, p.notes, p.catalogNumber, TYPE_LABELS[p.type], `g${p.generation}`, p.mcdCountry, p.mcdYear];
    if (window.ponySearchTerms) {
      ponySearchTerms(p.generation, p.name).forEach(t => fields.push(t));
    } else if (window.PONY_DB && window.PONY_DB[p.generation]) {
      const nl = (p.name || '').toLowerCase();
      if (window.PONY_DB[p.generation].some(n => n.toLowerCase() === nl)) fields.push('official');
    }
    return fields.some(f => fuzzyScore(q, String(f || '')) > 0);
  }

  function computeInsights() {
    const ponies = S.ponies || [];
    const n = ponies.length;
    const gens = [1, 2, 3, 4, 5].map(g => ({
      g, c: ponies.filter(p => p.generation === g).length,
    }));
    const topGen = gens.reduce((a, b) => (b.c > a.c ? b : a), { g: 0, c: 0 });
    const favGen = gens.reduce((a, b) => {
      const fc = ponies.filter(p => p.generation === b.g && p.isFavourite).length;
      const ac = ponies.filter(p => p.generation === a.g && p.isFavourite).length;
      return fc > ac ? { g: b.g, c: fc } : a;
    }, { g: 0, c: 0 });
    const shelves = {};
    ponies.forEach(p => {
      const s = (p.shelf || '').trim() || 'Unshelved';
      shelves[s] = (shelves[s] || 0) + 1;
    });
    const topShelf = Object.entries(shelves).sort((a, b) => b[1] - a[1])[0];
    const orig = ponies.filter(p => p.isOriginal).length;
    const wishOwned = (S.wishlist || []).filter(w =>
      ponies.some(p => p.name.toLowerCase() === w.name.toLowerCase() && p.generation === w.generation)
    ).length;
    const wishPct = S.wishlist?.length ? Math.round((wishOwned / S.wishlist.length) * 100) : 0;

    const timeline = [...ponies]
      .filter(p => p.acquiredDate || p.createdAt)
      .sort((a, b) => new Date(a.acquiredDate || a.createdAt) - new Date(b.acquiredDate || b.createdAt));

    const growth = [];
    const byMonth = {};
    timeline.forEach(p => {
      const d = p.acquiredDate || new Date(p.createdAt).toISOString().slice(0, 10);
      const key = d.slice(0, 7);
      byMonth[key] = (byMonth[key] || 0) + 1;
    });
    let running = 0;
    Object.keys(byMonth).sort().forEach(m => {
      running += byMonth[m];
      growth.push({ month: m, added: byMonth[m], total: running });
    });

    return {
      n, topGen, favGen, topShelf, orig, extras: n - orig,
      origPct: n ? Math.round((orig / n) * 100) : 0,
      wishPct, wishOwned, wishTotal: S.wishlist?.length || 0,
      timeline, growth,
      cond: ['mint', 'good', 'played', 'loved'].map(c => ({
        c, n: ponies.filter(p => p.condition === c).length,
      })),
    };
  }

  function suggestions() {
    const out = [];
    if (window.collectionGoalProgress) {
      ['g4_mane6', 'g1_babies'].forEach(id => {
        const g = collectionGoalProgress(id, S.ponies);
        if (g && g.missing?.length) {
          out.push({ type: 'goal', title: g.title, items: g.missing, emoji: g.emoji });
        }
      });
    }
    (S.wishlist || []).slice(0, 3).forEach(w => {
      if (!S.ponies.some(p => p.name.toLowerCase() === w.name.toLowerCase() && p.generation === w.generation)) {
        out.push({ type: 'wishlist', title: w.name, sub: `G${w.generation} · ${w.priority}`, id: w.id });
      }
    });
    return out.slice(0, 5);
  }

  function extendAchievements() {
    if (!window.Achievements) return;
    const extra = [
      { id: 'first_fav', ic: '❤️', t: 'First Favourite — marked a fave', test: () => S.ponies.some(p => p.isFavourite) },
      { id: 'first_orig', ic: '✨', t: 'First Original — not an extra', test: () => S.ponies.some(p => p.isOriginal) },
      { id: 'first_mint', ic: '🌟', t: 'Mint Condition — first mint pony', test: () => S.ponies.some(p => p.condition === 'mint') },
      { id: 'ten', ic: '🔟', t: 'Growing Stable — 10 ponies', test: () => S.ponies.length >= 10 },
      { id: 'twentyfive', ic: '📦', t: 'Packed Stable — 25 ponies', test: () => S.ponies.length >= 25 },
      { id: 'mane6', ic: '🌈', t: 'Complete Mane Six', test: () => {
        const need = ['Twilight Sparkle', 'Rainbow Dash', 'Pinkie Pie', 'Applejack', 'Rarity', 'Fluttershy'];
        const owned = new Set(S.ponies.filter(p => p.generation === 4).map(p => p.name.toLowerCase()));
        return need.every(n => owned.has(n.toLowerCase()));
      }},
      { id: 'g1babies', ic: '👶', t: 'G1 Baby Collector — 3+ babies', test: () =>
        S.ponies.filter(p => p.generation === 1 && /^baby /i.test(p.name)).length >= 3 },
      { id: 'accessory3', ic: '🎀', t: 'Accessory Expert — 3+ items', test: () => (S.accessories || []).length >= 3 },
      { id: 'wishmaster', ic: '💫', t: 'Wishlist Master — 10+ dreams', test: () => S.wishlist.length >= 10 },
      { id: 'shelf_org', ic: '🗂️', t: 'Shelf Organizer — 5+ shelves', test: () =>
        new Set(S.ponies.map(p => p.shelf).filter(Boolean)).size >= 5 },
      { id: 'photo1', ic: '📷', t: 'Photographer — first pony photo', test: () =>
        S.ponies.some(p => ponyPhoto(p)) },
      { id: 'veteran', ic: '🏅', t: 'Collector Veteran — 2+ years', test: () => {
        const since = S.collector?.since;
        if (!since) return false;
        return (Date.now() - new Date(since).getTime()) > 730 * 86400000;
      }},
    ];
    const ids = new Set(Achievements.defs.map(d => d.id));
    extra.forEach(e => { if (!ids.has(e.id)) Achievements.defs.push(e); });
  }

  function insightsHtml() {
    const ins = computeInsights();
    const E = Render.esc;
    return `<div class="card excellence-insights">
      <div class="section-title">Collection insights</div>
      <div class="insight-grid">
        <div class="insight-cell"><span class="insight-k">Top generation</span><strong>G${ins.topGen.g} ${GEN_EMOJI[ins.topGen.g]} (${ins.topGen.c})</strong></div>
        <div class="insight-cell"><span class="insight-k">Fave generation</span><strong>G${ins.favGen.g} (${ins.favGen.c} ❤️)</strong></div>
        <div class="insight-cell"><span class="insight-k">Top shelf</span><strong>${ins.topShelf ? E(ins.topShelf[0]) + ' (' + ins.topShelf[1] + ')' : '—'}</strong></div>
        <div class="insight-cell"><span class="insight-k">Originals</span><strong>${ins.origPct}% (${ins.orig}/${ins.n})</strong></div>
        <div class="insight-cell"><span class="insight-k">Wishlist progress</span><strong>${ins.wishOwned}/${ins.wishTotal} (${ins.wishPct}%)</strong></div>
      </div>
    </div>`;
  }

  function suggestionsHtml() {
    const items = suggestions();
    if (!items.length) return '';
    const E = Render.esc;
    return `<div class="card">
      <div class="section-title">Smart suggestions ✨</div>
      ${items.map(s => {
        if (s.type === 'goal') {
          return `<div class="suggest-row"><span>${s.emoji} Missing from ${E(s.title)}:</span> <strong>${s.items.map(E).join(', ')}</strong></div>`;
        }
        return `<div class="suggest-row"><span>💫 Wishlist:</span> <strong>${E(s.title)}</strong> <span style="opacity:.7">${E(s.sub)}</span></div>`;
      }).join('')}
    </div>`;
  }

  function renderTimeline() {
    const ins = computeInsights();
    const E = Render.esc;
    const rows = ins.timeline.length ? ins.timeline.map(p => {
      const d = p.acquiredDate || new Date(p.createdAt).toISOString().slice(0, 10);
      return `<div class="timeline-row cap-reveal">
        <div class="timeline-dot g${p.generation}"></div>
        <div class="timeline-body">
          <strong>${E(p.name)}</strong> <span class="badge ${GEN_COLORS[p.generation]}">G${p.generation}</span>
          <div style="font-size:.8rem;color:var(--text-soft)">${d}${p.shelf ? ' · ' + E(p.shelf) : ''}</div>
        </div>
      </div>`;
    }).join('') : '<div class="empty"><span>📅</span><p>Add acquisition dates to build your collection journey.</p></div>';

    document.getElementById('tab-stats').innerHTML = `
      <button type="button" class="btn-g" style="margin-bottom:12px" onclick="Render.stats()">← Back to Stats</button>
      <h1 class="greet">📅 Collection Timeline</h1>
      <p class="sub">When your ponies joined the stable</p>
      <div class="card">${rows}</div>`;
  }

  function renderStorybook() {
    const ponies = [...(S.ponies || [])].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    const E = Render.esc;
    const pages = ponies.length ? ponies.map(p => {
      const ph = ponyPhoto(p);
      const emoji = GEN_EMOJI[p.generation] || '🦄';
      const img = ph
        ? `<img src="${ph}" alt="" class="storybook-photo" loading="lazy">`
        : `<div class="storybook-photo storybook-emoji g${p.generation}">${emoji}</div>`;
      return `<div class="storybook-page">
        ${img}
        <h3>${E(p.name)}</h3>
        <p>G${p.generation} ${TYPE_LABELS[p.type] || ''} · ${E(p.colour || '—')}</p>
        ${p.notes ? `<p class="storybook-note">"${E(p.notes)}"</p>` : ''}
      </div>`;
    }).join('') : '<div class="empty"><span>📖</span><p>Your storybook is empty — add ponies to fill the album!</p></div>';

    document.getElementById('tab-stats').innerHTML = `
      <button type="button" class="btn-g" style="margin-bottom:12px" onclick="Render.stats()">← Back to Stats</button>
      <h1 class="greet">📖 Collection Storybook</h1>
      <p class="sub">${S.collector?.name || 'My'}'s magical album · ${ponies.length} pages</p>
      <button type="button" class="btn-p" style="width:100%;margin-bottom:14px" onclick="Excellence.exportStorybookPrint()">🖨️ Print / Save as PDF</button>
      <div class="storybook-scroll">${pages}</div>`;
  }

  function exportStorybookPrint() {
    const ponies = [...(S.ponies || [])].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    const name = S.collector?.name || 'My Collection';
    const E = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const pages = ponies.map(p => {
      const ph = ponyPhoto(p);
      const emoji = GEN_EMOJI[p.generation] || '🦄';
      const img = ph
        ? `<img src="${ph}" alt="" class="print-photo">`
        : `<div class="print-emoji g${p.generation}">${emoji}</div>`;
      return `<article class="print-page">
        ${img}
        <h2>${E(p.name)}</h2>
        <p class="print-meta">Generation ${p.generation} · ${E(TYPE_LABELS[p.type] || p.type)} · ${E(p.colour || '—')}</p>
        ${p.notes ? `<p class="print-note">"${E(p.notes)}"</p>` : ''}
      </article>`;
    }).join('');
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${E(name)} — DeePonyCap Storybook</title>
<style>
@page { size: A4 portrait; margin: 14mm; }
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1F2937;background:#fff}
.print-cover{text-align:center;padding:40mm 10mm 20mm;page-break-after:always}
.print-cover h1{font-size:28pt;color:#EC4899;margin-bottom:8mm}
.print-cover p{font-size:12pt;color:#6B7280}
.print-page{page-break-after:always;padding:8mm 0;text-align:center;min-height:240mm;display:flex;flex-direction:column;align-items:center;justify-content:center}
.print-photo{max-width:100%;max-height:140mm;object-fit:contain;border-radius:12px;margin-bottom:10mm}
.print-emoji{font-size:72pt;height:80mm;display:flex;align-items:center;justify-content:center;margin-bottom:10mm}
.print-page h2{font-size:20pt;margin-bottom:4mm;color:#9333EA}
.print-meta{font-size:11pt;color:#6B7280;margin-bottom:6mm}
.print-note{font-style:italic;font-size:11pt;color:#4B5563;max-width:140mm;margin:0 auto}
.print-footer{position:fixed;bottom:8mm;left:0;right:0;text-align:center;font-size:8pt;color:#9CA3AF}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="print-cover"><h1>📖 ${E(name)}'s Storybook</h1><p>${ponies.length} magical ponies · DeePonyCap · ${new Date().toLocaleDateString()}</p></div>
${pages || '<p style="text-align:center;padding:40mm">No ponies in collection yet.</p>'}
<div class="print-footer">Made with DeePonyCap ✨ · ${new Date().toLocaleDateString()}</div>
</body></html>`;
    const win = window.open('', '_blank', 'noopener');
    if (!win) { Toast.show('Allow pop-ups to print storybook'); return; }
    win.document.write(html);
    win.document.close();
    win.onload = () => { setTimeout(() => win.print(), 400); };
    Toast.show('Opening print dialog…');
  }

  function openPassport(id) {
    const p = S.ponies.find(x => x.id === id);
    if (!p) return;
    detailId = id;
    const E = Render.esc;
    const ph = ponyPhoto(p);
    const emoji = GEN_EMOJI[p.generation] || '🦄';
    const linkedAcc = (S.accessories || []).filter(a => (a.ponyIds || []).includes(id));
    const milestones = [];
    if (p.isFavourite) milestones.push('❤️ Favourite');
    if (p.isMostPlayed) milestones.push('🎮 Most played');
    if (p.isOriginal) milestones.push('✨ Original');
    if (p.condition === 'mint') milestones.push('🌟 Mint');
    const hero = ph
      ? `<img src="${ph}" alt="" class="passport-hero" loading="lazy">`
      : `<div class="passport-hero passport-emoji g${p.generation}">${emoji}</div>`;

    const cat = window.CollectorSuite ? CollectorSuite.ponyCategory(p) : 'mlp';
    const badge = window.CollectorSuite ? CollectorSuite.ponyBadge(p) : `G${p.generation}`;
    const year = window.CollectorSuite ? CollectorSuite.acquiredYear(p) : (p.acquiredDate || '').slice(0, 4);
    const loc = p.shelf ? `🗄️ ${p.shelf}` : '📦 Unshelved';
    const rows = [
      ['Location', loc],
      ['Category', CATEGORY_LABELS[cat] || cat],
      cat === 'mlp' ? ['Generation', `G${p.generation} ${emoji}`] : null,
      cat === 'other' ? ['Brand', p.brand || '—'] : null,
      cat === 'mcdonalds' ? ['McDonald\'s', `${p.mcdCountry || '—'} · ${p.mcdYear || '—'}`] : null,
      ['Log #', p.catalogNumber || '—'],
      ['Type', TYPE_LABELS[p.type] || p.type],
      ['Body colour', p.colour || '—'],
      ['Hair colour', p.hairColour || '—'],
      ['Size', SIZE_LABELS[p.size] || p.size],
      ['Cutie mark', p.cutieMark || '—'],
      ['Year acquired', year || '—'],
      ['Condition', COND_LABELS[p.condition]],
    ].filter(Boolean);

    UI.openSheet(`${Render.sheetHdr(E(p.name) + ' — Passport', 'UI.closeSheet()')}
      ${hero}
      <div style="margin-bottom:12px">${PhotoPicker.html('passportPhoto', 'UI.onPassportPhoto(event)', { multiple: true })}</div>
      <div class="passport-location card" style="margin-bottom:12px;padding:12px 14px">
        <div style="font-size:.75rem;font-weight:800;color:var(--text-soft);text-transform:uppercase;letter-spacing:.04em">Whereabouts</div>
        <div style="font-size:1.1rem;font-weight:800;margin-top:4px">${E(loc)}</div>
        <button type="button" class="btn-g" style="width:100%;margin-top:10px" onclick="UI.closeSheet();Nav.go('map')">🗺️ View on Pony Map</button>
      </div>
      <div class="passport-badges">${milestones.map(m => `<span class="badge">${m}</span>`).join('') || '<span style="color:var(--text-soft);font-size:.85rem">No milestones yet</span>'}
      </div>
      ${rows.map(([k, v]) =>
        `<div class="detail-row"><span>${k}</span><span>${E(String(v))}</span></div>`).join('')}
      ${linkedAcc.length ? `<div class="section-title" style="margin-top:12px">Accessories</div>${linkedAcc.map(a => `<div class="detail-row"><span>${E(a.name)}</span><span>🎀</span></div>`).join('')}` : ''}
      ${p.notes ? `<div class="passport-notes"><strong>Notes</strong><p>${E(p.notes)}</p></div>` : ''}
      <div class="detail-actions">
        <button class="btn-p" onclick="UI.openEdit('${id}')">Edit</button>
        <button class="btn-g" onclick="Excellence.exportPassportCard('${id}')">Share card</button>
        <button class="btn-g" onclick="UI.clonePony('${id}')">Clone</button>
        <button class="btn-d" onclick="UI.deletePony('${id}')">Delete</button>
      </div>`);
  }

  function exportPassportCard(id) {
    const p = S.ponies.find(x => x.id === id);
    if (!p) return;
    const canvas = document.createElement('canvas');
    canvas.width = 500; canvas.height = 320;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 500, 320);
    grad.addColorStop(0, '#FFF5F8'); grad.addColorStop(1, '#E9D5FF');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 500, 320);
    ctx.fillStyle = '#EC4899'; ctx.font = 'bold 22px Nunito, sans-serif';
    ctx.fillText('🦄 Pony Passport', 24, 40);
    ctx.fillStyle = '#1F2937'; ctx.font = 'bold 20px Nunito, sans-serif';
    ctx.fillText(p.name, 24, 78);
    ctx.font = '14px Nunito, sans-serif'; ctx.fillStyle = '#6B7280';
    ctx.fillText(`G${p.generation} · ${TYPE_LABELS[p.type] || p.type} · ${p.colour || ''}`, 24, 104);
    ctx.fillText(`DeePonyCap · ${new Date().toLocaleDateString()}`, 24, 290);
    canvas.toBlob(blob => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `passport-${p.name.replace(/\s+/g, '-')}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      Toast.show('Passport card saved ✨');
    });
  }

  function validateBackup(data) {
    if (!data || typeof data !== 'object') return { ok: false, err: 'Not a valid backup file' };
    if (!Array.isArray(data.ponies) && !Array.isArray(data.wishlist)) return { ok: false, err: 'Missing collection data' };
    if (data.ponies && !Array.isArray(data.ponies)) return { ok: false, err: 'Invalid ponies array' };
    return { ok: true };
  }

  function snapshotRecovery() {
    try {
      if (window.DataStore) {
        DataStore.saveRecovery(S);
        return;
      }
      localStorage.setItem('deeponycap_recovery_' + Date.now(), JSON.stringify(S));
      const keys = Object.keys(localStorage).filter(k => k.startsWith('deeponycap_recovery_')).sort();
      while (keys.length > 3) {
        localStorage.removeItem(keys.shift());
      }
    } catch (e) {}
  }

  function initA11y() {
    const sheet = document.getElementById('sheet');
    if (sheet) {
      sheet.setAttribute('role', 'dialog');
      sheet.setAttribute('aria-modal', 'true');
      sheet.setAttribute('aria-labelledby', 'sheetTitle');
    }
    document.querySelectorAll('.nav-btn').forEach(btn => {
      const label = btn.querySelector('.nav-label')?.textContent?.trim() || btn.dataset.tab;
      if (label) btn.setAttribute('aria-label', label);
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && document.getElementById('sheet')?.classList.contains('on')) {
        UI.closeSheet();
      }
    });
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('reduce-motion');
    }
  }

  function init() {
    if (init._done) return;
    init._done = true;
    extendAchievements();
    initA11y();
    const origSave = Store.save.bind(Store);
    const snap = snapshotRecovery;
    Store.save = function () {
      try { snap(); } catch (e) {}
      return origSave();
    };
  }

  function deepLink() {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const view = params.get('view');
    const action = params.get('action');
    if (tab) Nav.go(tab);
    if (view === 'storybook') renderStorybook();
    else if (view === 'timeline') renderTimeline();
    if (action === 'add' && window.UI) UI.openAdd();
  }

  return {
    matchPony, computeInsights, suggestions, insightsHtml, suggestionsHtml,
    renderTimeline, renderStorybook, openPassport, exportPassportCard, exportStorybookPrint,
    validateBackup, snapshotRecovery, init, deepLink, ACC_CATEGORIES,
  };
})();

window.Excellence = Excellence;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Excellence.init());
} else {
  Excellence.init();
}
