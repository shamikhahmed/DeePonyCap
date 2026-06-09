'use strict';
/* Official & common MLP pony names by generation — autocomplete source */
const PONY_DB = {
  1: ['Minty','Butterfly','Blue Belle','Blossom','Cotton Candy','Snuzzle','Bubbles','Moonstone','Sunbeam','Starshine','Medley','Firefly','Applejack','Bow Tie','Glory','Moondancer','Seashell','Skydancer','Sunlight','Twilight','Clover','Golden Harvest','Hopscotch','Lickety Split','Paradise','Patches','Plush','Ribbon','Shady','Speedy','Sun Shower','Tulip','White Blossom'],
  2: ['Sunsparkle','Morning Glory','Honey Sweet','Silver Lining','Dainty Daisy','Morning Mist','Golden Glow','Twinkle Twirl','Rainbow Dash','Sunbeam','Morning Glory','Daisy Dancer','Golden Glow'],
  3: ['Star Catcher','Coconut Cream','Candy Apple','G3 Rainbow Dash','Scootaloo','Toola Roola','Skywishes','Twinkle Twirl','Pinkie Pie','Cheerilee','Rarity','Applejack','Spike','Minty','Wysteria','Sunny Daze','Star Shimmer','Coconut Cream'],
  4: ['Twilight Sparkle','Rainbow Dash','Pinkie Pie','Applejack','Rarity','Fluttershy','Princess Celestia','Princess Luna','Princess Cadance','Shining Armor','Spike','Apple Bloom','Scootaloo','Sweetie Belle','Big McIntosh','Granny Smith','Cheerilee','Zecora','Trixie','Derpy Hooves','DJ Pon-3','Octavia','Vinyl Scratch','Luna','Celestia','Starlight Glimmer','Sunset Shimmer','Discord','Queen Chrysalis','King Sombra','Nightmare Moon','Flurry Heart','Thorax','Pharynx','Tempest Shadow','Capper','Captain Celaeno','Princess Skystar','Pinkamena','Gilda','Iron Will','Crusaders','Diamond Tiara','Silver Spoon','Babs Seed','Gabby','Limestone','Marble','Maud Pie','Cloudchaser','Fleetfoot','Soarin','Spitfire','Rainbow Dash','Wonderbolts'],
  5: ['Sunny Starscout','Izzy Moonbow','Hitch Trailblazer','Pipp Petals','Zipp Storm','Misty Brightdawn','Sprout','Queen Haven','Phoeni','Sparky Sparkeroni','Posey','Raven Inkwell','Alphabittle','Phyllis','Sprout Cloverleaf','Queen Petunia','Thunder','Zoom','Dazzle Feather','Crystal Ball','Maretime Bay Ponies'],
};

window.PONY_DB = PONY_DB;
window.ponyNameSuggestions = function(gen, q) {
  const list = PONY_DB[gen] || [];
  if (!q) return list.slice(0, 12);
  const ql = q.toLowerCase();
  return list.filter(n => n.toLowerCase().includes(ql)).slice(0, 10);
};
