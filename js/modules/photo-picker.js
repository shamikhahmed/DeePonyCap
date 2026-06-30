'use strict';
const PhotoPicker = {
  html(prefix, handler, opts = {}) {
    const multi = opts.multiple ? ' multiple' : '';
    return `
      <div class="photo-picker" role="group" aria-label="Add photo">
        <button type="button" class="photo-pick-btn" onclick="PhotoPicker.open('${prefix}','camera')">📷 Camera</button>
        <button type="button" class="photo-pick-btn" onclick="PhotoPicker.open('${prefix}','gallery')">🖼️ Gallery</button>
      </div>
      <input type="file" id="${prefix}Cam" accept="image/*" capture="environment" style="display:none" onchange="${handler}"${multi}>
      <input type="file" id="${prefix}Gal" accept="image/*" style="display:none" onchange="${handler}"${multi}>`;
  },
  open(prefix, mode) {
    const el = document.getElementById(prefix + (mode === 'camera' ? 'Cam' : 'Gal'));
    if (!el) return;
    el.value = '';
    el.click();
    Haptic.tap();
  },
  firstFile(prefix) {
    const cam = document.getElementById(prefix + 'Cam');
    const gal = document.getElementById(prefix + 'Gal');
    return cam?.files?.[0] || gal?.files?.[0] || null;
  }
};
