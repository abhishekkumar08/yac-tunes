import { AppError, body, found, idParam, text } from "../guards.js";
import { albumCard, albumSelect, artistCard, playlistCard, playlistSelect, tracksByIds } from "../queries.js";

const TOGGLES = {
  tracks: { table: "likes", column: "track_id", target: "tracks" },
  albums: { table: "saved_albums", column: "album_id", target: "albums" },
  playlists: { table: "saved_playlists", column: "playlist_id", target: "playlists" },
  following: { table: "follows", column: "artist_id", target: "artists" },
};

const CONTEXT_TYPES = ["album", "playlist", "artist", "liked", "search", "queue"];

export default function libraryRoutes(app, { db, now }) {
  app.get("/api/library", (req) => {
    const uid = req.user.id;
    const lastPlayed = new Map(
      db
        .prepare("SELECT context_type, context_id, max(played_at) t FROM plays WHERE user_id = ? GROUP BY context_type, context_id")
        .all(uid)
        .map((r) => [`${r.context_type}:${r.context_id}`, r.t]),
    );
    const stamp = (card, type, addedAt) => ({ ...card, addedAt, lastPlayedAt: lastPlayed.get(`${type}:${card.id}`) ?? null });

    const playlists = db
      .prepare(
        `${playlistSelect("coalesce(sp.created_at, p.created_at) AS added_at")}
         LEFT JOIN saved_playlists sp ON sp.playlist_id = p.id AND sp.user_id = ?
         WHERE p.owner_id = ? OR sp.user_id IS NOT NULL`,
      )
      .all(uid, uid)
      .map((p) => stamp({ ...playlistCard(db, p), subtitle: `Playlist • ${p.owner_name}`, own: p.owner_id === uid }, "playlist", p.added_at));
    const albums = db
      .prepare(`${albumSelect("s.created_at AS added_at")} JOIN saved_albums s ON s.album_id = al.id WHERE s.user_id = ?`)
      .all(uid)
      .map((a) => stamp(albumCard(a, `Album • ${a.artist_name}`), "album", a.added_at));
    const artists = db
      .prepare("SELECT a.*, f.created_at AS added_at FROM artists a JOIN follows f ON f.artist_id = a.id WHERE f.user_id = ?")
      .all(uid)
      .map((a) => stamp(artistCard(a), "artist", a.added_at));
    const likedIds = db.prepare("SELECT track_id FROM likes WHERE user_id = ? ORDER BY created_at DESC").all(uid).map((r) => r.track_id);
    return { playlists, albums, artists, likedIds };
  });

  app.get("/api/me/tracks", (req) => {
    const rows = db.prepare("SELECT track_id, created_at FROM likes WHERE user_id = ? ORDER BY created_at DESC, rowid DESC").all(req.user.id);
    const tracks = new Map(tracksByIds(db, rows.map((r) => r.track_id)).map((t) => [t.id, t]));
    return { items: rows.filter((r) => tracks.has(r.track_id)).map((r) => ({ addedAt: r.created_at, track: tracks.get(r.track_id) })) };
  });

  for (const [path, { table, column, target }] of Object.entries(TOGGLES)) {
    const opts = { schema: { params: idParam } };
    app.put(`/api/me/${path}/:id`, opts, (req) => {
      found(db.prepare(`SELECT 1 FROM ${target} WHERE id = ?`).get(req.params.id));
      db.prepare(`INSERT OR IGNORE INTO ${table} (user_id, ${column}, created_at) VALUES (?, ?, ?)`).run(req.user.id, req.params.id, now());
      return { ok: true };
    });
    app.delete(`/api/me/${path}/:id`, opts, (req) => {
      db.prepare(`DELETE FROM ${table} WHERE user_id = ? AND ${column} = ?`).run(req.user.id, req.params.id);
      return { ok: true };
    });
  }

  app.post(
    "/api/plays",
    {
      schema: {
        body: body({ trackId: text(80, 1), contextType: { type: "string", enum: CONTEXT_TYPES }, contextId: { type: ["string", "null"], maxLength: 80 } }, ["trackId", "contextType"]),
      },
    },
    (req) => {
      const { trackId, contextType, contextId = null } = req.body;
      if (!db.prepare("SELECT 1 FROM tracks WHERE id = ?").get(trackId)) throw new AppError(404, "unknown_track");
      db.prepare("INSERT INTO plays (user_id, track_id, context_type, context_id, played_at) VALUES (?, ?, ?, ?, ?)").run(
        req.user.id,
        trackId,
        contextType,
        contextId,
        now(),
      );
      return { ok: true };
    },
  );
}
