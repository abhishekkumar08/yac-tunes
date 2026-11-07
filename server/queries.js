const TRACK_SELECT = `
  SELECT t.id, t.title, t.duration_sec, t.album_id, t.audio_file, t.credit, t.genre_id,
         al.title AS album_title, al.seed AS album_seed,
         t.base_plays + (SELECT count(*) FROM plays p WHERE p.track_id = t.id) AS plays
  FROM tracks t JOIN albums al ON al.id = t.album_id`;

const marks = (n) => Array(n).fill("?").join(",");

export function tracksWhere(db, where, ...args) {
  const rows = db.prepare(`${TRACK_SELECT} ${where}`).all(...args);
  if (!rows.length) return [];
  const ids = [...new Set(rows.map((r) => r.id))];
  const byTrack = new Map();
  for (const l of db
    .prepare(
      `SELECT ta.track_id, a.id, a.name FROM track_artists ta JOIN artists a ON a.id = ta.artist_id
       WHERE ta.track_id IN (${marks(ids.length)}) ORDER BY ta.ord`,
    )
    .all(...ids)) {
    if (!byTrack.has(l.track_id)) byTrack.set(l.track_id, []);
    byTrack.get(l.track_id).push({ id: l.id, name: l.name });
  }
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    durationSec: r.duration_sec,
    albumId: r.album_id,
    albumTitle: r.album_title,
    albumSeed: r.album_seed,
    artists: byTrack.get(r.id) ?? [],
    plays: r.plays,
    audio: `/audio/${r.audio_file}`,
    credit: r.credit,
  }));
}

export function tracksByIds(db, ids) {
  if (!ids.length) return [];
  const map = new Map(tracksWhere(db, `WHERE t.id IN (${marks(ids.length)})`, ...ids).map((t) => [t.id, t]));
  return ids.map((id) => map.get(id)).filter(Boolean);
}

const KIND_LABEL = { album: "Album", single: "Single", ep: "EP" };

export const albumCard = (r, subtitle = `${r.year} • ${r.artist_name}`) => ({
  type: "album",
  id: r.id,
  name: r.title,
  subtitle,
  seed: r.seed,
  kind: KIND_LABEL[r.kind],
  year: r.year,
});

/** Album rows with their artist name; `extra` adds columns, e.g. "s.created_at AS added_at". */
export const albumSelect = (extra = "") =>
  `SELECT al.*, ar.name AS artist_name${extra && `, ${extra}`} FROM albums al JOIN artists ar ON ar.id = al.artist_id`;

export const artistCard = (r) => ({ type: "artist", id: r.id, name: r.name, subtitle: "Artist", seed: r.seed, round: true });

export function playlistCover(db, p) {
  if (p.is_curator) return { seed: p.seed };
  const seeds = db
    .prepare(
      `SELECT al.seed FROM playlist_items pi JOIN tracks t ON t.id = pi.track_id JOIN albums al ON al.id = t.album_id
       WHERE pi.playlist_id = ? GROUP BY al.id ORDER BY min(pi.position) LIMIT 4`,
    )
    .all(p.id)
    .map((r) => r.seed);
  if (seeds.length >= 4) return { seed: seeds[0], mosaic: seeds };
  if (seeds.length) return { seed: seeds[0] };
  return { seed: p.seed, empty: true };
}

/** Playlist rows with owner name and curator flag; `extra` adds columns. */
export const playlistSelect = (extra = "") =>
  `SELECT p.*, u.name AS owner_name, u.is_curator${extra && `, ${extra}`} FROM playlists p JOIN users u ON u.id = p.owner_id`;

export const playlistCard = (db, p) => ({
  type: "playlist",
  id: p.id,
  name: p.name,
  subtitle: p.description || `By ${p.owner_name}`,
  owner: p.owner_name,
  ...playlistCover(db, p),
});

export function likedCard(db, userId) {
  const n = db.prepare("SELECT count(*) n FROM likes WHERE user_id = ?").get(userId).n;
  return { type: "liked", id: "liked", name: "Liked Songs", subtitle: `${n} ${n === 1 ? "song" : "songs"}`, liked: true };
}

export function contextCard(db, userId, type, id) {
  if (type === "album") {
    const r = db.prepare(`${albumSelect()} WHERE al.id = ?`).get(id);
    return r && albumCard(r, r.artist_name);
  }
  if (type === "artist") {
    const r = db.prepare("SELECT * FROM artists WHERE id = ?").get(id);
    return r && artistCard(r);
  }
  if (type === "playlist") {
    const r = db.prepare(`${playlistSelect()} WHERE p.id = ?`).get(id);
    return r && playlistCard(db, r);
  }
  if (type === "liked") return likedCard(db, userId);
  return null;
}

export const likePattern = (q) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
