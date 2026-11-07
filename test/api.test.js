import { test } from "node:test";
import assert from "node:assert/strict";
import { testApp, signUp, AUDIO_BYTES } from "./helpers.js";

const positions = (db, id) =>
  db.prepare("SELECT position FROM playlist_items WHERE playlist_id = ? ORDER BY position").all(id).map((r) => r.position);

async function newPlaylist(call, trackIds = []) {
  const { body } = await call("POST", "/api/playlists", {});
  if (trackIds.length) await call("POST", `/api/playlists/${body.playlist.id}/items`, { trackIds });
  return body.playlist.id;
}

test("album page returns tracks in order with artist and total length", async () => {
  const { app } = testApp();
  const { call } = await signUp(app);
  const { status, body } = await call("GET", "/api/albums/al1");
  assert.equal(status, 200);
  assert.deepEqual(body.album.tracks.map((t) => t.id), ["t1", "t2", "t3"]);
  assert.equal(body.album.artist.name, "Nova Lane");
  assert.equal(body.album.totalSec, 226);
  assert.equal(body.album.tracks[0].audio, "/audio/t1.mp3");
});

test("unknown album is a 404", async () => {
  const { app } = testApp();
  const { call } = await signUp(app);
  assert.equal((await call("GET", "/api/albums/nope")).status, 404);
});

test("new playlists are numbered My Playlist #N per user", async () => {
  const { app } = testApp();
  const { call } = await signUp(app);
  const a = await call("POST", "/api/playlists", {});
  const b = await call("POST", "/api/playlists", {});
  assert.equal(a.body.playlist.name, "My Playlist #1");
  assert.equal(b.body.playlist.name, "My Playlist #2");
});

test("adding tracks appends them and allows duplicates", async () => {
  const { app, db } = testApp();
  const { call } = await signUp(app);
  const id = await newPlaylist(call, ["t1", "t2"]);
  const { body } = await call("POST", `/api/playlists/${id}/items`, { trackIds: ["t1"] });
  assert.deepEqual(body.playlist.items.map((i) => i.track.id), ["t1", "t2", "t1"]);
  assert.deepEqual(positions(db, id), [0, 1, 2]);
});

test("adding an unknown track is refused", async () => {
  const { app } = testApp();
  const { call } = await signUp(app);
  const id = await newPlaylist(call);
  assert.equal((await call("POST", `/api/playlists/${id}/items`, { trackIds: ["zzz"] })).status, 404);
});

test("removing an item closes the gap in positions", async () => {
  const { app, db } = testApp();
  const { call } = await signUp(app);
  const id = await newPlaylist(call, ["t1", "t2", "t3"]);
  const { body } = await call("GET", `/api/playlists/${id}`);
  const res = await call("DELETE", `/api/playlists/${id}/items/${body.playlist.items[1].itemId}`);
  assert.deepEqual(res.body.playlist.items.map((i) => i.track.id), ["t1", "t3"]);
  assert.deepEqual(positions(db, id), [0, 1]);
});

test("reorder saves a new order", async () => {
  const { app, db } = testApp();
  const { call } = await signUp(app);
  const id = await newPlaylist(call, ["t1", "t2", "t3"]);
  const items = (await call("GET", `/api/playlists/${id}`)).body.playlist.items.map((i) => i.itemId);
  const res = await call("PUT", `/api/playlists/${id}/order`, { itemIds: [items[2], items[0], items[1]] });
  assert.deepEqual(res.body.playlist.items.map((i) => i.track.id), ["t3", "t1", "t2"]);
  assert.deepEqual(positions(db, id), [0, 1, 2]);
});

test("reorder from a stale list is refused with 409", async () => {
  const { app } = testApp();
  const { call } = await signUp(app);
  const id = await newPlaylist(call, ["t1", "t2"]);
  const items = (await call("GET", `/api/playlists/${id}`)).body.playlist.items.map((i) => i.itemId);
  await call("POST", `/api/playlists/${id}/items`, { trackIds: ["t3"] });
  const res = await call("PUT", `/api/playlists/${id}/order`, { itemIds: [items[1], items[0]] });
  assert.equal(res.status, 409);
  assert.equal(res.body.error, "stale_order");
});

test("other users cannot edit, reorder, add to or delete a playlist", async () => {
  const { app } = testApp();
  const owner = await signUp(app, "ada@tunes.test");
  const other = await signUp(app, "ben@tunes.test");
  const id = await newPlaylist(owner.call, ["t1"]);
  const itemId = (await owner.call("GET", `/api/playlists/${id}`)).body.playlist.items[0].itemId;
  for (const [method, url, payload] of [
    ["PATCH", `/api/playlists/${id}`, { name: "x" }],
    ["POST", `/api/playlists/${id}/items`, { trackIds: ["t2"] }],
    ["DELETE", `/api/playlists/${id}/items/${itemId}`],
    ["PUT", `/api/playlists/${id}/order`, { itemIds: [itemId] }],
    ["DELETE", `/api/playlists/${id}`],
  ]) {
    assert.equal((await other.call(method, url, payload)).status, 403, `${method} ${url}`);
  }
});

test("owner can rename and describe a playlist", async () => {
  const { app } = testApp();
  const { call } = await signUp(app);
  const id = await newPlaylist(call);
  const res = await call("PATCH", `/api/playlists/${id}`, { name: "Road trip", description: "Windows down" });
  assert.equal(res.body.playlist.name, "Road trip");
  assert.equal(res.body.playlist.description, "Windows down");
  assert.equal((await call("PATCH", `/api/playlists/${id}`, { name: "  " })).status, 400);
});

test("deleting a playlist removes its items and saves", async () => {
  const { app, db } = testApp();
  const owner = await signUp(app, "ada@tunes.test");
  const other = await signUp(app, "ben@tunes.test");
  const id = await newPlaylist(owner.call, ["t1"]);
  await other.call("PUT", `/api/me/playlists/${id}`, {});
  assert.equal((await owner.call("DELETE", `/api/playlists/${id}`)).status, 200);
  assert.equal(db.prepare("SELECT count(*) n FROM playlist_items WHERE playlist_id = ?").get(id).n, 0);
  assert.equal(db.prepare("SELECT count(*) n FROM saved_playlists WHERE playlist_id = ?").get(id).n, 0);
  assert.equal((await owner.call("GET", `/api/playlists/${id}`)).status, 404);
});

test("likes are idempotent and liked songs list newest first", async () => {
  const { app, tick } = testApp();
  const { call } = await signUp(app);
  await call("PUT", "/api/me/tracks/t1", {});
  tick(1000);
  await call("PUT", "/api/me/tracks/t3", {});
  await call("PUT", "/api/me/tracks/t3", {});
  const liked = await call("GET", "/api/me/tracks");
  assert.deepEqual(liked.body.items.map((i) => i.track.id), ["t3", "t1"]);
  await call("DELETE", "/api/me/tracks/t1");
  await call("DELETE", "/api/me/tracks/t1");
  const lib = await call("GET", "/api/library");
  assert.deepEqual(lib.body.likedIds, ["t3"]);
});

test("follow and save show up in the library and on the pages", async () => {
  const { app } = testApp();
  const { call } = await signUp(app);
  await call("PUT", "/api/me/following/ar2", {});
  await call("PUT", "/api/me/albums/al1", {});
  const lib = (await call("GET", "/api/library")).body;
  assert.deepEqual(lib.artists.map((a) => a.id), ["ar2"]);
  assert.deepEqual(lib.albums.map((a) => a.id), ["al1"]);
  assert.equal((await call("GET", "/api/artists/ar2")).body.artist.following, true);
  assert.equal((await call("GET", "/api/albums/al1")).body.album.saved, true);
  assert.equal((await call("PUT", "/api/me/following/nope", {})).status, 404);
});

test("plays raise play counts and feed recently played", async () => {
  const { app } = testApp();
  const { call } = await signUp(app);
  await call("POST", "/api/plays", { trackId: "t4", contextType: "album", contextId: "al2" });
  const album = (await call("GET", "/api/albums/al2")).body.album;
  assert.equal(album.tracks[0].plays, 11);
  const home = (await call("GET", "/api/home")).body;
  assert.equal(home.recent[0].type, "album");
  assert.equal(home.recent[0].id, "al2");
});

test("made for you favours unplayed music from genres you play", async () => {
  const { app, db } = testApp();
  db.prepare(`INSERT INTO albums (id, artist_id, title, kind, year, released_on, seed) VALUES ('al3', 'ar2', 'Blue Hour', 'album', 2024, '2024-01-01', 303)`).run();
  db.prepare(`INSERT INTO tracks (id, album_id, title, track_no, duration_sec, genre_id, base_plays, audio_file) VALUES ('t5', 'al3', 'Blue', 1, 40, 'jazz', 0, 't5.mp3')`).run();
  db.prepare("INSERT INTO track_artists VALUES ('t5', 'ar2', 0)").run();
  const { call } = await signUp(app);
  await call("POST", "/api/plays", { trackId: "t4", contextType: "album", contextId: "al2" });
  const home = (await call("GET", "/api/home")).body;
  assert.equal(home.madeForYou[0].id, "al3");
  assert.ok(!home.madeForYou.some((c) => c.id === "al2"));
});

test("artist page lists popular tracks by plays", async () => {
  const { app } = testApp();
  const { call } = await signUp(app);
  const { body } = await call("GET", "/api/artists/ar1");
  assert.deepEqual(body.popular.map((t) => t.id), ["t1", "t2", "t3"]);
  assert.equal(body.discography[0].id, "al1");
});

test("search groups results and treats % literally", async () => {
  const { app } = testApp();
  const { call } = await signUp(app);
  const res = (await call("GET", "/api/search?q=nova")).body;
  assert.equal(res.top.type, "artist");
  assert.equal(res.top.id, "ar1");
  const pct = (await call("GET", "/api/search?q=%25")).body;
  assert.deepEqual(pct.tracks.map((t) => t.id), ["t1"]);
  const empty = (await call("GET", "/api/search?q=zzzz")).body;
  assert.equal(empty.top, null);
});

test("tracks by ids keeps requested order and drops unknown ids", async () => {
  const { app } = testApp();
  const { call } = await signUp(app);
  const { body } = await call("GET", "/api/tracks?ids=t3,nope,t1");
  assert.deepEqual(body.tracks.map((t) => t.id), ["t3", "t1"]);
});

test("audio serves the whole file and byte ranges", async () => {
  const { app } = testApp();
  const { cookies } = await signUp(app);
  const get = (url, headers = {}) => app.inject({ method: "GET", url, headers, cookies });

  const full = await get("/audio/t1.mp3");
  assert.equal(full.statusCode, 200);
  assert.equal(full.headers["accept-ranges"], "bytes");
  assert.equal(full.headers["content-type"], "audio/mpeg");
  assert.deepEqual(full.rawPayload, AUDIO_BYTES);

  const part = await get("/audio/t1.mp3", { range: "bytes=100-199" });
  assert.equal(part.statusCode, 206);
  assert.equal(part.headers["content-range"], "bytes 100-199/1000");
  assert.deepEqual(part.rawPayload, AUDIO_BYTES.subarray(100, 200));

  const open = await get("/audio/t1.mp3", { range: "bytes=990-" });
  assert.deepEqual(open.rawPayload, AUDIO_BYTES.subarray(990));

  assert.equal((await get("/audio/t1.mp3", { range: "bytes=5000-" })).statusCode, 416);
  assert.equal((await get("/audio/t2.mp3")).statusCode, 404);
  assert.equal((await get("/audio/..%2Fsecret.mp3")).statusCode, 404);
});

test("top result matches the start of any word in an artist's name", async () => {
  const { app } = testApp();
  const { call } = await signUp(app);
  const res = (await call("GET", "/api/search?q=harbor")).body;
  assert.equal(res.top.type, "artist");
  assert.equal(res.top.id, "ar2");
});
