'use strict';
const Csv = {
  export() {
    const header = 'name,category,generation,catalogNumber,type,colour,hairColour,size,shelf,brand,mcdCountry,mcdYear,cutieMark,acquiredDate,condition,isOriginal,purchaseValue,estimatedValue,notes';
    const rows = S.ponies.map(p => [
      `"${(p.name||'').replace(/"/g,'""')}"`, p.category || 'mlp', p.generation, `"${(p.catalogNumber||'').replace(/"/g,'""')}"`, p.type,
      `"${(p.colour||'').replace(/"/g,'""')}"`, `"${(p.hairColour||'').replace(/"/g,'""')}"`, p.size,
      `"${(p.shelf||'').replace(/"/g,'""')}"`, `"${(p.brand||'').replace(/"/g,'""')}"`, `"${(p.mcdCountry||'').replace(/"/g,'""')}"`, p.mcdYear || '',
      `"${(p.cutieMark||'').replace(/"/g,'""')}"`, p.acquiredDate || '',
      p.condition, p.isOriginal ? 1 : 0,
      ponyValue(p) ?? '', p.estimatedValue ?? '', `"${(p.notes||'').replace(/"/g,'""')}"`
    ].join(','));
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `deepony-collection-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    Toast.show('CSV exported 📊');
  },
  import(text) {
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) throw new Error('empty');
    let added = 0;
    for (let i = 1; i < lines.length; i++) {
      const cols = Csv._parseLine(lines[i]);
      if (!cols[0]) continue;
      S.ponies.push(normalizePony({
        id: uid(), name: cols[0], generation: parseInt(cols[1]) || 4, type: cols[2] || 'mlp',
        colour: cols[3] || '', size: cols[4] || 'standard', shelf: cols[5] || 'Shelf 1',
        condition: cols[6] || 'good', isOriginal: cols[7] !== '0',
        purchaseValue: cols[8] ? parseFloat(cols[8]) : null,
        estimatedValue: cols[9] ? parseFloat(cols[9]) : null,
        notes: cols[10] || '', photos: [], isFavourite: false, isMostPlayed: false,
        acquiredDate: '', createdAt: Date.now()
      }));
      added++;
    }
    Store.save();
    Render.all();
    Toast.show(`Imported ${added} ponies from CSV ✨`);
  },
  _parseLine(line) {
    const out = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQ = !inQ; continue; }
      if (c === ',' && !inQ) { out.push(cur); cur = ''; continue; }
      cur += c;
    }
    out.push(cur);
    return out;
  }
};
