// Every artist, release, track and playlist here is invented for the demo catalogue.

export const GENRES = [
  { id: "synthpop", name: "Synthpop", hue: 320, style: { wave: "saw", bpm: 112, scale: "major", drums: "four" } },
  { id: "lofi", name: "Lo-fi Beats", hue: 260, style: { wave: "triangle", bpm: 78, scale: "pentatonic", drums: "brush" } },
  { id: "ambient", name: "Ambient", hue: 190, style: { wave: "sine", bpm: 64, scale: "lydian", drums: "none" } },
  { id: "house", name: "House", hue: 15, style: { wave: "square", bpm: 124, scale: "minor", drums: "four" } },
  { id: "jazz", name: "Jazz", hue: 35, style: { wave: "triangle", bpm: 96, scale: "dorian", drums: "brush" } },
  { id: "chiptune", name: "Chiptune", hue: 140, style: { wave: "square", bpm: 140, scale: "major", drums: "back" } },
  { id: "folk", name: "Folk", hue: 90, style: { wave: "triangle", bpm: 100, scale: "major", drums: "back" } },
  { id: "cinematic", name: "Cinematic", hue: 220, style: { wave: "saw", bpm: 70, scale: "minor", drums: "march" } },
];

export const ARTISTS = [
  {
    id: "neon-pilots", name: "Neon Pilots", genre: "synthpop", listeners: 2_480_113,
    bio: "A duo that writes songs for empty motorways at 2am, built from cheap keyboards and big choruses.",
    releases: [
      { id: "night-signals", title: "Night Signals", kind: "album", released: "2025-04-11", tracks: ["Night Signals", "Overpass Glow", "Radio Silence", "Chrome Hearts Club", "Exit 14", "Afterimage"] },
      { id: "satellite-kiss", title: "Satellite Kiss", kind: "single", released: "2026-09-26", tracks: ["Satellite Kiss"] },
    ],
  },
  {
    id: "juniper-static", name: "Juniper Static", genre: "lofi", listeners: 1_120_540,
    bio: "Bedroom producer. Rain on the window, tape hiss on the master bus.",
    releases: [
      { id: "rainy-window-tapes", title: "Rainy Window Tapes", kind: "album", released: "2024-11-02", tracks: ["Kettle On", "Window Seat", "Slow Sunday", "Paper Lanterns", "Homework Loop"] },
      { id: "study-break", title: "Study Break", kind: "ep", released: "2026-02-14", tracks: ["Pencil Shavings", "Library Hum", "Five More Minutes"] },
    ],
  },
  {
    id: "glass-meadow", name: "Glass Meadow", genre: "ambient", listeners: 640_221,
    bio: "Long tones and slow light. Music for breathing out.",
    releases: [
      { id: "low-clouds", title: "Low Clouds", kind: "album", released: "2023-06-21", tracks: ["First Light", "Low Clouds", "Moss", "Tidal Pools"] },
    ],
  },
  {
    id: "velvet-circuit", name: "Velvet Circuit", genre: "house", listeners: 3_310_870,
    bio: "Warehouse grooves with a soft centre.",
    releases: [
      { id: "basement-sunrise", title: "Basement Sunrise", kind: "album", released: "2025-08-01", tracks: ["Doors at Ten", "Basement Sunrise", "Hands Up Slowly", "Strobe Lullaby", "Last Train Home"] },
      { id: "warehouse-hearts", title: "Warehouse Hearts", kind: "single", released: "2026-10-10", tracks: ["Warehouse Hearts"] },
    ],
  },
  {
    id: "copper-quartet", name: "The Copper Quartet", genre: "jazz", listeners: 410_009,
    bio: "Four friends, one upright piano, and a standing Thursday booking.",
    releases: [
      { id: "thursday-standards", title: "Thursday Standards", kind: "album", released: "2022-03-17", tracks: ["Late Set", "Blue Napkin", "Brass Tacks", "Coat Check Waltz", "Closing Time Again"] },
    ],
  },
  {
    id: "pixel-harbor", name: "Pixel Harbor", genre: "chiptune", listeners: 870_455,
    bio: "Music from games that never existed.",
    releases: [
      { id: "continue-screen", title: "Continue Screen", kind: "album", released: "2024-05-05", tracks: ["Press Start", "World 1-1", "Boss Rush", "High Score", "Credits Roll"] },
      { id: "extra-life", title: "Extra Life", kind: "ep", released: "2025-12-01", tracks: ["Extra Life", "Warp Pipe", "Save Point"] },
    ],
  },
  {
    id: "maple-and-rook", name: "Maple & Rook", genre: "folk", listeners: 1_050_300,
    bio: "Two guitars, one porch, a lot of weather.",
    releases: [
      { id: "porch-light", title: "Porch Light", kind: "album", released: "2023-09-29", tracks: ["Porch Light", "River Road", "Woodsmoke", "Letters Home"] },
    ],
  },
  {
    id: "aurora-vance", name: "Aurora Vance", genre: "cinematic", listeners: 1_990_002,
    bio: "Composer of trailers for films that are still being imagined.",
    releases: [
      { id: "northern-reach", title: "Northern Reach", kind: "album", released: "2025-01-24", tracks: ["Prologue", "The Long Climb", "Northern Reach", "Ember Fields", "Homecoming"] },
    ],
  },
  {
    id: "sunday-satellite", name: "Sunday Satellite", genre: "synthpop", listeners: 720_118,
    bio: "Sunny synths for people who still own a cassette deck.",
    releases: [
      { id: "weekend-orbit", title: "Weekend Orbit", kind: "ep", released: "2026-06-06", tracks: ["Weekend Orbit", "Pool Party Static", "Golden Hour Radio"] },
    ],
  },
  {
    id: "lumen-drift", name: "Lumen Drift", genre: "ambient", listeners: 515_660,
    bio: "Slow-moving electronic music made on night shifts.",
    releases: [
      { id: "night-shift", title: "Night Shift", kind: "album", released: "2026-03-20", tracks: ["Clock In", "Fluorescent", "Quiet Floor", "Clock Out"] },
      { id: "dawn-bus", title: "Dawn Bus", kind: "single", released: "2026-08-15", tracks: ["Dawn Bus"] },
    ],
  },
];

// Features: [trackTitle, guestArtistId]
export const FEATURES = [
  ["Pool Party Static", "neon-pilots"],
  ["Library Hum", "glass-meadow"],
  ["Last Train Home", "lumen-drift"],
];

export const CURATOR = { email: "editors@tunes.test", name: "Tunes Editors" };

export const EDITORIAL = [
  { id: "morning-lift", name: "Morning Lift", genre: "synthpop", description: "Bright synths and easy grooves to start the day.", pick: ["synthpop", "folk", "chiptune"] },
  { id: "deep-focus", name: "Deep Focus", genre: "ambient", description: "Calm, steady sounds to help you concentrate.", pick: ["ambient", "lofi"] },
  { id: "late-night-drive", name: "Late Night Drive", genre: "house", description: "Headlights, empty roads, low bass.", pick: ["synthpop", "house"] },
  { id: "coffeehouse-jazz", name: "Coffeehouse Jazz", genre: "jazz", description: "Brushed drums and warm keys.", pick: ["jazz", "lofi"] },
  { id: "eight-bit-arcade", name: "8-Bit Arcade", genre: "chiptune", description: "Insert coin. High scores only.", pick: ["chiptune"] },
  { id: "epic-soundscapes", name: "Epic Soundscapes", genre: "cinematic", description: "Big themes for small moments.", pick: ["cinematic", "ambient"] },
];

export const DEMO_PASSWORD = "tunes-demo-1";
export const DEMO_USERS = [
  { email: "ada@tunes.test", name: "Ada", favourite: ["synthpop", "lofi", "house"] },
  { email: "ben@tunes.test", name: "Ben", favourite: ["jazz", "folk", "ambient"] },
];

// Real recordings, CC0 on Wikimedia Commons (from Musopen). Downloaded only by `npm run fetch-pd`,
// which needs the owner's approval first; the seed adds whichever files are present in data/pd/.
const COMMONS = "https://upload.wikimedia.org/wikipedia/commons";
export const PUBLIC_DOMAIN = {
  genre: { id: "classical", name: "Classical", hue: 45 },
  album: { id: "open-classics", title: "Open Classics", released: "2026-10-22", artist: { id: "various-artists", name: "Various Artists" } },
  tracks: [
    {
      id: "open-classics-01", title: "Orchestral Suite No. 2: Badinerie", composer: { id: "j-s-bach", name: "Johann Sebastian Bach" },
      performer: "European Archive", url: `${COMMONS}/9/97/Bach%2C_Johann_Sebastian_-_Suite_No.2_in_B_Minor_-_X._Badinerie.ogg`,
      page: "https://commons.wikimedia.org/wiki/File:Bach,_Johann_Sebastian_-_Suite_No.2_in_B_Minor_-_X._Badinerie.ogg",
    },
    {
      id: "open-classics-02", title: "Jesu, Joy of Man's Desiring (BWV 147)", composer: { id: "j-s-bach", name: "Johann Sebastian Bach" },
      performer: "Orchestra Gli Armonici", url: `${COMMONS}/2/27/Bach%2C_BWV_147%2C_10._Jesus_bleibet_meine_Freude.ogg`,
      page: "https://commons.wikimedia.org/wiki/File:Bach,_BWV_147,_10._Jesus_bleibet_meine_Freude.ogg",
    },
    {
      id: "open-classics-03", title: "Oboe Concerto in D minor, Op. 9 No. 2: III. Allegro", composer: { id: "t-albinoni", name: "Tomaso Albinoni" },
      performer: "Musopen", url: `${COMMONS}/3/38/Albinoni%2C_Concerto_for_Oboe_and_Strings_No._2_in_D_minor%2C_Op._9%2C_III._Allegro.ogg`,
      page: "https://commons.wikimedia.org/wiki/File:Albinoni,_Concerto_for_Oboe_and_Strings_No._2_in_D_minor,_Op._9,_III._Allegro.ogg",
    },
    {
      id: "open-classics-04", title: "In the Steppes of Central Asia", composer: { id: "a-borodin", name: "Alexander Borodin" },
      performer: "Musopen Symphony Orchestra", url: `${COMMONS}/b/be/Alexander_Borodin_-_In_The_Steppes_Of_Central_Asia.ogg`,
      page: "https://commons.wikimedia.org/wiki/File:Alexander_Borodin_-_In_The_Steppes_Of_Central_Asia.ogg",
    },
    {
      id: "open-classics-05", title: "Goldberg Variations: Aria", composer: { id: "j-s-bach", name: "Johann Sebastian Bach" },
      performer: "Musopen", url: `${COMMONS}/a/af/Bach%2C_Goldberg_Variations%2C_Aria_%28Musopen_version%29.ogg`,
      page: "https://commons.wikimedia.org/wiki/File:Bach,_Goldberg_Variations,_Aria_(Musopen_version).ogg",
    },
  ],
};
