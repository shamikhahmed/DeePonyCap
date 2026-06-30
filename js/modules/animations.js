'use strict';
const Confetti = {
  burst() {
    if (S.settings?.collectorMode) return;
    const w = document.getElementById('confetti');
    const colors = ['#FF6B9D','#C084FC','#FCD34D','#6EE7B7','#93C5FD'];
    for (let i = 0; i < 40; i++) {
      const d = document.createElement('div');
      d.className = 'confetti';
      d.style.left = Math.random()*100+'%';
      d.style.top = '-10px';
      d.style.background = colors[i%colors.length];
      d.style.animationDelay = (Math.random()*0.8)+'s';
      d.style.animationDuration = (2+Math.random()*2)+'s';
      w.appendChild(d);
      setTimeout(() => d.remove(), 5000);
    }
  }
};

const Anim = {
  countUp(el, target) {
    if (!el) return;
    let cur = 0;
    const step = Math.max(1, Math.ceil(target / 30));
    const t = setInterval(() => {
      cur = Math.min(target, cur + step);
      el.textContent = cur;
      if (cur >= target) clearInterval(t);
    }, 30);
  }
};
