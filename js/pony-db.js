'use strict';
/**
 * User-defined series + name suggestions from the collector's own entries.
 * No bundled third-party character catalogs.
 */

function seriesKey(s) {
  return String(s || '').trim().toLowerCase();
}

function defaultSeriesFromGeneration(gen) {
  const n = Number(gen);
  if (Number.isFinite(n) && n > 0) return `Series ${n}`;
  if (gen != null && String(gen).trim()) return String(gen).trim();
  return 'Unsorted';
}

function ponySeries(p) {
  if (!p) return 'Unsorted';
  if (p.series && String(p.series).trim()) return String(p.series).trim();
  return defaultSeriesFromGeneration(p.generation);
}

function ensureSeriesList(state) {
  const S = state || window.S || {};
  const fromPonies = (S.ponies || []).map(ponySeries);
  const fromWish = (S.wishlist || []).map(w => ponySeries(w));
  const fromSaved = (S.seriesList || []).map(s => (typeof s === 'string' ? s : s?.name)).filter(Boolean);
  const seen = new Set();
  const list = [];
  [...fromSaved, ...fromPonies, ...fromWish].forEach(name => {
    const k = seriesKey(name);
    if (!k || seen.has(k)) return;
    seen.add(k);
    list.push(String(name).trim());
  });
  if (!list.length) {
    ['Dawn Line', 'Meadow Line', 'Starlight Line', 'Vintage Line'].forEach(n => list.push(n));
  }
  S.seriesList = list;
  return list;
}

function namesInSeries(series, ponyList) {
  const k = seriesKey(series);
  const owned = ponyList || (window.S && S.ponies) || [];
  const names = [];
  const seen = new Set();
  owned.forEach(p => {
    if (seriesKey(ponySeries(p)) !== k) return;
    const n = (p.name || '').trim();
    const nk = n.toLowerCase();
    if (!n || seen.has(nk)) return;
    seen.add(nk);
    names.push(n);
  });
  return names.sort((a, b) => a.localeCompare(b));
}

window.ponySeries = ponySeries;
window.ensureSeriesList = ensureSeriesList;
window.defaultSeriesFromGeneration = defaultSeriesFromGeneration;

/** Autocomplete from the user's own names in this series (and nearby series). */
window.ponyNameSuggestions = function(seriesOrGen, q) {
  const series = typeof seriesOrGen === 'number'
    ? defaultSeriesFromGeneration(seriesOrGen)
    : (seriesOrGen || '');
  const list = namesInSeries(series, window.S && S.ponies);
  if (!list.length && window.S && S.ponies) {
    const all = [...new Set(S.ponies.map(p => (p.name || '').trim()).filter(Boolean))];
    if (!q) return all.slice(0, 12);
    const ql = q.toLowerCase();
    return all.filter(n => n.toLowerCase().includes(ql)).slice(0, 10);
  }
  if (!q) return list.slice(0, 12);
  const ql = q.toLowerCase();
  return list.filter(n => n.toLowerCase().includes(ql)).slice(0, 10);
};

window.ponyNameInDb = function(seriesOrGen, name) {
  const nl = (name || '').trim().toLowerCase();
  if (!nl) return false;
  const series = typeof seriesOrGen === 'number'
    ? defaultSeriesFromGeneration(seriesOrGen)
    : (seriesOrGen || '');
  return namesInSeries(series, window.S && S.ponies).some(n => n.toLowerCase() === nl);
};

window.ponySearchTerms = function(seriesOrGen, name) {
  const terms = new Set([(name || '').toLowerCase()]);
  const series = typeof seriesOrGen === 'number'
    ? defaultSeriesFromGeneration(seriesOrGen)
    : (seriesOrGen || '');
  if (series) terms.add(series.toLowerCase());
  return [...terms];
};

/** User-created collection goals (optional); empty by default — no bundled IP goals. */
window.COLLECTION_GOALS = {};

window.collectionGoalProgress = function(goalId, ponyList) {
  const goal = window.COLLECTION_GOALS[goalId];
  if (!goal) return null;
  const names = goal.names || [];
  const series = goal.series || '';
  const owned = new Set(
    (ponyList || [])
      .filter(p => !series || seriesKey(ponySeries(p)) === seriesKey(series))
      .map(p => p.name.trim().toLowerCase())
  );
  const have = names.filter(n => owned.has(n.toLowerCase()));
  return {
    id: goal.id,
    title: goal.title,
    emoji: goal.emoji || '✨',
    series,
    have: have.length,
    total: names.length,
    pct: names.length ? Math.round((have.length / names.length) * 100) : 0,
    missing: names.filter(n => !owned.has(n.toLowerCase())).slice(0, 4),
  };
};
