/* DeePonyCap demo data — original invented names only (?demo=1). Never mirrors user data. */
window.DemoSeed = {
  SERIES: ['Dawn Line', 'Meadow Line', 'Starlight Line', 'Vintage Line'],
  PONIES: [
    { name: 'Clover Gleam', series: 'Dawn Line', generation: 1, type: 'mlp', colour: 'Soft green with gold mane', size: 'standard', shelf: 'Main Shelf', isOriginal: true, condition: 'mint', isFavourite: true, isMostPlayed: false, notes: 'First edition sample.', acquiredDate: '2022-12-01' },
    { name: 'Midnight Bloom', series: 'Dawn Line', generation: 1, type: 'mlp', colour: 'Deep violet', size: 'standard', shelf: 'Main Shelf', isOriginal: true, condition: 'good', isFavourite: true, isMostPlayed: true, notes: 'Slight wear on mane.', acquiredDate: '2023-03-15' },
    { name: 'Sunny Pebble', series: 'Dawn Line', generation: 1, type: 'mlp', colour: 'Warm yellow', size: 'standard', shelf: 'Main Shelf', isOriginal: true, condition: 'mint', isFavourite: false, isMostPlayed: false, notes: 'Collector sample.', acquiredDate: '2023-07-04' },
    { name: 'River Soft', series: 'Meadow Line', generation: 2, type: 'mlp', colour: 'Sky blue', size: 'standard', shelf: 'Bedroom Shelf', isOriginal: true, condition: 'good', isFavourite: true, isMostPlayed: false, notes: '', acquiredDate: '2023-05-20' },
    { name: 'Petal Drift', series: 'Meadow Line', generation: 2, type: 'mlp', colour: 'Blush pink', size: 'standard', shelf: 'Bedroom Shelf', isOriginal: true, condition: 'mint', isFavourite: false, isMostPlayed: false, notes: 'Sparkle variant.', acquiredDate: '2023-09-10' },
    { name: 'Honey Trail', series: 'Meadow Line', generation: 2, type: 'mlp', colour: 'Honey orange', size: 'standard', shelf: 'Bedroom Shelf', isOriginal: true, condition: 'loved', isFavourite: false, isMostPlayed: true, notes: 'Well loved.', acquiredDate: '2022-06-01' },
    { name: 'Tiny Dewdrop', series: 'Vintage Line', generation: 3, type: 'mlp', colour: 'Pale pink', size: 'mini', shelf: 'Vintage Corner', isOriginal: true, condition: 'loved', isFavourite: true, isMostPlayed: false, notes: 'Found at a market stall.', acquiredDate: '2021-08-14' },
    { name: 'Lumen Quill', series: 'Vintage Line', generation: 3, type: 'mlp', colour: 'Cream white', size: 'standard', shelf: 'Vintage Corner', isOriginal: true, condition: 'good', isFavourite: false, isMostPlayed: false, notes: 'Missing accessories.', acquiredDate: '2022-01-20' },
    { name: 'Aurora Nest', series: 'Starlight Line', generation: 4, type: 'mlp', colour: 'Lavender with gold', size: 'standard', shelf: 'Wishlist Finds', isOriginal: true, condition: 'mint', isFavourite: false, isMostPlayed: false, notes: 'Recent find.', acquiredDate: '2024-02-10' },
  ],

  load({ silent = false } = {}) {
    if (!window.S) return;
    const now = Date.now();
    S.seriesList = [...DemoSeed.SERIES];
    S.ponies = DemoSeed.PONIES.map((p, i) => ({
      id: 'demo_' + i,
      photos: [],
      photo: null,
      category: 'mlp',
      createdAt: now - (DemoSeed.PONIES.length - i) * 86400000,
      ...p,
    }));
    S.onboardingDone = true;
    S.collector = { name: 'Demo Collector', since: '2021' };
    if (typeof Store !== 'undefined' && Store.save) Store.save().catch(() => {});
    if (typeof Render !== 'undefined' && Render.all) Render.all();
  }
};
