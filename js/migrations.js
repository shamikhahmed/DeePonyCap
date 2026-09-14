'use strict';
/** Schema migrations — run on load when stored version < CURRENT_SCHEMA */
const CURRENT_SCHEMA = 6;

const Migrations = {
  CURRENT: CURRENT_SCHEMA,
  run(state) {
    let s = { ...state };
    let v = s.version || 1;
    if (v < 2) {
      s.settings = { collectorMode: false, darkMode: false, ...(s.settings || {}) };
      v = 2;
    }
    if (v < 3) {
      s.unlockedAchievements = s.unlockedAchievements || [];
      s.accessories = s.accessories || [];
      v = 3;
    }
    if (v < 4) {
      s.settings = {
        collectorMode: false, darkMode: false, hapticsEnabled: true,
        parentPinEnabled: false, parentPinHash: null, updatePolicy: 'ask',
        ...(s.settings || {}),
      };
      if (!s.settings.updatePolicy) s.settings.updatePolicy = 'ask';
      v = 4;
    }
    if (v < 5) {
      s.ponies = (s.ponies || []).map(p => ({
        ...p,
        category: p.category || (p.mcdCountry || p.type === 'mcdonalds' ? 'mcdonalds' : (p.brand || p.generation === 0 ? 'other' : 'mlp')),
        catalogNumber: p.catalogNumber || '',
        hairColour: p.hairColour || '',
        cutieMark: p.cutieMark || '',
        brand: p.brand || '',
        mcdCountry: p.mcdCountry || '',
        mcdYear: p.mcdYear != null ? String(p.mcdYear) : '',
      }));
      s.settings = { accentTheme: 'pink', ...(s.settings || {}) };
      if (!s.settings.accentTheme) s.settings.accentTheme = 'pink';
      v = 5;
    }
    if (v < 6) {
      // Add series field only — never rename or alter user-entered names/notes.
      s.ponies = (s.ponies || []).map(p => {
        if (p.series && String(p.series).trim()) return p;
        const series = (typeof defaultSeriesFromGeneration === 'function')
          ? defaultSeriesFromGeneration(p.generation)
          : (p.generation != null ? `Series ${p.generation}` : 'Unsorted');
        return { ...p, series };
      });
      s.wishlist = (s.wishlist || []).map(w => {
        if (w.series && String(w.series).trim()) return w;
        const series = (typeof defaultSeriesFromGeneration === 'function')
          ? defaultSeriesFromGeneration(w.generation)
          : (w.generation != null ? `Series ${w.generation}` : 'Unsorted');
        return { ...w, series };
      });
      if (!Array.isArray(s.seriesList) || !s.seriesList.length) {
        const seen = new Set();
        const list = [];
        [...(s.ponies || []), ...(s.wishlist || [])].forEach(p => {
          const name = (p.series || '').trim();
          const k = name.toLowerCase();
          if (!name || seen.has(k)) return;
          seen.add(k);
          list.push(name);
        });
        s.seriesList = list.length ? list : ['Series 1', 'Series 2', 'Series 3', 'Series 4', 'Series 5'];
      }
      v = 6;
    }
    s.version = CURRENT_SCHEMA;
    return s;
  },
};

window.Migrations = Migrations;
