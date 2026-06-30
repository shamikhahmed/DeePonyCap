'use strict';
const Photo = {
  async compress(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        const img = new Image();
        img.onload = () => {
          let w = img.width, h = img.height;
          const max = 800;
          if (w > max) { h = h * max / w; w = max; }
          const draw = (quality) => {
            const c = document.createElement('canvas');
            c.width = w; c.height = h;
            c.getContext('2d').drawImage(img, 0, 0, w, h);
            const url = c.toDataURL('image/jpeg', quality);
            if (url.length > 680000 && quality > 0.4) draw(quality - 0.15);
            else resolve(url);
          };
          draw(0.85);
        };
        img.onerror = reject;
        img.src = r.result;
      };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }
};

const Toast = {
  show(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(Toast._tm);
    Toast._tm = setTimeout(() => t.classList.remove('show'), 2600);
  }
};
