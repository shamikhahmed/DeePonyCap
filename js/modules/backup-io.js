'use strict';
const Backup = {
  export() {
    const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `deepony-backup-${new Date().toISOString().slice(0,10)}.deepony`;
    a.click();
    URL.revokeObjectURL(a.href);
    Toast.show('Backup downloaded 💾');
  },
  import(file) {
    if (!file) return;
    ParentGate.run('Import backup', () => {
      const r = new FileReader();
      r.onload = () => {
        try {
          const data = JSON.parse(r.result);
          if (window.Excellence) {
            const v = Excellence.validateBackup(data);
            if (!v.ok) throw new Error(v.err || 'invalid');
          } else if (!data.ponies && !data.wishlist) throw new Error('invalid');
          S = {
            ...S, ...data,
            settings: {
              collectorMode: false, darkMode: false, hapticsEnabled: true,
              parentPinEnabled: false, parentPinHash: null,
              ...(data.settings || {}),
            },
            ponies: (data.ponies || []).map(normalizePony),
            unlockedAchievements: data.unlockedAchievements || [],
            onboardingDone: true,
          };
          Store.save();
          Theme.apply();
          document.getElementById('onboard').classList.add('hide');
          document.getElementById('app').style.display = 'flex';
          Render.all();
          Confetti.burst();
          Haptic.success();
          Achievements.checkAll(true);
          Toast.show('Collection restored! 🦄');
        } catch (err) {
          Toast.show(err?.message && err.message !== 'invalid' ? err.message : 'Could not read backup file');
        }
      };
      r.readAsText(file);
    });
  }
};
