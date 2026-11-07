# yac-tunes — design (v1)

Working name until YAC HQ picks one. Local-only web app; no remote, no publishing.

## Problem and goal
YAC wants a music-streaming product whose layout and behaviour match the familiar web music player
as closely as possible. The layout reference is a REA capture of the public web player, logged out and
signed in (side-session notes `yac-tunes-rea-teardown.md`, copied to `docs/rea-teardown.md`).

Matching means layout, page types, controls, their order and their behaviour. **Not copied:** name, logo,
the green brand colour, icons, code, images or music. Every artist, album, track and cover in the app is invented.

## Non-goals (v1)
Podcasts, audiobooks, lyrics, "connect to a device", full-screen mode, downloads/offline, friend activity,
notifications, premium/ads, collaborative playlists, playlist folders, crossfade/gapless, native mobile.
None of these appear as disabled buttons; they are left out entirely.

## Look
- Kasumi dark theme. The app sets one accent colour (warm coral) for the big round Play button, the playing row and
  slider fills. It sets this on Kasumi's `--accent` role at app level and doesn't change Kasumi's palettes.
- Shell: black page; rounded dark panels with an 8px gap: **Library** (left, resizable 280–420px),
  **Main** (scrolls on its own), optional **Right panel** (Now Playing or Queue). Fixed **Player bar** at the bottom.
- Top bar: Home (round icon button), pill search box ("What do you want to play?") with a Browse icon,
  avatar menu on the right (Account name, Sign out).
- Page headers sit on a gradient taken from the cover's dominant colour. Huge title, then a type label and a meta line.
- Generated covers: deterministic SVG patterns (shapes and gradient from a seed). Artists get round
  "portrait" patterns. No photos.

## Pages
| Route | Content |
|---|---|
| `/` Home | Greeting by time of day; quick grid of 8 recent items (cover + name, hover Play); shelves: *Jump back in* (recent albums/playlists/artists), *Made for you* (recommendations), *Popular artists*, *New releases*. Each shelf has "Show all" → `/section/:id`. |
| `/search` | Empty query: *Browse all* genre tiles (colour + tilted generated cover) → `/genre/:id`. With a query: filter chips All / Songs / Artists / Albums / Playlists. *All* view shows **Top result** card + **Songs** (top 4) side by side, then Artists, Albums, Playlists shelves. Query lives in the URL (`/search/:q`). |
| `/album/:id` | Header (cover, "Album"/"Single"/"EP", title, artist • year • N songs, total length). Actions: Play, Shuffle, Save to library (+ / ✓), More (…). Columns # / Title / Duration. Footer release date + © line. *More by artist* shelf. |
| `/artist/:id` | Round portrait, huge name, monthly listeners (seeded). Actions: Play, Shuffle, Follow/Following, More. *Popular* top 5 with play counts ("See more" → 10). *Discography* shelf with chips Albums / Singles and EPs. *Fans also like* shelf. |
| `/playlist/:id` | "Public Playlist"/"Playlist", title, description, owner • N songs, length. Columns # / Title / Album / Date added / Duration. Owner can: edit details (name, description) in a modal, drag rows to reorder, remove tracks, delete playlist. Others can save it to their library. Empty owned playlist shows "Let's find something for your playlist" + inline search to add songs. |
| `/collection/tracks` Liked Songs | Gradient heart cover, "Playlist", owner • N songs. Columns as playlist, newest first. No reorder. |
| `/genre/:id`, `/section/:id` | Grid of cards for that genre or shelf. |
| `/queue` | Same content as the Queue panel, full width. |
| `/login`, `/signup` | Kasumi auth shell; email + password. Everything else requires sign-in. |

## Library panel
"Your Library" + Create (+ → "Playlist", which creates "My Playlist #N" and opens it). Filter chips Playlists /
Albums / Artists (only chips with items). Search-in-library toggle; sort menu Recents / Recently added /
Alphabetical / Creator. Rows: 48px cover (round for artists), name, "Playlist • owner" / "Album • artist" /
"Artist". Liked Songs is pinned first. Current page row is highlighted; the playing item's name turns accent.

## Track rows (everywhere)
Hover: number becomes Play; heart (Add to / Remove from Liked Songs) and "…" appear. Double-click plays.
The playing row shows an equaliser glyph and an accent-coloured title. "…" and right-click open one menu:
Add to queue, Add to playlist ▸ (search + playlists + New playlist), Save to / Remove from Liked Songs,
Go to artist, Go to album, Remove from this playlist (own playlist only).

## Player
- Bar left: cover, title (→ album), artists (→ artist), heart. Centre: Shuffle, Previous, Play/Pause, Next,
  Repeat (off → all → one, the "one" state shows a small 1). Below them: elapsed / seek slider / total.
  Right: Now Playing view toggle, Queue toggle, Mute + volume slider.
- Rules (a pure module, fully unit-tested):
  - Playing from a context (album, playlist, artist top tracks, liked songs, search results) loads that list
    and starts at the chosen track.
  - "Add to queue" tracks play before the rest of the context, in the order added. They are kept apart from the
    context and appear under "Next in queue".
  - Next: queued track first, else next context track. At the end: repeat all → wrap; repeat off → stop
    after the last track (stays loaded at 0:00, paused).
  - Repeat one: when a track ends, the same track restarts. Pressing Next still moves on.
  - Previous: if more than 3s into the track, restart it; else go to the previous context track (wraps only
    with repeat all).
  - Shuffle on: current track stays; the rest of the context plays in a random order. Shuffle off:
    continue from the current track's original position. The queue is never shuffled.
  - Queue panel: "Now playing", "Next in queue" (removable, draggable), "Next from: <context name>".
- Space toggles play/pause (except while typing). Media keys and lock-screen controls use the browser Media Session API.
- Player state (context, queue, index, position, shuffle, repeat, volume) is saved per user in the
  browser. It is restored paused on reload.

## Audio
- `npm run seed` composes about 55 generated tracks: a deterministic synth per track (genre sets tempo, scale,
  waveform and drum pattern), 30–90s. They are written as WAV and converted to 128 kbps MP3 with the local ffmpeg.
  The MP3s go in `data/audio/` (git-ignored).
- About 5 public-domain or CC0 recordings (e.g. classical performances on Wikimedia Commons or Musopen). Each one's
  licence is checked on its source page, and the user approves each download (file, source, size) before
  it's fetched. The licence and source are stored with the track and shown in a credits line. If the user
  says no, the catalogue stays fully generated.
- The API serves audio with HTTP Range support so seeking works.

## Data and accounts
- Local SQLite file created by the seed (`data/tunes.db`): users, sessions, artists, albums, tracks,
  genres, playlists, playlist_tracks (position, added_at; the same track may appear twice), likes,
  follows, saved albums/playlists, plays (user, track, context, played_at).
- Catalogue: ~10 artists, ~16 albums/singles/EPs, ~60 tracks, 8 genres, ~6 editorial playlists owned by
  a curator user. Two demo users with playlists, likes and history (credentials in README; local test values).
- Auth: email + password (scrypt hash), httpOnly session cookie, sign up / sign in / sign out.
- A play is recorded after 10s of listening. *Recently played* and *Jump back in* come from plays.
  *Made for you*: unplayed albums/playlists from the genres and artists you play most; falls back to popular.
  Play counts and monthly listeners = seeded base + recorded plays.

## Architecture
Same stack as yac-stays: Vite + React + `@kasumi/ui` (`file:../kasumi`) web on **:3150**, Fastify +
`node:sqlite` API on **:3151**, `npm run dev` runs both. Shared pure logic (queue engine, playlist ordering)
in `shared/` so tests import it directly.

## Kasumi change
Add `Slider`: a product-neutral range control on design tokens, with keyboard and ARIA support, fill colour from
`--accent`, and a thumb that appears on hover. Committed separately in the kasumi repo. No other Kasumi API changes.

## Testing
`node --test`: queue engine (every rule above), playlist ordering (insert, move, remove, duplicates,
positions stay 0..n-1), API (auth, playlists CRUD + reorder, likes, follows, saves, plays, search).
One Playwright journey: sign in → play album → add to queue → next → like → add to new playlist → reorder.

## Assumptions
- Desktop first. Below 900px the library panel collapses to icons and the right panel is hidden.
- "Same as the reference" refers to the captured layout. Parts not captured (context menus, Queue panel,
  Now Playing panel) follow the widely known pattern.
