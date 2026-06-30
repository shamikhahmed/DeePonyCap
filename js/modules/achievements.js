'use strict';
const Achievements = {
  defs: [
    { id: 'first', ic: '🏆', t: 'First Pony!', test: () => S.ponies.length >= 1 },
    { id: 'g1fan', ic: '💜', t: 'Generation 1 Fan — 5+ G1', test: () => S.ponies.filter(p => p.generation === 1).length >= 5 },
    { id: 'rainbow', ic: '🌈', t: 'Rainbow Collector — 1 of each gen', test: () => [1, 2, 3, 4, 5].every(g => S.ponies.some(p => p.generation === g)) },
    { id: 'lover', ic: '❤️', t: 'Pony Lover — 10+ favourites', test: () => S.ponies.filter(p => p.isFavourite).length >= 10 },
    { id: 'shelf', ic: '📚', t: 'Shelf Master — 3+ shelves', test: () => new Set(S.ponies.map(p => p.shelf).filter(Boolean)).size >= 3 },
    { id: 'big50', ic: '🌟', t: 'Big Collection — 50+ ponies', test: () => S.ponies.length >= 50 },
    { id: 'big100', ic: '💎', t: 'Serious Collector — 100+ ponies', test: () => S.ponies.length >= 100 },
    { id: 'big250', ic: '👑', t: 'Pony Royalty — 250+ ponies', test: () => S.ponies.length >= 250 },
    { id: 'wish5', ic: '💫', t: 'Dreamer — 5+ wishlist items', test: () => S.wishlist.length >= 5 },
  ],
  /** Unlocks a single achievement by id if not already unlocked, saves state, and shows a toast. */
  unlock(id) {
    const a = this.defs.find(x => x.id === id);
    if (!a || S.unlockedAchievements.includes(id)) return;
    S.unlockedAchievements.push(id);
    Store.save();
    if (!S.settings?.collectorMode) {
      Confetti.burst();
      Haptic.success();
      Toast.show(`Unlocked: ${a.t} 🎉`);
    }
  },
  /** Checks all achievement definitions against current state and unlocks any newly earned ones. */
  checkAll(silent) {
    const fresh = [];
    this.defs.forEach(a => {
      if (!a.test() || S.unlockedAchievements.includes(a.id)) return;
      S.unlockedAchievements.push(a.id);
      fresh.push(a);
    });
    if (fresh.length) {
      Store.save();
      if (!silent && !S.settings?.collectorMode) {
        Confetti.burst();
        Haptic.success();
        Toast.show(`Unlocked: ${fresh.map(x => x.t).join(' · ')} 🎉`);
      }
    }
    return fresh;
  },
};
