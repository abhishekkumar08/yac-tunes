import { existsSync, mkdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { openDb, tx } from "../server/db.js";
import { hashPassword } from "../server/auth.js";
import { renderTrack } from "./synth.js";
import { ARTISTS, CURATOR, DEMO_PASSWORD, DEMO_USERS, EDITORIAL, FEATURES, GENRES, PUBLIC_DOMAIN } from "./catalog.js";

const RATE = 22050;
const dataDir = process.env.TUNES_DATA_DIR ? `${process.env.TUNES_DATA_DIR}/` : fileURLToPath(new URL("../data/", import.meta.url));
const audioDir = `${dataDir}audio`;
const dbPath = `${dataDir}tunes.db`;

function hash(str) {
  let h = 2166136261;
  for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
const seeded = (str, min, max) => min + (hash(str) % (max - min + 1));
const slug = (s) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

if (spawnSync("ffmpeg", ["-version"]).status !== 0) {
  process.stderr.write("ffmpeg is needed to encode the generated songs. Install it (brew install ffmpeg) and run the seed again.\n");
  process.exit(1);
}

if (process.argv.includes("--reset")) {
  for (const suffix of ["", "-wal", "-shm"]) rmSync(`${dbPath}${suffix}`, { force: true });
}
mkdirSync(audioDir, { recursive: true });
const db = openDb(dbPath);

const tracks = [];
for (const artist of ARTISTS) {
  const style = GENRES.find((g) => g.id === artist.genre).style;
  for (const rel of artist.releases) {
    rel.tracks.forEach((title, i) => {
      const id = `${rel.id}-${String(i + 1).padStart(2, "0")}`;
      tracks.push({ id, title, albumId: rel.id, no: i + 1, artist, style, seconds: seeded(id, 30, 90) });
    });
  }
}

function encode(track) {
  const out = `${audioDir}/${track.id}.mp3`;
  if (existsSync(out)) return;
  const pcm = renderTrack({ seed: hash(track.id), ...track.style, seconds: track.seconds, rate: RATE });
  const res = spawnSync(
    "ffmpeg",
    ["-loglevel", "error", "-y", "-f", "s16le", "-ar", String(RATE), "-ac", "1", "-i", "-", "-b:a", "96k", out],
    { input: Buffer.from(pcm.buffer) },
  );
  if (res.status !== 0) throw new Error(`ffmpeg failed for ${track.id}: ${res.stderr}`);
}

const already = db.prepare("SELECT count(*) n FROM artists").get().n > 0;
if (already) {
  process.stdout.write("Database already seeded; only rendering missing audio. Use `npm run seed -- --reset` to rebuild it.\n");
} else {
  const now = Date.now();
  const H = 3_600_000;
  tx(db, () => {
    const ins = (sql, ...a) => db.prepare(sql).run(...a);
    for (const g of GENRES) ins("INSERT INTO genres (id, name, hue) VALUES (?, ?, ?)", g.id, g.name, g.hue);
    for (const a of ARTISTS) {
      ins("INSERT INTO artists (id, name, bio, seed, base_listeners) VALUES (?, ?, ?, ?, ?)", a.id, a.name, a.bio, hash(a.id) % 1_000_000, a.listeners);
      for (const r of a.releases) {
        ins(
          "INSERT INTO albums (id, artist_id, title, kind, year, released_on, seed, label) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          r.id, a.id, r.title, r.kind, Number(r.released.slice(0, 4)), r.released, hash(r.id) % 1_000_000, `${a.name} / YAC Records`,
        );
      }
    }
    for (const t of tracks) {
      ins(
        "INSERT INTO tracks (id, album_id, title, track_no, duration_sec, genre_id, base_plays, audio_file) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        t.id, t.albumId, t.title, t.no, t.seconds, t.artist.genre, Math.floor(t.artist.listeners * (seeded(t.id, 20, 400) / 10)), `${t.id}.mp3`,
      );
      ins("INSERT INTO track_artists (track_id, artist_id, ord) VALUES (?, ?, 0)", t.id, t.artist.id);
    }
    for (const [title, guest] of FEATURES) {
      const t = tracks.find((x) => x.title === title);
      ins("INSERT INTO track_artists (track_id, artist_id, ord) VALUES (?, ?, 1)", t.id, guest);
    }

    const user = (email, name, curator = 0) =>
      db.prepare("INSERT INTO users (email, name, password_hash, avatar_hue, is_curator) VALUES (?, ?, ?, ?, ?) RETURNING id")
        .get(email, name, hashPassword(curator ? `${Math.random()}${Date.now()}` : DEMO_PASSWORD), seeded(email, 0, 359), curator).id;
    const playlist = (id, owner, name, description, genre, trackIds, at) => {
      ins("INSERT INTO playlists (id, owner_id, name, description, seed, genre_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        id, owner, name, description, hash(id) % 1_000_000, genre, at, at);
      trackIds.forEach((tid, i) => ins("INSERT INTO playlist_items (playlist_id, track_id, position, added_at) VALUES (?, ?, ?, ?)", id, tid, i, at + i * 60_000));
    };
    const pickTracks = (genres, n, salt) =>
      tracks.filter((t) => genres.includes(t.artist.genre)).sort((a, b) => hash(a.id + salt) - hash(b.id + salt)).slice(0, n).map((t) => t.id);

    const curator = user(CURATOR.email, CURATOR.name, 1);
    EDITORIAL.forEach((p, i) => playlist(p.id, curator, p.name, p.description, p.genre, pickTracks(p.pick, 12, p.id), now - (40 - i) * 24 * H));

    for (const d of DEMO_USERS) {
      const uid = user(d.email, d.name);
      const mine = pickTracks(d.favourite, 9, d.email);
      playlist(`pl-${slug(d.name)}-mix`, uid, `${d.name}'s Mix`, "", null, mine.slice(0, 7), now - 10 * 24 * H);
      mine.forEach((tid, i) => ins("INSERT INTO likes (user_id, track_id, created_at) VALUES (?, ?, ?)", uid, tid, now - (i + 1) * 20 * H));
      const favArtists = ARTISTS.filter((a) => d.favourite.includes(a.genre));
      favArtists.slice(0, 2).forEach((a, i) => ins("INSERT INTO follows (user_id, artist_id, created_at) VALUES (?, ?, ?)", uid, a.id, now - (i + 3) * 24 * H));
      favArtists.slice(0, 2).forEach((a, i) =>
        ins("INSERT INTO saved_albums (user_id, album_id, created_at) VALUES (?, ?, ?)", uid, a.releases[0].id, now - (i + 5) * 24 * H));
      ins("INSERT INTO saved_playlists (user_id, playlist_id, created_at) VALUES (?, ?, ?)", uid, EDITORIAL.find((p) => d.favourite.includes(p.genre)).id, now - 7 * 24 * H);

      let at = now - 14 * 24 * H;
      for (const a of favArtists) {
        const album = a.releases[0];
        for (const t of tracks.filter((x) => x.albumId === album.id)) {
          ins("INSERT INTO plays (user_id, track_id, context_type, context_id, played_at) VALUES (?, ?, 'album', ?, ?)", uid, t.id, album.id, at);
          at += t.seconds * 1000 + seeded(t.id + d.email, 1, 30) * H;
        }
      }
      for (const tid of mine.slice(0, 4)) {
        ins("INSERT INTO plays (user_id, track_id, context_type, context_id, played_at) VALUES (?, ?, 'liked', 'liked', ?)", uid, tid, Math.min(at, now - H));
        at += 2 * H;
      }
    }
  });
  process.stdout.write(`Seeded ${ARTISTS.length} artists, ${tracks.length} tracks, ${EDITORIAL.length} editorial playlists, ${DEMO_USERS.length} demo users.\n`);
}

function addPublicDomain() {
  const present = PUBLIC_DOMAIN.tracks.filter((t) => existsSync(`${dataDir}pd/${t.id}.ogg`));
  for (const t of present) {
    const out = `${audioDir}/${t.id}.mp3`;
    if (existsSync(out)) continue;
    const res = spawnSync("ffmpeg", ["-loglevel", "error", "-y", "-i", `${dataDir}pd/${t.id}.ogg`, "-vn", "-ac", "2", "-b:a", "128k", out]);
    if (res.status !== 0) throw new Error(`ffmpeg failed for ${t.id}: ${res.stderr}`);
  }
  const seconds = (t) =>
    Math.round(Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", `${audioDir}/${t.id}.mp3`]).stdout));
  const { genre, album } = PUBLIC_DOMAIN;
  tx(db, () => {
    const ins = (sql, ...a) => db.prepare(sql).run(...a);
    if (!present.length) return;
    ins("INSERT OR IGNORE INTO genres (id, name, hue) VALUES (?, ?, ?)", genre.id, genre.name, genre.hue);
    ins("INSERT OR IGNORE INTO artists (id, name, bio, seed, base_listeners) VALUES (?, ?, ?, ?, 0)",
      album.artist.id, album.artist.name, "Public-domain recordings by many performers.", hash(album.artist.id) % 1_000_000);
    for (const c of new Map(present.map((t) => [t.composer.id, t.composer])).values()) {
      ins("INSERT OR IGNORE INTO artists (id, name, bio, seed, base_listeners) VALUES (?, ?, ?, ?, 0)",
        c.id, c.name, "Composer. The recordings here are dedicated to the public domain (CC0).", hash(c.id) % 1_000_000);
    }
    ins("INSERT OR IGNORE INTO albums (id, artist_id, title, kind, year, released_on, seed, label) VALUES (?, ?, ?, 'album', ?, ?, ?, ?)",
      album.id, album.artist.id, album.title, Number(album.released.slice(0, 4)), album.released, hash(album.id) % 1_000_000, "Public domain recordings");
    PUBLIC_DOMAIN.tracks.forEach((t, i) => {
      if (!present.includes(t)) return;
      const credit = `${t.title} (${t.composer.name}), performed by ${t.performer}. CC0 1.0 via Wikimedia Commons / Musopen: ${t.page}`;
      ins("INSERT OR IGNORE INTO tracks (id, album_id, title, track_no, duration_sec, genre_id, base_plays, audio_file, credit) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)",
        t.id, album.id, t.title, i + 1, seconds(t), genre.id, `${t.id}.mp3`, credit);
      ins("INSERT OR IGNORE INTO track_artists (track_id, artist_id, ord) VALUES (?, ?, 0)", t.id, t.composer.id);
    });
  });
  if (present.length) process.stdout.write(`${present.length} public-domain recordings in the catalogue.\n`);
}
addPublicDomain();

let rendered = 0;
for (const t of tracks) {
  if (!existsSync(`${audioDir}/${t.id}.mp3`)) {
    encode(t);
    rendered++;
    process.stdout.write(`\rRendering audio ${rendered}…`);
  }
}
process.stdout.write(`\n${rendered} songs rendered into ${audioDir}\n`);
db.close();
