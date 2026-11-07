# yac tunes (working name)

A local music-streaming web app for YAC. Its layout and behaviour follow the familiar web music player
(library panel, player bar, queue, playlists, liked songs). It uses none of that product's name, logo,
colours, icons, code, artwork or music. Every artist, album and song is invented, and the audio is generated on
this machine. Built on the shared Kasumi design system.

## Run it

```bash
npm install
npm run seed      # creates data/tunes.db and renders ~55 songs with ffmpeg (about 20 s)
npm run dev       # web http://127.0.0.1:3150, API http://127.0.0.1:3151
```

Needs Node 22.13+ and ffmpeg (`brew install ffmpeg`). Stop `npm run dev` before `npm run seed -- --reset`
(the API holds the database open). Plain `npm run seed` again only fills in missing audio.

Demo logins (local test accounts): `ada@tunes.test` and `ben@tunes.test`, password `tunes-demo-1`.
Anyone can also sign up.

## What's in v1

| Area | What it does |
|---|---|
| Shell | Top bar (back/forward, Home, search, account menu). Resizable "Your Library" panel that collapses to an icon rail. Main panel. Optional right panel (Now Playing or Queue). Player bar. |
| Player | Play/pause, seek, previous/next, shuffle, repeat off/all/one, volume and mute, an up-next queue (add, remove, drag, clear), Space key and media keys. Resumes paused where you left off, per user. |
| Pages | Home (recent tiles, Jump back in, Made for you, Editors' picks, Popular artists, New releases), Search (genre tiles, Top result, Songs, Artists, Albums, Playlists), Album, Artist (Follow, Popular, Discography, Fans also like), Playlist, Liked Songs, Genre, Queue, Sign in / Sign up. |
| Your music | Like songs, save albums and playlists, follow artists, create playlists, rename or describe them, delete them, add songs, remove songs, reorder by dragging or with Move up/down. |
| Recommendations | "Made for you" ranks unplayed albums and editors' playlists by the genres you play most. A play counts after 10 s. |

## Audio

- **Generated songs:** `scripts/synth.js` composes each track from a seed (key, chord progression, melody
  motif, bass, pads, drums by genre), and ffmpeg encodes it to MP3 in `data/audio/` (git-ignored).
- **Optional real recordings:** `scripts/catalog.js` lists five CC0 recordings from Wikimedia Commons (from
  Musopen). They were downloaded with the owner's OK on 2026-10-22 (`npm run fetch-pd`, then `npm run seed`; data/pd is git-ignored, so a fresh clone needs those two steps again). Each shows its credit and source
  on the "Open Classics" album page.

## Tests

```bash
npm test          # 66 unit + API tests (player engine, playlist ordering, synth, auth, API)
npm run e2e       # Playwright journey on its own seeded copy (ports 3152/3153)
npm run lint
```

## Layout

| Path | What lives there |
|---|---|
| `shared/player.js` | Pure player engine: queue, shuffle, repeat, next/previous rules |
| `shared/order.js`, `shared/format.js` | Playlist reordering, duration/count formatting |
| `server/` | Fastify API, SQLite schema, sessions, ranged audio streaming |
| `scripts/` | Catalogue data, synth, seed, CC0 fetch |
| `web/src/` | React app: `lib/player/PlayerProvider.jsx` drives the one `<audio>` element |
| `docs/` | Design spec and the REA layout teardown |

## Not done

- No brand yet (name, logo, colours wait on YAC HQ).
- No podcasts, lyrics, devices, full screen, offline downloads, friends, collaborative playlists or folders.
- No crossfade or gapless playback. Each browser tab is its own player.
- Recommendations are simple genre counts, not a model.
