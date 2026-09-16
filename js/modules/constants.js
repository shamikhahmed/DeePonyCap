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

/** Collection values are stored as USD — format with Intl; label stays USD. */
function formatEstValue(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return '';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(n) + ' est.';
  } catch (_) {
    return `$${Math.round(n).toLocaleString()} est. USD`;
  }
}

/** Small inline SVG icons for controls (never emoji in buttons). */
function uiIcon(name) {
  const common = 'class="ui-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  const paths = {
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
    map: '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>',
    chart: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    star: '<polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>',
    shelf: '<rect x="3" y="4" width="18" height="4" rx="1"/><rect x="3" y="10" width="18" height="4" rx="1"/><rect x="3" y="16" width="18" height="4" rx="1"/>',
  };
  return `<svg ${common}>${paths[name] || paths.spark}</svg>`;
}

function switchHtml(on, ariaLabel, onclick) {
  const checked = on ? 'true' : 'false';
  return `<button type="button" class="cap-switch${on ? ' on' : ''}" role="switch" aria-checked="${checked}" aria-label="${ariaLabel}" onclick="${onclick}"><span class="cap-switch__thumb" aria-hidden="true"></span></button>`;
}
