'use strict';
/* Official & common MLP pony names by generation — autocomplete source */
const PONY_DB = {
  1: ['Minty','Butterfly','Blue Belle','Blossom','Cotton Candy','Snuzzle','Bubbles','Moonstone','Sunbeam','Starshine','Medley','Firefly','Applejack','Bow Tie','Glory','Moondancer','Seashell','Skydancer','Sunlight','Twilight','Clover','Golden Harvest','Hopscotch','Lickety Split','Paradise','Patches','Plush','Ribbon','Shady','Speedy','Sun Shower','Tulip','White Blossom'],
  2: ['Sunsparkle','Morning Glory','Honey Sweet','Silver Lining','Dainty Daisy','Morning Mist','Golden Glow','Twinkle Twirl','Rainbow Dash','Sunbeam','Morning Glory','Daisy Dancer','Golden Glow'],
  3: ['Star Catcher','Coconut Cream','Candy Apple','G3 Rainbow Dash','Scootaloo','Toola Roola','Skywishes','Twinkle Twirl','Pinkie Pie','Cheerilee','Rarity','Applejack','Spike','Minty','Wysteria','Sunny Daze','Star Shimmer','Coconut Cream'],
  4: ['Twilight Sparkle','Rainbow Dash','Pinkie Pie','Applejack','Rarity','Fluttershy','Princess Celestia','Princess Luna','Princess Cadance','Shining Armor','Spike','Apple Bloom','Scootaloo','Sweetie Belle','Big McIntosh','Granny Smith','Cheerilee','Zecora','Trixie','Derpy Hooves','DJ Pon-3','Octavia','Vinyl Scratch','Luna','Celestia','Starlight Glimmer','Sunset Shimmer','Discord','Queen Chrysalis','King Sombra','Nightmare Moon','Flurry Heart','Thorax','Pharynx','Tempest Shadow','Capper','Captain Celaeno','Princess Skystar','Pinkamena','Gilda','Iron Will','Crusaders','Diamond Tiara','Silver Spoon','Babs Seed','Gabby','Limestone','Marble','Maud Pie','Cloudchaser','Fleetfoot','Soarin','Spitfire','Rainbow Dash','Wonderbolts'],
  5: ['Sunny Starscout','Izzy Moonbow','Hitch Trailblazer','Pipp Petals','Zipp Storm','Misty Brightdawn','Sprout','Queen Haven','Phoeni','Sparky Sparkeroni','Posey','Raven Inkwell','Alphabittle','Phyllis','Sprout Cloverleaf','Queen Petunia','Thunder','Zoom','Dazzle Feather','Crystal Ball','Maretime Bay Ponies'],
};

const COLLECTION_GOALS = {
  g1_babies: {
    id: 'g1_babies',
    title: 'G1 Babies',
    emoji: '👶',
    generation: 1,
    names: ['Baby Cotton Candy', 'Baby Glory', 'Baby Moondancer', 'Baby Blossom', 'Baby Firefly', 'Baby Mountain Rainbow', 'Baby Sugarberry'],
  },
  g4_mane6: {
    id: 'g4_mane6',
    title: 'G4 Mane Six',
    emoji: '🌈',
    generation: 4,
    names: ['Twilight Sparkle', 'Rainbow Dash', 'Pinkie Pie', 'Applejack', 'Rarity', 'Fluttershy'],
  },
};

window.PONY_DB = PONY_DB;
window.COLLECTION_GOALS = COLLECTION_GOALS;

window.ponyNameSuggestions = function(gen, q) {
  const list = PONY_DB[gen] || [];
  if (!q) return list.slice(0, 12);
  const ql = q.toLowerCase();
  return list.filter(n => n.toLowerCase().includes(ql)).slice(0, 10);
};

window.ponyNameInDb = function(gen, name) {
  const nl = (name || '').trim().toLowerCase();
  if (!nl) return false;
  return (PONY_DB[gen] || []).some(n => n.toLowerCase() === nl);
};

/** Alternate names / nicknames for smarter search */
const PONY_ALIASES = {
  'dj pon-3': ['vinyl scratch', 'octavia'],
  'vinyl scratch': ['dj pon-3'],
  'octavia': ['dj pon-3'],
  'derpy hooves': ['muffins', 'ditzy doo'],
  'princess luna': ['nightmare moon'],
  'nightmare moon': ['princess luna'],
  'pinkamena': ['pinkie pie'],
  'g3 rainbow dash': ['rainbow dash'],
};

window.PONY_ALIASES = PONY_ALIASES;

window.ponySearchTerms = function(gen, name) {
  const terms = new Set([(name || '').toLowerCase()]);
  const nl = (name || '').trim().toLowerCase();
  if (PONY_ALIASES[nl]) PONY_ALIASES[nl].forEach(a => terms.add(a));
  (PONY_DB[gen] || []).forEach(n => {
    if (n.toLowerCase().includes(nl) || nl.includes(n.toLowerCase())) terms.add(n.toLowerCase());
  });
  return [...terms];
};

window.collectionGoalProgress = function(goalId, ponyList) {
  const goal = COLLECTION_GOALS[goalId];
  if (!goal) return null;
  const names = goal.names || [];
  const owned = new Set((ponyList || []).filter(p => p.generation === goal.generation).map(p => p.name.trim().toLowerCase()));
  const have = names.filter(n => owned.has(n.toLowerCase()));
  return {
    id: goal.id,
    title: goal.title,
    emoji: goal.emoji,
    generation: goal.generation,
    have: have.length,
    total: names.length,
    pct: names.length ? Math.round((have.length / names.length) * 100) : 0,
    missing: names.filter(n => !owned.has(n.toLowerCase())).slice(0, 4),
  };
};
