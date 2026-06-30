'use strict';
const uid = () => Math.random().toString(36).slice(2,10);

function ponyPhoto(p) {
  if (!p) return null;
  if (p.photos?.length) return p.photos[0];
  return p.photo || null;
}

function normalizePony(p) {
  const photos = Array.isArray(p.photos) ? p.photos.filter(Boolean) : [];
  if (!photos.length && p.photo) photos.push(p.photo);
  const soldComps = Array.isArray(p.soldComps) ? p.soldComps.filter(c => c && c.amount > 0) : [];
  const category = p.category || (p.mcdCountry || p.type === 'mcdonalds' ? 'mcdonalds' : (p.brand || p.generation === 0 ? 'other' : 'mlp'));
  return {
    ...p, photos, photo: photos[0] || null,
    category,
    catalogNumber: p.catalogNumber || '',
    hairColour: p.hairColour || '',
    cutieMark: p.cutieMark || '',
    brand: p.brand || '',
    mcdCountry: p.mcdCountry || '',
    mcdYear: p.mcdYear != null ? String(p.mcdYear) : '',
    purchaseValue: p.purchaseValue != null ? Number(p.purchaseValue) : null,
    estimatedValue: p.estimatedValue != null ? Number(p.estimatedValue) : null,
    soldComps,
  };
}

function ponyBadgeLabel(p) {
  return window.CollectorSuite ? CollectorSuite.ponyBadge(p) : `G${p.generation || '?'}`;
}

function ponyValue(p) {
  return p.estimatedValue ?? p.purchaseValue ?? null;
}

function pinHash(pin) {
  let h = 0;
  for (let i = 0; i < pin.length; i++) h = ((h << 5) - h + pin.charCodeAt(i)) | 0;
  return 'dp_' + Math.abs(h).toString(36);
}

function guessNameFromFile(filename) {
  const base = (filename || '').replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!base) return '';
  return base.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function matchG4PonyByName(name) {
  const nl = (name || '').trim().toLowerCase();
  if (!nl) return null;
  const exact = S.ponies.find(p => p.generation === 4 && p.name.trim().toLowerCase() === nl);
  if (exact) return exact;
  const db = (window.PONY_DB && window.PONY_DB[4]) || [];
  const dbMatch = db.find(n => n.toLowerCase() === nl || n.toLowerCase().includes(nl) || nl.includes(n.toLowerCase()));
  if (dbMatch) {
    const owned = S.ponies.find(p => p.generation === 4 && p.name.trim().toLowerCase() === dbMatch.toLowerCase());
    if (owned) return owned;
    return { suggestName: dbMatch };
  }
  const partial = S.ponies.filter(p => p.generation === 4 && (p.name.toLowerCase().includes(nl) || nl.includes(p.name.toLowerCase())));
  if (partial.length === 1) return partial[0];
  return null;
}

function findDuplicate(name, gen, excludeId) {
  const nl = (name || '').trim().toLowerCase();
  if (!nl) return null;
  return S.ponies.find(p => p.id !== excludeId && p.name.trim().toLowerCase() === nl && p.generation === gen);
}

function findSimilarPonies(name, gen, excludeId) {
  const nl = (name || '').trim().toLowerCase();
  if (!nl || nl.length < 2) return [];
  return S.ponies.filter(p => {
    if (p.id === excludeId || p.generation !== gen) return false;
    const pn = p.name.trim().toLowerCase();
    if (pn === nl) return false;
    return pn.startsWith(nl) || nl.startsWith(pn) || pn.includes(nl) || nl.includes(pn);
  }).slice(0, 3);
}
