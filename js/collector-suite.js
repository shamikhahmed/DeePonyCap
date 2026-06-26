'use strict';
/**
 * Collector-first views: generation logs, pony map, taxonomy helpers.
 */
const CollectorSuite = (() => {
  const LOG_SECTIONS = [
    { id: 'g1', label: 'G1', emoji: '💜', gen: 1 },
    { id: 'g2', label: 'G2', emoji: '💚', gen: 2 },
    { id: 'g3', label: 'G3', emoji: '💙', gen: 3 },
    { id: 'g4', label: 'G4', emoji: '💛', gen: 4 },
    { id: 'g5', label: 'G5', emoji: '🩷', gen: 5 },
    { id: 'other', label: 'Other', emoji: '🐴', cat: 'other' },
    { id: 'mcd', label: "McDonald's", emoji: '🍟', cat: 'mcdonalds' },
  ];

  const MCD_COUNTRIES = [
    'USA', 'UK', 'Canada', 'Australia', 'Germany', 'France', 'Japan',
    'Brazil', 'Mexico', 'Netherlands', 'Italy', 'Spain', 'Other',
  ];

  const ACCENT_THEMES = {
    pink: { pink: '#C4367A', bg: '#D4A0B8', purple: '#8B5CF6', label: 'Classic Pink' },
    purple: { pink: '#9333EA', bg: '#C4B5FD', purple: '#EC4899', label: 'Royal Purple' },
    sunset: { pink: '#F97316', bg: '#FDBA74', purple: '#EC4899', label: 'Sunset' },
    mint: { pink: '#14B8A6', bg: '#99F6E4', purple: '#6366F1', label: 'Mint Dream' },
    rainbow: { pink: '#EC4899', bg: '#DDD6FE', purple: '#3B82F6', label: 'Rainbow' },
  };

  function ponyCategory(p) {
    if (!p) return 'mlp';
    if (p.category === 'other' || p.category === 'mcdonalds') return p.category;
    if (p.mcdCountry || p.type === 'mcdonalds') return 'mcdonalds';
    if (p.brand && p.category !== 'mlp') return 'other';
    if (p.generation === 0) return 'other';
    return 'mlp';
  }

  function acquiredYear(p) {
    if (p.acquiredYear) return String(p.acquiredYear);
    if (p.acquiredDate) return String(p.acquiredDate).slice(0, 4);
    return '';
  }

  function ponyBadge(p) {
    const cat = ponyCategory(p);
    if (cat === 'mlp') return `G${p.generation || '?'}`;
    if (cat === 'other') return p.brand || 'Other';
    const c = p.mcdCountry || '—';
    const y = p.mcdYear || '—';
    return `McD ${c} ${y}`;
  }

  function poniesForSection(sectionId, ponies) {
    const sec = LOG_SECTIONS.find(s => s.id === sectionId) || LOG_SECTIONS[3];
    return (ponies || []).filter(p => {
      const cat = ponyCategory(p);
      if (sec.cat === 'other') return cat === 'other';
      if (sec.cat === 'mcdonalds') return cat === 'mcdonalds';
      return cat === 'mlp' && p.generation === sec.gen;
    });
  }

  function sortLogPonies(list, sort) {
    const out = [...list];
    if (sort === 'number') {
      out.sort((a, b) => String(a.catalogNumber || '').localeCompare(String(b.catalogNumber || ''), undefined, { numeric: true }) || (a.name || '').localeCompare(b.name || ''));
    } else if (sort === 'year') {
      out.sort((a, b) => (acquiredYear(b) || '0').localeCompare(acquiredYear(a) || '0') || (a.name || '').localeCompare(b.name || ''));
    } else {
      out.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    return out;
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function logRow(p, sectionId) {
    const id = p.id;
    const open = `Excellence.openPassport('${id}')`;
    const num = esc(p.catalogNumber || '—');
    const name = esc(p.name);
    const colour = esc(p.colour || '—');
    const hair = esc(p.hairColour || '—');
    const type = esc((window.TYPE_LABELS && TYPE_LABELS[p.type]) || p.type || '—');
    const size = esc((window.SIZE_LABELS && SIZE_LABELS[p.size]) || p.size || '—');
    const year = esc(acquiredYear(p) || '—');
    const shelf = esc(p.shelf || '—');
    const brand = esc(p.brand || '—');
    const mcd = esc(`${p.mcdCountry || '—'} · ${p.mcdYear || '—'}`);
    if (sectionId === 'other') {
      return `<tr class="log-row" role="button" tabindex="0" onclick="${open}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();${open}}">
        <td>${num}</td><td class="log-name">${name}</td><td>${brand}</td><td>${colour}</td><td>${hair}</td><td>${type}</td><td>${size}</td><td>${year}</td><td>${shelf}</td></tr>`;
    }
    if (sectionId === 'mcd') {
      return `<tr class="log-row" role="button" tabindex="0" onclick="${open}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();${open}}">
        <td>${num}</td><td class="log-name">${name}</td><td>${mcd}</td><td>${colour}</td><td>${hair}</td><td>${size}</td><td>${year}</td><td>${shelf}</td></tr>`;
    }
    return `<tr class="log-row" role="button" tabindex="0" onclick="${open}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();${open}}">
      <td>${num}</td><td class="log-name">${name}</td><td>${colour}</td><td>${hair}</td><td>${type}</td><td>${size}</td><td>${year}</td><td>${shelf}</td></tr>`;
  }

  function logHead(sectionId) {
    if (sectionId === 'other') {
      return '<tr><th>#</th><th>Name</th><th>Brand</th><th>Colour</th><th>Hair</th><th>Type</th><th>Size</th><th>Year</th><th>Shelf</th></tr>';
    }
    if (sectionId === 'mcd') {
      return '<tr><th>#</th><th>Name</th><th>Country · Year</th><th>Colour</th><th>Hair</th><th>Size</th><th>Year got</th><th>Shelf</th></tr>';
    }
    return '<tr><th>#</th><th>Name</th><th>Colour</th><th>Hair</th><th>Type</th><th>Size</th><th>Year</th><th>Shelf</th></tr>';
  }

  function renderLogs(container, state, filter, renderCard) {
    const section = filter.logSection || 'g4';
    const secMeta = LOG_SECTIONS.find(s => s.id === section) || LOG_SECTIONS[3];
    const q = (filter.q || '').toLowerCase();
    let list = poniesForSection(section, state.ponies);
    if (q) {
      list = list.filter(p => (window.Excellence ? Excellence.matchPony(p, q) : (
        (p.name || '').toLowerCase().includes(q) ||
        (p.colour || '').toLowerCase().includes(q) ||
        (p.hairColour || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q) ||
        (p.shelf || '').toLowerCase().includes(q) ||
        (p.catalogNumber || '').toLowerCase().includes(q)
      )));
    }
    list = sortLogPonies(list, filter.logSort || 'name');
    const view = filter.logView || 'register';
    const chips = LOG_SECTIONS.map(s => {
      const n = poniesForSection(s.id, state.ponies).length;
      return `<button type="button" class="chip${section === s.id ? ' on' : ''}" onclick="logFilter.logSection='${s.id}';filter.page=0;Render.logs()">${s.emoji} ${s.label}${n ? ` (${n})` : ''}</button>`;
    }).join('');

    const table = list.length
      ? `<div class="log-table-wrap"><table class="log-table"><thead>${logHead(section)}</thead><tbody>${list.map(p => logRow(p, section)).join('')}</tbody></table></div>`
      : `<div class="empty"><span>${secMeta.emoji}</span><p>No ponies in this log yet — tap <strong>+</strong> to add one.</p></div>`;

    const cards = list.length
      ? `<div class="grid">${list.map(p => renderCard(p)).join('')}</div>`
      : `<div class="empty"><span>${secMeta.emoji}</span><p>No ponies in this log yet.</p></div>`;

    container.innerHTML = `
      <h1 class="greet">${secMeta.emoji} ${secMeta.label} Log</h1>
      <p class="sub">${list.length} ponies · your private collection register</p>
      <div class="search-wrap"><input class="search" type="search" aria-label="Search log" placeholder="Search this log…" value="${esc(filter.q)}" oninput="filter.q=this.value;filter.page=0;Render.logs()"></div>
      <div class="chips log-chips">${chips}</div>
      <div class="log-toolbar">
        <div class="sort-row" style="margin:0;flex:1">
          <label for="logSort">Sort</label>
          <select id="logSort" class="sort-select" onchange="logFilter.logSort=this.value;Render.logs()">
            <option value="name"${(filter.logSort || 'name') === 'name' ? ' selected' : ''}>Name</option>
            <option value="number"${filter.logSort === 'number' ? ' selected' : ''}>Number</option>
            <option value="year"${filter.logSort === 'year' ? ' selected' : ''}>Year acquired</option>
          </select>
        </div>
        <div class="view-toggle">
          <button type="button" class="opt${view === 'register' ? ' on' : ''}" onclick="logFilter.logView='register';Render.logs()">📋 Register</button>
          <button type="button" class="opt${view === 'cards' ? ' on' : ''}" onclick="logFilter.logView='cards';Render.logs()">🖼️ Cards</button>
        </div>
      </div>
      ${view === 'cards' ? cards : table}`;
  }

  function renderPonyMap(container, state, ponyPhotoFn) {
    const shelves = {};
    (state.ponies || []).forEach(p => {
      const s = (p.shelf || '').trim() || '__unshelved__';
      if (!shelves[s]) shelves[s] = [];
      shelves[s].push(p);
    });
    const keys = Object.keys(shelves).filter(k => k !== '__unshelved__').sort();
    const unshelved = shelves.__unshelved__ || [];
    const total = (state.ponies || []).length;

    const shelfBlock = (name, ponies) => {
      const label = name === '__unshelved__' ? '📦 Unshelved' : `🗄️ ${esc(name)}`;
      const slots = ponies.map(p => {
        const ph = ponyPhotoFn(p);
        const emoji = (window.GEN_EMOJI && GEN_EMOJI[p.generation]) || '🦄';
        const g = (window.GEN_COLORS && GEN_COLORS[p.generation]) || 'g5';
        const open = `Excellence.openPassport('${p.id}')`;
        return `<button type="button" class="map-slot" onclick="${open}" aria-label="${esc(p.name)} on ${name === '__unshelved__' ? 'unshelved' : name}">
          ${ph ? `<img src="${ph}" alt="">` : `<span class="map-emoji g${p.generation || 5}">${emoji}</span>`}
          <span class="map-slot-name">${esc(p.name)}</span>
          <span class="map-slot-meta">${esc(ponyBadge(p))}</span>
        </button>`;
      }).join('');
      return `<section class="map-shelf card">
        <div class="map-shelf-hdr"><h2>${label}</h2><span class="map-count">${ponies.length}</span></div>
        <div class="map-grid">${slots || '<p class="map-empty">Empty shelf</p>'}</div>
      </section>`;
    };

    container.innerHTML = `
      <h1 class="greet">🗺️ Pony Map</h1>
      <p class="sub">${total} ponies across ${keys.length + (unshelved.length ? 1 : 0)} locations · tap any pony for full details</p>
      <button type="button" class="btn-g" style="width:100%;margin-bottom:14px" onclick="Render.shelfOrganize()">↕ Organize shelves (drag & move)</button>
      ${keys.map(k => shelfBlock(k, shelves[k])).join('')}
      ${unshelved.length ? shelfBlock('__unshelved__', unshelved) : ''}
      ${!total ? '<div class="empty"><span>🗺️</span><p>Add ponies with a shelf name to see them on your map.</p></div>' : ''}`;
  }

  function applyAccent(themeId) {
    const t = ACCENT_THEMES[themeId] || ACCENT_THEMES.pink;
    const root = document.documentElement;
    root.dataset.accent = themeId;
    root.style.setProperty('--pink', t.pink);
    root.style.setProperty('--bg', t.bg);
    root.style.setProperty('--purple', t.purple);
    const meta = document.getElementById('themeMeta');
    if (meta && !document.documentElement.classList.contains('dark-mode')) {
      meta.content = t.pink;
    }
  }

  function accentPickerHtml(current, onchangeFn) {
    return Object.entries(ACCENT_THEMES).map(([id, t]) =>
      `<button type="button" class="accent-swatch${current === id ? ' on' : ''}" style="--swatch:${t.pink}" onclick="${onchangeFn}('${id}')" aria-label="${esc(t.label)}" title="${esc(t.label)}"></button>`
    ).join('');
  }

  return {
    LOG_SECTIONS,
    MCD_COUNTRIES,
    ACCENT_THEMES,
    ponyCategory,
    acquiredYear,
    ponyBadge,
    poniesForSection,
    renderLogs,
    renderPonyMap,
    applyAccent,
    accentPickerHtml,
  };
})();

window.CollectorSuite = CollectorSuite;
