'use strict';
const STORAGE_KEY = 'deeponycap_v2';
const STORAGE_KEY_LEGACY = 'deePonyOS_v2';
const STORAGE_KEY_V1 = 'deePonyOS_v1';
const STORAGE_KEY_V1_LEGACY = 'deeponycap_v1';
const PAGE_SIZE = 40;
const SERIES_COLORS = ['g1', 'g2', 'g3', 'g4', 'g5'];
const SERIES_EMOJI = ['💜', '💚', '💙', '💛', '🩷'];
/** @deprecated use seriesColorClass / seriesEmoji — kept for older call sites */
const GEN_COLORS = {1:'g1',2:'g2',3:'g3',4:'g4',5:'g5'};
const GEN_EMOJI = {1:'💜',2:'💚',3:'💙',4:'💛',5:'🩷'};
const TYPE_LABELS = {
  mlp: '🦄 Figure',
  filly: '🎀 Filly',
  velvet: '🧸 Soft',
  palace_pet: '🏰 Pet',
  special: '✨ Special',
  mcdonalds: '🍟 Promo',
  other_brand: '🐴 Other',
};
const TYPE_KEYS = ['mlp', 'filly', 'velvet', 'palace_pet', 'special'];
const CATEGORY_LABELS = {
  mlp: 'Pony figure',
  other: 'Other brand',
  mcdonalds: 'Promo toy',
};
const COND_LABELS = { mint: '✨ Mint', good: '👍 Good', played: '🎮 Played', loved: '💕 Loved' };
const SIZE_LABELS = { mini: 'Mini', standard: 'Standard', large: 'Large', extra_large: 'XL' };
const SHELF_SUGGEST = ['Shelf 1', 'Shelf 2', 'Windowsill', 'Display Case', 'Box'];
const STORAGE_LIMIT = 5 * 1024 * 1024;

function seriesColorClass(seriesOrGen) {
  if (typeof seriesOrGen === 'number' && GEN_COLORS[seriesOrGen]) return GEN_COLORS[seriesOrGen];
  const list = (window.S && S.seriesList) || [];
  const name = typeof seriesOrGen === 'string' ? seriesOrGen : (window.ponySeries ? ponySeries({ series: seriesOrGen, generation: seriesOrGen }) : String(seriesOrGen || ''));
  const idx = Math.max(0, list.findIndex(s => String(s).toLowerCase() === String(name).toLowerCase()));
  return SERIES_COLORS[(idx >= 0 ? idx : hashStr(name)) % SERIES_COLORS.length];
}

function seriesEmoji(seriesOrGen) {
  if (typeof seriesOrGen === 'number' && GEN_EMOJI[seriesOrGen]) return GEN_EMOJI[seriesOrGen];
  const list = (window.S && S.seriesList) || [];
  const name = typeof seriesOrGen === 'string' ? seriesOrGen : String(seriesOrGen || '');
  const idx = Math.max(0, list.findIndex(s => String(s).toLowerCase() === String(name).toLowerCase()));
  return SERIES_EMOJI[(idx >= 0 ? idx : hashStr(name)) % SERIES_EMOJI.length];
}

function hashStr(s) {
  let h = 0;
  const t = String(s || '');
  for (let i = 0; i < t.length; i++) h = ((h << 5) - h + t.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Locale-aware display date (e.g. "1 Jan 2020"). */
function formatLocaleDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  } catch (_) {
    return String(iso);
  }
}

function switchHtml(on, ariaLabel, onclick) {
  const checked = on ? 'true' : 'false';
  return `<button type="button" class="cap-switch${on ? ' on' : ''}" role="switch" aria-checked="${checked}" aria-label="${ariaLabel}" onclick="${onclick}"><span class="cap-switch__thumb" aria-hidden="true"></span></button>`;
}
