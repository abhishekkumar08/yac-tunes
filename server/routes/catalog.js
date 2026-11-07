import { found, idParam } from "../guards.js";
import {
  albumCard,
  albumSelect,
  artistCard,
  contextCard,
  likePattern,
  playlistCard,
  playlistSelect,
  tracksByIds,
  tracksWhere,
} from "../queries.js";

const ALBUM_GENRE = "(SELECT genre_id FROM tracks WHERE album_id = al.id ORDER BY track_no LIMIT 1)";
const ARTIST_PLAYS = `(SELECT coalesce(sum(t.base_plays), 0) + (SELECT count(*) FROM plays p JOIN track_artists x ON x.track_id = p.track_id WHERE x.artist_id = a.id)
  FROM tracks t JOIN track_artists ta ON ta.track_id = t.id WHERE ta.artist_id = a.id)`;

export function homeSections(db, userId) {
  const recentContexts = (limit) =>
    db
      .prepare(
        `SELECT context_type, context_id, max(played_at) AS last FROM plays
         WHERE user_id = ? AND context_type IN ('album', 'playlist', 'artist', 'liked')
         GROUP BY context_type, context_id ORDER BY last DESC LIMIT ?`,
      )
      .all(userId, limit)
      .map((r) => contextCard(db, userId, r.context_type, r.context_id))
      .filter(Boolean);

  const madeForYou = (limit) => {
    const genres = db
      .prepare(
        `SELECT t.genre_id FROM plays p JOIN tracks t ON t.id = p.track_id WHERE p.user_id = ?
         GROUP BY t.genre_id ORDER BY count(*) DESC`,
      )
      .all(userId)
      .map((r) => r.genre_id);
    const rank = (g) => (genres.includes(g) ? genres.indexOf(g) : genres.length);
    const played = new Set(
      db.prepare("SELECT DISTINCT t.album_id FROM plays p JOIN tracks t ON t.id = p.track_id WHERE p.user_id = ?").all(userId).map((r) => r.album_id),
    );
    const albums = db
      .prepare(
        `${albumSelect(`${ALBUM_GENRE} AS genre_id, (SELECT sum(base_plays) FROM tracks WHERE album_id = al.id) AS pop`)}`,
      )
      .all()
      .filter((a) => !played.has(a.id))
      .sort((a, b) => rank(a.genre_id) - rank(b.genre_id) || b.pop - a.pop)
      .map((a) => albumCard(a, a.artist_name));
    const editorial = db
      .prepare(`${playlistSelect()} WHERE u.is_curator = 1 AND p.genre_id IS NOT NULL`)
      .all()
      .filter((p) => genres.includes(p.genre_id))
      .sort((a, b) => rank(a.genre_id) - rank(b.genre_id))
      .map((p) => playlistCard(db, p));
    const mixed = [];
    for (let i = 0; mixed.length < limit && (i < albums.length || i < editorial.length); i++) {
      if (albums[i]) mixed.push(albums[i]);
      if (editorial[i] && mixed.length < limit) mixed.push(editorial[i]);
    }
    return mixed;
  };

  const popularArtists = (limit) =>
    db.prepare(`SELECT a.*, ${ARTIST_PLAYS} AS total FROM artists a ORDER BY total DESC LIMIT ?`).all(limit).map(artistCard);

  const newReleases = (limit) =>
    db.prepare(`${albumSelect()} ORDER BY al.released_on DESC LIMIT ?`).all(limit).map((a) => albumCard(a, a.artist_name));

  const editorsPicks = (limit) =>
    db.prepare(`${playlistSelect()} WHERE u.is_curator = 1 ORDER BY p.created_at LIMIT ?`).all(limit).map((p) => playlistCard(db, p));

  return {
    recent: recentContexts,
    "jump-back-in": recentContexts,
    "made-for-you": madeForYou,
    "popular-artists": popularArtists,
    "new-releases": newReleases,
    "editors-picks": editorsPicks,
  };
}

export default function catalogRoutes(app, { db }) {
  app.get("/api/home", (req) => {
    const s = homeSections(db, req.user.id);
    const recent = s.recent(10);
    return {
      recent: recent.slice(0, 8),
      jumpBackIn: recent,
      madeForYou: s["made-for-you"](10),
      editorsPicks: s["editors-picks"](10),
      popularArtists: s["popular-artists"](10),
      newReleases: s["new-releases"](10),
    };
  });

  app.get("/api/sections/:id", { schema: { params: idParam } }, (req) => {
    const section = found(homeSections(db, req.user.id)[req.params.id]);
    return { items: section(50) };
  });

  app.get("/api/albums/:id", { schema: { params: idParam } }, (req) => {
    const a = found(db.prepare(`${albumSelect()} WHERE al.id = ?`).get(req.params.id));
    const tracks = tracksWhere(db, "WHERE t.album_id = ? ORDER BY t.track_no", a.id);
    const artist = db.prepare("SELECT id, name, seed FROM artists WHERE id = ?").get(a.artist_id);
    return {
      album: {
        id: a.id,
        title: a.title,
        kind: albumCard(a).kind,
        year: a.year,
        releasedOn: a.released_on,
        seed: a.seed,
        label: a.label,
        artist,
        tracks,
        totalSec: tracks.reduce((s, t) => s + t.durationSec, 0),
        saved: !!db.prepare("SELECT 1 FROM saved_albums WHERE user_id = ? AND album_id = ?").get(req.user.id, a.id),
      },
      moreByArtist: db
        .prepare(`${albumSelect()} WHERE al.artist_id = ? AND al.id != ? ORDER BY al.released_on DESC`)
        .all(a.artist_id, a.id)
        .map((r) => albumCard(r, `${r.year} • ${albumCard(r).kind}`)),
    };
  });

  app.get("/api/artists/:id", { schema: { params: idParam } }, (req) => {
    const a = found(db.prepare("SELECT * FROM artists WHERE id = ?").get(req.params.id));
    const popular = tracksWhere(
      db,
      "WHERE t.id IN (SELECT track_id FROM track_artists WHERE artist_id = ?) ORDER BY plays DESC, t.id LIMIT 10",
      a.id,
    );
    const plays = db.prepare("SELECT count(*) n FROM plays p JOIN track_artists ta ON ta.track_id = p.track_id WHERE ta.artist_id = ?").get(a.id).n;
    const fans = db
      .prepare(
        `SELECT DISTINCT ar.* FROM artists ar JOIN track_artists ta ON ta.artist_id = ar.id JOIN tracks t ON t.id = ta.track_id
         WHERE ar.id != ? AND t.genre_id IN (SELECT t2.genre_id FROM tracks t2 JOIN track_artists x ON x.track_id = t2.id WHERE x.artist_id = ?)
         ORDER BY ar.base_listeners DESC LIMIT 10`,
      )
      .all(a.id, a.id);
    return {
      artist: {
        id: a.id,
        name: a.name,
        bio: a.bio,
        seed: a.seed,
        listeners: a.base_listeners + plays,
        following: !!db.prepare("SELECT 1 FROM follows WHERE user_id = ? AND artist_id = ?").get(req.user.id, a.id),
      },
      popular,
      discography: db
        .prepare(`${albumSelect()} WHERE al.artist_id = ? ORDER BY al.released_on DESC`)
        .all(a.id)
        .map((r) => albumCard(r, `${r.year} • ${albumCard(r).kind}`)),
      fansAlsoLike: fans.map(artistCard),
    };
  });

  app.get("/api/genres", () => ({
    genres: db
      .prepare(
        `SELECT g.*, (SELECT al.seed FROM albums al WHERE ${ALBUM_GENRE} = g.id ORDER BY al.released_on DESC LIMIT 1) AS seed
         FROM genres g ORDER BY g.name`,
      )
      .all(),
  }));

  app.get("/api/genres/:id", { schema: { params: idParam } }, (req) => {
    const genre = found(db.prepare("SELECT * FROM genres WHERE id = ?").get(req.params.id));
    return {
      genre,
      playlists: db.prepare(`${playlistSelect()} WHERE p.genre_id = ?`).all(genre.id).map((p) => playlistCard(db, p)),
      albums: db
        .prepare(`${albumSelect()} WHERE ${ALBUM_GENRE} = ? ORDER BY al.released_on DESC`)
        .all(genre.id)
        .map((a) => albumCard(a, a.artist_name)),
    };
  });

  app.get("/api/tracks", { schema: { querystring: { type: "object", properties: { ids: { type: "string", maxLength: 4000 } } } } }, (req) => ({
    tracks: tracksByIds(db, (req.query.ids ?? "").split(",").filter(Boolean).slice(0, 500)),
  }));

  app.get(
    "/api/search",
    { schema: { querystring: { type: "object", properties: { q: { type: "string", maxLength: 100 } } } } },
    (req) => {
      const q = (req.query.q ?? "").trim();
      if (!q) return { top: null, tracks: [], artists: [], albums: [], playlists: [] };
      const like = likePattern(q);
      const tracks = tracksWhere(
        db,
        `WHERE t.title LIKE ? ESCAPE '\\' OR EXISTS (SELECT 1 FROM track_artists ta JOIN artists a ON a.id = ta.artist_id
           WHERE ta.track_id = t.id AND a.name LIKE ? ESCAPE '\\') ORDER BY plays DESC LIMIT 20`,
        like,
        like,
      );
      const artists = db.prepare("SELECT * FROM artists WHERE name LIKE ? ESCAPE '\\' ORDER BY base_listeners DESC LIMIT 20").all(like);
      const albums = db.prepare(`${albumSelect()} WHERE al.title LIKE ? ESCAPE '\\' ORDER BY al.released_on DESC LIMIT 20`).all(like);
      const playlists = db.prepare(`${playlistSelect()} WHERE p.name LIKE ? ESCAPE '\\' ORDER BY p.updated_at DESC LIMIT 20`).all(like);

      const lower = q.toLowerCase();
      const prefix = (name) => name.toLowerCase().split(/\s+/).some((word) => word.startsWith(lower)) || name.toLowerCase().startsWith(lower);
      const topArtist = artists.find((a) => prefix(a.name));
      const topAlbum = albums.find((a) => prefix(a.title));
      const top =
        (topArtist && artistCard(topArtist)) ??
        (topAlbum && albumCard(topAlbum, topAlbum.artist_name)) ??
        (tracks[0] && { type: "track", id: tracks[0].id, name: tracks[0].title, subtitle: tracks[0].artists.map((a) => a.name).join(", "), seed: tracks[0].albumSeed, track: tracks[0] }) ??
        (artists[0] && artistCard(artists[0])) ??
        (albums[0] && albumCard(albums[0], albums[0].artist_name)) ??
        (playlists[0] && playlistCard(db, playlists[0])) ??
        null;
      return {
        top,
        tracks,
        artists: artists.map(artistCard),
        albums: albums.map((a) => albumCard(a, `${a.year} • ${a.artist_name}`)),
        playlists: playlists.map((p) => playlistCard(db, p)),
      };
    },
  );
}
