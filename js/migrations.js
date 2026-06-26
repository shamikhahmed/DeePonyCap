'use strict';
/** Schema migrations — run on load when stored version < CURRENT_SCHEMA */
const CURRENT_SCHEMA = 5;

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
    s.version = CURRENT_SCHEMA;
    return s;
  },
};

window.Migrations = Migrations;
