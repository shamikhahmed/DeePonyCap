/* DeePonyCap demo data — loaded when ?demo=1 is in the URL */
window.DemoSeed = {
  PONIES: [
    { name: 'Twilight Sparkle', generation: 4, type: 'mlp', colour: 'Purple with pink streak', size: 'standard', shelf: 'Main Shelf', isOriginal: true, condition: 'mint', isFavourite: true, isMostPlayed: false, notes: 'First edition, unopened box.', acquiredDate: '2022-12-01' },
    { name: 'Pinkie Pie', generation: 4, type: 'mlp', colour: 'Pink all over', size: 'standard', shelf: 'Main Shelf', isOriginal: true, condition: 'good', isFavourite: true, isMostPlayed: true, notes: 'Slight wear on mane.', acquiredDate: '2023-03-15' },
    { name: 'Rainbow Dash', generation: 4, type: 'mlp', colour: 'Blue with rainbow hair', size: 'standard', shelf: 'Main Shelf', isOriginal: true, condition: 'mint', isFavourite: false, isMostPlayed: false, notes: 'Collector\'s edition.', acquiredDate: '2023-07-04' },
    { name: 'Fluttershy', generation: 4, type: 'mlp', colour: 'Yellow with pink hair', size: 'standard', shelf: 'Bedroom Shelf', isOriginal: true, condition: 'good', isFavourite: true, isMostPlayed: false, notes: '', acquiredDate: '2023-05-20' },
    { name: 'Rarity', generation: 4, type: 'mlp', colour: 'White with purple hair', size: 'standard', shelf: 'Bedroom Shelf', isOriginal: true, condition: 'mint', isFavourite: false, isMostPlayed: false, notes: 'Sparkle variant.', acquiredDate: '2023-09-10' },
    { name: 'Applejack', generation: 4, type: 'mlp', colour: 'Orange with blonde hair', size: 'standard', shelf: 'Bedroom Shelf', isOriginal: true, condition: 'loved', isFavourite: false, isMostPlayed: true, notes: 'Played with a lot — visible wear.', acquiredDate: '2022-06-01' },
    { name: 'Baby Cotton Candy', generation: 1, type: 'mlp', colour: 'Pink with purple hair', size: 'mini', shelf: 'Vintage Corner', isOriginal: true, condition: 'loved', isFavourite: true, isMostPlayed: false, notes: '1983 original. Found at car boot sale.', acquiredDate: '2021-08-14' },
    { name: 'Moondancer', generation: 1, type: 'mlp', colour: 'White with pink hair', size: 'standard', shelf: 'Vintage Corner', isOriginal: true, condition: 'good', isFavourite: false, isMostPlayed: false, notes: 'Missing accessories.', acquiredDate: '2022-01-20' },
    { name: 'Skywishes', generation: 3, type: 'mlp', colour: 'Purple with gold hair', size: 'standard', shelf: 'Wishlist Finds', isOriginal: true, condition: 'mint', isFavourite: false, isMostPlayed: false, notes: 'Only found recently.', acquiredDate: '2024-02-10' },
  ],

  load({ silent = false } = {}) {
    if (!window.S) return;
    const now = Date.now();
    S.ponies = DemoSeed.PONIES.map((p, i) => ({
      id: 'demo_' + i,
      photos: [],
      photo: null,
      createdAt: now - (DemoSeed.PONIES.length - i) * 86400000,
      ...p,
    }));
    S.onboardingDone = true;
    S.collector = { name: 'Demo Collector', since: '2021' };
    if (typeof Store !== 'undefined' && Store.save) Store.save().catch(() => {});
    if (typeof Render !== 'undefined' && Render.all) Render.all();
    if (!silent) console.log('[DeePonyCap] Demo seed loaded:', S.ponies.length, 'ponies');
  }
};
