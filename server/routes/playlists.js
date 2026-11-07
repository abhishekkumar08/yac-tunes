import { randomBytes, randomInt } from "node:crypto";
import { tx } from "../db.js";
import { AppError, body, found, idParam, text } from "../guards.js";
import { playlistCover, playlistSelect, tracksByIds } from "../queries.js";
import { isPermutation } from "../../shared/order.js";

const itemParams = {
  type: "object",
  properties: { id: idParam.properties.id, itemId: { type: "integer", minimum: 1 } },
  required: ["id", "itemId"],
};

export function playlistDetail(db, id, userId) {
  const p = found(db.prepare(`${playlistSelect()} WHERE p.id = ?`).get(id));
  const rows = db.prepare("SELECT id, track_id, added_at FROM playlist_items WHERE playlist_id = ? ORDER BY position").all(id);
  const tracks = new Map(tracksByIds(db, [...new Set(rows.map((r) => r.track_id))]).map((t) => [t.id, t]));
  const items = rows.map((r) => ({ itemId: r.id, addedAt: r.added_at, track: tracks.get(r.track_id) }));
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    owner: { id: p.owner_id, name: p.owner_name },
    isOwner: p.owner_id === userId,
    totalSec: items.reduce((s, i) => s + i.track.durationSec, 0),
    items,
    ...playlistCover(db, p),
  };
}

function ownPlaylist(db, id, userId) {
  const p = found(db.prepare("SELECT owner_id FROM playlists WHERE id = ?").get(id));
  if (p.owner_id !== userId) throw new AppError(403, "not_owner");
}

function renumber(db, playlistId, itemIds, now) {
  const set = db.prepare("UPDATE playlist_items SET position = ? WHERE id = ?");
  itemIds.forEach((itemId, i) => set.run(i, itemId));
  db.prepare("UPDATE playlists SET updated_at = ? WHERE id = ?").run(now, playlistId);
}

export default function playlistRoutes(app, { db, now }) {
  const detail = (req) => ({ playlist: playlistDetail(db, req.params.id, req.user.id) });

  app.get("/api/playlists/:id", { schema: { params: idParam } }, detail);

  app.post("/api/playlists", { schema: { body: body({ name: text(100, 1) }, []) } }, (req) => {
    const n = db.prepare("SELECT count(*) n FROM playlists WHERE owner_id = ?").get(req.user.id).n + 1;
    const id = `pl-${randomBytes(6).toString("hex")}`;
    const name = req.body.name?.trim() || `My Playlist #${n}`;
    db.prepare("INSERT INTO playlists (id, owner_id, name, seed, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)").run(
      id,
      req.user.id,
      name,
      randomInt(1, 1_000_000),
      now(),
      now(),
    );
    return { playlist: playlistDetail(db, id, req.user.id) };
  });

  app.patch(
    "/api/playlists/:id",
    { schema: { params: idParam, body: body({ name: text(100, 1), description: text(300) }, []) } },
    (req) => {
      ownPlaylist(db, req.params.id, req.user.id);
      const { name, description } = req.body;
      if (name !== undefined && !name.trim()) throw new AppError(400, "invalid_input");
      db.prepare(
        "UPDATE playlists SET name = coalesce(?, name), description = coalesce(?, description), updated_at = ? WHERE id = ?",
      ).run(name?.trim() ?? null, description?.trim() ?? null, now(), req.params.id);
      return detail(req);
    },
  );

  app.delete("/api/playlists/:id", { schema: { params: idParam } }, (req) => {
    ownPlaylist(db, req.params.id, req.user.id);
    tx(db, () => {
      db.prepare("DELETE FROM playlist_items WHERE playlist_id = ?").run(req.params.id);
      db.prepare("DELETE FROM saved_playlists WHERE playlist_id = ?").run(req.params.id);
      db.prepare("DELETE FROM playlists WHERE id = ?").run(req.params.id);
    });
    return { ok: true };
  });

  app.post(
    "/api/playlists/:id/items",
    {
      schema: {
        params: idParam,
        body: body({ trackIds: { type: "array", minItems: 1, maxItems: 200, items: { type: "string", maxLength: 80 } } }),
      },
    },
    (req) => {
      ownPlaylist(db, req.params.id, req.user.id);
      const known = new Set(tracksByIds(db, [...new Set(req.body.trackIds)]).map((t) => t.id));
      if (req.body.trackIds.some((id) => !known.has(id))) throw new AppError(404, "unknown_track");
      tx(db, () => {
        let pos = db.prepare("SELECT coalesce(max(position) + 1, 0) p FROM playlist_items WHERE playlist_id = ?").get(req.params.id).p;
        const add = db.prepare("INSERT INTO playlist_items (playlist_id, track_id, position, added_at) VALUES (?, ?, ?, ?)");
        for (const trackId of req.body.trackIds) add.run(req.params.id, trackId, pos++, now());
        db.prepare("UPDATE playlists SET updated_at = ? WHERE id = ?").run(now(), req.params.id);
      });
      return detail(req);
    },
  );

  app.delete("/api/playlists/:id/items/:itemId", { schema: { params: itemParams } }, (req) => {
    ownPlaylist(db, req.params.id, req.user.id);
    tx(db, () => {
      found(db.prepare("DELETE FROM playlist_items WHERE id = ? AND playlist_id = ? RETURNING id").get(req.params.itemId, req.params.id));
      const rest = db.prepare("SELECT id FROM playlist_items WHERE playlist_id = ? ORDER BY position").all(req.params.id).map((r) => r.id);
      renumber(db, req.params.id, rest, now());
    });
    return detail(req);
  });

  app.put(
    "/api/playlists/:id/order",
    { schema: { params: idParam, body: body({ itemIds: { type: "array", maxItems: 2000, items: { type: "integer" } } }) } },
    (req) => {
      ownPlaylist(db, req.params.id, req.user.id);
      tx(db, () => {
        const current = db.prepare("SELECT id FROM playlist_items WHERE playlist_id = ?").all(req.params.id).map((r) => r.id);
        if (!isPermutation(current, req.body.itemIds)) throw new AppError(409, "stale_order");
        renumber(db, req.params.id, req.body.itemIds, now());
      });
      return detail(req);
    },
  );
}
